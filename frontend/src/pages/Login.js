import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        if (isRegister && password !== confirmPassword) {
            toast.error('Passwords do not match!');
            setLoading(false);
            return;
        }

        try {
            const endpoint = isRegister
                ? 'http://pieguyrobot.com:5000/api/auth/register'
                : 'http://pieguyrobot.com:5000/api/auth/login';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, confirmPassword }),
            });

            const data = await res.json();

            if (res.ok && data.token) {
                // Store token and user info in localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.user.role);  // Store user role as well
                localStorage.setItem('user', JSON.stringify(data.user));  // Store full user info

                toast.success(`${isRegister ? 'Registered' : 'Logged in'} successfully!`);
                navigate('/');  // Redirect to home or dashboard after login
            } else {
                setPassword('');
                setConfirmPassword('');
                toast.error(data.message || 'Request failed');
            }
        } catch (err) {
            toast.error('Network error');
        }

        setLoading(false);
    }

    return (
        <div className=" bg-black flex items-center justify-center pt-40 overflow-hidden">
            <Toaster />
            <div className="bg-black-900 border border-white p-8 rounded-lg w-full max-w-md shadow-lg">
                <h1 className="text-3xl font-bold mb-6 text-red-500 text-center">
                    {isRegister ? 'Register' : 'User Login'}
                </h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full p-2 bg-black text-white border border-gray-600 rounded"
                        required
                        disabled={loading}
                    />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full p-2 bg-black text-white border border-gray-600 rounded"
                        required
                        disabled={loading}
                    />
                    {isRegister && (
                        <input
                            type={showPassword ? 'text' : 'password'}
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
                    <button
                        type="submit"
                        disabled={
                            loading ||
                            !username ||
                            !password ||
                            (isRegister && !confirmPassword)
                        }
                        className="w-full bg-red-700 hover:bg-red-800 text-white p-2 rounded"
                    >
                        {loading
                            ? isRegister
                                ? 'Registering...'
                                : 'Logging in...'
                            : isRegister
                                ? 'Register'
                                : 'Login'}
                    </button>
                </form>

                <div className="mt-4 text-center text-white">
                    {isRegister ? (
                        <p>
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => setIsRegister(false)}
                                className="text-red-400 hover:underline"
                            >
                                Login
                            </button>
                        </p>
                    ) : (
                        <p>
                            Don’t have an account?{' '}
                            <button
                                type="button"
                                onClick={() => setIsRegister(true)}
                                className="text-red-400 hover:underline"
                            >
                                Register Now
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}