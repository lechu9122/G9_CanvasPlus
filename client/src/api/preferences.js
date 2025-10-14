// client/src/apl/preferences.js
import { supabase } from "../auth/supabaseClient.js"

/** Get current user's preferences (or null if none) */
export async function getUserPreferences(userId) {
    if (!userId) return null;
    const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(); // returns null if none

    if (error && error.code !== "PGRST116") {
        console.error("getUserPreferences error:", error);
    }
    return data || null;
}

/** Upsert preferences (conflicts on unique user_id) */
export async function saveUserPreferences({
                                              userId,
                                              themeColor,
                                              backgroundType, // 'color' | 'image'
                                              backgroundValue, // hex or url/dataUrl
                                          }) {
    if (!userId) return;

    const payload = {
        user_id: userId,
        theme_color: themeColor,
        background_type: backgroundType,
        background_value: backgroundValue,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from("user_preferences")
        .upsert(payload, { onConflict: "user_id" });

    if (error) {
        console.error("Error saving preferences:", error);
        throw error;
    }
}
