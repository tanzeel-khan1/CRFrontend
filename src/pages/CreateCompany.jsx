import React, { useState } from "react";
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/apiClient";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const STEPS = [
  { icon: Building2, label: "Company Info" },
  { icon: Users, label: "Partnership" },
  { icon: CheckCircle, label: "Complete" },
];

export default function CreateCompany() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setActiveCompany } = useOutletContext();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    country: "",
    currency: "USD",
    description: "",
    fiscal_year_start: "January",
  });
  const [partnershipType, setPartnershipType] = useState("");

  const getUserFromLocalStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};


  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => api.entities.Company.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      api.entities.Company.create({
        ...data,
        setup_progress: 80,
        status: "active",
      }),
    onSuccess: async (newCompany) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setActiveCompany(newCompany);
      api.auth.setActiveCompanyId(newCompany.id);
      setStep(2);
      const returnTo = searchParams.get("returnTo");
      if (returnTo === "personal") {
        navigate("/personal", {
          replace: true,
          state: { activeSection: "companies" },
        });
      }
    },
  });

  const canCreateCompany = (existingCompaniesCount = 0) => {
    const user = getUserFromLocalStorage();

    const isFree = user?.subscription?.plan === "free";

    if (isFree && existingCompaniesCount >= 1) {
      return false;
    }

    return true;
  };

  const handleCreateClick = (companiesCount) => {
    const allowed = canCreateCompany(companiesCount);

    if (!allowed) {
      setShowLimitModal(true);
      return;
    }

    createMutation.mutate(form);
  };
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Progress */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Company</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up your workspace in minutes
        </p>
        <Progress value={progress} className="mt-4 h-1.5" />
        <div className="flex justify-between mt-3">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 text-xs font-medium ${i <= step ? "text-primary" : "text-muted-foreground"}`}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        {/* STEP 0: Company Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Company Information</h2>
            <div>
              <Label>Company Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Acme Corp"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Industry</Label>
                <Input
                  value={form.industry}
                  onChange={(e) =>
                    setForm({ ...form, industry: e.target.value })
                  }
                  placeholder="Technology"
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  placeholder="United States"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Currency</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm({ ...form, currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["USD", "EUR", "GBP", "CAD", "AUD", "INR", "PKR"].map(
                      (c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fiscal Year Start</Label>
                <Select
                  value={form.fiscal_year_start}
                  onValueChange={(v) =>
                    setForm({ ...form, fiscal_year_start: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["January", "April", "July", "October"].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Brief description"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* STEP 1: Partnership */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Partnership Setup</h2>
            <p className="text-sm text-muted-foreground">
              You can configure detailed investor splits after creating the
              company. Add investors from the Investors page.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {[
                "50/50 Equal Split",
                "Dynamic Ownership",
                "Silent Investors",
                "Custom Equity",
              ].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPartnershipType(opt)}
                  className={`text-left p-4 rounded-lg border transition-colors ${partnershipType === opt ? "border-primary bg-primary/5" : "border-border hover:border-primary hover:bg-primary/5"}`}
                >
                  <p className="text-sm font-medium">{opt}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Complete */}
        {step === 2 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Company Created!</h2>
            {imported && extractedData && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900 text-sm text-green-700 dark:text-green-400">
                ✓ Imported {extractedData.expenses?.length || 0} expenses &{" "}
                {extractedData.invoices?.length || 0} invoices
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-3">
              Your workspace is ready. Start adding investors and tracking
              finances.
            </p>
            <Button
              onClick={() =>
                navigate("/personal", {
                  replace: true,
                  state: { activeSection: "companies" },
                })
              }
              className="mt-6 gap-2"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </motion.div>

      {step < 2 && (
        <>
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {step === 0 ? (
              <Button
                onClick={() => setStep(1)}
                disabled={!form.name}
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => handleCreateClick(companies.length)}
                disabled={!form.name || !partnershipType || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...
                  </>
                ) : (
                  <>
                    Create Company <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>

          <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Subscription limit reached</DialogTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Your free plan allows only one company. Upgrade your subscription to create another company.
                </p>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowLimitModal(false)}>
                  Close
                </Button>
                <Button
               onClick={() => {
  setShowLimitModal(false);
  window.location.href = "https://main.dsoa1hgcxw1e5.amplifyapp.com/dashboard";
}}
                >
                  Manage Subscription
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
