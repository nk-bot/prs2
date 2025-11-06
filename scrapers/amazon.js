import axios from "axios";
import * as cheerio from "cheerio";


export async function scrapeAmazon(url) {
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const $ = cheerio.load(data);

  const name = $("#productTitle").text().trim();
  const price =
    $("#priceblock_ourprice").text().trim() ||
    $(".a-price .a-offscreen").first().text().trim();
  const availability = $("#availability span").text().trim();
  const main_image = $("#imgTagWrapperId img").attr("src");
  let additional_images = [];

  // 1️⃣ Extract JSON images from dynamic attribute
  const dynamicImgJSON = $("#imgTagWrapperId img").attr("data-a-dynamic-image");

  if (dynamicImgJSON) {
    try {
      const imgObj = JSON.parse(dynamicImgJSON);
      additional_images = [...Object.keys(imgObj)];
    } catch {}
  }

  // 2️⃣ Thumbnail images
  $("li.image.item img").each((_, el) => {
    const img =
      $(el).attr("data-src") ||
      $(el).attr("src") ||
      $(el).attr("srcset")?.split(" ")[0];

    if (img && !additional_images.includes(img)) {
      additional_images.push(img);
    }
  });

  const description = $("#feature-bullets ul li span").text().trim();
  const return_policy = $("#RETURNS_POLICY span").text().trim() || "Refer site";
  const variants = [];

  $("#twister .a-dropdown-container").each((_, el) => {
    const type = $(el).find(".a-form-label").text().trim();
    const options = [];
    $(el)
      .find("option")
      .each((_, o) => options.push($(o).text().trim()));
    variants.push({ type, options });
  });
  console.log("name:", name);  
  console.log("price", price);
  console.log("description :", description);
  console.log("image", main_image);

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
    variants,
  };
}