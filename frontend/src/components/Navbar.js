import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OwnerBadge from "../components/OwnerBadge";
import { useAuth } from "../auth/AuthContext";

export default function Navbar() {
    const navigate = useNavigate();
    const { user, role, token, logout, updateDisplayName } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isAuthed = !!token;

    async function handleChangeDisplayName() {
        const newDisplayName = prompt("Enter your new display name:");
        if (!newDisplayName) return;
        const ok = await updateDisplayName(newDisplayName);
        if (!ok?.ok) alert(ok.message || "Failed to update display name");
    }

    return (
        <>
            <nav className="bg-black text-red-400 p-4 flex items-center border-b border-white">
                <div className="flex items-center gap-4 w-full">
                    {/* Hamburger — MOBILE ONLY */}
                    <button
                        className="md:hidden w-10 h-10 grid place-items-center border border-red-500 rounded-none"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open menu"
                        title="Menu"
                    >
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-red-500" aria-hidden="true">
                            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>

                    {/* Desktop menu */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/" className="hover:text-red-600">Home</Link>

                        {isAuthed && (role === "owner" || role === "admin") && (
                            <>
                                {role === "owner" && (
                                    <Link to="/new" className="hover:text-red-600">Make Post</Link>
                                )}
                                <Link to="/admin/users" className="hover:text-red-600">Manage Users</Link>
                            </>
                        )}

                        {isAuthed && (
                            <>
                                <button onClick={handleChangeDisplayName} className="text-left hover:text-red-600">
                                    Change Display Name
                                </button>
                                <Link to="/account/password" className="hover:text-red-600">
                                    Change Password
                                </Link>

                                <div className={`flex items-center gap-2 pl-4 border-l border-white/30 ${role === "owner" ? "text-yellow-400" : "text-white"}`}>
                                    <span>Signed in as</span>
                                    {role === "owner" && <OwnerBadge />}
                                    <span className="font-bold">{user?.displayName || user?.username}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right edge: Login/Logout (desktop) */}
                    <div className="ml-auto hidden md:flex items-center">
                        {isAuthed ? (
                            <button
                                onClick={() => { logout(); setMobileOpen(false); navigate("/login"); }}
                                className="inline-block bg-black text-white border border-white px-4 py-2 rounded hover:bg-white hover:text-black transition-colors"
                            >
                                Logout
                            </button>
                        ) : (
                            <Link
                                to="/login"
                                className="inline-block bg-black text-white border border-white px-4 py-2 rounded hover:bg-white hover:text-black transition-colors"
                            >
                                Login
                            </Link>
                        )}
                    </div>

                    {/* Mobile right side: Signed in as OR Login */}
                    <div className="md:hidden ml-auto flex items-center">
                        {isAuthed ? (
                            <div className={`flex items-center gap-2 ${role === "owner" ? "text-yellow-400" : "text-white"}`}>
                                <span>Signed in as</span>
                                {role === "owner" && <OwnerBadge />}
                                <span className="font-bold">{user?.displayName || user?.username}</span>
                            </div>
                        ) : (
                            <Link to="/login" className="inline-block bg-black text-white border border-white px-4 py-2 rounded hover:bg-white hover:text-black transition-colors">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
                    <div className="absolute top-0 left-0 h-full w-72 bg-black border-r border-white p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-white font-semibold">Menu</span>
                            <button className="text-white text-xl" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                                ✕
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Link to="/" className="hover:text-red-600" onClick={() => setMobileOpen(false)}>Home</Link>

                            {isAuthed && (role === "owner" || role === "admin") && (
                                <>
                                    {role === "owner" && (
                                        <Link to="/new" className="hover:text-red-600" onClick={() => setMobileOpen(false)}>
                                            Make Post
                                        </Link>
                                    )}
                                    <Link to="/admin/users" className="hover:text-red-600" onClick={() => setMobileOpen(false)}>
                                        Manage Users
                                    </Link>
                                </>
                            )}

                            {isAuthed && (
                                <>
                                    <button
                                        onClick={() => { setMobileOpen(false); handleChangeDisplayName(); }}
                                        className="text-left hover:text-red-600"
                                    >
                                        Change Display Name
                                    </button>
                                    <Link to="/account/password" className="hover:text-red-600" onClick={() => setMobileOpen(false)}>
                                        Change Password
                                    </Link>
                                </>
                            )}

                            {!isAuthed ? (
                                <Link
                                    to="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="mt-4 inline-block bg-black text-white border border-white px-4 py-2 rounded hover:bg-white hover:text-black transition-colors"
                                >
                                    Login
                                </Link>
                            ) : (
                                <button
                                    onClick={() => { logout(); setMobileOpen(false); navigate("/login"); }}
                                    className="mt-4 inline-block bg-black text-white border border-white px-4 py-2 rounded hover:bg-white hover:text-black transition-colors"
                                >
                                    Logout
                                </button>
                            )}
                        </div>

                        {isAuthed && (
                            <div className={`mt-auto pt-4 border-t border-white/30 ${role === "owner" ? "text-yellow-400" : "text-white"}`}>
                                <div className="flex items-center gap-2">
                                    <span>Signed in as</span>
                                    {role === "owner" && <OwnerBadge />}
                                    <span className="font-bold">{user?.displayName || user?.username}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}