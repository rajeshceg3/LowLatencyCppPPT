import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

// Purpose-fit verification for Low Latency C++ deck: a dependency-free structural drive of the Slidev deck source.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..');
const deckDir="low-latency-cpp-slides";
const deck=path.join(root,deckDir);
const out=path.join(root,'artifacts/verification');
fs.mkdirSync(out,{recursive:true});
const slidesPath=path.join(deck,'slides.md');
const proof={skill:"verify-low-latency-deck",node:process.version,deckDir,generatedAt:new Date().toISOString(),checks:{},warnings:[],passed:false};
const fail=(name,msg)=>{proof.checks[name]={ok:false,detail:msg};throw Error(name+': '+msg);};
const ok=(name,detail)=>{proof.checks[name]={ok:true,detail};};
try{
  // 1. package.json parses and declares Slidev scripts
  const pkgRaw=fs.readFileSync(path.join(deck,'package.json'),'utf8');
  let pkg; try{pkg=JSON.parse(pkgRaw);}catch(e){fail('package','package.json is not valid JSON: '+e.message);}
  if(!pkg.scripts||!pkg.scripts.build)fail('package','package.json has no build script');
  ok('package',{name:pkg.name,scripts:Object.keys(pkg.scripts)});
  // Emoji glyphs must ship with the deck, not rely on the viewer OS.
  if(pkg.dependencies?.['@fontsource/noto-emoji']!=='5.3.2')fail('emoji','bundled Noto Emoji 5.3.2 dependency missing');
  const emojiCss=fs.readFileSync(path.join(deck,"styles/index.css"),'utf8');
  if(!emojiCss.includes('@fontsource/noto-emoji/400.css')||!emojiCss.includes('"Noto Emoji"'))fail('emoji','bundled emoji import or font fallback missing');
  ok('emoji','Noto Emoji bundled and included in slide font fallback');
  // Fuse 7.5 returns every slide for an empty query, overlaying closed Goto.
  if(pkg.overrides?.['fuse.js']!=='7.1.0')fail('goto','expected exact fuse.js 7.1.0 override');
  ok('goto','Fuse 7.1.0 override prevents empty-query Goto overlay');
  // 2. slides.md present, hashed
  if(!fs.existsSync(slidesPath))fail('slides','slides.md missing at '+deckDir+'/slides.md');
  const md=fs.readFileSync(slidesPath,'utf8');
  proof.slidesSha256=crypto.createHash('sha256').update(md).digest('hex');
  // 3. headmatter frontmatter holds theme and title
  const parts=md.split(/^---[ \t]*$/m);
  if(parts.length<3)fail('headmatter','no --- frontmatter block found');
  const head=parts[1];
  if(!/^theme:/m.test(head))fail('headmatter','headmatter has no theme key');
  if(!/^title:/m.test(head))fail('headmatter','headmatter has no title key');
  // Slide 1's config must live in the headmatter itself: a pure-config part right
  // after the headmatter renders as literal text, and an empty part renders a blank first slide.
  {
    const first=parts[2].split('\n').filter(l=>l.trim()!=='');
    if(first.length&&first.every(l=>/^[\w-]+:/.test(l)||l.trim().startsWith('#')))
      fail('headmatter','slide 1 config sits in its own part after the headmatter; Slidev renders it as literal text - move it into the headmatter frontmatter');
    if(!first.length)fail('headmatter','empty part after the headmatter renders a blank first slide');
  }
  ok('headmatter','theme and title present, slide 1 config in headmatter');
  // 4. slide structure: per-slide config lines must sit in frontmatter position, not after content
  const cfg=/^(layout|class|background|transition|style|favicon|download|mdc|level):/;
  const yamlLine=/^[\w-]+:/;
  let slides=0;const misplaced=[],empty=[];
  for(let i=2;i<parts.length;i++){
    const lines=parts[i].split('\n');
    const nonBlank=lines.filter(l=>l.trim()!=='');
    if(!nonBlank.length)continue;
    // config lines must never follow content, even inside otherwise YAML-looking parts:
    // a heading or prose line followed by "layout: x" means the config renders as visible text.
    let contentStarted=false;
    for(const l of lines){
      if(l.trim()==='')continue;
      if(!contentStarted&&yamlLine.test(l))continue; // leading frontmatter keys
      contentStarted=true;
      if(cfg.test(l))misplaced.push('slide part '+i+': "'+l.trim()+'"');
    }
    const isFrontmatter=nonBlank.every(l=>yamlLine.test(l)||l.trim().startsWith('#'));
    if(isFrontmatter)continue; // pure per-slide frontmatter part
    slides++;
    if(!nonBlank.some(l=>!l.trim().startsWith('<!--')&&!l.trim().startsWith('#')))empty.push('slide part '+i);
  }
  proof.slideCount=slides;
  if(misplaced.length)fail('structure','config lines after content: '+misplaced.join(' | '));
  if(empty.length)proof.warnings.push('slides with only comments/headings: '+empty.join(', '));
  ok('structure',slides+' slides, all config in frontmatter position');
  // 5. local asset references resolve the way Slidev serves them (/x -> <deckDir>/public/x, ./x -> <deckDir>/x)
  const refs=new Set();
  for(const m of md.matchAll(/!\[[^\]]*\]\(([^)\s]+)[^)]*\)/g))refs.add(m[1]);
  for(const m of md.matchAll(/<img[^>]+src="([^"]+)"/g))refs.add(m[1]);
  for(const m of md.matchAll(/^(?:background|favicon|style):[ \t]*['"]?([^'"\n]+?)['"]?[ \t]*$/gm)){
    let v=m[1].replace(/\s+#.*$/,'').trim();refs.add(v);
  }
  const missing=[],found=[];
  for(const r of refs){
    if(/^(https?:|data:|@|\w+\()/.test(r))continue;
    if(!r.startsWith('/')&&!r.startsWith('.'))continue;
    const target=r.startsWith('/')?path.join(deck,'public',r):path.resolve(deck,r);
    (fs.existsSync(target)?found:missing).push(r);
  }
  proof.assets={referenced:found,missing};
  if(missing.length)fail('assets','unresolved local references: '+missing.join(', '));
  const pubDir=path.join(deck,'public');
  if(fs.existsSync(pubDir)){
    const all=[];const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?walk(p):all.push('/'+path.relative(pubDir,p));}};walk(pubDir);
    const unused=all.filter(f=>!found.includes(f));
    if(unused.length)proof.warnings.push('public files not referenced from slides.md: '+unused.join(', '));
  }
  ok('assets',found.length+' referenced local assets all resolve');
  // 6. code fences balanced
  const fences=(md.match(/^```/gm)||[]).length;
  if(fences%2)fail('fences','odd number of ``` fences ('+fences+')');
  ok('fences',fences+' fence markers balanced');
  // 7. stylesheet url() refs
  const stylesDir=path.join(deck,'styles');
  if(fs.existsSync(stylesDir)){
    const cssMissing=[];
    for(const f of fs.readdirSync(stylesDir).filter(f=>f.endsWith('.css'))){
      const css=fs.readFileSync(path.join(stylesDir,f),'utf8');
      for(const m of css.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)){
        const u=m[2];if(/^(https?:|data:)/.test(u))continue;
        if(u.startsWith('/')&&!fs.existsSync(path.join(deck,'public',u)))cssMissing.push(f+': '+u);
      }
    }
    if(cssMissing.length)fail('styles','unresolved css url() refs: '+cssMissing.join(', '));
  }
  ok('styles','stylesheet local refs resolve');
  // 8. raw-HTML blocks: markdown-it ends a raw HTML block at a blank line and does not
  // process markdown inside it, so fenced code or generic types in inline code inside
  // raw HTML render as literal text or unclosed tags and break the Vue compile.
  {
    const tagOpen=/<(div|ul|ol|li|p|span|section|table|details|blockquote|pre|h[1-6])(\s|>)(?![^<>]*<\/\1>)/g;
    const tagClose=/<\/(div|ul|ol|li|p|span|section|table|details|blockquote|pre|h[1-6])>/g;
    const htmlFails=[];
    let depth=0,inFence=false;
    const lines=md.split('\n');
    for(let n=0;n<lines.length;n++){
      const l=lines[n];
      if(/^```/.test(l)){
        if(!inFence&&depth>0)htmlFails.push('line '+(n+1)+': fenced code block inside raw HTML');
        inFence=!inFence;continue;
      }
      if(inFence)continue;
      const opens=(l.match(tagOpen)||[]).length;
      const closes=(l.match(tagClose)||[]).length;
      if(depth>0&&/\`[^\`]*<[A-Za-z][^\`]*\`/.test(l))htmlFails.push('line '+(n+1)+': generic type in inline code inside raw HTML renders as an unclosed tag');
      depth=Math.max(0,depth+opens-closes);
    }
    if(htmlFails.length)fail('htmlblocks',htmlFails.slice(0,5).join(' | '));
  }
  ok('htmlblocks','raw HTML blocks free of fences and generic-type inline code');
  proof.passed=true;
}catch(error){proof.failure=error.message;process.exitCode=1;}
finally{
  const file=path.join(out,"verify-low-latency-deck"+'.json');
  fs.writeFileSync(file,JSON.stringify(proof,null,2)+'\n');
  if(!fs.existsSync(file))throw Error('Evidence lost after write');
  console.log(JSON.stringify(proof,null,2));
}
