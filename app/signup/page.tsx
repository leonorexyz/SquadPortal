"use client";

import { ArrowRight, Check, Grid2X2, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuthSession } from "@/app/components/AuthSessionProvider";
import { authClient } from "@/lib/auth-client";

export default function SignupPage() {
  const { signIn } = useAuthSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const passwordRules = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "One number", valid: /\d/.test(password) },
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedName.length < 2) return setError("Enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return setError("Enter a valid email address.");
    if (!passwordRules.every((rule) => rule.valid)) return setError("Choose a stronger password using all the rules below.");
    if (password !== confirmation) return setError("Passwords do not match.");

    setIsLoading(true);
    try {
      if (process.env.NEXT_PUBLIC_AUTH_MOCK !== "false") {
        await new Promise((resolve) => setTimeout(resolve, 750));
        const initials = normalizedName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
        signIn({ user: { id: `demo-${normalizedEmail}`, name: normalizedName, email: normalizedEmail, initials, role: "Viewer" }, provider: "Email" });
        setIsRegistered(true);
        return;
      }
      const result = await authClient.signUp.email({ name: normalizedName, email: normalizedEmail, password, callbackURL: "/" });
      if (result.error) setError(result.error.message ?? "Unable to create your account.");
    } catch {
      setError("Registration is not available right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return <main className="auth-page"><section className="auth-card" aria-labelledby="signup-title"><div className="auth-brand"><span className="brand-icon"><Grid2X2 size={17} strokeWidth={2.2} /></span><span><span className="brand-name">squad<span style={{ color: "#7357f6" }}>.</span></span><span className="brand-caption">team portal</span></span></div>{isRegistered ? <div className="auth-success" aria-live="polite"><span className="auth-success-check">✓</span><span className="auth-kicker">Account created</span><h1 id="signup-title">Welcome to squad.</h1><p className="auth-description">Your account is ready. You can open the workspace now.</p><Link className="primary-button auth-continue-button" href="/">Open workspace <ArrowRight size={15} /></Link><Link className="auth-switch-account" href="/login">Back to sign in</Link></div> : <div className="auth-card-content auth-signup-content"><span className="auth-kicker">Join your team</span><h1 id="signup-title">Create your account</h1><p className="auth-description">Set up your account and start contributing to the squad workspace.</p><form className="auth-email-form" onSubmit={handleSubmit}><label>Full name<input autoFocus required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Maya Putri" /></label><label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" /></label><label>Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a strong password" /></label><div className="password-rules" aria-label="Password requirements">{passwordRules.map((rule) => <span className={rule.valid ? "valid" : ""} key={rule.label}>{rule.valid ? <Check size={11} /> : <X size={11} />}{rule.label}</span>)}</div><label>Confirm password<input required type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repeat your password" /></label>{error ? <p className="auth-error" role="alert">{error}</p> : null}<button className="primary-button auth-email-submit" type="submit" disabled={isLoading}>{isLoading ? <span className="auth-spinner" aria-hidden="true" /> : null}<span>{isLoading ? "Creating account..." : "Create account"}</span>{!isLoading ? <ArrowRight size={15} /> : null}</button></form><p className="auth-form-note">Already have an account? <Link href="/login">Sign in</Link></p><p className="auth-security"><ShieldCheck size={14} /> Your account is protected with secure authentication.</p></div>}<p className="auth-footer">Need access? Ask your workspace administrator.</p></section></main>;
}
