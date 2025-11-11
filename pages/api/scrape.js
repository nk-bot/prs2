import Papa from "papaparse";
import { supabase } from "../../supabaseClient.js";
import formidable from "formidable";
import fs from "fs";
import ExcelJS from "exceljs";

import { scrapeFirstCry } from "../../scrapers/firstcry.js";
import { scrapeMothercare } from "../../scrapers/mothercare.js";
import { scrapeMyntra } from "../../scrapers/m.js";
import { scrapeAmazon } from "../../scrapers/amazon.js";

export const config = { api: { bodyParser: false } };

function parseForm(req) {
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { files } = await parseForm(req);
    const file = files.file?.[0];

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const csvText = fs.readFileSync(file.filepath, "utf-8");
    const parsed = Papa.parse(csvText, { header: true });
    const urls = parsed.data.map((r) => r.url).filter(Boolean);

    let scrapedList = [];

    for (const url of urls) {
      let data = null;
      try {
        if (url.includes("firstcry")) data = await scrapeFirstCry(url);
        else if (url.includes("myntra")) data = await scrapeMyntra(url);
        else if (url.includes("mothercare")) data = await scrapeMothercare(url);
        else if (url.includes("amazon") || url.includes("amzn")) data = await scrapeAmazon(url);
        else continue;

        if (data?.name) {
          scrapedList.push(data);
          await supabase.from("products").upsert(data);
        }
      } catch (err) {
        console.log(`❌ Error scraping ${url}`, err);
      }
    }

    // ✅ Generate Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Scraped Products");

    sheet.columns = [
      { header: "site", key: "site", width: 15 },
      { header: "url", key: "url", width: 60 },
      { header: "name", key: "name", width: 40 },
      { header: "price", key: "price", width: 15 },
      { header: "availability", key: "availability", width: 15 },
      { header: "main_image", key: "main_image", width: 70 },
      { header: "additional_images", key: "additional_images", width: 80 },
      { header: "description", key: "description", width: 80 },
      { header: "return_policy", key: "return_policy", width: 40 },
      { header: "variants", key: "variants", width: 30 },
    ];

    scrapedList.forEach((p) => {
      sheet.addRow({
        ...p,
        additional_images: JSON.stringify(p.additional_images),
        variants: JSON.stringify(p.variants),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=scraped_products.xlsx");
    return res.send(buffer);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
