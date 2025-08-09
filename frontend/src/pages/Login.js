import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        if (isRegister && password !== confirmPassword) {
            toast.error("Passwords do not match!");
            setLoading(false);
            return;
        }
        const res = await login(username, password, isRegister, confirmPassword);
        setLoading(false);
        if (res.ok) {
            toast.success(isRegister ? "Registered successfully!" : "Logged in!");
            navigate("/");
        } else {
            toast.error(res.message || "Request failed");
        }
    }

    return (
        <div className="bg-black flex items-center justify-center pt-40 overflow-hidden">
            <Toaster />
            <div className="bg-black-900 border border-white p-8 rounded-lg w-full max-w-md shadow-lg">
                <h1 className="text-3xl font-bold mb-6 text-red-500 text-center">
                    {isRegister ? "Register" : "User Login"}
                </h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full p-2 bg-black text-white rounded border border-white-600"
                        required
                        disabled={loading}
                    />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full p-2 bg-black text-white border border-gray-600 rounded"
                        required
                        disabled={loading}
                    />
                    {isRegister && (
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full p-2 bg-black text-white border border-gray-600 rounded"
                            required
                            disabled={loading}
                        />
                    )}
                    <div className="flex items-center text-white">
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={() => setShowPassword(!showPassword)}
                            className="mr-2"
                        />
                        <label>Show Password</label>
                    </div>
                    <div className="flex justify-center">
                        <button
                            type="submit"
                            disabled={loading || !username || !password || (isRegister && !confirmPassword)}
                            className="bg-black text-white border border-white px-6 py-2 rounded hover:bg-white hover:text-black transition"
                        >
                            {loading ? (isRegister ? "Registering..." : "Logging in...") : (isRegister ? "Register" : "Login")}
                        </button>
                    </div>
                </form>

                <div className="mt-4 text-center text-white">
                    {isRegister ? (
                        <p>
                            Already have an account?{" "}
                            <button type="button" onClick={() => setIsRegister(false)} className="text-red-400 hover:underline">
                                Login
                            </button>
                        </p>
                    ) : (
                        <p>
                            Don’t have an account?{" "}
                            <button type="button" onClick={() => setIsRegister(true)} className="text-red-400 hover:underline">
                                Register Now
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}