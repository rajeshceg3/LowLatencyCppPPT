import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const root=process.cwd();
const deck=path.join(root,"low-latency-cpp-slides");
const require=createRequire(path.join(deck,'package.json'));
const playwright=require('playwright-chromium');
const {chromium}=playwright;
const base=process.env.DECK_URL;
assert(base,'Serve the production dist directory, then set DECK_URL to its origin');
const out=path.join(root,'artifacts/verification/rendered');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const proof={screenshots:[],navigation:null,visualReview:'requires full-size human inspection; screenshots alone are not a visual pass'};
 for(const slide of [1, 4]){
  await page.goto(new URL(String(slide),base.endsWith('/')?base:base+'/').href,{waitUntil:'networkidle'});
  await page.keyboard.press('Escape');await page.evaluate(async()=>{await document.fonts.load('400 32px "Deck Emoji"','🚀⚡');await document.fonts.ready;});await page.waitForTimeout(600);
  assert(await page.locator('.slidev-layout').count()>0,'slide layout missing');
  await page.screenshot({path:path.join(out,`slide-${slide}.png`)});proof.screenshots.push(slide);
 }
 await page.goto(new URL('1',base.endsWith('/')?base:base+'/').href,{waitUntil:'networkidle'});
 await page.keyboard.press('Escape');
 const results=page.locator('#slidev-goto-dialog li');assert.equal(await results.count(),0,'closed Goto overlays slides');
 await page.keyboard.press('g');const input=page.locator('#slidev-goto-input');await input.waitFor();assert(await input.isEnabled());
 await input.fill('2');await page.waitForTimeout(200);assert(await results.count()>0,'Goto search is broken');
 assert((await page.locator('#slidev-goto-dialog').evaluate(el=>getComputedStyle(el).fontFamily)).includes('Noto Emoji'),'Goto emoji fallback missing');
 await page.screenshot({path:path.join(out,'goto-open.png')});await input.press('Enter');await page.waitForTimeout(300);
 assert.equal(new URL(page.url()).pathname,'/2');assert.equal(await results.count(),0);proof.navigation='closed/open/search/select/closed passed';
 fs.writeFileSync(path.join(out,'runtime.json'),JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof,null,2));
} finally {await browser.close();}
