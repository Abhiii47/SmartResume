import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE, updateMetaTags } from "../utils";

export default function SignupPage() {
  const [email, setEmail]       = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    updateMetaTags({ title: "Sign Up – SmartResume" });
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("username", username);
      formData.append("password", password);
      await axios.post(`${API_BASE}/signup`, formData);
      navigate("/login", { state: { message: "Account created! Please log in." } });
    } catch (err) {
      const d = err?.response?.data?.detail;
      setError(Array.isArray(d) ? (d[0]?.msg || "Signup failed") : (typeof d === "string" ? d : "Signup failed."));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Itsua Technical Grid Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      <div className="w-full max-w-md relative z-10">
        {/* Itsua Blueprint Frame */}
        <div className="border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 lg:p-10 relative">
          {/* Corner Accents */}
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-right-2 border-primary" />
          
          {/* Header */}
          <div className="text-left mb-10 border-b-2 border-foreground/10 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 border-2 border-foreground flex items-center justify-center bg-primary text-primary-foreground font-bold">
                SR
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">Reg_Sys / V2.0</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight uppercase leading-none">Register_Node</h2>
            <p className="text-xs font-mono text-muted-foreground mt-2 uppercase">Provision new identity in diagnostic network</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Unique_Handle</label>
                <span className="text-[8px] font-mono text-primary/40 uppercase">A-Z, 0-9</span>
              </div>
              <input
                value={username} onChange={e => setUsername(e.target.value)}
                required placeholder="USER_NAME" 
                className="w-full bg-muted/20 border-2 border-foreground px-4 py-3 font-mono text-sm focus:bg-background focus:ring-0 focus:border-primary outline-none transition-all placeholder:opacity-30"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Comm_Channel</label>
                <span className="text-[8px] font-mono text-primary/40 uppercase">E-Mail</span>
              </div>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="ENTER_EMAIL_ADDR" 
                className="w-full bg-muted/20 border-2 border-foreground px-4 py-3 font-mono text-sm focus:bg-background focus:ring-0 focus:border-primary outline-none transition-all placeholder:opacity-30"
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Auth_Key</label>
                <span className="text-[8px] font-mono text-primary/40 uppercase">Min 6 Chars</span>
              </div>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="••••••••" 
                className="w-full bg-muted/20 border-2 border-foreground px-4 py-3 font-mono text-sm focus:bg-background focus:ring-0 focus:border-primary outline-none transition-all placeholder:opacity-30"
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 p-3 border-2 border-destructive bg-destructive/5 text-destructive font-mono text-[11px] uppercase leading-tight">
                <span className="font-bold">[ERR]</span>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-foreground text-background py-4 font-bold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-background border-t-transparent animate-spin" />
                  <span>Provisioning...</span>
                </>
              ) : (
                <>
                  <span>Initialize_Account</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t-2 border-foreground/10 flex flex-col items-center gap-4">
            <p className="text-[10px] font-mono text-muted-foreground uppercase text-center">
              Existing_Identity? <button onClick={() => navigate("/login")} className="text-primary font-bold hover:underline">Access_Portal</button>
            </p>
            <div className="flex gap-4">
              <div className="w-1 h-1 bg-foreground/20 rounded-full" />
              <div className="w-1 h-1 bg-foreground/20 rounded-full" />
              <div className="w-1 h-1 bg-foreground/20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
