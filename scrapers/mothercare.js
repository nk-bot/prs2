import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeMothercare(url) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  };

  const { data } = await axios.get(url, { headers });
  const $ = cheerio.load(data);

  const name = $("h1").text().trim() || null;

  // 👇 Extract price
  const priceText = $("span.new-price.mc-regular").first().text().trim();
  console.log("Raw price text:", JSON.stringify(priceText)); // show hidden chars

  let price = null;
  if (priceText) {
  // Removes ₹, commas, whitespace, NBSP, etc → keeps digits only
    const numeric = priceText.replace(/[^\d.]/g, "");
    price = parseFloat(numeric);
  }

console.log("Price:", price);


  const main_image = $("meta[property='og:image']").attr("content") || null;
  const description =
    $("div.pdp-product-description-content").text().trim() ||
    $("meta[name='description']").attr("content");
  
  console.log("name:", name);  
  console.log("price", price);
  console.log("description :", description);
  console.log("image", main_image);

    return {
    name,
    price,
    main_image,
    url,
    description,
    site: "Mothercare",
  };
}
