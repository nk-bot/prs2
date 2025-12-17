import axios from "axios";

function extractProductId(url) {
  const match = url.match(/\/(\d+)(\/buy)?$/);
  return match ? match[1] : null;
}

export async function scrapeMyntra(url) {
  const productId = extractProductId(url);
  if (!productId) throw new Error("Invalid Myntra URL");

  const apiUrl = `https://www.myntra.com/gateway/v2/product/${productId}`;

  const { data } = await axios.get(apiUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Accept": "application/json"
    },
    timeout: 15000
  });

  const style = data?.style;
  if (!style) throw new Error("Product not found");

  const name = style.name;

  const price =
    style.price?.discounted ||
    style.price?.mrp ||
    null;

  const availability =
    style.inventory?.available ? "In Stock" : "Out of Stock";

  const images =
    style.media?.albums?.[0]?.images?.map(
      img => img.imageURL
    ) || [];

  const main_image = images[0] || null;
  const additional_images = images.slice(1);

  const description = style.description || "";

  const variants =
    style.sizes?.map(s => ({
      size: s.label,
      available: s.available
    })) || [];

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
    variants
  };
}
