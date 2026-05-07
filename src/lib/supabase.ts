import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

// For admin operations (like deleting, if needed in API routes)
// const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
// export const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);
