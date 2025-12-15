// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Missing Supabase env vars! Add them in .env.local");
}

const globalKey = "__SUPABASE_CLIENT__";

const supabase =
  window[globalKey] ||
  (window[globalKey] = createClient(supabaseUrl, supabaseAnonKey));

export { supabase };
export default supabase;
