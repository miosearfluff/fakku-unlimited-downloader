#!/usr/bin/env node
"use strict";

const fs = require("fs-extra");
const path = require("path");
const sanitize = require("sanitize-filename");
const { cookies, urls, outputDir, progressPath, headless } = require("./options");
const download = require("./download");

async function savePage(url, title, artist, count, page, prefixedPage, data) {
  console.log(`Saving URL ${url} as [${artist}] ${title} page ${page} / ${count}`);
  const bookOutputDir = path.join(outputDir, sanitize(`[${artist}] ${title} [FAKKU]`));
  await fs.mkdirp(bookOutputDir, 0o755);

  const pageFilename = sanitize(`${prefixedPage}.png`);
  const pagePath = path.join(bookOutputDir, pageFilename);

  await fs.writeFile(pagePath, data, { mode: 0o644 });

  if(page == count) {
    await fs.appendFile(progressPath, `${url}\n`, { mode: 0o644, flush: true });
  }
}

(async () => {
  try {
    await download(cookies, urls, headless, savePage);
    console.log("Done.");
  }
  catch(e) {
    console.log("An error occurred. Sorry!");
    console.error(e);
  }
})();
