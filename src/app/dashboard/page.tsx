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
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400 font-medium">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 antialiased selection:bg-indigo-500/30">
      <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-7 w-7 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center">
               <div className="h-3 w-3 bg-white rounded-sm"></div>
            </div>
            <span className="font-bold text-white tracking-tight">StudyBuddy</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="h-3 w-3 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input 
                type="text" 
                placeholder="Find a path..."
                className="bg-zinc-900/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 text-[10px] font-bold text-white placeholder:text-zinc-700 focus:border-indigo-500 transition-all outline-none uppercase tracking-widest w-48 focus:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Link href="/profile" className="text-xs font-semibold text-zinc-500 hover:text-white transition uppercase">My Profile</Link>
            <button 
              onClick={() => signOut()}
              className="text-xs font-semibold text-zinc-500 hover:text-white transition uppercase"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">My Learning Paths</h1>
            <p className="text-zinc-500 mt-1">Manage and track your personalized AI-generated curriculum.</p>
          </div>
          <Link 
            href="/dashboard/new" 
            className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98]"
          >
            Create New Plan
          </Link>
        </header>

        {plans.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 py-24 text-center">
            <div className="h-12 w-12 bg-zinc-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <svg className="h-6 w-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4.5v15m7.5-7.5h-15" strokeWidth={2} /></svg>
            </div>
            <h3 className="text-lg font-semibold text-white">No plans yet</h3>
            <p className="text-zinc-500 mt-1 mb-6">Let's create your first personalized study roadmap.</p>
            <Link href="/dashboard/new" className="text-indigo-500 font-semibold hover:underline">Get started &rarr;</Link>
          </div>
        ) : plans.filter(p => p.title.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
          <div className="py-20 text-center border border-dashed border-zinc-900 rounded-3xl">
             <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.4em]">No matching learning paths found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans
              .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
              .map((plan) => {
              const completed = plan.tasks?.filter((t: any) => t.completed).length || 0;
              const total = plan.tasks?.length || 0;
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div 
                  key={plan._id} 
                  className="group flex flex-col bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 rounded-2xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6 flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-indigo-500/20">
                        Active Path
                      </div>
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-tighter">{percent}% Done</span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{plan.title}</h3>
                    <p className="text-zinc-500 text-sm mt-3 line-clamp-2 leading-relaxed">
                      {plan.description || "Personalized curriculum built with AI."}
                    </p>

                    <div className="mt-8">
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">{completed} of {total} items finished</span>
                       </div>
                       <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 transition-all duration-1000" 
                            style={{ width: `${percent}%` }}
                          ></div>
                       </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-zinc-900/50 border-t border-zinc-800 flex items-center justify-between gap-4">
                    <Link 
                      href={`/dashboard/plan/${plan._id}`}
                      className="flex-1 text-center py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-md transition"
                    >
                      Open Roadmap
                    </Link>
                    <button 
                      onClick={() => deletePlan(plan._id)}
                      className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-md transition"
                      title="Delete Plan"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
