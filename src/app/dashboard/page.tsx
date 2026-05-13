"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface StudyPlan {
  _id: string;
  title: string;
  description: string;
  tasks: any[];
  createdAt: string;
}

const stats = [
  {
    label: "Total Plans",
    value: "12",
    change: "+3 this week",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    color: "indigo",
  },
  {
    label: "Tasks Completed",
    value: "48",
    change: "+12 this week",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "emerald",
  },
  {
    label: "Hours Learned",
    value: "24",
    change: "+8 this week",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "amber",
  },
  {
    label: "Current Streak",
    value: "5 days",
    change: "Best: 12 days",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      </svg>
    ),
    color: "pink",
  },
];

const recentActivity = [
  { action: "Completed task", target: "JavaScript Basics - Variables", time: "2 hours ago", type: "complete" },
  { action: "Started new plan", target: "Machine Learning Fundamentals", time: "1 day ago", type: "create" },
  { action: "Updated progress", target: "React Advanced Patterns", time: "2 days ago", type: "progress" },
  { action: "Completed plan", target: "Python for Data Science", time: "4 days ago", type: "complete" },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchPlans();
    }
  }, [status]);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/study-plans");
      const data = await res.json();
      setPlans(data);
    } catch (error) {
      console.error("Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this study plan?")) return;
    try {
      const res = await fetch(`/api/study-plans/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlans(plans.filter((p) => p._id !== id));
      }
    } catch (error) {
      console.error("Failed to delete plan");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-zinc-400 font-medium">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </div>
      </div>
    );
  }

  const isGuest = (session?.user as any)?.isGuest;
  const userName = session?.user?.name || "User";

  const handleSignOut = async () => {
    if (isGuest) {
      try {
        await fetch("/api/guest-delete", { method: "DELETE" });
      } catch (error) {
        console.error("Failed to delete guest account");
      }
    }
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 antialiased selection:bg-indigo-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)]" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/8 rounded-full blur-[100px]" />
      </div>

      {/* Guest Mode Banner */}
      {isGuest && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm text-amber-200/80">
                You're in <span className="font-semibold text-amber-200">Guest Mode</span> - Your data will be reset when you sign out
              </span>
            </div>
            <Link
              href="/signup"
              className="text-xs font-semibold bg-amber-600/20 text-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-600/30 transition-colors"
            >
              Upgrade to Free Account
            </Link>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="border-b border-white/[0.08] bg-[#09090b]/70 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="font-bold text-white tracking-tight">StudyBuddy</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.196 10.196z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search plans..."
                className="bg-white/[0.05] border border-white/[0.08] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all outline-none w-56"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="h-6 w-px bg-white/[0.08] mx-2" />
            <Link href="/profile" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              My Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{userName.split(' ')[0]}</span>
          </h1>
          <p className="text-zinc-400">Here's an overview of your learning progress.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  stat.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-400' :
                  stat.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                  stat.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-pink-500/20 text-pink-400'
                }`}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-zinc-500 font-medium mt-1">{stat.label}</p>
              <p className="text-xs text-zinc-600 mt-1">{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Learning Paths */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">Learning Paths</h2>
              <Link
                href="/dashboard/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create New
              </Link>
            </div>

            {plans.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] py-20 text-center">
                <div className="w-14 h-14 bg-zinc-800/50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="h-7 w-7 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No plans yet</h3>
                <p className="text-zinc-500 text-sm mb-6">Create your first personalized study roadmap.</p>
                <Link href="/dashboard/new" className="inline-flex items-center gap-2 text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                  Get started <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            ) : plans.filter(p => p.title.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
              <div className="py-16 text-center border border-dashed border-white/[0.08] rounded-2xl">
                <p className="text-zinc-600 text-sm">No matching learning paths found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans
                  .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
                  .map((plan) => {
                    const completed = plan.tasks?.filter((t: any) => t.completed).length || 0;
                    const total = plan.tasks?.length || 0;
                    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                      <div
                        key={plan._id}
                        className="group relative p-6 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-300 overflow-hidden"
                      >
                        {/* Hover glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <div className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-semibold rounded-md border border-indigo-500/20">
                              Active
                            </div>
                            <span className="text-sm font-semibold text-zinc-500">{percent}%</span>
                          </div>

                          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{plan.title}</h3>
                          <p className="text-zinc-500 text-sm mb-6 line-clamp-2 leading-relaxed">
                            {plan.description || "Personalized curriculum built with AI."}
                          </p>

                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-zinc-500">{completed} of {total} completed</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                            <Link
                              href={`/dashboard/plan/${plan._id}`}
                              className="flex-1 text-center py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition"
                            >
                              Open
                            </Link>
                            <button
                              onClick={() => deletePlan(plan._id)}
                              className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/dashboard/new" className="flex items-center gap-3 p-3 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/30 transition-all group">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">New Study Plan</p>
                    <p className="text-xs text-zinc-500">Create from scratch</p>
                  </div>
                </Link>
                <Link href="/dashboard/new" className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.1] transition-all group">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">AI Generate</p>
                    <p className="text-xs text-zinc-500">Let AI create your plan</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'complete' ? 'bg-emerald-400' :
                      activity.type === 'create' ? 'bg-indigo-400' :
                      activity.type === 'progress' ? 'bg-amber-400' : 'bg-zinc-500'
                    }`} />
                    <div>
                      <p className="text-sm text-white">{activity.action}</p>
                      <p className="text-xs text-zinc-500">{activity.target}</p>
                      <p className="text-xs text-zinc-600 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
              <h3 className="text-lg font-bold text-white mb-3">Study Tip</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Consistency beats intensity. Try to study a little bit every day rather than cramming all at once.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}