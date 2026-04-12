"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";

const StudyBuddyLogo = () => (
   <div className="flex items-center gap-2">
      <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center">
         <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
         </svg>
      </div>
      <span className="text-sm font-bold text-white tracking-tight uppercase font-sans">StudyBuddy</span>
   </div>
);

export default function NewPlan() {
   const { data: session } = useSession();
   const [title, setTitle] = useState("");
   const [description, setDescription] = useState("");
   const [manualTopics, setManualTopics] = useState("");
   const [loading, setLoading] = useState(false);
   const [aiLoading, setAiLoading] = useState(false);
   const router = useRouter();

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

   const handleManualSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) {
        toast.error("Title Is Required", {
            description: "Please enter a title for your manual roadmap."
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

   const handleAiGenerate = async () => {
      if (!title.trim()) {
         toast.error("Title Is Missing", {
             description: "The AI needs a title to understand the topic you want to master."
         });
         return;
      }

      setAiLoading(true);
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
         setAiLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 antialiased font-sans">
         <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
               <StudyBuddyLogo />
               <div className="flex items-center gap-8">
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

         <main className="max-w-3xl mx-auto px-6 py-12">
            <header className="mb-10">
               <Link href="/dashboard" className="inline-flex items-center text-xs font-semibold text-zinc-500 hover:text-white transition gap-2 mb-4 uppercase tracking-tighter text-indigo-400">
                  <span>&larr;</span> Back to Dashboard
               </Link>
               <h1 className="text-3xl font-bold text-white tracking-tight">Set Your Path</h1>
               <p className="text-zinc-500 mt-1 italic">Personalized roadmap generation or manual curriculum mapping.</p>
            </header>

            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 shadow-2xl space-y-8">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Plan Title <span className="text-indigo-500">*</span></label>
                     <input
                        type="text"
                        required
                        placeholder="e.g. Mastering Advanced React"
                        className={`block w-full rounded-lg bg-zinc-950 border ${!title.trim() && (loading || aiLoading) ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-zinc-800'} px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-700 font-medium`}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                     />
                  </div>

                  <button
                     type="button"
                     onClick={handleAiGenerate}
                     disabled={aiLoading || loading}
                     className="w-full rounded-lg bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/10 hover:bg-indigo-500 transition-all transform active:scale-[0.98] disabled:bg-zinc-800 disabled:text-zinc-600 flex items-center justify-center gap-2"
                  >
                     {aiLoading ? "Consulting AI..." : "✨ StudyBuddy Generate Plan"}
                  </button>
               </div>

               <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.4em] italic"><span className="bg-zinc-900 px-4 text-zinc-600">OR DEFINE MANUALLY</span></div>
               </div>

               <form onSubmit={handleManualSubmit} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Modules / Topics</label>
                     <textarea
                        rows={5}
                        className="block w-full rounded-lg bg-zinc-950 border border-zinc-800 px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-700 font-medium text-sm"
                        placeholder="Topic 1 (e.g. Hooks Deep Dive)&#10;Topic 2 (e.g. Server Components)&#10;Topic 3..."
                        value={manualTopics}
                        onChange={(e) => setManualTopics(e.target.value)}
                        required
                     />
                     <p className="text-[10px] text-zinc-600 pl-1">Enter one topic per line. We'll build the workspace for each.</p>
                  </div>

                  <button
                     type="submit"
                     disabled={loading || aiLoading}
                     className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-6 py-4 text-xs font-bold text-zinc-500 hover:text-white hover:border-zinc-700 transition transform active:scale-[0.98] disabled:bg-zinc-800/50 disabled:text-zinc-700 disabled:cursor-not-allowed"
                  >
                     {loading ? "Initializing..." : "Map Manual Plan"}
                  </button>
               </form>
            </div>
         </main>
      </div>
   );
}
