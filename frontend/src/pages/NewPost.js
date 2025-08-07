import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export default function NewPost() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'admin') {
            toast.error('Access denied');
            navigate('/');
        }
    }, [navigate]);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        if (!token || !user) {
            toast.error('You must be logged in to post.');
            setLoading(false);
            navigate('/login');
            return;
        }

        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    content,
                    image,
                    author: user.id,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Post created!');
                navigate('/');
            } else {
                toast.error(data.message || 'Failed to create post');
            }
        } catch (error) {
            toast.error('Server error. Try again later.');
        }

        setLoading(false);
    }

    if (localStorage.getItem('role') !== 'admin') {
        return null; // or a loading spinner / redirect fallback
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <Toaster />
            <h1 className="text-3xl font-bold mb-6 text-red-500">New Journal Entry</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full p-2 mb-4 bg-black text-white rounded border border-white-600"
                    required
                />
                <textarea
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full p-2 mb-4 bg-black text-white rounded border border-white-600"
                    rows="6"
                    required
                />
                <input
                    type="text"
                    placeholder="Image URL (optional)"
                    value={image}
                    onChange={e => setImage(e.target.value)}
                    className="w-full p-2 mb-4 bg-black text-white rounded border border-white-600"
                />
                <div className="flex justify-center">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-black text-white border border-white px-6 py-2 rounded hover:bg-white hover:text-black transition"
                    >
                        {loading ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </form>
        </div>
    );
}
