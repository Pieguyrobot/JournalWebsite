import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://10.0.0.55:5000/api/posts') // backend endpoint, adjust if needed
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Journal Entries</h1>
      {loading ? (
        <p>Loading...</p>
      ) : posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <ul className="space-y-4">
            {posts.map(post => (
                <li key={post._id} className="mb-4 border-b border-red-700 pb-2">
                    <Link to={`/post/${post._id}`} className="text-red-400 hover:text-red-600 text-xl font-semibold">
                        {post.title || 'Untitled Post'}
                    </Link>
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>{new Date(post.createdAt).toLocaleString()}</span>
                      <span>{post.author?.displayName || post.author?.username}</span>
                    </div>
                </li>
            ))}
        </ul>
      )}
      {localStorage.getItem('token') && localStorage.getItem('role') === 'admin' && (
        <Link to="/new" className="inline-block mt-6 px-4 py-2 bg-red-700 rounded hover:bg-red-800">
          New Post (Admin Only)
        </Link>
      )}
    </div>
  );
}