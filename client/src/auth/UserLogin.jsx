import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient.js";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function UserLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    // Reset global layout styling temporarily
    useEffect(() => {
        const root = document.getElementById("root");

        const prev = {
            bodyMaxWidth: document.body.style.maxWidth,
            bodyPadding: document.body.style.padding,
            bodyBg: document.body.style.background,
            bodyOverflowX: document.body.style.overflowX,
            rootMaxWidth: root ? root.style.maxWidth : "",
            rootPadding: root ? root.style.padding : "",
            rootBg: root ? root.style.background : "",
        };

        document.body.style.maxWidth = "none";
        document.body.style.padding = "0";
        document.body.style.background = "transparent";
        document.body.style.overflowX = "hidden";
        if (root) {
            root.style.maxWidth = "none";
            root.style.padding = "0";
            root.style.background = "transparent";
        }

        return () => {
            document.body.style.maxWidth = prev.bodyMaxWidth;
            document.body.style.padding = prev.bodyPadding;
            document.body.style.background = prev.bodyBg;
            document.body.style.overflowX = prev.bodyOverflowX;
            if (root) {
                root.style.maxWidth = prev.rootMaxWidth;
                root.style.padding = prev.rootPadding;
                root.style.background = prev.rootBg;
            }
        };
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            toast.error(error.message);
            setEmail("");
            setPassword("");
        } else {
            toast.success("Login successful");
            navigate("/canvas-plus");
        }
    }

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                fontFamily: "Poppins, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
                background: "radial-gradient(circle at 20% 20%, #0b1e47, #040b1a 70%)",
            }}
        >
            {/* Floating gradient shapes */}
            <div
                style={{
                    position: "absolute",
                    top: "-10%",
                    left: "-10%",
                    width: "40vw",
                    height: "40vw",
                    background: "radial-gradient(circle at center, rgba(0, 119, 255, 0.35), transparent 70%)",
                    filter: "blur(120px)",
                    animation: "float1 12s ease-in-out infinite alternate",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: "-15%",
                    right: "-15%",
                    width: "45vw",
                    height: "45vw",
                    background: "radial-gradient(circle at center, rgba(0, 204, 255, 0.25), transparent 70%)",
                    filter: "blur(100px)",
                    animation: "float2 14s ease-in-out infinite alternate",
                }}
            />

            {/* Login card */}
            <div
                style={{
                    zIndex: 2,
                    width: "420px",
                    maxWidth: "90vw",
                    padding: "36px 32px",
                    borderRadius: "12px",
                    background: "rgba(10, 22, 45, 0.75)",
                    boxShadow:
                        "0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(12px)",
                    color: "#EAF2FF",
                }}
            >
                <h1
                    style={{
                        textAlign: "center",
                        margin: "0 0 6px 0",
                        fontSize: "22px",
                        fontWeight: 700,
                        letterSpacing: "1px",
                        color: "#8fbfff",
                    }}
                >
                    CANVAS PLUS
                </h1>
                <h2
                    style={{
                        textAlign: "center",
                        margin: "0 0 24px 0",
                        fontWeight: 600,
                        fontSize: "28px",
                        color: "#fff",
                    }}
                >
                    Login
                </h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "14px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "6px",
                                fontSize: "13px",
                                color: "rgba(234,242,255,0.85)",
                                fontWeight: 500,
                            }}
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                border: "1px solid rgba(255,255,255,0.15)",
                                background: "rgba(255,255,255,0.05)",
                                color: "#EAF2FF",
                                outline: "none",
                                transition: "border 0.2s ease",
                            }}
                            onFocus={(e) =>
                                (e.target.style.border = "1px solid rgba(100,180,255,0.7)")
                            }
                            onBlur={(e) =>
                                (e.target.style.border = "1px solid rgba(255,255,255,0.15)")
                            }
                            placeholder="you@example.com"
                        />
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "6px",
                                fontSize: "13px",
                                color: "rgba(234,242,255,0.85)",
                                fontWeight: 500,
                            }}
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                border: "1px solid rgba(255,255,255,0.15)",
                                background: "rgba(255,255,255,0.05)",
                                color: "#EAF2FF",
                                outline: "none",
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "none",
                            borderRadius: "8px",
                            background:
                                "linear-gradient(135deg, #0078ff 0%, #005ce6 100%)",
                            color: "#fff",
                            fontWeight: 600,
                            cursor: "pointer",
                            boxShadow:
                                "0 6px 16px rgba(0, 120, 255, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                            transition: "all 0.2s ease-in-out",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                                "linear-gradient(135deg, #1a88ff 0%, #0069ff 100%)";
                            e.currentTarget.style.boxShadow =
                                "0 10px 22px rgba(0, 120, 255, 0.55)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                                "linear-gradient(135deg, #0078ff 0%, #005ce6 100%)";
                            e.currentTarget.style.boxShadow =
                                "0 6px 16px rgba(0, 120, 255, 0.4)";
                        }}
                    >
                        Sign In
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/sign-up")}
                        style={{
                            width: "100%",
                            marginTop: "12px",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.35)",
                            backgroundColor: "transparent",
                            color: "#EAF2FF",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                        }}
                    >
                        Click to Sign Up
                    </button>
                </form>
                <Toaster position="top-center" reverseOrder={false} />
            </div>

            {/* Floating animation keyframes */}
            <style>{`
        @keyframes float1 {
          from { transform: translate(0px, 0px); }
          to { transform: translate(40px, 60px); }
        }
        @keyframes float2 {
          from { transform: translate(0px, 0px); }
          to { transform: translate(-40px, -40px); }
        }
      `}</style>
        </div>
    );
}
