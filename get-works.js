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

async function getWork(browser, cookies, url, callback) {
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
  await page.evaluateOnNewDocument(`window.${unboundName} = HTMLCanvasElement.prototype.toDataURL;`);

  await page.goto(url, { waitUntil: ["load", "networkidle0"] });

  await getPages(page, unboundName, callback);
}

async function getPages(page, unboundName, callback) {
  const frameHandle = await page.$("iframe");
  const frame = await frameHandle.contentFrame();

  const getString = async (selector) => (await frame.$eval(selector, e => e.textContent)).trim();

  const title = await getString(".js-title-text");
  //const chapter = ;
  const artist = await getString(".js-artist");
  const pageCount = parseInt(await getString(".js-count"), 10);

  for(let i = 1; i <= pageCount; i++) {
    const pageNumberFull = await getString(".js-page");
    const pageNumber = parseInt(pageNumberFull, 10);

    const canvas = await frame.$("canvas.page");

    const imageDataURL = await frame.evaluate((e, unboundName) => window[unboundName].call(e), canvas, unboundName);
    const imageData = dataUriToBuffer(imageDataURL);

    await callback(title, artist, pageCount, pageNumber, pageNumberFull, imageData);

    if(i == pageCount) break;

    await Promise.all([
      page.waitForNetworkIdle(),
      page.waitForNavigation(),
      page.keyboard.press("Space", { delay: 50 }),
      sleep(1500)
    ]);
  }
}

async function getWorks(cookies, urls, callback) {
  const browser = await puppeteer.launch({ args: ["--disable-web-security"] });

  try {
    for(let url of urls) {
      await getWork(browser, cookies, url, callback);
      await sleep(1500);
    }

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
  catch(e) {
    if(browser) await browser.close();
    throw e;
  }
}

module.exports = getWorks;