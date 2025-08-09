import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import OwnerBadge from '../components/OwnerBadge';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/posts')
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
        <ul className="space-y-6">
          {posts.map(post => (
            <li key={post._id} className="border border-white rounded-lg p-4 bg-black text-red shadow-sm">
              <Link to={`/post/${post._id}`} className="text-red-400 hover:text-red-600 text-2xl font-bold block mb-2">
                {post.title || 'Untitled Post'}
              </Link>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>{new Date(post.createdAt).toLocaleString()}</span>
                <div className="flex items-center gap-2">
                  {post.author?.role === 'owner' && <OwnerBadge />}
                  <span>{post.author?.displayName}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {localStorage.getItem('token') && localStorage.getItem('role') === 'owner' && (
        <Link to="/new" className="inline-block mt-6 px-4 py-2 bg-red-700 border border-red px-4 py-2 rounded hover:bg-red hover:text-black transition">
          New Post (Owner Only)
        </Link>
      )}
    </div>
  );
}