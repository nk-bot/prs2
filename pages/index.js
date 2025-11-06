import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a CSV file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setMessage("Uploading and scraping... ⏳");

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        body: formData,
      });

      // Check if response is ok
      if (!res.ok) {
        const text = await res.text();
        // Try to parse as JSON, but handle HTML error pages
        try {
          const errorData = JSON.parse(text);
          setMessage("❌ Error: " + (errorData.error || errorData.message || `HTTP ${res.status}`));
        } catch {
          setMessage(`❌ Error: Server returned ${res.status} ${res.statusText}. ${text.substring(0, 100)}`);
        }
        return;
      }

      // Check content-type before parsing JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        setMessage("❌ Error: Server returned non-JSON response. " + text.substring(0, 100));
        return;
      }

      const data = await res.json();
      setMessage(data.message || data.error || "✅ Upload successful");
    } catch (err) {
      setMessage("❌ Error uploading file: " + err.message);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🧠 Bulk Scraper</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit" style={{ marginLeft: "1rem" }}>
          Start Scraping
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>{message}</p>
    </div>
  );
}
