import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

export async function scrapeMyntra(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled"
    ]
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
  );

  await page.setExtraHTTPHeaders({
    "accept-language": "en-US,en;q=0.9"
  });

  try {
    await page.goto(url, { timeout: 90000, waitUntil: "networkidle2" });

    // Myntra React hydration wait
    await page.waitForSelector(".pdp-title", { timeout: 20000 })
      .catch(() => page.waitForTimeout(4000));

    const result = await page.evaluate(() => {
      const brand = document.querySelector(".pdp-title")?.innerText?.trim() || "";
      const product = document.querySelector(".pdp-name")?.innerText?.trim() || "";
      const name = product ? `${brand} ${product}` : brand;

      const price = document.querySelector(".pdp-price .pdp-price")?.innerText?.replace(/[^\d]/g, "")
        || document.querySelector(".pdp-price strong")?.innerText?.replace(/[^\d]/g, "");

      const imgs = Array.from(document.querySelectorAll(".image-grid-image"))
        .map(img => img.getAttribute("src") || img.getAttribute("data-src"))
        .filter(Boolean);

      const main_image = imgs[0] || null;
      const additional_images = imgs;

      const description = document.querySelector(".pdp-product-description-content")?.innerText?.trim();
      console.log("name:", name);  
      console.log("price", price);
      console.log("description :", description);
      console.log("image", main_image);
	
      return { name, price, main_image, additional_images, description };
    });

    await browser.close();
    return result;
  } catch (err) {
    await browser.close();
    throw err;
  }
}
