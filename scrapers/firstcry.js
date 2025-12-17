import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeFirstCry(url) {
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "text/html",
    },
    timeout: 15000,
  });

  const $ = cheerio.load(data);

  // ✅ Name
  const name = $("h1").first().text().trim();
  if (!name) throw new Error("Product not found");

  // ✅ Price
  const price =
    $(".pdp-price .offer-price").text().trim() ||
    $(".pdp-price").text().trim();

  // ✅ Availability
  const availability = $(".add-to-cart").length
    ? "In Stock"
    : "Out of Stock";

  // ✅ Main Image
  const main_image =
    $("#pdpMainImage img").attr("src") ||
    $(".pdp-image img").first().attr("src");

  // ✅ Additional Images
  const additional_images = [];

  $(".pdp-thumbnail img").each((_, el) => {
    let img = $(el).attr("data-src") || $(el).attr("src");
    if (img && !additional_images.includes(img)) {
      additional_images.push(img);
    }
  });

  // ✅ Description
  const description = $("#description").text().trim();

  return {
    site: "FirstCry",
    url,
    name,
    price,
    availability,
    main_image,
    additional_images,
    description,
  };
}
