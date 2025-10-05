
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

import {AuthProvider, useAuth} from "../auth/AuthProviders.jsx";
import ProtectedRoute from "../auth/ProtectedRoutes.jsx";
import UserLogin from "../auth/UserLogin.jsx";
import UserSignUp from "../auth/UserSignUp.jsx";

// ---- Mocks ----
// Mock react-router-dom navigate + Navigate (so we can assert redirects)
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importActual) => {
    const real = await importActual();
    return {
        ...real,
        useNavigate: () => mockNavigate,
        // Render a simple marker we can assert instead of performing a real redirect
        Navigate: ({ to }) => <div data-testid="redirect" data-to={to} />,
    };
});

// Basic supabase auth mock
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();

vi.mock("../supabaseClient.js", () => {
    const supabase = {
        auth: {
            getUser: mockGetUser,
            onAuthStateChange: mockOnAuthStateChange,
            signInWithPassword: mockSignInWithPassword,
            signUp: mockSignUp,
            signOut: mockSignOut,
        },
    };
    // keep getUserId behavior identical to your code but using mocked supabase
    async function getUserId() {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id;
    }
    return { supabase, getUserId };
});



// Small test helper that consumes the auth context
function AuthConsumerProbe() {
    const { userId, user, loading, signOut } = useAuth();
    return (
        <div>
            <div data-testid="loading">{String(loading)}</div>
            <div data-testid="userId">{userId || ""}</div>
            <div data-testid="hasUser">{String(!!user)}</div>
            <button onClick={() => signOut()} data-testid="logout">Logout</button>
        </div>
    );
}

beforeEach(() => {
    vi.clearAllMocks();

    // default getUser: no user
    mockGetUser.mockResolvedValue({ data: { user: null } });

    // default onAuthStateChange: return a subscription with unsubscribe
    mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
    });

    // default auth actions succeed
    mockSignInWithPassword.mockResolvedValue({ data: { session: {} }, error: null });
    mockSignUp.mockResolvedValue({ data: { user: { id: "new-user" } }, error: null });
    mockSignOut.mockResolvedValue({ error: null });
});

afterEach(() => {
    mockNavigate.mockReset();
});

describe("AuthProvider (basic)", () => {
    it("bootstraps and exposes loading=false with no user", async () => {
        render(
            <AuthProvider>
                <AuthConsumerProbe />
            </AuthProvider>
        );

        // loading flips to false after initial getUser resolves
        await waitFor(() => {
            expect(screen.getByTestId("loading")).toHaveTextContent("false");
        });
        expect(screen.getByTestId("hasUser")).toHaveTextContent("false");
        expect(screen.getByTestId("userId")).toHaveTextContent("");
    });

    it("exposes user + userId when getUser returns a user", async () => {
        mockGetUser.mockResolvedValueOnce({
            data: { user: { id: "u-123" } },
        });

        render(
            <AuthProvider>
                <AuthConsumerProbe />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("loading")).toHaveTextContent("false");
        });
        expect(screen.getByTestId("hasUser")).toHaveTextContent("true");
        expect(screen.getByTestId("userId")).toHaveTextContent("u-123");
    });

    it("signOut calls supabase.auth.signOut()", async () => {
        render(
            <AuthProvider>
                <AuthConsumerProbe />
            </AuthProvider>
        );
        await waitFor(() => {
            expect(screen.getByTestId("loading")).toHaveTextContent("false");
        });
        fireEvent.click(screen.getByTestId("logout"));
        expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
});

describe("ProtectedRoute (basic)", () => {
    it("renders children when authenticated", async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: { id: "ok" } } });

        render(
            <AuthProvider>
                <ProtectedRoute>
                    <div data-testid="secure">secure</div>
                </ProtectedRoute>
            </AuthProvider>
        );

        // wait for provider to finish loading
        await waitFor(() => {
            expect(screen.queryByTestId("secure")).toBeInTheDocument();
        });
        expect(screen.queryByTestId("redirect")).not.toBeInTheDocument();
    });

    it("redirects to /login when unauthenticated", async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: null } });

        render(
            <AuthProvider>
                <ProtectedRoute>
                    <div>should-not-see</div>
                </ProtectedRoute>
            </AuthProvider>
        );

        await waitFor(() => {
            const redirect = screen.getByTestId("redirect");
            expect(redirect).toBeInTheDocument();
            expect(redirect).toHaveAttribute("data-to", "/login");
        });
    });
});

describe("UserLogin (basic)", () => {
    it("signs in and navigates to /canvas-plus on success", async () => {
        render(<UserLogin />);

        fireEvent.change(screen.getByLabelText("Email"), {
            target: { value: "a@b.com" },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "secret" },
        });
        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => {
            expect(mockSignInWithPassword).toHaveBeenCalledWith({
                email: "a@b.com",
                password: "secret",
            });
        });
        // navigates on success
        expect(mockNavigate).toHaveBeenCalledWith("/canvas-plus");
    });
});

describe("UserSignUp (basic)", () => {
    it("signs up and navigates to /canvas-plus on success", async () => {
        render(<UserSignUp />);

        fireEvent.change(screen.getByLabelText("Email"), {
            target: { value: "new@user.com" },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "pw" },
        });
        fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

        await waitFor(() => {
            expect(mockSignUp).toHaveBeenCalledWith({
                email: "new@user.com",
                password: "pw",
            });
        });
        expect(mockNavigate).toHaveBeenCalledWith("/canvas-plus");
    });
});

describe("getUserId helper (basic)", () => {
    it("returns user id when present", async () => {
        mockGetUser.mockResolvedValueOnce({
            data: { user: { id: "helper-1" } },
        });
        await expect(getUserId()).resolves.toBe("helper-1");
    });

    it("returns undefined when no user", async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: null } });
        await expect(getUserId()).resolves.toBeUndefined();
    });
});
