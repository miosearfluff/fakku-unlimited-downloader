"use strict";

const fs = require("fs-extra");
const path = require("path");
const sanitize = require("sanitize-filename");
const getWorks = require("./get-works");

async function downloadWorks(options) {
  await getWorks({ ...options, callback: (...args) => savePage(options.outputDir, ...args) });
}

async function savePage(baseOutputDir, title, artist, count, page, prefixedPage, data) {
  //console.log(`baseOutputDir: ${baseOutputDir}, title: ${title}, artist: ${artist}, count: ${count}, page: ${page}, prefixedPage: ${prefixedPage}`);
  console.log(`Saving [${artist}] ${title} page ${page} / ${count}`);
  const outputDir = path.join(baseOutputDir, sanitize(`[${artist}] ${title} [FAKKU]`));
  await fs.mkdirp(outputDir, 0o755);

  const imageFilename = sanitize(`${prefixedPage}.png`);
  const imagePath = path.join(outputDir, imageFilename);

  await fs.writeFile(imagePath, data, { mode: 0o644 });
}

module.exports = downloadWorks;