import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NewPost from "./pages/NewPost";
import Post from "./pages/Post";
import Navbar from "./components/Navbar";
import Users from "./pages/admin/Users";
import ChangePassword from "./pages/ChangePassword";

import { AuthProvider, useAuth } from "./auth/AuthContext";

function ProtectedUsersRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return (user.role === "admin" || user.role === "owner") ? <Users /> : <Navigate to="/" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewPost />} />
          <Route path="/login" element={<Login />} />
          <Route path="/post/:id" element={<Post />} />
          <Route path="/account/password" element={<ChangePassword />} />

          <Route path="/admin/users" element={<ProtectedUsersRoute />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}