"use strict";

const crypto = require("crypto");
const { dataUriToBuffer } = require("data-uri-to-buffer");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const UserAgentPlugin = require("puppeteer-extra-plugin-anonymize-ua");
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

puppeteer.use(StealthPlugin());
puppeteer.use(UserAgentPlugin({ makeWindows: true }));

const TIMEOUT = 30000;
const FLIP_PAGE_TIMEOUT = 1500;

async function downloadBook(browser, cookies, url, callback) {
  console.log(`Downloading URL ${url}`);

  const context = await browser.createBrowserContext();

  for(let cookie of cookies) {
    context.setCookie({ domain: cookie.domain, name: cookie.name, path: cookie.path, value: cookie.value });
  }

  const page = await context.newPage();

  await page.setDefaultTimeout(TIMEOUT);

  await page.setViewport({
    isMobile: false,
    width: 1900,
    height: 1080,
    deviceScaleFactor: 1,
  });

  const unboundName = `_${crypto.randomBytes(20).toString("hex")}`;
  await page.evaluateOnNewDocument(`window.${unboundName} = {
    toDataURL: HTMLCanvasElement.prototype.toDataURL,
    createElement: HTMLDocument.prototype.createElement
  };`);
  await page.evaluateOnNewDocument(`window.localStorage.setItem("fakku-twoPageMode", "0");`);

  await page.goto(url, { waitUntil: ["load", "networkidle0"] });

  await downloadPages(url, page, unboundName, callback);

  await page.close();

  console.log(`Done downloading URL ${url}`);
}

async function downloadPages(url, page, unboundName, callback) {
  const frameHandle = await page.waitForSelector("iframe");
  const frame = await frameHandle.contentFrame();

  const getString = async (selector) => (await frame.$eval(selector, e => e.textContent)).trim();

  const title = await getString(".js-title-text");
  //const chapter = ;
  const artist = await getString(".js-artist");
  const pageCount = parseInt(await getString(".js-count"), 10);

  for(let i = 1; i <= pageCount; i++) {
    const image = await frame.waitForSelector("canvas.page, img.page");

    await frame.locator(".loader").setVisibility("hidden").wait();

    const imageName = await image.evaluate(e => e.nodeName);

    let imageDataURL;
    if(imageName == "CANVAS") {
      imageDataURL = await frame.evaluate((e, unboundName) => window[unboundName].toDataURL.call(e), image, unboundName);
    }
    else {
      imageDataURL = await frame.evaluate((e, unboundName) => {
        const canvas = window[unboundName].createElement.call(document, "canvas");
        canvas.width = e.naturalWidth;
        canvas.height = e.naturalHeight;
        const context = canvas.getContext("2d");
        context.drawImage(e, 0, 0);
        return window[unboundName].toDataURL.call(canvas);
      }, image, unboundName);
    }

    const imageData = dataUriToBuffer(imageDataURL);

    await image.dispose();

    const prefixedPageNumber = await getString(".js-page");
    const pageNumber = parseInt(prefixedPageNumber, 10);

    await callback(url, title, artist, pageCount, pageNumber, prefixedPageNumber, imageData);

    if(i == pageCount) break;

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.keyboard.press("Space", { delay: 50 }),
      sleep(FLIP_PAGE_TIMEOUT)
    ]);
  }

  await frameHandle.dispose();
}

async function download(cookies, urls, headless, callback) {
  const browser = await puppeteer.launch({ headless: headless, args: ["--disable-web-security"] });

  try {
    for(let url of urls) {
      await downloadBook(browser, cookies, url, callback);
      await sleep(FLIP_PAGE_TIMEOUT);
    }

    if(headless) {
      /*
      If this sleep isn't here, then the following error gets printed to the console, triggered by the
      await browser.close()
      line:
      ERROR: The process with PID <id> (child process of PID <other id>) could not be terminated.
      Reason: The operation attempted is not supported.
      */
      await sleep(100);
      await browser.close();
    }
  }
  catch(e) {
    if(browser && headless) await browser.close();
    throw e;
  }
}

module.exports = download;