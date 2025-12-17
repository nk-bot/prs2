// scrapers/myntra.js
import axios from "axios";

export async function scrapeMyntra(url) {
  // ✅ Extract productId
  const match = url.match(/\/(\d+)\//);
  if (!match) {
    throw new Error("Invalid Myntra URL");
  }

  const productId = match[1];

  // ✅ Call Myntra API
  const apiUrl = `https://www.myntra.com/gateway/v2/product/${productId}`;

  const { data } = await axios.get(apiUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "accept-language": "en-IN"
    },
    timeout: 15000
  });

  const product = data?.style;

  if (!product) {
    throw new Error("Product not found");
  }

  // ✅ Name
  const name = `${product.brand?.name || ""} ${product.name || ""}`.trim();

  // ✅ Price
  const price =
    product.price?.discountedPrice ||
    product.price?.mrp ||
    null;

  // ✅ Images (HIGH RES)
  const images =
    product.media?.albums?.[0]?.images || [];

  const additional_images = images.map(
    img => `https://assets.myntassets.com/${img.imageURL}`
  );

  const main_image = additional_images[0] || null;

  // ✅ Availability
  const availability =
    product.inventory?.available
      ? "In Stock"
      : "Out of Stock";

  // ✅ Description
  const description =
    product.productDetails
      ?.map(d => d.value)
      .join(" ") || null;

  return {
    site: "Myntra",
    url,
    name,
    price,
    availability,
    main_image,
    additional_images,
    description,
    return_policy: "Refer Myntra",
    variants: []
  };
}
