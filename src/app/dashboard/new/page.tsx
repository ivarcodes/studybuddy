"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewPlan() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/study-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, tasks: [] }),
      });

      if (res.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to create plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
      <div className="mx-auto max-w-2xl mt-12">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-white transition gap-2 mb-8">
          <span>←</span> Back to Dashboard
        </Link>
        <div className="rounded-3xl bg-zinc-900 p-10 shadow-3xl border border-zinc-800">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">Create New Path</h1>
            <p className="text-zinc-500">Define your goals and set up your study foundation.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest pl-1">Plan Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Mastering Advanced TypeScript"
                className="block w-full rounded-2xl bg-zinc-800 border-none px-6 py-4 text-white shadow-inner focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-zinc-600"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest pl-1">Description</label>
              <textarea
                rows={4}
                className="block w-full rounded-2xl bg-zinc-800 border-none px-6 py-4 text-white shadow-inner focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-zinc-600"
                placeholder="What exactly do you want to learn?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-lg font-bold text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition transform active:scale-[0.98] disabled:bg-zinc-800 disabled:text-zinc-600"
              >
                {loading ? "Creating Path..." : "Save Study Plan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
