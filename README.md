# Low Latency C++ Presentation

This project contains the source code for a presentation on Low Latency C++ techniques, built using Slidev.

## Prerequisites

Ensure you have Node.js and npm installed.

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```
2.  Change into the Slidev project directory and install dependencies:
    ```bash
    cd low-latency-cpp-slides
    npm install
    ```

## Viewing the Presentation

To start the Slidev presentation in development mode (with hot-reloading):
```bash
npm run dev
```
Navigate to `http://localhost:3030` in your browser.

## Building and Exporting

To build the presentation into static HTML files (in `dist/`):
```bash
npm run build
```

To export the presentation as a PDF:
```bash
npm run export
```
This will generate a PDF file in the `dist/` directory (e.g., `slides-export.pdf`).

*Note: You might need to install `playwright-chromium` for PDF export if it's not already present. Run `npm install -D playwright-chromium` or `npx playwright install chromium` if you encounter issues with export.*

## Project Structure

-   `low-latency-cpp-slides/slides.md`: The main content of the presentation in Markdown format.
-   `low-latency-cpp-slides/package.json`: Project metadata and dependencies.
-   `low-latency-cpp-slides/styles/`: Custom CSS styles for the presentation.
-   `low-latency-cpp-slides/public/`: Static assets (images, etc.) referenced from `slides.md` as `/placeholders/...`. Slidev serves `public/` from the project directory, so this folder must stay inside `low-latency-cpp-slides/` for the images to resolve.

Replace `<repository_url>` and `<repository_directory>` with the actual URL and directory name when cloning.