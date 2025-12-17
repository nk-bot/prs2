import axios from "axios";

function extractProductId(url) {
  const match = url.match(/\/(\d+)(\/|$)/);
  return match ? match[1] : null;
}

export async function scrapeFirstCry(url) {
  const productId = extractProductId(url);
  if (!productId) throw new Error("Invalid FirstCry URL");

  const apiUrl = `https://www.firstcry.com/api/pdp/product/${productId}`;

  const { data } = await axios.get(apiUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "application/json"
    },
    timeout: 15000
  });

  const product = data?.product;
  if (!product) throw new Error("Product not found");

  const name = product.productName;
  const description = product.description?.replace(/<[^>]+>/g, "").trim();

  const price = product.finalPrice || product.mrp;
  const availability = product.inStock ? "In Stock" : "Out of Stock";

  const images = product.imageGallery || [];

  const main_image = images[0] || null;
  const additional_images = images.slice(1);

  const variants =
    product.variants?.map(v => ({
      size: v.size,
      price: v.price,
      available: v.inStock
    })) || [];

  return {
    site: "FirstCry",
    url,
    name,
    price,
    availability,
    main_image,
    additional_images,
    description,
    return_policy: "Refer FirstCry",
    variants
  };
}
