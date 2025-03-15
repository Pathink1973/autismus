import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://oisjitofsoltrvixkife.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pc2ppdG9mc29sdHJ2aXhraWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyOTM5ODAsImV4cCI6MjA1Njg2OTk4MH0.OKFVoPcsxwpLlmeMnFZfEup9niV3aBUuUbQKMO4SlB8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
