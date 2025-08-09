import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import OwnerBadge from '../components/OwnerBadge';

export default function Post() {
  const { id } = useParams();
  const navigate = useNavigate();

  // post
  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(true);

  // auth & role
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [myRole, setMyRole] = useState((localStorage.getItem('role') || '').toLowerCase());
  const isAdminish = myRole === 'admin' || myRole === 'owner';
  const isOwner = myRole === 'owner';

  // root comments
  const [rootComments, setRootComments] = useState([]);
  const [rootTotal, setRootTotal] = useState(0);
  const [rootPage, setRootPage] = useState(1);
  const ROOT_LIMIT = 50;

  // replies
  // shape: { [parentId]: { items?, total?, page?, open?, loading? } }
  const [repliesByParent, setRepliesByParent] = useState({});

  // editors
  const [newComment, setNewComment] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [activeReplyFor, setActiveReplyFor] = useState(null);

  // moderation popover
  const [openMenuFor, setOpenMenuFor] = useState(null);

  // keep role/token fresh
  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t || '');
    if (!t) {
      setMyRole((localStorage.getItem('role') || '').toLowerCase());
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${t}` },
        });
        const data = await res.json();
        if (res.ok) {
          setMyRole((data.role || '').toLowerCase());
          localStorage.setItem('role', data.role || '');
        } else {
          setMyRole('');
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          setToken('');
        }
      } catch {
        setMyRole('');
      }
    })();
  }, []);

  // fetch post
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/posts/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load post');
        setPost(data);
      } catch {
        toast.error('Failed to load post');
      } finally {
        setLoadingPost(false);
      }
    })();
  }, [id]);

  // initial root comments
  useEffect(() => {
    fetchRootComments(1, /*replace*/ true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAdminish, token]);

  async function fetchRootComments(page = 1, replace = false) {
    try {
      const query = `page=${page}&limit=${ROOT_LIMIT}${isAdminish ? '&includeHidden=1' : ''}`;
      const res = await fetch(`/api/comments/${id}/root?${query}`, {
        headers: isAdminish && token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load comments');

      const nextItems = page === 1 || replace ? data.items : [...rootComments, ...data.items];
      setRootComments(nextItems);
      setRootTotal(data.total);
      setRootPage(data.page);

      // Prefetch reply counts so "Show replies (X)" renders immediately
      prefetchReplyCounts(nextItems);
    } catch (e) {
      toast.error('Failed to load comments');
    }
  }

  // Preload reply totals (cheap: limit=1) without opening threads
  async function prefetchReplyCounts(comments) {
    if (!comments || comments.length === 0) return;

    const headers = isAdminish && token ? { Authorization: `Bearer ${token}` } : undefined;

    // Only request counts we don't already know
    const targets = comments
      .map(c => c._id)
      .filter(pid => !(repliesByParent[pid] && typeof repliesByParent[pid].total === 'number'));

    // Chunk to avoid spamming if you have a ton; simple all-at-once for now
    const promises = targets.map(async (parentId) => {
      try {
        const query = `parent=${parentId}&page=1&limit=1${isAdminish ? '&includeHidden=1' : ''}`;
        const res = await fetch(`/api/comments/${id}/replies?${query}`, { headers });
        const data = await res.json();
        if (!res.ok) return;

        setRepliesByParent(prev => {
          const existing = prev[parentId] || {};
          // don't clobber loaded items, just set total
          return {
            ...prev,
            [parentId]: {
              ...existing,
              total: data.total,
              page: existing.page || 0,
              open: existing.open || false,
              loading: false,
            }
          };
        });
      } catch {
        /* ignore count errors */
      }
    });

    await Promise.all(promises);
  }

  async function fetchReplies(parentId, nextPage = 1) {
    setRepliesByParent(prev => ({
      ...prev,
      [parentId]: { ...(prev[parentId] || {}), loading: true, open: true },
    }));
    try {
      const query = `parent=${parentId}&page=${nextPage}&limit=10${isAdminish ? '&includeHidden=1' : ''}`;
      const res = await fetch(`/api/comments/${id}/replies?${query}`, {
        headers: isAdminish && token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load replies');

      setRepliesByParent(prev => {
        const existing = prev[parentId]?.items || [];
        return {
          ...prev,
          [parentId]: {
            items: nextPage === 1 ? data.items : [...existing, ...data.items],
            total: data.total,
            page: data.page,
            open: true,
            loading: false,
          },
        };
      });
    } catch {
      toast.error('Failed to load replies');
      setRepliesByParent(prev => ({
        ...prev,
        [parentId]: { ...(prev[parentId] || {}), loading: false },
      }));
    }
  }

  // create comment
  async function handleCreateComment(e) {
    e.preventDefault();
    if (!token) return toast.error('You must be logged in to comment.');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postId: id, content: newComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to add comment');

      setNewComment('');
      // safest: refetch page 1 so counts/visibility are fresh
      fetchRootComments(1, true);
    } catch (err) {
      toast.error(err.message || 'Error posting comment');
    }
  }

  // create reply
  async function handleCreateReply(parentId) {
    if (!token) return toast.error('You must be logged in to reply.');

    const content = (replyDrafts[parentId] || '').trim();
    if (!content) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postId: id, content, parentComment: parentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to add reply');

      setReplyDrafts(prev => ({ ...prev, [parentId]: '' }));
      setActiveReplyFor(null);
      fetchReplies(parentId, 1);
    } catch (err) {
      toast.error(err.message || 'Error posting reply');
    }
  }

  // moderation
  async function toggleHide(commentId, hidden) {
    if (!token) return;
    try {
      const res = await fetch(`/api/comments/${commentId}/hide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hidden }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to update');

      // refetch to keep counts/visibility correct
      fetchRootComments(rootPage);
      Object.keys(repliesByParent).forEach(pid => {
        if (repliesByParent[pid]?.open) fetchReplies(pid, repliesByParent[pid].page || 1);
      });
      setOpenMenuFor(null);
    } catch (e) {
      toast.error(e.message || 'Failed to update');
    }
  }

  async function deleteComment(commentId, parentId = null) {
    if (!token) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to delete');

      // refetch
      fetchRootComments(rootPage);
      if (parentId) fetchReplies(parentId, 1);
      setOpenMenuFor(null);
    } catch (e) {
      toast.error(e.message || 'Failed to delete');
    }
  }

  // helpers
  function toggleReplies(parentId) {
    const thread = repliesByParent[parentId];
    if (!thread || (!thread.items && !thread.loading)) {
      fetchReplies(parentId, 1);
      return;
    }
    setRepliesByParent(prev => ({
      ...prev,
      [parentId]: { ...(prev[parentId] || {}), open: !prev[parentId].open },
    }));
  }

  function loadMoreReplies(parentId) {
    const thread = repliesByParent[parentId];
    if (!thread) return;
    const loaded = thread.items?.length || 0;
    if (loaded < (thread.total || 0) && !thread.loading) {
      fetchReplies(parentId, (thread.page || 1) + 1);
    }
  }

  const hasMoreRoot = rootComments.length < rootTotal;

  // moderation menu (hides for owner-authored content unless viewer is owner)
  const ModMenu = ({ record, parentId = null }) => {
    if (!isAdminish) return null;

    // If the comment/reply author is the owner, only the owner can see menu.
    const authorIsOwner = record?.author?.role === 'owner';
    if (authorIsOwner && !isOwner) return null;

    const isHidden = !!record.hidden;
    const open = openMenuFor === record._id;

    return (
      <div className="relative">
        <button
          type="button"
          className="absolute right-2 top-2 bg-black text-white border border-white px-2 py-1 rounded hover:bg-white hover:text-black transition"
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenuFor(open ? null : record._id);
          }}
          aria-label="Moderation menu"
          title="Settings"
        >
          <span className="inline-block w-5 text-center">⋯</span>
        </button>

        {open && (
          <div
            className="absolute right-2 top-10 z-10 bg-black border border-white rounded p-2 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="bg-black text-white border border-white px-3 py-1 rounded hover:bg-white hover:text-black transition"
                onClick={() => toggleHide(record._id, !isHidden)}
              >
                {isHidden ? 'Unhide' : 'Hide'}
              </button>
              {isOwner && (
                <button
                  type="button"
                  className="bg-black text-red-500 border border-red-500 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition"
                  onClick={() => deleteComment(record._id, parentId)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const HiddenNotice = () => (
    <div className="text-red-400 text-sm italic mb-2">This comment has been hidden.</div>
  );

  useEffect(() => {
    function onDocClick() {
      if (openMenuFor) setOpenMenuFor(null);
    }
    function onEsc(e) {
      if (e.key === 'Escape') setOpenMenuFor(null);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [openMenuFor]);

  if (loadingPost) return <div className="p-6 text-center text-xl text-white">Loading post...</div>;
  if (!post) return <div className="p-6 text-center text-xl text-white">Post not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-black min-h-screen">
      <Toaster />
      <button
        onClick={() => navigate('/')}
        className="mb-4 bg-black text-white border border-white px-6 py-2 rounded hover:bg-white hover:text-black transition"
      >
        ← Back
      </button>

      {/* Post */}
      <div className="border border-white p-6 rounded mb-8">
        <h1 className="text-3xl font-bold mb-2 text-white">{post.title}</h1>
        <div className="text-gray-400 text-sm mb-2 flex items-center gap-2">
          {post.author?.role === 'owner' && <OwnerBadge />}
          <span>{post.author?.displayName} • {new Date(post.createdAt).toLocaleString()}</span>
        </div>
        {post.image && (
          <img
            src={post.image}
            alt="Post visual"
            className="w-full max-h-[500px] object-cover rounded mb-4"
          />
        )}
        <p className="text-white text-lg whitespace-pre-line">{post.content}</p>
      </div>

      {/* Comments */}
      <div className="border border-white p-6 rounded">
        <h2 className="text-xl font-semibold mb-2 text-white">Comments ({rootTotal})</h2>

        <form onSubmit={handleCreateComment} className="mb-4">
          <textarea
            className="w-full p-2 rounded border border-gray-700 bg-black text-white"
            rows="3"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            required
          />
          <div className="mt-3">
            <button
              type="submit"
              className="bg-black text-white border border-white px-6 py-2 rounded hover:bg-white hover:text-black transition"
            >
              Post Comment
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {rootComments
            .filter(c => !c.hidden || isAdminish)
            .map((c) => {
              const ownerAuth = c.author?.role === 'owner';
              const thread = repliesByParent[c._id];

              return (
                <div key={c._id} className="relative p-4 rounded border border-white bg-black/50">
                  <div className="text-sm text-gray-400 flex items-center gap-2 mb-1">
                    {ownerAuth && <OwnerBadge />}
                    <span>{c.author?.displayName || 'Unknown'} • {new Date(c.createdAt).toLocaleString()}</span>
                  </div>

                  {isAdminish && <ModMenu record={c} />}

                  {/* If hidden AND admin/owner -> show red notice ABOVE full content */}
                  {c.hidden && isAdminish && <HiddenNotice />}

                  {/* Full content always for admin/owner; for users, hidden ones are filtered out */}
                  <p className="text-white mb-3 whitespace-pre-line">{c.content}</p>

                  <div className="flex items-center gap-3">
                    {activeReplyFor === c._id ? (
                      <>
                        <button
                          className="bg-black text-white border border-white px-4 py-1 rounded hover:bg-white hover:text-black transition"
                          onClick={() => handleCreateReply(c._id)}
                        >
                          Reply
                        </button>
                        <button
                          className="bg-black text-white border border-white px-4 py-1 rounded hover:bg-white hover:text-black transition"
                          onClick={() => setActiveReplyFor(null)}
                          type="button"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="bg-black text-white border border-white px-4 py-1 rounded hover:bg-white hover:text-black transition"
                        onClick={() => setActiveReplyFor(c._id)}
                        type="button"
                      >
                        Reply
                      </button>
                    )}

                    <button
                      className="bg-black text-white border border-white px-4 py-1 rounded hover:bg-white hover:text-black transition"
                      onClick={() => toggleReplies(c._id)}
                      type="button"
                    >
                      {thread?.open
                        ? 'Hide replies'
                        : `Show replies${typeof thread?.total === 'number' ? ` (${thread.total})` : ''}`}
                    </button>
                  </div>

                  {activeReplyFor === c._id && (
                    <div className="mt-3">
                      <textarea
                        className="w-full p-2 rounded border border-gray-700 bg-black text-white"
                        rows="2"
                        placeholder="Write a reply..."
                        value={replyDrafts[c._id] || ''}
                        onChange={e =>
                          setReplyDrafts(prev => ({ ...prev, [c._id]: e.target.value }))
                        }
                      />
                    </div>
                  )}

                  {thread?.open && (
                    <div className="mt-3 ml-6 border-l-2 pl-4 border-white/40">
                      {(thread.items || [])
                        .filter(r => !r.hidden || isAdminish)
                        .map((r) => {
                          const rOwner = r.author?.role === 'owner';
                          return (
                            <div key={r._id} className="relative mb-4">
                              <div className="text-sm text-gray-400 flex items-center gap-2 mb-1">
                                {rOwner && <OwnerBadge />}
                                <span>{r.author?.displayName || 'Unknown'} • {new Date(r.createdAt).toLocaleString()}</span>
                              </div>

                              {isAdminish && <ModMenu record={r} parentId={c._id} />}

                              {/* Hidden notice ABOVE content for admin/owner */}
                              {r.hidden && isAdminish && <HiddenNotice />}

                              <p className="text-white whitespace-pre-line">{r.content}</p>
                            </div>
                          );
                        })}

                      {thread && (thread.items?.length || 0) < (thread.total || 0) && (
                        <button
                          className="mt-2 bg-black text-white border border-white px-4 py-1 rounded hover:bg-white hover:text-black transition"
                          onClick={() => loadMoreReplies(c._id)}
                          type="button"
                          disabled={thread.loading}
                        >
                          {thread.loading ? 'Loading…' : 'Show more replies'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {hasMoreRoot && (
          <div className="mt-4">
            <button
              className="bg-black text-white border border-white px-6 py-2 rounded hover:bg-white hover:text-black transition"
              onClick={() => fetchRootComments(rootPage + 1)}
            >
              Load more comments
            </button>
          </div>
        )}
      </div>
    </div>
  );
}