"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ActivityLog {
   date: string;
   type: string;
}

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

export default function ProfilePage() {
   const { data: session, status } = useSession();
   const [activities, setActivities] = useState<ActivityLog[]>([]);
   const [loading, setLoading] = useState(true);
   const router = useRouter();

   useEffect(() => {
      if (status === "unauthenticated") {
         router.push("/login");
      } else if (status === "authenticated") {
         fetchActivity();
      }
   }, [status]);

   const fetchActivity = async () => {
      try {
         const res = await fetch("/api/activity");
         if (res.ok) {
            const data = await res.json();
            setActivities(data);
         }
      } catch (error) {
         console.error("Failed to load activity");
      } finally {
         setLoading(false);
      }
   };

   const generateHeatmap = () => {
      const today = new Date();
      const map: Record<string, number> = {};
      activities.forEach(a => {
         const d = new Date(a.date).toISOString().split('T')[0];
         map[d] = (map[d] || 0) + 1;
      });

      const cells = [];
      for (let i = 180; i >= 0; i--) {
         const d = new Date();
         d.setDate(today.getDate() - i);
         const dateStr = d.toISOString().split('T')[0];
         const count = map[dateStr] || 0;
         cells.push({ date: dateStr, count });
      }
      return cells;
   };

   const calculateStreak = () => {
      if (activities.length === 0) return 0;

      // Get unique dates sorted descending
      const dates = Array.from(new Set(activities.map(a => new Date(a.date).toISOString().split('T')[0])))
         .sort((a, b) => b.localeCompare(a));

      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (dates[0] !== today && dates[0] !== yesterday) return 0;

      let current = new Date(dates[0]);
      for (let i = 0; i < dates.length; i++) {
         const d = new Date(dates[i]);
         const diff = (current.getTime() - d.getTime()) / 86400000;
         if (diff <= i) {
            streak++;
         } else {
            break;
         }
      }
      return streak;
   };

   if (loading) return <div className="h-screen flex items-center justify-center bg-zinc-950 text-zinc-500 text-sm">Syncing profile...</div>;

   const heatmapData = generateHeatmap();
   const totalCompleted = activities.filter(a => a.type === 'task_completion').length;
   const streak = calculateStreak();

   return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 antialiased font-sans selection:bg-indigo-500/30">
         <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
               <StudyBuddyLogo />
               <div className="flex items-center gap-6">
                  <Link href="/dashboard" className="text-xs font-semibold text-zinc-500 hover:text-white transition uppercase tracking-tighter">Dashboard</Link>
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                     {session?.user?.name?.[0]}
                  </div>
               </div>
            </div>
         </nav>

         <main className="max-w-7xl mx-auto px-6 py-12">
            <header className="mb-12">
               <h1 className="text-3xl font-bold text-white tracking-tight">Performance Summary</h1>
               <p className="text-zinc-500 mt-1">Real-time tracking of your study journey.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
               <div className="lg:col-span-1 space-y-4">
                  <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800">
                     <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-4">Mastery achieved</h4>
                     <p className="text-4xl font-bold text-white">{totalCompleted}</p>
                     <p className="text-xs text-zinc-500 mt-1">Modules finished</p>
                  </div>
                  <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800">
                     <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-4">Continuous Streak</h4>
                     <p className="text-4xl font-bold text-white">{streak} {streak === 1 ? 'Day' : 'Days'}</p>
                     <p className="text-xs text-zinc-500 mt-1">Success chain</p>
                  </div>
               </div>

               <div className="lg:col-span-3">
                  <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-semibold text-white">Daily Progress</h3>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] text-zinc-500">Less</span>
                           <div className="flex gap-[2px]">
                              <div className="h-3 w-3 rounded-sm bg-zinc-800"></div>
                              <div className="h-3 w-3 rounded-sm bg-indigo-900/40"></div>
                              <div className="h-3 w-3 rounded-sm bg-indigo-700/60"></div>
                              <div className="h-3 w-3 rounded-sm bg-indigo-500"></div>
                           </div>
                           <span className="text-[10px] text-zinc-500">More</span>
                        </div>
                     </div>

                     <div className="flex flex-wrap gap-[4px] min-h-[50px]">
                        {heatmapData.length === 0 ? (
                           <div className="flex-1 text-center py-6 text-zinc-600 text-xs italic">No activity  recorded yet.</div>
                        ) : (
                           heatmapData.map((day, idx) => (
                              <div
                                 key={idx}
                                 title={`${day.date}: ${day.count} `}
                                 className={`h-3 w-3 sm:h-4 sm:w-4 rounded-sm transition-all ${day.count === 0 ? "bg-zinc-800/40" :
                                    day.count === 1 ? "bg-indigo-900/50" :
                                       day.count === 2 ? "bg-indigo-700/70" :
                                          "bg-indigo-500"
                                    }`}
                              ></div>
                           ))
                        )}
                     </div>

                     <div className="mt-6 flex justify-between text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-1">
                        <span>180 Day History</span>
                        <span>Today</span>
                     </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800 flex items-center justify-between">
                        <div>
                           <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">AI Interactions</p>
                           <p className="text-xl font-bold text-white">0 Queries</p>
                        </div>
                     </div>
                     <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800 flex items-center justify-between">
                        <div>
                           <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">Total Focus</p>
                           <p className="text-xl font-bold text-white">0.0h</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
}
