import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cksauvgjodsduhxtnqwm.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrc2F1dmdqb2RzZHVoeHRucXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzE0OTUsImV4cCI6MjEwMzg0NzQ5NX0.4a5gB69LbXyG9zVE9AxKGp_BGDL9cTn3QSs4zj6Oirc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
