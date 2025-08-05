import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';

import Home from './pages/Home';
import Login from './pages/Login';
import NewPost from './pages/NewPost';
import Post from './pages/Post';
import Navbar from './components/Navbar';

function App() {
  const [loggedOut, setLoggedOut] = useState(false);
  const [user, setUser] = useState(null);  // Added to track user info

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      // Attempt to validate token if present and user exists
      fetch('http://pieguyrobot.com:5000/api/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => {
          if (!res.ok) throw new Error('Invalid token');
          return res.json();
        })
        .then(data => {
          setUser(data.user);  // Set user info if token is valid
        })
        .catch(() => {
          localStorage.clear();
          setLoggedOut(true);
        });
    } else {
      setLoggedOut(true);  // If no token, set as logged out
    }
  }, []);

  return (
    <Router>
      <Navbar user={user} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewPost />} />
        <Route path="/login" element={<Login />} />
        <Route path="/post/:id" element={<Post />} />
      </Routes>

      {loggedOut && (
        <div className="fixed bottom-4 right-4 bg-red-800 text-white p-4 rounded shadow-lg z-50 border border-white">
          <div className="flex justify-between items-center">
            <span>You've been logged out. Log back in? </span>
            <button
              className="ml-2 bg-transparent border border-white text-white px-4 py-2 rounded hover:bg-white hover:text-black"
              onClick={() => window.location.href = '/login'}
            >
              Log In
            </button>
            <button
              className="ml-2 text-white"
              onClick={() => setLoggedOut(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;