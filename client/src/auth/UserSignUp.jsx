import { useState } from "react";
import {supabase} from "./supabaseClient.js";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function UserSignUp() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        let { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        })

        if (error !== null) {
            toast.error(error.message);
            setEmail("");
            setPassword("");
        } else {
            toast.success("Sign Up successful");
            goToCanvasPlus();
        }
    }

    function goToCanvasPlus() {
        navigate("/canvas-plus");
    }

    return (
        <div
            className="login-container"
            style={{
                background: "rgba(0, 60, 120, 0.8)",
                borderRadius: "16px",
                padding: "24px",
                width: "300px",
                margin: "0 auto",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
        >
            <h2 style={{ textAlign: "center", marginBottom: "16px" }}>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "6px" }}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "8px",
                            border: "none",
                            outline: "none",
                        }}
                    />
                </div>
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "6px" }}>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "8px",
                            border: "none",
                            outline: "none",
                        }}
                    />
                </div>
                <button
                    type="submit"
                    style={{
                        width: "100%",
                        padding: "12px",
                        border: "none",
                        borderRadius: "10px",
                        backgroundColor: "#007AFF",
                        color: "#fff",
                        fontWeight: "bold",
                        cursor: "pointer",
                    }}
                >
                    Sign Up
                </button>
            </form>
            <Toaster position="top-center" reverseOrder={false} />
        </div>
    );
}
