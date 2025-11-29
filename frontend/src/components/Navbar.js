import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <h2 style={styles.logoText}>SmartResume</h2>
        </Link>
        <div style={styles.navLinks}>
          {user ? (
            <>
              <Link to="/dashboard" style={styles.link}>
                Dashboard
              </Link>
              <span style={styles.userName}>{user.username}</span>
              <button onClick={handleLogout} style={styles.button}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/" style={styles.link}>
                Analyze
              </Link>
              <Link to="/login" style={styles.link}>
                Login
              </Link>
              <Link to="/signup" style={styles.signupButton}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    background: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    padding: "12px 0",
    marginBottom: "24px",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    textDecoration: "none",
    color: "#2563eb",
  },
  logoText: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "700",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  link: {
    textDecoration: "none",
    color: "#4b5563",
    fontWeight: "500",
    fontSize: "15px",
    transition: "color 0.2s",
  },
  signupButton: {
    textDecoration: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "6px",
    fontWeight: "500",
    fontSize: "15px",
  },
  userName: {
    color: "#6b7280",
    fontSize: "14px",
  },
  button: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "15px",
  },
};

