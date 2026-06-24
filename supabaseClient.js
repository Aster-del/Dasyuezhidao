import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // 開發時若忘了設定 .env.local，會在主控台看到清楚的提示
  console.warn(
    "[supabase] 尚未設定 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY，請參考 .env.local.example"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
