import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ybiepaufisubaskmjcfi.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliaWVwYXVmaXN1YmFza21qY2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzcyMjYsImV4cCI6MjA5NzgxMzIyNn0.t9gT1v4Bbtz4GEOVjelj2PEoxnpZL_FdY2R4Tmo0sj8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
