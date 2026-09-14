import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Verifyotp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await api.auth.verifyOtp(email, otp);

      api.auth.saveSession(result);
      api.auth.setWelcomeModal(true);
      await checkUserAuth();

      toast.success("Email verified successfully 🎉");

      setTimeout(() => {
        navigate("/personal", { state: { showWelcome: true } });
      }, 800);
    } catch (err) {
      toast.error(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-xl border border-border">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">
            Verify Your Email
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter OTP sent to your email
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>OTP Code</Label>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="h-11 text-center tracking-widest text-lg"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Verifyotp;
