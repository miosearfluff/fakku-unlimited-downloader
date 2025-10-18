#!/usr/bin/env node
"use strict";

const fs = require("fs-extra");
const path = require("path");
const sanitize = require("sanitize-filename");
const { cookies, urls, outputDir } = require("./options");
const download = require("./download");

async function savePage(title, artist, count, page, prefixedPage, data) {
  console.log(`Saving [${artist}] ${title} page ${page} / ${count}`);
  const bookOutputDir = path.join(outputDir, sanitize(`[${artist}] ${title} [FAKKU]`));
  await fs.mkdirp(bookOutputDir, 0o755);

  const pageFilename = sanitize(`${prefixedPage}.png`);
  const pagePath = path.join(bookOutputDir, pageFilename);

  await fs.writeFile(pagePath, data, { mode: 0o644 });
}

(async () => {
  try {
    await download(cookies, urls, savePage);
    console.log("Done.");
  }
  catch(e) {
    console.log("An error occurred. Sorry!");
    console.error(e);
  }
})();
