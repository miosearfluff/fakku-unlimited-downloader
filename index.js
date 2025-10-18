#!/usr/bin/env node
"use strict";

const fs = require("fs-extra");
const path = require("path");
const process = require("process");
const { program } = require("commander");
const { CookieJar } = require("netscape-cookies-parser");
const sanitize = require("sanitize-filename");
const getWorks = require("./get-works");

async function downloadWorks(cookies, urls, baseOutputDir) {
  await getWorks(cookies, urls, async (title, artist, count, page, prefixedPage, data) => {
    console.log(`Saving [${artist}] ${title} page ${page} / ${count}`);
    const outputDir = path.join(baseOutputDir, sanitize(`[${artist}] ${title} [FAKKU]`));
    await fs.mkdirp(outputDir, 0o755);

    const imageFilename = sanitize(`${prefixedPage}.png`);
    const imagePath = path.join(outputDir, imageFilename);

    await fs.writeFile(imagePath, data, { mode: 0o644 });
  });
}

function parseCookies(options) {
  const cookieJar = new CookieJar();
  cookieJar.load(options.cookies);
  return cookieJar.parse();
}

function parseUrls(options) {
  let rawUrls = [];
  if(options.url) rawUrls.push(...options.url);
  if(options.urls) rawUrls.push(...fs.readFileSync(options.urls, "utf8").split(/[\r\n]+/));

  const urls = [];
  for(let url of rawUrls) {
    url = url.trim();
    if(url == "") continue;

    if(url.endsWith("/")) url = url.slice(0, -1);
    url = url.replace(/\/page\/\d+$/, "");
    if(!url.endsWith("/read")) url += "/read";

    urls.push(url);
  }

  return [...new Set(urls)];
}

(async () => {
  try {
    program
      .requiredOption("-c, --cookies <file>", "path to file containing logged-in fakku cookies in Netscape format")
      .option("-u, --url <urls...>", "one or more urls of FAKKU manga to download")
      .option("-U, --urls <file>", "path to file containing list of FAKKU manga urls to download")
      .option("-o, --output <dir>", "path to directory where manga should be downloaded to");

    program.parse();

    const options = program.opts();
    const cookies = parseCookies(options);
    const urls = parseUrls(options);
    const outputDir = await fs.realpath(options.output ?? process.cwd());

    await downloadWorks(cookies, urls, outputDir);
    console.log("Done.");
  }
  catch(e) {
    console.log("Couldn't download. Sorry!");
    console.error(e);
  }
})();
