import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token") || "");
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
    });
    const [loading, setLoading] = useState(false);

    // Keep token/user mirrored to localStorage
    useEffect(() => {
        if (token) localStorage.setItem("token", token); else localStorage.removeItem("token");
        if (user) localStorage.setItem("user", JSON.stringify(user)); else localStorage.removeItem("user");
        if (user?.role) localStorage.setItem("role", user.role); else localStorage.removeItem("role");
    }, [token, user]);

    // React to changes from other tabs
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === "token") setToken(e.newValue || "");
            if (e.key === "user") {
                try { setUser(e.newValue ? JSON.parse(e.newValue) : null); } catch { setUser(null); }
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // If we have a token but no user, or token changes, refresh /me
    useEffect(() => {
        let ignore = false;
        async function fetchMe() {
            if (!token) { setUser(null); return; }
            setLoading(true);
            try {
                const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                if (!ignore) {
                    if (res.ok) setUser(data);
                    else { setUser(null); setToken(""); }
                }
            } catch {
                if (!ignore) { setUser(null); setToken(""); }
            } finally {
                if (!ignore) setLoading(false);
            }
        }
        fetchMe();
        return () => { ignore = true; };
    }, [token]);

    // Public API
    const login = async (username, password, isRegister, confirmPassword) => {
        const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, confirmPassword }),
        });
        const data = await res.json();
        if (res.ok && data.token && data.user) {
            setToken(data.token);
            setUser(data.user);
            return { ok: true };
        }
        return { ok: false, message: data.message || "Request failed" };
    };

    const logout = () => {
        setToken("");
        setUser(null);
    };

    const updateDisplayName = async (newDisplayName) => {
        if (!token || !user?.id) return { ok: false, message: "Not authenticated" };
        const res = await fetch(`/api/users/${user.id}/display-name`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ newDisplayName }),
        });
        const data = await res.json();
        if (res.ok) {
            setUser((u) => (u ? { ...u, displayName: data.displayName } : u));
            return { ok: true };
        }
        return { ok: false, message: data.message || "Failed to update display name" };
    };

    const value = useMemo(
        () => ({
            token,
            user,
            role: user?.role || "",
            loading,
            login,
            logout,
            updateDisplayName,
        }),
        [token, user, loading]
    );

    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
    return useContext(AuthCtx);
}