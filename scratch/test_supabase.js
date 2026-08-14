import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function run() {
  console.log("Fetching schema info...");
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    const data = await res.json();
    console.log("Swagger/OpenAPI paths:");
    if (data.paths) {
      console.log(Object.keys(data.paths));
    } else {
      console.log(data);
    }
  } catch (err) {
    console.log("Error:", err.message);
  }
}

run();
