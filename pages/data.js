import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";

export default function DataPage() {
  const [rows, setRows] = useState([]);

  const loadData = async () => {
    const { data, error } = await supabase
      .from("products") // your table name
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setRows(data);
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>📦 Scraped Products</h2>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            {rows[0] && Object.keys(rows[0]).map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {Object.values(row).map((value, i) => (
                <td key={i}>{String(value)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
