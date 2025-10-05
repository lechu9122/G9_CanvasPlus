import React, {createContext, useContext, useEffect, useState} from "react";
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
            }).data.subscription;
        })();
        return () => sub?.unsubscribe();
    }, []);

    const value = {
        user,
        userId: user?.id,
        loading,
        signIn: (args) => supabase.auth.signInWithPassword(args),
        signUp: (args) => supabase.auth.signUp(args),
        signOut: () => supabase.auth.signOut(),
    };
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
