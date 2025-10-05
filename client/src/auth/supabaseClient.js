
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://ljygydqwyhlsxhwtnuiz.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || ''

export const supabase =  createClient(supabaseUrl, supabaseKey)

export async function getUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
}

