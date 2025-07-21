import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These values are expected to be set in the environment.
// The build/runtime environment should replace process.env with actual values.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
        console.error("Failed to create Supabase client:", error);
    }
} else {
    console.warn("Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are not set. Database features will be disabled.");
}

export { supabase };
