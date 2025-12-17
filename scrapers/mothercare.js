import axios from "axios";

function extractHandle(url) {
  const match = url.match(/\/product\/([^/?]+)/);
  return match ? match[1] : null;
}

export async function scrapeMothercare(url) {
  const handle = extractHandle(url);
  if (!handle) throw new Error("Invalid Mothercare URL");

  const apiUrl = `https://mothercare.in/products/${handle}.json`;

  const { data } = await axios.get(apiUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "application/json"
    },
    timeout: 15000
  });

  const product = data.product;

  const name = product.title;
  const description = product.body_html?.replace(/<[^>]+>/g, "").trim();

  const price = product.variants?.[0]?.price || null;
  const availability = product.variants?.[0]?.available
    ? "In Stock"
    : "Out of Stock";

  const images = product.images.map(img => img.src);

  const main_image = images[0] || null;
  const additional_images = images.slice(1);

  const variants = product.variants.map(v => ({
    id: v.id,
    title: v.title,
    price: v.price,
    available: v.available
  }));

  return {
    site: "Mothercare",
    url,
    name,
    price,
    availability,
    main_image,
    additional_images,
    description,
    return_policy: "Refer Mothercare",
    variants
  };
}
