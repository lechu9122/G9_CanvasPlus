import React from "react";
import { Navigate } from "react-router-dom";
import {useAuth} from "./AuthProviders.jsx";


export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;           // keep it blank while bootstrapping
    return user ? children : <Navigate to="/login" replace />;
}
