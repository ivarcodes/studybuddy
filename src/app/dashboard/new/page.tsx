"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";

const StudyBuddyLogo = () => (
  <div className="flex items-center gap-3 group">
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    </div>
    <span className="font-bold text-white tracking-tight">StudyBuddy</span>
  </div>
);

export default function NewPlan() {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [manualTopics, setManualTopics] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isGuest = (session as any)?.user?.isGuest;

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

  const createPlan = async (tasks: any[] = []) => {
    if (!title.trim()) {
      toast.error("Roadmap Title Required", {
        description: "Please name your study plan before saving."
      });
      return;
    }

    try {
      const res = await fetch("/api/study-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          tasks
        }),
      });

      if (res.ok) {
        toast.success("Roadmap Created!", {
          description: `Successfully initialized ${title}.`
        });
        router.push("/dashboard");
      } else {
        const errData = await res.json();
        toast.error("Creation Failed", {
          description: errData.message || "Failed to sync with neural database."
        });
      }
    } catch (error) {
      toast.error("Network Error", {
        description: "Lost connection to the brain server."
      });
    }
  };

  const handleAiGenerate = async () => {
    if (!title.trim()) {
      toast.error("Title Is Missing", {
        description: "The AI needs a title to understand the topic you want to master."
      });
      return;
    }

    setLoading(true);
    toast.info("Generating Neural Roadmap", {
      description: "Our AI is synthesizing your custom curriculum..."
    });

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: title, description }),
      });

      if (res.ok) {
        const tasks = await res.json();
        await createPlan(tasks);
      } else {
        toast.error("AI Generation Failed", {
          description: "Failed to build the roadmap. Please check your API key."
        });
      }
    } catch (error) {
      toast.error("System Error", {
        description: "The AI engine is currently unresponsive."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title Is Required", {
        description: "Please enter a title for your roadmap."
      });
      return;
    }
    if (!manualTopics.trim()) {
      toast.error("Topics Required", {
        description: "Please add at least one topic for your roadmap."
      });
      return;
    }

    setLoading(true);
    const tasks = manualTopics
      .split("\n")
      .filter(t => t.trim())
      .map(topic => ({
        title: topic.trim(),
        completed: false,
        subtasks: [],
        resources: []
      }));

    await createPlan(tasks);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 antialiased selection:bg-indigo-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear_gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)]" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="border-b border-white/[0.08] bg-[#09090b]/70 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <StudyBuddyLogo />
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Dashboard
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

      <main className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-indigo-400 transition gap-2 mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
            Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Study Plan</span>
          </h1>
          <p className="text-zinc-400">Build your personalized learning roadmap.</p>
        </header>

        <form onSubmit={handleManualSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Plan Title <span className="text-indigo-500">*</span></label>
              <input
                type="text"
                placeholder="e.g. Mastering Advanced React"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Description (optional)</label>
              <textarea
                rows={2}
                placeholder="Tell us about your goals or current level..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all outline-none resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Topics Section - Toggle between AI or Manual */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-400">Topics / Curriculum</label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-600">Let AI generate</span>
                <button
                  type="button"
                  onClick={() => setManualTopics(manualTopics ? "" : "placeholder")}
                  className={`relative w-11 h-6 rounded-full transition-colors ${manualTopics ? "bg-zinc-700" : "bg-indigo-600"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${manualTopics ? "left-1" : "left-6"}`} />
                </button>
                <span className="text-zinc-400">I'll add manually</span>
              </div>
            </div>

            {manualTopics ? (
              <textarea
                rows={6}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all outline-none resize-none font-mono text-sm"
                placeholder={"HTML Basics\nCSS Fundamentals\nJavaScript Essentials\nReact Basics"}
                value={manualTopics === "placeholder" ? "" : manualTopics}
                onChange={(e) => setManualTopics(e.target.value)}
              />
            ) : (
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-center">
                <p className="text-sm text-zinc-400">
                  Leave this empty and click <span className="text-indigo-400 font-semibold">Generate with AI</span> below to auto-generate your curriculum
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={loading}
              className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
              )}
              Generate with AI
            </button>

            <button
              type="submit"
              disabled={loading || !manualTopics}
              className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm font-semibold text-white hover:bg-white/[0.06] hover:border-white/[0.15] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              Add Manually
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}