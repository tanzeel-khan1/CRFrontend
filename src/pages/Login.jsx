import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
// import { signInWithPopup } from "firebase/auth";
// import { auth, provider } from "../firebase";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkUserAuth } = useAuth();

  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const inviteEmail = searchParams.get("email") || "";

  const [mode, setMode] = useState(initialMode);
  
  const [form, setForm] = useState({
    full_name: "",
    email: inviteEmail,
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get("mode") === "register") {
      setMode("register");
    }
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setForm((prev) => ({ ...prev, email: emailParam }));
    }
  }, [searchParams]);

  const isLogin = mode === "login";

  const updateForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    if (isLogin) {
      const result = await api.auth.login(form.email, form.password);

      api.auth.saveSession(result);
      await checkUserAuth();

      navigate("/personal");
    } 
    else {
      await api.auth.register(form);

      toast.success("OTP sent to email");

      // ✅ ONLY redirect to OTP page
      navigate("/verify-otp", {
        state: { email: form.email },
      });
    }
  } catch (err) {
    toast.error(err.message || "Authentication failed");
  } finally {
    setLoading(false);
  }
};
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);

  //   try {
  //     let result;

  //     if (isLogin) {
  //       result = await api.auth.login(form.email, form.password);
  //     } else {
  //       result = await api.auth.register(form);
  //     }

  //     api.auth.setToken(result.token);
  //     await checkUserAuth();
  //     navigate("/personal");
  //   } catch (err) {
  //     toast.error(err.message || "Authentication failed");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`,
        {
          full_name: result.user.displayName,
          email: result.user.email,
          avatar_url: result.user.photoURL,
        },
      );

      localStorage.setItem("token", response.data.token);
      api.auth.setUser(response.data);

      // redirect
      window.location.href = "/personal";
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,0,0,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.05),transparent_50%)]" />

      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-foreground/5 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-foreground/10 blur-3xl" />

      <div className="relative min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl grid overflow-hidden rounded-3xl border border-border/80 bg-card/80 shadow-[0_20px_80px_-20px_rgba(20,20,35,0.35)] backdrop-blur-xl lg:grid-cols-2">
          <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-foreground p-10 text-background">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.08),transparent_55%)]" />
            <div className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full border-[26px] border-background/10" />
            <div className="pointer-events-none absolute top-1/3 right-8 h-24 w-24 rounded-full bg-background/10 blur-2xl" />

            <div className="relative">
              <div className="mb-12 flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-background text-foreground">
                  <span className="text-sm font-black">R</span>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-2xl font-bold tracking-tight">Ranvola</span>
                  <span className="text-[9px] mt-1 uppercase tracking-[0.3em] text-background/55">Realtor Suite</span>
                </div>
              </div>

              <div className="space-y-5">
                <h2 className="max-w-md font-display text-5xl font-normal leading-[1.05] tracking-tight">
                  Run your business with <em>confidence</em>.
                </h2>
                <p className="max-w-md text-sm leading-6 text-background/60">
                  The workspace built for realtors and brokers — clients, properties, deals and operations in one refined place.
                </p>
              </div>
            </div>

            <div className="relative space-y-3">
              {[
                "Properties, clients & pipelines in one view",
                "Invoices, expenses and profit tracking",
                "Documents, teams and every workflow",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3 rounded-xl border border-background/10 bg-background/[0.04] px-4 py-3 backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-background" />
                  <p className="text-xs text-background/80">{f}</p>
                </div>
              ))}
              <div className="rounded-2xl bg-gradient-to-br from-background/[0.08] to-background/[0.02] border border-background/10 p-5 backdrop-blur mt-2">
                <p className="font-display text-lg italic leading-relaxed text-background/80">
                  "One workspace. Every workflow. Nothing slips through."
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-center justify-between lg:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
                    <span className="text-xs font-black">R</span>
                  </div>
                  <span className="text-xl font-bold">Ranvola</span>
                </div>
              </div>

              <div className="mb-8">
                <p className="eyebrow mb-2">{isLogin ? "Member access" : "Join Ranvola"}</p>
                <h1 className="font-display text-3xl font-normal tracking-tight sm:text-4xl">
                  {isLogin ? "Welcome back" : "Create your account"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isLogin
                    ? "Sign in to continue to your dashboard."
                    : "Fill the details below to get started."}
                </p>
              </div>

              <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1 border border-border/60">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isLogin
                      ? "bg-card text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign in
                </button>

                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    !isLogin
                      ? "bg-card text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full name</Label>
                    <Input
                      id="full_name"
                      value={form.full_name}
                      onChange={(e) => updateForm("full_name", e.target.value)}
                      required
                      disabled={loading}
                      placeholder="John Doe"
                      autoComplete="name"
                      className="h-11 rounded-xl"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    required
                    disabled={loading}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => updateForm("password", e.target.value)}
                      required
                      disabled={loading}
                      placeholder="••••••••"
                      autoComplete={
                        isLogin ? "current-password" : "new-password"
                      }
                      className="h-11 rounded-xl pr-20"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl text-sm font-semibold"
                  disabled={loading}
                >
                  {loading
                    ? "Please wait..."
                    : isLogin
                      ? "Sign in"
                      : "Create account"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setMode(isLogin ? "register" : "login")}
                  className="font-medium text-foreground hover:underline"
                >
                  {isLogin ? "Create one" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
