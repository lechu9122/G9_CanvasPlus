import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import UserLogin from './auth/UserLogin.jsx';
import UserSignUp from './auth/UserSignUp.jsx';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';

import {AuthProvider} from "./auth/AuthProviders.jsx";
import ProtectedRoute from "./auth/ProtectedRoutes.jsx";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>
            <BrowserRouter>
                <Routes>

                    <Route path="/login" element={<UserLogin />} />
                    <Route path="/sign-up" element={<UserSignUp />} />

                    <Route
                        path="/canvas-plus"
                        element={
                            <ProtectedRoute>
                                <App />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    </StrictMode>
);
