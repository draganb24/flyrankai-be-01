import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

function getSupabaseConfig() {
    const supabaseUrl =
        process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
        process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase environment variables are not configured.');
    }

    return { supabaseUrl, supabaseKey };
}

export function getSupabase() {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();

    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false
        }
    });
}

export function getSupabaseAdmin() {
    const { supabaseUrl } = getSupabaseConfig();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return null;
    }

    return createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                persistSession: false
            }
        }
    );
}
