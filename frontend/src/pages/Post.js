import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export default function Post() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`http://pieguyrobot.com/api/posts/${id}`);
        const data = await res.json();
        setPost(data);
        setLoading(false);
      } catch (err) {
        toast.error('Failed to load post');
        setLoading(false);
      }
    }

    async function fetchComments() {
      try {
        const res = await fetch(`http://pieguyrobot.com/api/comments/${id}`);
        const data = await res.json();
        setComments(data);
      } catch (err) {
        toast.error('Failed to load comments');
      }
    }

    fetchPost();
    fetchComments();
  }, [id]);

  async function handleCommentSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to comment.');
      return;
    }

    try {
      const res = await fetch('http://pieguyrobot.com/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          postId: id,
          content: newComment,
          parentComment: replyTo,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewComment('');
        setReplyTo(null);
        setComments([...comments, data.comment]);
      } else {
        toast.error(data.message || 'Failed to add comment');
      }
    } catch (error) {
      toast.error('Error posting comment');
    }
  }

  function renderComments(comments, parentId = null) {
    return comments
      .filter(c => c.parentComment === parentId)
      .map(c => (
        <div key={c._id} className={`mb-4 ${parentId ? 'ml-6 border-l-2 pl-4 border-white' : ''}`}>
          <p className="text-sm text-gray-400">{c.author.displayName} • {new Date(c.createdAt).toLocaleString()}</p>
          <p className="text-white mb-1">{c.content}</p>
          {!parentId && (
            <button
              className="text-blue-400 text-sm"
              onClick={() => setReplyTo(c._id)}
            >
              Reply
            </button>
          )}
        </div>
      ));
  }

  if (loading) return <div className="p-6 text-center text-xl text-white">Loading post...</div>;
  if (!post) return <div className="p-6 text-center text-xl text-white">Post not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-black min-h-screen">
      <Toaster />
      <button
        onClick={() => navigate('/')}
        className="mb-4 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded"
      >
        ← Back
      </button>

      {/* Post content block */}
      <div className="border border-white p-6 rounded mb-8">
        <h1 className="text-3xl font-bold mb-2 text-white">{post.title}</h1>
        <p className="text-gray-400 text-sm mb-2">
          {post.author?.displayName} • {new Date(post.createdAt).toLocaleString()}
        </p>
        {post.image && (
          <img
            src={post.image}
            alt="Post visual"
            className="w-full max-h-[500px] object-cover rounded mb-4"
          />
        )}
        <p className="text-white text-lg whitespace-pre-line">{post.content}</p>
      </div>

      {/* Comment block */}
      <div className="border border-white p-6 rounded">
        <h2 className="text-xl font-semibold mb-2 text-white">Comments</h2>
        <form onSubmit={handleCommentSubmit} className="mb-4">
          <textarea
            className="w-full p-2 rounded border border-gray-700 bg-black text-white"
            rows="3"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            required
          ></textarea>
          <button
            type="submit"
            className="mt-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded"
          >
            Post Comment
          </button>
        </form>
        <div>{renderComments(comments)}</div>
      </div>
    </div>
  );
}