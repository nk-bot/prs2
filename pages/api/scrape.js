import Papa from "papaparse";
import { supabase } from "../../supabaseClient.js";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import os from "os";
import { scrapeFirstCry } from "../../scrapers/firstcry.js";
import { scrapeMothercare } from "../../scrapers/mothercare.js";
import { scrapeMyntra } from "../../scrapers/m.js";
import { scrapeAmazon } from "../../scrapers/amazon.js";

export const config = {
  api: {
    bodyParser: false, // ⛔ must disable built-in parser for file uploads
  },
};

export default async function handler(req, res) {
  // Ensure we always return JSON
  const sendJson = (status, data) => {
    res.status(status).setHeader("Content-Type", "application/json");
    return res.json(data);
  };

  if (req.method !== "POST") {
    return sendJson(405, { error: "Method not allowed" });
  }

  // Configure formidable for serverless environments
  const uploadDir = path.join(os.tmpdir(), "formidable-uploads");
  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    multiples: false,
    uploadDir: uploadDir,
    keepExtensions: true,
  });

  try {
    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];
    if (!file) {
      return sendJson(400, { error: "No file uploaded" });
    }

    // Read and parse the CSV
    let csvText;
    try {
      csvText = fs.readFileSync(file.filepath, "utf-8");
    } catch (readError) {
      console.error("Error reading file:", readError);
      return sendJson(500, { error: "Failed to read uploaded file" });
    }

    // Clean up temp file
    try {
      fs.unlinkSync(file.filepath);
    } catch (unlinkError) {
      // Ignore cleanup errors
      console.warn("Could not delete temp file:", unlinkError);
    }

    const parsed = Papa.parse(csvText, { header: true });
    const urls = parsed.data.map((row) => row.url).filter(Boolean);

    console.log("Parsed URLs:", urls);

    if (urls.length === 0) {
      return sendJson(400, { error: "No valid URLs found in CSV file" });
    }

    let successCount = 0;

    // Loop through each URL and run the right scraper
    for (const url of urls) {
      console.log("🔍 Scraping:", url);

      let scrapedData = null;

      try {
        if (url.includes("firstcry")) {
          scrapedData = await scrapeFirstCry(url);
	} else if (url.includes("myntra")) {
          scrapedData = await scrapeMyntra(url);
        } else if (url.includes("mothercare")) {
          scrapedData = await scrapeMothercare(url);
        } else if (url.includes("amazon")) {
          scrapedData = await scrapeAmazon(url);
        }  else if (url.includes("amzn")) {
          scrapedData = await scrapeAmazon(url);
        } 
	  else {
          console.log("❌ No scraper available for this URL:", url);
          continue; // skip unknown site
        }

        if (scrapedData?.name && scrapedData?.price) {
          await supabase.from("products").upsert(scrapedData);
          successCount++;
          console.log(`✅ Scraped and saved: ${scrapedData.name}`);
        } else {
          console.log(`⚠️ Missing data for URL: ${url}`);
        }
      } catch (scrapeError) {
        console.error(`❌ Error scraping ${url}:`, scrapeError.message);
      }
    }

    // Always respond after processing
    return sendJson(200, {
      message: `✅ Scraped ${successCount} products successfully.`,
      totalUrls: urls.length,
      successCount,
    });

  } catch (err) {
    console.error("Error in /api/scrape:", err);
    return sendJson(500, { 
      error: err.message || "Internal server error",
      details: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
}
