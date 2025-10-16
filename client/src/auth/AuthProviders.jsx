import React, {createContext, useContext, useEffect, useState, useMemo} from "react";
import {supabase} from "./supabaseClient.js";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let sub;
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user ?? null);
            setLoading(false);
            sub = supabase.auth.onAuthStateChange((_e, session) => {
                setUser(session?.user ?? null);
                
                // Clear state when user signs out
                if (!session) {
                    // Additional cleanup can be performed here
                    // e.g., clear localStorage, reset other states, etc.
                }
            }).data.subscription;
        })();
        return () => sub?.unsubscribe();
    }, []);

    // Enhanced signOut that ensures proper cleanup
    const handleSignOut = async () => {
        try {
            // Clear user state immediately for responsive UI
            setUser(null);
            
            // Sign out from Supabase
            const { error } = await supabase.auth.signOut({ scope: 'local' });
            
            if (error) throw error;
            
            return { error: null };
        } catch (error) {
            console.error('Sign out error:', error);
            // Even on error, keep user state cleared locally
            return { error };
        }
    };

    const value = useMemo(() => ({
        user,
        userId: user?.id,
        loading,
        signIn: (args) => supabase.auth.signInWithPassword(args),
        signUp: (args) => supabase.auth.signUp(args),
        signOut: handleSignOut,
    }), [user, loading]);
    
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
