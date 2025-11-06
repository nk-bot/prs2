import puppeteer from "puppeteer";

export async function scrapeMyntra(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
  );

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  const result = await page.evaluate(() => {
    const brand = document.querySelector("h1.pdp-title")?.innerText?.trim() || "";
    const product = document.querySelector("h1.pdp-name")?.innerText?.trim() || "";
    const name = `${brand} ${product}`.trim();

    const price = document
      .querySelector(".pdp-price strong")
      ?.innerText.replace(/[^\d]/g, "");

    const imageEl = document.querySelector(".image-grid-image");
    const main_image =
      imageEl?.getAttribute("src") || imageEl?.getAttribute("data-src");

    const additional_images = Array.from(
      document.querySelectorAll(".image-grid-image")
    ).map(img => img.getAttribute("src") || img.getAttribute("data-src"));

    const description = document.querySelector(
      ".pdp-product-description-content"
    )?.innerText?.trim();

    return { name, price, main_image, additional_images, description };
  });

  await browser.close();
  return result;
}
