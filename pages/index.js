import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function uploadAndScrape() {
    if (!file) return alert("Upload CSV first");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/scrape", { method: "POST", body: formData });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "scraped_products.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);

    setLoading(false);
  }

  return (
    <div style={{ padding: 30 }}>
      <h2>Bulk Product Scraper</h2>
      <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={uploadAndScrape} disabled={loading}>
        {loading ? "Scraping & Exporting..." : "Upload & Scrape"}
      </button>
    </div>
  );
}
