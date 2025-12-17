import { addExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import os from "os";

const puppeteerExtra = addExtra(puppeteer);
puppeteerExtra.use(StealthPlugin());

export async function scrapeFirstCry(url) {
  let browser;

  try {
    // ✅ Detect if running locally or in serverless (e.g., Vercel)
    const isLocal = os.platform() === "win32" || os.platform() === "darwin";

    const launchOptions = isLocal
      ? {
          headless: true,
          executablePath: await import("puppeteer")
            .then((m) => m.default.executablePath())
            .catch(() => undefined),
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        }
      : {
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          defaultViewport: chromium.defaultViewport,
        };

    browser = await puppeteerExtra.launch(launchOptions);

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    );

    console.log(`🔍 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    await page.waitForSelector("h1, .pp-dtl-name, .pdp-name", {
      timeout: 20000,
    });

    const data = await page.evaluate(() => {
      const name =
        document.querySelector(".pp-dtl-name")?.innerText.trim() ||
        document.querySelector(".pdp-name")?.innerText.trim() ||
        document.querySelector("h1")?.innerText.trim() ||
        null;

      // ✅ Price extraction
      let priceText =
        document.querySelector(".final-price")?.innerText.trim() ||
        document.querySelector(".prod-price")?.innerText.trim() ||
        document.querySelector(".pdp-final-price")?.innerText.trim() ||
        document.querySelector(".price")?.innerText.trim() ||
        document.querySelector(".mrp")?.innerText.trim() ||
        document.querySelector("meta[itemprop='price']")?.content ||
        document.querySelector("meta[property='product:price:amount']")?.content ||
        null;

      let price = null;
      if (priceText) {
        const numeric = priceText.replace(/[₹$,]/g, "").trim();
        if (/^\d{5,}$/.test(numeric)) price = (parseFloat(numeric) / 100).toFixed(2);
        else price = parseFloat(numeric).toFixed(2);
      }

      // ✅ Description
      const description =
        document.querySelector(".pp-dtl-desc")?.innerText.trim() ||
        document.querySelector(".product_desc")?.innerText.trim() ||
        document.querySelector("meta[name='description']")?.content ||
        null;

      // ✅ Main image
      const main_image =
        document.querySelector(".pp-dtl-imgbox img")?.src ||
        document.querySelector(".imgsliderwrap img")?.src ||
        document.querySelector("img[itemprop='image']")?.src ||
        document.querySelector("img")?.src ||
        null;

      // ✅ Additional images (from slider)
      const imageElements = document.querySelectorAll(
        ".swiper-slide img[src], .ImgSlider_Wrap img[src], .imgsliderwrap img[src]"
      );
      
      const all_images = Array.from(imageElements)
        .map((img) => img.getAttribute("src"))
        .filter((src) => src && !src.includes("blank"))
        .filter((v, i, a) => a.indexOf(v) === i); // Deduplicate

      // Filter out the main image from the additional list for a clean result
      const additional_images = all_images.filter(src => src !== main_image);

      // ✅ Availability
      const availabilityText =
        document.querySelector(".oos-text, .out-of-stock, .soldout")?.innerText.trim() ||
        document.querySelector(".add-to-cart, .addToCartBtn")?.innerText.trim() ||
        "";
      const availability = /out of stock|sold out/i.test(availabilityText)
        ? "Out of Stock"
        : "In Stock";

      // ✅ Return policy
      let return_policy = null;
      
      // 1. Target the policy span with the 'returnpopup()' click handler
      const policySpan = document.querySelector('span.policy-1[onclick*="returnpopup"]');
      
      if (policySpan) {
          // 2. Look for the policy text within the children (e.g., the label)
          return_policy = policySpan.querySelector('.policytext')?.innerText.trim() || 
                          policySpan.innerText.trim();
      }
      
      // 3. Fallback to existing selectors in case the specific element isn't found
      if (!return_policy) {
        return_policy =
          document.querySelector(".pp-return-policy, .policy-info")?.innerText.trim() ||
          document.querySelector(".policyDetail .policy-txt")?.innerText.trim() ||
          document.querySelector(".policyDetail")?.innerText.trim() ||
          null;
      }
      
      // 4. Clean up any remaining "Gift Wrap" text, though the new selector should prevent this
      if (return_policy) {
        return_policy = return_policy.replace(/Gift Wrap|Gift-wrap/gi, '').trim();
        return_policy = return_policy.replace(/^[|,\s]+|[|,\s]+$/g, '').trim() || null;
      }
      // ✅ Variants (sizes)
      const variants = Array.from(
        document.querySelectorAll(".size-box, .sizeOpt, .sizeSel input[type='radio'], .sizeSel span")
      )
        .map((el) => el.innerText.trim() || el.value?.trim())
        .filter(Boolean);

      return {
        site: "Firstcry",
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

    console.log("✅ Scraped data:", data);
    return data;
  } catch (err) {
    console.error("❌ Error scraping FirstCry:", err.message);
    throw err;
  } finally {
    if (browser) await browser.close();
  }
}
