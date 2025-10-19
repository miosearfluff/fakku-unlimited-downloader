"use strict";

const fs = require("fs-extra");
const path = require("path");
const { program } = require("commander");
const { CookieJar } = require("netscape-cookies-parser");

function parseCookies(options) {
  const cookieJar = new CookieJar();
  cookieJar.load(options.cookies);
  return cookieJar.parse();
}

function readLines(path) {
  return fs.readFileSync(path, "utf8").split(/[\r\n]+/).map(l => l.trim()).filter(l => l != "" && !l.startsWith("#"));
}

function parseUrls(options) {
  let urls = [];
  if(options.url) urls.push(...options.url.map(l => l.trim()));
  if(options.urls) urls.push(...readLines(options.urls));
  return urls;
}

function normaliseUrls(rawUrls) {
  const urls = [];
  for(let url of rawUrls) {
    if(!url.startsWith("https://www.fakku.net/hentai/")) {
      console.log(`Skipping unrecognised URL ${url}`);
      continue;
    }

    if(url.endsWith("/")) url = url.slice(0, -1);
    url = url.replace(/\/page\/\d+$/, "");
    if(!url.endsWith("/read")) url += "/read";

    urls.push(url);
  }

  return [...new Set(urls)];
}

function skipSavedUrls(allUrls, progressPath) {
  if(!fs.existsSync(progressPath)) return allUrls;
  const savedUrls = readLines(progressPath);

  const skippedUrls = allUrls.filter(url => savedUrls.includes(url));
  if(skippedUrls.length) {
    for(let skippedUrl of skippedUrls) console.log(`Skipping already saved URL ${skippedUrl}`);
  }

  return allUrls.filter(url => !savedUrls.includes(url));
}

program
  .requiredOption("-c, --cookies <file>", "path to file containing logged-in fakku cookies in Netscape format")
  .option("-u, --url <urls...>", "one or more urls of FAKKU manga to download")
  .option("-U, --urls <file>", "path to file containing list of FAKKU manga urls to download")
  .option("-o, --output <dir>", "path to directory where manga should be downloaded to")
  .option("--no-headless", "run in headful mode to assist with debugging; also keeps browser open on error");

program.parse();

const options = program.opts();
const outputDir = fs.realpathSync(options.output ?? ".");
const progressPath = path.join(outputDir, "downloads.log");
const cookies = parseCookies(options);
const urls = skipSavedUrls(normaliseUrls(parseUrls(options)), progressPath);
const headless = options.headless;

module.exports = { cookies, urls, outputDir, progressPath, headless };