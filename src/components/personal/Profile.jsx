import React, { useEffect, useState } from "react";
import api from "../../api/apiClient";
import { toast } from "sonner";
import { Search, Bell, Command, Menu, Sun, Moon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const currentUser = api.auth.getUser();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        full_name: currentUser.full_name || "",
        email: currentUser.email || "",
      });
      fetchSubscription();
    }
  }, []);

  const fetchSubscription = async () => {
    try {
      const userId = currentUser?._id || currentUser?.id;
      const res = await api.profile.getSubscription(userId);
      setSubscription(res.subscription || res.data?.subscription || null);
    } catch (error) {
      console.error(error);
      toast.error("Subscription Has No load ❌");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const res = await api.profile.update({
        full_name: formData.full_name,
        email: formData.email,
      });
      api.auth.setUser(res.user);
      setIsEditing(false);
      toast.success("Profile updated successfully 🚀");
    } catch (error) {
      toast.error(error?.message || "Update failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className="
min-h-screen
transition-all
duration-500

"
    >
      <div className="max-w-6xl ">
        {/* TOP HEADER */}

        <div
          className="
flex
justify-between
items-start
mb-10
"
        >
          <div>
            <h1
              className="
text-4xl
font-bold
tracking-tight
text-gray-900
dark:text-white
"
            >
              Account
            </h1>

            <p
              className="
mt-2
text-gray-500
dark:text-gray-400
"
            >
              Manage your profile and subscription details
            </p>
          </div>

          {/* THEME BUTTON */}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const isDark = document.documentElement.classList.toggle("dark");

              localStorage.setItem("theme", isDark ? "dark" : "light");
            }}
            className="
rounded-full
bg-white
dark:bg-zinc-900
border
border-gray-200
dark:border-zinc-800
shadow
"
          >
            <Sun
              className="
w-5
h-5
text-gray-900
dark:text-white
rotate-0
scale-100
transition-all
dark:-rotate-90
dark:scale-0
"
            />

            <Moon
              className="
absolute
w-5
h-5
text-gray-900
dark:text-white
rotate-90
scale-0
transition-all
dark:rotate-0
dark:scale-100
"
            />
          </Button>
        </div>

        <div
          className="
grid
lg:grid-cols-2
gap-8
"
        >
          {/* PROFILE CARD */}

          <div
            className="
relative
overflow-hidden
rounded-[32px]
border
border-gray-200
dark:border-zinc-800

bg-white/80
dark:bg-zinc-950/80

backdrop-blur-xl
shadow-xl

p-8

"
          >
            <div
              className="
absolute
-top-24
-right-24
w-60
h-60
rounded-full
bg-black/5
dark:bg-white/10
blur-3xl
"
            />

            <div className="relative">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div
                    className="
w-24
h-24
rounded-3xl
bg-gradient-to-br
from-gray-900
to-black
dark:from-white
dark:to-gray-200
flex
items-center
justify-center
text-white
dark:text-black
text-3xl
font-bold
shadow-xl

ring-2
ring-amber-400/30
dark:ring-amber-300/20
ring-offset-2
ring-offset-white
dark:ring-offset-zinc-950
"
                  >
                    {getInitials(formData.full_name)}
                  </div>

                  <span
                    className="
absolute
bottom-1
right-1

w-5
h-5

bg-gray-900
dark:bg-white

border-4
border-white
dark:border-zinc-950

rounded-full
"
                  />
                </div>

                <div>
                  <h2
                    className="
text-2xl
font-bold
text-gray-900
dark:text-white
"
                  >
                    {formData.full_name || "User"}
                  </h2>

                  <p
                    className="
text-sm
text-gray-500
dark:text-gray-400
"
                  >
                    {formData.email}
                  </p>

                  <div
                    className="
mt-3
inline-flex
px-3
py-1
rounded-full

bg-gray-900
dark:bg-white

text-white
dark:text-black

text-xs
font-semibold
"
                  >
                    Verified Account
                  </div>
                </div>
              </div>

              <div className="mt-10 space-y-6">
                {[
                  {
                    label: "Full Name",
                    name: "full_name",
                  },
                  {
                    label: "Email Address",
                    name: "email",
                  },
                ].map((field) => (
                  <div key={field.name}>
                    <label
                      className="
text-xs
font-semibold
uppercase
text-gray-500
dark:text-gray-400
"
                    >
                      {field.label}
                    </label>

                    <input
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="
mt-2
w-full
rounded-2xl
px-5
py-4

bg-gray-100
dark:bg-zinc-900

text-gray-900
dark:text-white

border
border-transparent

focus:ring-4
focus:ring-gray-900/10
dark:focus:ring-white/10

outline-none

transition
"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-10">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="
w-full
rounded-2xl
py-4

bg-black
dark:bg-white

text-white
dark:text-black

font-semibold

hover:scale-[1.02]
transition
"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleUpdate}
                      className="
flex-1
rounded-2xl
py-4

bg-black
dark:bg-white

text-white
dark:text-black

font-semibold
"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      onClick={() => setIsEditing(false)}
                      className="
px-6
rounded-2xl

border
border-gray-300
dark:border-zinc-700

text-gray-700
dark:text-white
"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* SUBSCRIPTION CARD */}

          <div
            className="
rounded-[32px]

border
border-gray-200
dark:border-zinc-800


bg-white
dark:bg-zinc-950


text-gray-900
dark:text-white


p-8

shadow-xl

relative

overflow-hidden

"
          >
            <div
              className="
absolute
top-0
right-0

w-72
h-72

bg-black/5
dark:bg-white/10

blur-3xl
"
            />

            <div className="relative">
              <p
                className="
text-xs
uppercase
tracking-widest

text-gray-400
dark:text-zinc-400
"
              >
                Subscription
              </p>

              <div
                className="
flex
justify-between
items-center
mt-5
"
              >
                <h2
                  className="
text-4xl
font-bold
"
                >
                  {subscription?.plan || "Free"}
                </h2>

                <span
                  className="
px-4
py-2
rounded-full

border
border-amber-400/40
dark:border-amber-300/30

bg-gradient-to-r
from-amber-50
to-white
dark:from-amber-500/10
dark:to-white/5

text-amber-700
dark:text-amber-300

text-xs
font-semibold

shadow-[0_0_0_1px_rgba(251,191,36,0.15)]
"
                >
                  Active
                </span>
              </div>

              <div className="mt-10 space-y-4">
                {[
                  ["Status", subscription?.status],
                  ["Billing", subscription?.billingCycle],
                  [
                    "Amount",
                    subscription?.amount
                      ? `${subscription.amount} ${subscription.currency}`
                      : "Free",
                  ],
                  [
                    "Renewal",
                    subscription?.currentPeriodEnd
                      ? new Date(
                          subscription.currentPeriodEnd,
                        ).toLocaleDateString()
                      : "-",
                  ],
                ].map((item, i) => (
                  <div
                    key={i}
                    className="
flex
justify-between
items-center

p-5

rounded-2xl

bg-gray-100
dark:bg-white/10

"
                  >
                    <span
                      className="
text-gray-500
dark:text-zinc-400
"
                    >
                      {item[0]}
                    </span>

                    <span className="font-semibold">{item[1] || "-"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
