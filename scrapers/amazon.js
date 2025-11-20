import axios from "axios";
import * as cheerio from "cheerio";

/* ------------------------------------------
   FIX FUNCTION → Rebuild high-res Amazon URL
-------------------------------------------*/
function fixAmazonImage(url) {
  if (!url) return null;

  // Amazon image ID extractor
  const match = url.match(/\/I\/([^._]+)/);
  if (!match) return null;

  const id = match[1];

  // Return a clean HD image
  return `https://m.media-amazon.com/images/I/${id}._SL1500_.jpg`;
}

export async function scrapeAmazon(url) {
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const $ = cheerio.load(data);

  /* -------------------------------
     BASIC PRODUCT DATA
  ------------------------------- */
  const name = $("#productTitle").text().trim();

  const price =
    $("#priceblock_ourprice").text().trim() ||
    $(".a-price .a-offscreen").first().text().trim();

  const availability = $("#availability span").text().trim();

  /* ------------------------------------------
     👇 1) GET MAIN IMAGE (HIGH RES)
  -------------------------------------------- */
  let mainImageRaw =
    $("#imgTagWrapperId img").attr("data-old-hires") ||
    $("#imgTagWrapperId img").attr("src") ||
    $("#landingImage").attr("src");

  const main_image = fixAmazonImage(mainImageRaw);

  /* ------------------------------------------
     👇 2) GET ZOOM IMAGES FROM THUMBNAILS
  -------------------------------------------- */
  let additional_images = [];

  $("#altImages img").each((i, el) => {
    let raw =
      $(el).attr("data-image-source") ||
      $(el).attr("data-src") ||
      $(el).attr("src");

    if (!raw) return;

    const fixed = fixAmazonImage(raw);
    if (fixed && !additional_images.includes(fixed)) {
      additional_images.push(fixed);
    }
  });

  /* ------------------------------------------
     PRODUCT DESCRIPTION
  -------------------------------------------- */
  const description = $("#feature-bullets ul li span").text().trim();
  const return_policy = $("#RETURNS_POLICY span").text().trim() || "Refer site";

  /* ------------------------------------------
     VARIANTS (SIZE, COLOR, ETC)
  -------------------------------------------- */
  const variants = [];

  $("#twister .a-dropdown-container").each((_, el) => {
    const type = $(el).find(".a-form-label").text().trim();
    const options = [];

    $(el)
      .find("option")
      .each((_, o) => options.push($(o).text().trim()));

    variants.push({ type, options });
  });

  /* ------------------------------------------
     DEBUG LOGS (optional)
  -------------------------------------------- */
  console.log("name:", name);
  console.log("price:", price);
  console.log("main_image:", main_image);
  console.log("additional_images:", additional_images);

  /* ------------------------------------------
     RETURN FINAL CLEAN OBJECT
  -------------------------------------------- */
  return {
    site: "Amazon",
    url,
    name,
    price,
    availability,
    main_image,
    additional_images,
    description,
    return_policy,
    variants
  };
}
