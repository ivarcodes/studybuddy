"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Task {
  title: string;
  completed: boolean;
}

interface StudyPlan {
  _id: string;
  title: string;
  description: string;
  tasks: Task[];
  createdAt: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (!confirm("Are you sure you want to delete this plan?")) return;

    try {
      const res = await fetch(`/api/study-plans/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlans(plans.filter((p) => p._id !== id));
      }
    } catch (error) {
      console.error("Failed to delete plan");
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-indigo-500">
      <div className="animate-pulse">Loading dashboard...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-8">
          <div>
            <h1 className="text-4xl font-black text-white">Dashboard</h1>
            <p className="text-zinc-500 mt-1">Manage your active learning paths</p>
          </div>
          <div className="flex items-center gap-4">
             <Link
              href="/dashboard/new"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-white font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
            >
              + Create Plan
            </Link>
            <button 
              onClick={() => signOut()}
              className="px-4 py-2 text-zinc-500 hover:text-white transition"
            >
              Sign Out
            </button>
          </div>
        </header>

        {plans.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-zinc-800 bg-zinc-900/50 p-24 text-center">
            <h3 className="text-2xl font-bold text-zinc-400">Empty Nest</h3>
            <p className="text-zinc-600 mt-2 mb-8">You haven't generated any study plans yet.</p>
            <Link 
              href="/dashboard/new" 
              className="rounded-xl bg-zinc-800 px-8 py-3 text-white font-semibold border border-zinc-700 hover:bg-zinc-700 transition"
            >
              Start Generating AI Plans
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div 
                key={plan._id} 
                className="group relative flex flex-col rounded-2xl bg-zinc-900 p-8 shadow-xl border border-zinc-800 hover:border-indigo-500/50 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="mb-4">
                   <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{plan.title}</h3>
                   <p className="text-zinc-500 text-sm mt-1 line-clamp-2 leading-relaxed">{plan.description || "No description provided."}</p>
                </div>
                
                <div className="mt-auto pt-6 flex items-center justify-between border-t border-zinc-800/50">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Progress</span>
                    <span className="text-sm font-medium text-zinc-400 mt-1">
                      {plan.tasks.filter(t => t.completed).length}/{plan.tasks.length} Completed
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <Link
                      href={`/dashboard/plan/${plan._id}`}
                      className="text-sm font-bold text-indigo-400 hover:text-indigo-300"
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => deletePlan(plan._id)}
                      className="text-sm font-bold text-zinc-600 hover:text-red-500 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
