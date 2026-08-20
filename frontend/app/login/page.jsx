"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, Mail, Lock, AtSign, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ identifier: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);

  const switchMode = (next) => {
    setMode(next);
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(loginForm.identifier.trim(), loginForm.password);
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const user = await register({
        username: registerForm.username.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
      });
      setPendingEmail(user ? registerForm.email : registerForm.email);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-(--surface-3) border border-(--line-strong) pl-9 pr-3 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-(--faint) focus:border-(--accent-line) transition";

  return (
    <div className="min-h-screen bg-(--bg) flex items-center justify-center p-5 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-(--accent)/[0.06] blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-(--accent)/[0.05] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative animate-slide-up">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-(--surface-2) border border-(--accent-line) flex items-center justify-center text-zinc-50 font-display font-bold text-xl">
            I
          </div>
          <div>
            <p className="font-display text-xl font-bold text-white tracking-[0.22em] uppercase leading-none">
              IDK
            </p>
            <p className="text-[10px] text-(--faint) font-medium tracking-[0.18em] uppercase mt-0.5">
              Calisthenics
            </p>
          </div>
        </div>

        {pendingEmail ? (
          /* Verification screen after successful register */
          <div className="bg-(--surface) border border-(--line) p-8 square-frame">
            <div className="w-12 h-12 bg-white/5 border border-(--line-strong) flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-zinc-50" />
            </div>
            <h1 className="font-display text-lg font-semibold text-zinc-100 mb-1.5">Verify your email</h1>
            <p className="text-xs text-(--muted) leading-relaxed mb-5">
              We sent a confirmation link to{" "}
              <span className="text-(--accent) font-medium">{pendingEmail}</span>. Click the link in
              your inbox, then log in to start training.
            </p>
            <button
              onClick={() => {
                setPendingEmail(null);
                setMode("login");
              }}
              className="w-full flex items-center justify-center gap-2 btn-white text-xs px-4 py-2.5 active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Go to login</span>
            </button>
          </div>
        ) : (
          <>
            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="font-display text-2xl font-semibold text-zinc-50 tracking-tight">
                {mode === "login" ? "Welcome back" : "Join the grind"}
              </h1>
              <p className="text-xs text-(--faint) mt-1.5">
                {mode === "login"
                  ? "Log in to your account to track your calisthenics journey."
                  : "Create an account to start tracking your progress."}
              </p>
            </div>

            {/* Mode tabs */}
            <div className="grid grid-cols-2 gap-1 bg-(--surface-3) border border-(--line) p-1 mb-6">
              {[
                { key: "login", label: "Log in", icon: LogIn },
                { key: "register", label: "Sign up", icon: UserPlus },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = mode === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => switchMode(tab.key)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold border-l-2 transition ${
                      active
                        ? "border-(--accent) bg-(--accent-soft) text-(--accent)"
                        : "border-transparent text-(--faint) hover:text-zinc-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Card */}
            <div className="bg-(--surface) border border-(--line) p-7 square-frame">
              {error && (
                <div className="flex items-start gap-2.5 bg-(--accent-soft) border border-(--accent-line) px-3.5 py-2.5 mb-5">
                  <AlertCircle className="w-4 h-4 text-(--accent) shrink-0 mt-0.5" />
                  <p className="text-xs text-(--accent) leading-relaxed">{error}</p>
                </div>
              )}

              {mode === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em] mb-1.5">
                      Email or username
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-(--faint) absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        value={loginForm.identifier}
                        onChange={(e) => setLoginForm((p) => ({ ...p, identifier: e.target.value }))}
                        placeholder="you@example.com"
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em] mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-(--faint) absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                        placeholder="••••••••"
                        required
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-(--faint) hover:text-zinc-300 transition"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 btn-accent disabled:opacity-50 text-xs px-4 py-2.5 active:scale-[0.98]"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isSubmitting ? "Logging in..." : "Log in"}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em] mb-1.5">
                      Username
                    </label>
                    <div className="relative">
                      <AtSign className="w-4 h-4 text-(--faint) absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, username: e.target.value }))}
                        placeholder="e.g. streetworkout_fan"
                        minLength={3}
                        maxLength={30}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em] mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-(--faint) absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="you@example.com"
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em] mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-(--faint) absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))}
                        placeholder="At least 8 characters"
                        minLength={8}
                        required
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-(--faint) hover:text-zinc-300 transition"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 btn-accent disabled:opacity-50 text-xs px-4 py-2.5 active:scale-[0.98]"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isSubmitting ? "Creating account..." : "Create account"}</span>
                  </button>
                  <p className="text-[10px] text-(--faint) leading-relaxed text-center">
                    We&apos;ll send a verification link to your email before you can log in.
                  </p>
                </form>
              )}
            </div>

            {/* Footer hint */}
            <p className="text-center text-[10px] text-(--faint) mt-5 flex items-center justify-center gap-1.5">
              <ArrowRight className="w-3 h-3" />
              <span>Powered by IDK Calisthenics — train hard, track harder.</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}