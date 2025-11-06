import axios from "axios";
import * as cheerio from "cheerio";

console.log("myntra");
export async function scrapeMyntra(url) {
  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Referer: "https://www.myntra.com/",
      Connection: "close",
    };

    const $ = cheerio.load(data);

    // ✅ Product Name
    const name =
      $("h1.pdp-title").text().trim() ||
      $("meta[property='og:title']").attr("content") ||
      null;

    // ✅ Price (HTML + JSON-LD fallback)
    let price =
      $("meta[property='product:price:amount']").attr("content") ||
      $(".pdp-price").text().trim() ||
      $(".pdp-price strong").text().trim() ||
      $(".price").first().text().trim() ||
      null;

    if (!price) {
      $("script[type='application/ld+json']").each((_, el) => {
        try {
          const json = JSON.parse($(el).html());
          if (json.offers?.price) {
            price = json.offers.price;
          }
        } catch (_) {} // ignore JSON errors
      });
    }

    if (price) price = price.replace(/[^\d]/g, "");

    // ✅ Main Image
    const main_image =
      $("meta[property='og:image']").attr("content") ||
      $("img.pdp-image").first().attr("src") ||
      null;

    // ✅ Description
    const description =
      $(".pdp-product-description-content").text().trim() ||
      $("meta[name='description']").attr("content") ||
      null;

    return {
      name: name || "N/A",
      price: price || "N/A",
      description: description || "N/A",
      main_image: main_image || "N/A",
      url,
    };
  } catch (err) {
    console.error("❌ Myntra scraper error:", err.message);
    return { error: "Failed to scrape Myntra", url };
  }
}
