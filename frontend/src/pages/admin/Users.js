import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import OwnerBadge from '../../components/OwnerBadge';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState({});
    const [newNames, setNewNames] = useState({});

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const currentUserId = token ? JSON.parse(atob(token.split('.')[1])).id : null;

    useEffect(() => {
        if (role !== 'admin' && role !== 'owner') return;

        fetch('/api/users', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(() => toast.error('Failed to load users'))
            .finally(() => setLoading(false));
    }, [token, role]);

    const startEditing = (userId, currentName) => {
        setEditing({ ...editing, [userId]: true });
        setNewNames({ ...newNames, [userId]: currentName });
    };

    const cancelEditing = (userId) => {
        setEditing({ ...editing, [userId]: false });
    };

    const saveName = async (userId) => {
        const newDisplayName = newNames[userId]?.trim();
        if (!newDisplayName || newDisplayName.includes(' ')) {
            toast.error('Name cannot be empty or contain spaces');
            return;
        }

        try {
            const res = await fetch(`/api/users/${userId}/display-name`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ newDisplayName })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Display name updated');
                setUsers(users.map(u => u._id === userId ? { ...u, displayName: newDisplayName } : u));
                cancelEditing(userId);
            } else {
                toast.error(data.message || 'Error updating name');
            }
        } catch (err) {
            toast.error('Error saving name');
        }
    };

    const changeRole = async (userId, newRole) => {
        try {
            const res = await fetch(`/api/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ newRole }) // <- MUST be newRole not role
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Role updated');
                setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
            } else {
                toast.error(data.message || 'Error updating role');
            }
        } catch (err) {
            toast.error('Error updating role');
        }
    };

    if (role !== 'admin' && role !== 'owner') {
        return <div className="p-6 text-white">Access denied.</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto text-white">
            <h1 className="text-2xl font-bold mb-4">User Management</h1>
            {loading ? (
                <p>Loading users...</p>
            ) : (
                <div className="space-y-4">
                    {users.map(user => {
                        const isCurrentUser = user._id === currentUserId;
                        const isOwner = user.role === 'owner';

                        return (
                            <div key={user._id} className="border border-white p-4 rounded bg-black">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="font-semibold">Username:</span> {user.username}<br />
                                        <span className="font-semibold">Role:</span> {user.role}<br />
                                        <span className="font-semibold">Display Name:</span>{' '}
                                        {editing[user._id] ? (
                                            <input
                                                type="text"
                                                className="bg-gray-800 text-white border border-white px-2 py-1 rounded"
                                                value={newNames[user._id] || ''}
                                                onChange={e => setNewNames({ ...newNames, [user._id]: e.target.value })}
                                            />
                                        ) : (
                                                <span className="inline-flex items-center gap-2">
                                                    <span>{user.displayName || 'Unknown'}</span>
                                                    {isOwner && <OwnerBadge />}
                                                </span>
                                        )}
                                    </div>
                                    {!isCurrentUser && !isOwner && (
                                        <div className="flex flex-col items-end gap-2">
                                            {editing[user._id] ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        className="bg-black text-red-500 border border-red-500 px-3 py-1 rounded"
                                                        onClick={() => saveName(user._id)}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        className="bg-black text-white border border-white px-3 py-1 rounded"
                                                        onClick={() => cancelEditing(user._id)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="bg-black text-white border border-white px-3 py-1 rounded"
                                                    onClick={() => startEditing(user._id, user.displayName)}
                                                >
                                                    Edit Name
                                                </button>
                                            )}

                                            {role === 'owner' && (
                                                <select
                                                    className="bg-black text-white border border-white px-2 py-1 rounded"
                                                    value={user.role}
                                                    onChange={e => changeRole(user._id, e.target.value)}
                                                >
                                                    <option value="user">user</option>
                                                    <option value="admin">admin</option>
                                                </select>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
