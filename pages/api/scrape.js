import Papa from "papaparse";
import { supabase } from "../../supabaseClient.js";
import formidable from "formidable";
import fs from "fs";
import { scrapeFirstCry } from "../../scrapers/firstcry.js";
import { scrapeMothercare } from "../../scrapers/mothercare.js";
import { scrapeMyntra } from "../../scrapers/myntra.js";
import { scrapeAmazon } from "../../scrapers/amazon.js";

export const config = {
  api: {
    bodyParser: false, // ⛔ must disable built-in parser for file uploads
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ multiples: false });

  try {
    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Read and parse the CSV
    const csvText = fs.readFileSync(file.filepath, "utf-8");
    const parsed = Papa.parse(csvText, { header: true });
    const urls = parsed.data.map((row) => row.url).filter(Boolean);

    console.log("Parsed URLs:", urls);

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
    res.status(200).json({
      message: `✅ Scraped ${successCount} products successfully.`,
      totalUrls: urls.length,
      successCount,
    });

  } catch (err) {
    console.error("Error in /api/scrape:", err);
    res.status(500).json({ error: err.message });
  }
}
