"use client";

import { ArrowRight, Grid2X2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useAuthSession } from "@/app/components/AuthSessionProvider";

type DemoUser = {
  name: string;
  email: string;
  initials: string;
  provider: "Google" | "Email";
};

type LoginMethod = "google" | "email";

export default function LoginPage() {
  const { signIn } = useAuthSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");

  async function handleGoogleLogin() {
    setError("");
    setIsLoading(true);
    try {
      if (process.env.NEXT_PUBLIC_AUTH_MOCK !== "false") {
        await new Promise((resolve) => setTimeout(resolve, 850));
        const user = { id: "demo-sarah", name: "Sarah Anderson", email: "sarah@squad.team", initials: "SA", role: "Admin" as const };
        signIn({ user, provider: "Google" });
        setDemoUser({ name: user.name, email: user.email, initials: user.initials, provider: "Google" });
        return;
      }
      const result = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
      if (result.error) setError(result.error.message ?? "Google sign-in is not available right now.");
    } catch {
      setError("Google sign-in is not configured for this workspace yet.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEmailLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setEmailError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      if (process.env.NEXT_PUBLIC_AUTH_MOCK !== "false") {
        await new Promise((resolve) => setTimeout(resolve, 700));
        const user = { id: "demo-email", name: "Sarah Anderson", email: normalizedEmail, initials: "SA", role: "Admin" as const };
        signIn({ user, provider: "Email" });
        setDemoUser({ name: user.name, email: user.email, initials: user.initials, provider: "Email" });
        return;
      }
      const result = await authClient.signIn.email({ email: normalizedEmail, password, callbackURL: "/" });
      if (result.error) setEmailError(result.error.message ?? "Email sign-in failed.");
    } catch {
      setEmailError("Email sign-in is not available right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return <main className="auth-page"><section className="auth-card" aria-labelledby="login-title"><div className="auth-brand"><span className="brand-icon"><Grid2X2 size={17} strokeWidth={2.2} /></span><span><span className="brand-name">squad<span style={{ color: "#7357f6" }}>.</span></span><span className="brand-caption">team portal</span></span></div>{demoUser ? <div className="auth-success" aria-live="polite"><span className="auth-success-check">✓</span><span className="auth-kicker">You are signed in</span><h1 id="login-title">Welcome, {demoUser.name.split(" ")[0]}</h1><p className="auth-description">Your {demoUser.provider} sign-in is ready to access the squad workspace.</p><div className="demo-account"><span className="avatar avatar-header purple">{demoUser.initials}</span><span><strong>{demoUser.name}</strong><small>{demoUser.email}</small></span></div><Link className="primary-button auth-continue-button" href="/">Open workspace <ArrowRight size={15} /></Link><button className="auth-switch-account" type="button" onClick={() => setDemoUser(null)}>Use another account</button></div> : <div className="auth-card-content"><span className="auth-kicker">Welcome back</span><h1 id="login-title">Sign in to your workspace</h1><p className="auth-description">Keep your team aligned, your context close, and your next step clear.</p>{loginMethod === "google" ? <><button className="google-login-button" type="button" onClick={handleGoogleLogin} disabled={isLoading}>{isLoading ? <span className="auth-spinner" aria-hidden="true" /> : <GoogleMark />}<span>{isLoading ? "Connecting to Google..." : "Continue with Google"}</span>{!isLoading ? <ArrowRight size={15} /> : null}</button>{error ? <p className="auth-error" role="alert">{error}</p> : null}<button className="auth-method-switch" type="button" onClick={() => { setLoginMethod("email"); setError(""); }}>Use email and password</button></> : <form className="auth-email-form" onSubmit={handleEmailLogin}><label>Email address<input autoFocus required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" /></label><label>Password<input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label><Link className="auth-forgot-link" href="/forgot-password">Forgot password?</Link>{emailError ? <p className="auth-error" role="alert">{emailError}</p> : null}<button className="primary-button auth-email-submit" type="submit" disabled={isLoading}>{isLoading ? <span className="auth-spinner" aria-hidden="true" /> : null}<span>{isLoading ? "Signing in..." : "Sign in with email"}</span>{!isLoading ? <ArrowRight size={15} /> : null}</button><button className="auth-method-switch" type="button" onClick={() => { setLoginMethod("google"); setEmailError(""); }}>Back to Google sign-in</button></form>}<div className="auth-divider"><span>Secure workspace access</span></div><p className="auth-security"><ShieldCheck size={14} /> Your account is protected with secure authentication.</p></div>}<p className="auth-footer">Need access? Ask your workspace administrator.</p></section></main>;
}

function GoogleMark() {
  return <span className="google-mark" aria-hidden="true">G</span>;
}
