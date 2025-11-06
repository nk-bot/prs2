import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeMothercare(url) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  };

  const { data } = await axios.get(url, { headers });
  const $ = cheerio.load(data);

  // ✅ Name
  const name =
    $("h1.product-name").text().trim() ||
    $("h1").text().trim() ||
    null;

  // ✅ Price
  const priceText =
    $("span.new-price").first().text().trim() ||
    $("span.current-price").text().trim();
  
  let price = null;
  if (priceText) {
    price = parseFloat(priceText.replace(/[^\d]/g, ""));
  }

  // ✅ Main Image
  const main_image =
    $("meta[property='og:image']").attr("content") ||
    $(".primary-image-container img").attr("src") ||
    null;

  // ✅ Additional Images
  const pictureImages = new Set();

$("picture source, picture img").each((_, el) => {
  const srcset = $(el).attr("srcset");
  if (srcset) {
    srcset.split(",").forEach((src) => {
      const cleanUrl = src.trim().split(" ")[0]; // remove resolution suffix (e.g., "400w")
      if (cleanUrl.startsWith("http")) {
        pictureImages.add(cleanUrl);
      }
    });
  }

  const src = $(el).attr("src");
  if (src && src.startsWith("http")) {
    pictureImages.add(src);
  }
});

const additional_images = Array.from(pictureImages);

  // ✅ Availability
  let availability =
    $(".pdp-stock-status").text().trim() ||
    $(".in-stock").text().trim() ||
    $(".availability-message").text().trim() ||
    null;

  if (!availability) {
    availability = "In Stock";
  } else if (availability.toLowerCase().includes("out")) {
    availability = "Out of Stock";
  }

  // ✅ Description
  const description =
    $(".pdp-product-description").text().trim() ||
    $("meta[name='description']").attr("content") ||
    null;

  // ✅ Return Policy
  let return_policy = null;
  $(".accordion-item").each((_, el) => {
    if ($(el).text().includes("Returns")) {
      return_policy = $(el).text().trim();
    }
  });
  if (!return_policy) return_policy = "Refer to Mothercare return policy page";

  // ✅ Variants (Size/Color)
  const variants = [];
  $(".swatch-option").each((_, el) => {
    const variant = $(el).text().trim();
    if (variant) variants.push(variant);
  });

  return {
    site: "Mothercare",
    url,
    name: name ?? "N/A",
    price: price ?? "N/A",
    availability,
    main_image: main_image ?? "N/A",
    additional_images,
    description: description ?? "N/A",
    return_policy,
    variants: variants.length ? variants : [],
  };
}
