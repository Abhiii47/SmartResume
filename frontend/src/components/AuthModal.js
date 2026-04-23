import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { gsap } from "gsap";
import { API_BASE, setAuthToken } from "../utils";

export default function AuthModal({ isOpen, onClose, initialView = "login" }) {
    const [view, setView] = useState(initialView);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const overlayRef = useRef(null);
    const modalRef = useRef(null);
    const navigate = useNavigate();

    // GSAP Animations
    useEffect(() => {
        if (isOpen) {
            // Enter animation
            if (overlayRef.current && modalRef.current) {
                gsap.set(overlayRef.current, { opacity: 0 });
                gsap.set(modalRef.current, { y: 20, opacity: 0, scale: 0.95 });

                gsap.to(overlayRef.current, {
                    opacity: 1,
                    duration: 0.3,
                    ease: "power2.out"
                });

                gsap.to(modalRef.current, {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 0.4,
                    ease: "back.out(1.2)",
                    delay: 0.1
                });
            }
        }
    }, [isOpen]);

    const handleClose = () => {
        if (overlayRef.current && modalRef.current) {
            // Exit animation
            gsap.to(overlayRef.current, {
                opacity: 0,
                duration: 0.2,
                ease: "power2.in"
            });

            gsap.to(modalRef.current, {
                y: 10,
                opacity: 0,
                scale: 0.98,
                duration: 0.2,
                ease: "power2.in",
                onComplete: onClose
            });
        } else {
            onClose();
        }
    };

    useEffect(() => {
        setView(initialView);
        setError("");
        setEmail("");
        setPassword("");
        setUsername("");
    }, [initialView, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (view === "login") {
                const params = new URLSearchParams();
                params.append("username", email);
                params.append("password", password);

                const { data } = await axios.post(`${API_BASE}/login`, params, {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                });

                setAuthToken(data.access_token);
                navigate("/dashboard");
                handleClose();
            } else {
                // Signup
                const formData = new FormData();
                formData.append("email", email);
                formData.append("username", username);
                formData.append("password", password);

                const { data } = await axios.post(`${API_BASE}/signup`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                if (data.success) {
                    // Auto login after signup
                    const params = new URLSearchParams();
                    params.append("username", email);
                    params.append("password", password);

                    const { data: loginData } = await axios.post(`${API_BASE}/login`, params, {
                        headers: { "Content-Type": "application/x-www-form-urlencoded" }
                    });

                    setAuthToken(loginData.access_token);
                    navigate("/dashboard");
                    handleClose();
                }
            }
        } catch (err) {
            const apiDetail = err?.response?.data?.detail;
            setError(typeof apiDetail === "string" ? apiDetail : "Authentication failed. Please try again.");

            // Shake animation on error
            if (modalRef.current) {
                gsap.fromTo(modalRef.current,
                    { x: -5 },
                    { x: 5, duration: 0.05, repeat: 5, yoyo: true, ease: "sine.inOut", onComplete: () => gsap.set(modalRef.current, { x: 0 }) }
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            {/* Backdrop */}
            <div
                ref={overlayRef}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleClose}
            ></div>

            {/* Modal Content - Shadcn Style */}
            <div
                ref={modalRef}
                className="relative w-full max-w-[400px] bg-background border border-border rounded-xl shadow-lg overflow-hidden"
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors z-10 cursor-pointer"
                >
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-8 pb-10">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
                            {view === "login" ? "Welcome back" : "Create an account"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {view === "login"
                                ? "Enter your email to sign in to your account"
                                : "Enter your email below to create your account"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {view === "signup" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="johndoe"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>

                        {error && (
                            <div className="text-sm font-medium text-destructive mt-2 text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] h-9 w-full mt-4 cursor-pointer"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Loading...
                                </span>
                            ) : (
                                view === "login" ? "Sign In" : "Create Account"
                            )}
                        </button>
                    </form>

                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        {view === "login" ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setView(view === "login" ? "signup" : "login")}
                            className="underline underline-offset-4 hover:text-primary font-medium cursor-pointer"
                        >
                            {view === "login" ? "Sign up" : "Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
