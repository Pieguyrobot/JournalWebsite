import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState('');
    const token = localStorage.getItem('token');

    useEffect(() => {
        async function fetchUser() {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const res = await fetch('http://pieguyrobot.com:5000/api/auth/me', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();
                if (res.ok) {
                    setDisplayName(data.displayName || data.username);
                    setRole(data.role || '');
                    localStorage.setItem('role', data.role); // keep role synced
                } else {
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            } catch (err) {
                console.error('Failed to fetch user info:', err);
            }
        }

        fetchUser();
    }, [token]);

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    }

    function handleChangeDisplayName() {
        const newDisplayName = prompt('Enter your new display name:');
        if (!newDisplayName) return;

        fetch('http://pieguyrobot.com:5000/api/users/display-name', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ newDisplayName }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.displayName) setDisplayName(data.displayName);
            })
            .catch(err => console.error('Failed to update display name:', err));
    }

    return (
        <nav className="bg-black text-red-400 p-4 flex items-center justify-between border-b border-white">
            <div className="flex gap-6 items-center">
                <Link to="/" className="hover:text-red-600">Home</Link>

                {token && role == 'admin' && (
                    <Link to="/new" className="hover:text-red-600">New Post</Link>
                )}

                {token && (
                    <>

                        <button
                            onClick={handleChangeDisplayName}
                            className="text-red-600 hover:text-red-600"
                        >
                            Change Display Name
                        </button>
                        <span className="text-white">
                            Signed in as <span className="font-semibold text-red-6700">{displayName}</span>
                        </span>
                    </>
                )}

                {!token && (
                    <Link to="/login" className="hover:text-red-600">Login</Link>
                )}
            </div>

            {token && (
                <button
                    onClick={handleLogout}
                    className="hover:text-red-600 bg-transparent border-none cursor-pointer"
                >
                    Logout
                </button>
            )}
        </nav>
    );
}