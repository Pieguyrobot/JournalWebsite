import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../auth/AuthContext';

export default function ChangePassword() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!token) return navigate('/login');
        if (newPassword !== confirm) {
            toast.error('New passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Password changed. Please log in again.');
                // Force logout (token now invalid)
                setTimeout(() => {
                    logout();
                    navigate('/login');
                }, 800);
            } else {
                toast.error(data.message || 'Failed to change password');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto text-white">
            <Toaster />
            <h1 className="text-2xl font-bold mb-4">Change Password</h1>
            <form onSubmit={onSubmit} className="space-y-4">
                <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-2 bg-black text-white rounded border border-white"
                    required
                />
                <input
                    type="password"
                    placeholder="New password (6+ chars, upper/lower/number/symbol)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2 bg-black text-white rounded border border-white"
                    required
                />
                <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full p-2 bg-black text-white rounded border border-white"
                    required
                />

                <div className="flex justify-center">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-black text-white border border-white px-6 py-2 rounded hover:bg-white hover:text-black transition"
                    >
                        {loading ? 'Saving...' : 'Change Password'}
                    </button>
                </div>
            </form>
        </div>
    );
}