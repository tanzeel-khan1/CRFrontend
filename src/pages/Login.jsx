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
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-muted/30" />

      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl grid overflow-hidden rounded-3xl border border-border bg-card/80 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
          <div className="hidden lg:flex flex-col justify-between bg-primary p-10 text-primary-foreground">
            <div>
              <div className="mb-10 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground text-primary shadow">
                  <span className="text-sm font-bold">R</span>
                </div>
                <span className="text-2xl font-bold tracking-tight">
                  Ranvola
                </span>
              </div>

              <div className="space-y-5">
                <h2 className="max-w-md text-4xl font-bold leading-tight">
Run your business with confidence.
                </h2>
                <p className="max-w-md text-sm leading-6 text-primary-foreground/80">
                  Sign in to access your workspace, collaborate with your team, manage operations, and keep everything organized in one place.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-primary-foreground/10 p-5 backdrop-blur">
              <p className="text-sm leading-6 text-primary-foreground/80">
                One workspace. Every workflow.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-center justify-between lg:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <span className="text-xs font-bold">R</span>
                  </div>
                  <span className="text-xl font-bold">Ranvola</span>
                </div>
              </div>

              <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {isLogin ? "Welcome back" : "Create your account"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isLogin
                    ? "Sign in to continue to your dashboard."
                    : "Fill the details below to get started."}
                </p>
              </div>

              <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isLogin
                      ? "bg-background text-foreground shadow-sm"
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
                      ? "bg-background text-foreground shadow-sm"
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
