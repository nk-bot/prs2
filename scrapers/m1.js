import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

console.log("m.js");

export async function scrapeMyntra(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
  );

  await page.setExtraHTTPHeaders({
    "accept-language": "en-US,en;q=0.9",
  });

  try {
    await page.goto(url, { timeout: 90000, waitUntil: "networkidle2" });

    // Wait for Myntra React hydration
    await page
      .waitForSelector(".pdp-title", { timeout: 20000 })
      .catch(() => page.waitForTimeout(4000));

    const result = await page.evaluate(() => {
      const brand =
        document.querySelector(".pdp-title")?.innerText?.trim() || "";
      const product =
        document.querySelector(".pdp-name")?.innerText?.trim() || "";
      const name = product ? `${brand} ${product}` : brand;

      const price =
        document
          .querySelector(".pdp-price .pdp-price")
          ?.innerText?.replace(/[^\d]/g, "") ||
        document
          .querySelector(".pdp-price strong")
          ?.innerText?.replace(/[^\d]/g, "");

      // ✅ Extract images from background-image style
      const imgs = Array.from(document.querySelectorAll(".image-grid-image"))
        .map((img) => {
          const bgImage = img.style.backgroundImage;
          if (bgImage) {
            const match = bgImage.match(/url\("(.*?)"\)/);
            return match ? match[1] : null;
          }
          return null;
        })
        .filter(Boolean);

      const main_image = imgs[0] || null;
      const additional_images = imgs.slice(1);

      const description =
        document
          .querySelector(".pdp-product-description-content")
          ?.innerText?.trim() || null;

      const availability = document
        .querySelector(".pdp-add-to-bag")
        ?.innerText?.includes("OUT")
        ? "Out of Stock"
        : "In Stock";

      const return_policy =
        Array.from(document.querySelectorAll(".meta-desc"))
          .map((el) => el.innerText.trim())
          .find((text) =>
            /(return|exchange)/i.test(text)
          ) || null;

      const variants = Array.from(
        document.querySelectorAll(".size-buttons-size-container button")
      )
        .map((el) => el.innerText.trim())
        .filter(Boolean);

      // Optional debug logs (will not appear outside page context)
      console.log("name:", name);
      console.log("price:", price);
      console.log("description:", description);
      console.log("main image:", main_image);

      return {
        site: "Myntra",
        url: window.location.href,
        name,
        price: price ? Number(price) : "N/A",
        availability,
        main_image,
        additional_images,
        description,
        return_policy,
        variants,
      };
    });

    await browser.close();
    return result;
  } catch (err) {
    await browser.close();
    throw err;
  }
}
