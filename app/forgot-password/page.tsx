"use client";

import { ArrowLeft, ArrowRight, Check, Grid2X2, Mail, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type ResetStep = "request" | "sent" | "reset" | "complete";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<ResetStep>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function requestReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setEmail(normalizedEmail);
    setIsLoading(false);
    setStep("sent");
  }

  function submitNewPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setError("Use at least 8 characters, one uppercase letter, and one number.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setStep("complete");
  }

  return <main className="auth-page"><section className="auth-card" aria-labelledby="reset-title"><div className="auth-brand"><span className="brand-icon"><Grid2X2 size={17} strokeWidth={2.2} /></span><span><span className="brand-name">squad<span style={{ color: "#7357f6" }}>.</span></span><span className="brand-caption">team portal</span></span></div>{step === "request" ? <div className="auth-card-content"><span className="auth-kicker">Account recovery</span><h1 id="reset-title">Forgot your password?</h1><p className="auth-description">Enter your email and we&apos;ll send a secure link to reset your password.</p><form className="auth-email-form" onSubmit={requestReset}><label>Email address<input autoFocus required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" /></label>{error ? <p className="auth-error" role="alert">{error}</p> : null}<button className="primary-button auth-email-submit" type="submit" disabled={isLoading}>{isLoading ? <span className="auth-spinner" aria-hidden="true" /> : <Mail size={14} />}<span>{isLoading ? "Sending link..." : "Send reset link"}</span>{!isLoading ? <ArrowRight size={15} /> : null}</button></form><Link className="auth-back-link" href="/login"><ArrowLeft size={13} /> Back to sign in</Link><ResetSecurityNote /></div> : step === "sent" ? <div className="auth-success" aria-live="polite"><span className="auth-success-check"><Mail size={19} /></span><span className="auth-kicker">Check your inbox</span><h1 id="reset-title">Reset link sent</h1><p className="auth-description">We sent a reset link to <strong>{email}</strong>. For this demo, continue to the reset form below.</p><button className="primary-button auth-continue-button" type="button" onClick={() => setStep("reset")}>Open reset link <ArrowRight size={15} /></button><button className="auth-switch-account" type="button" onClick={() => setStep("request")}>Use a different email</button></div> : step === "reset" ? <div className="auth-card-content"><span className="auth-kicker">New password</span><h1 id="reset-title">Set a new password</h1><p className="auth-description">Choose a password you haven&apos;t used before.</p><form className="auth-email-form" onSubmit={submitNewPassword}><label>New password<input autoFocus required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a strong password" /></label><div className="password-rules" aria-label="Password requirements"><span className={password.length >= 8 ? "valid" : ""}>{password.length >= 8 ? <Check size={11} /> : <X size={11} />}At least 8 characters</span><span className={/[A-Z]/.test(password) ? "valid" : ""}>{/[A-Z]/.test(password) ? <Check size={11} /> : <X size={11} />}One uppercase letter</span><span className={/\d/.test(password) ? "valid" : ""}>{/\d/.test(password) ? <Check size={11} /> : <X size={11} />}One number</span></div><label>Confirm new password<input required type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repeat your password" /></label>{error ? <p className="auth-error" role="alert">{error}</p> : null}<button className="primary-button auth-email-submit" type="submit">Update password <ArrowRight size={15} /></button></form></div> : <div className="auth-success" aria-live="polite"><span className="auth-success-check">✓</span><span className="auth-kicker">Password updated</span><h1 id="reset-title">You&apos;re all set</h1><p className="auth-description">Your password has been updated. Sign in with your new password to continue.</p><Link className="primary-button auth-continue-button" href="/login">Back to sign in <ArrowRight size={15} /></Link></div>}<p className="auth-footer">Need access? Ask your workspace administrator.</p></section></main>;
}

function ResetSecurityNote() {
  return <p className="auth-security"><ShieldCheck size={14} /> Reset links expire after a short time for your security.</p>;
}
