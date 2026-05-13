"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface Subtask {
  title: string;
  completed: boolean;
}

interface Resource {
  label: string;
  url: string;
}

interface Task {
  _id?: string;
  title: string;
  completed: boolean;
  estimatedHours?: number;
  subtasks: Subtask[];
  resources: Resource[];
  summary?: string;
  notes?: string;
}

interface StudyPlan {
  _id: string;
  title: string;
  description: string;
  tasks: Task[];
}

const StudyBuddyLogo = () => (
  <div className="flex items-center gap-2">
    <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center">
      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    </div>
    <span className="text-sm font-black text-white tracking-tighter uppercase font-sans">StudyBuddy<span className="text-indigo-500">.</span></span>
  </div>
);

export default function PlanDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTaskIdx, setActiveTaskIdx] = useState(0);
  const [showTutor, setShowTutor] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [query, setQuery] = useState("");
  const [chatLog, setChatLog] = useState<{ role: string, content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Zen Mode (Timer) State
  const [showZen, setShowZen] = useState(false);
  const [zenTime, setZenTime] = useState(25 * 60);
  const [zenActive, setZenActive] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [editingTaskIdx, setEditingTaskIdx] = useState<number | null>(null);
  const [tempTaskTitle, setTempTaskTitle] = useState("");

  // Task management
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchPlan();
    }
  }, [status, id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (zenActive && zenTime > 0) {
      interval = setInterval(() => setZenTime(t => t - 1), 1000);
    } else if (zenTime === 0 && zenActive) {
      setZenActive(false);
      toast.success("Session Completed!", {
        description: "Great work! Time for a short break."
      });
    }
    return () => clearInterval(interval);
  }, [zenActive, zenTime]);

  const sanitizePlan = (data: any) => {
    return {
      ...data,
      tasks: (data.tasks || []).map((task: any) => ({
        ...task,
        subtasks: task.subtasks || [],
        resources: task.resources || [],
        notes: task.notes || '',
      })),
    };
  };

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/study-plans/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPlan(sanitizePlan(data));
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Fetch Error", { description: "Could not retrieve your roadmap." });
    } finally {
      setLoading(false);
    }
  };

  const updatePlanOnServer = async (updatedTasks: Task[]) => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/study-plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: updatedTasks }),
      });

      if (!res.ok) throw new Error("Server rejected sync");

      const serverData = await res.json();
      const sanitized = sanitizePlan(serverData);
      setPlan(sanitized);

      const newlyCompleted = plan ? updatedTasks.some((t, idx) => t.completed && !(plan?.tasks?.[idx]?.completed)) : false;

      if (newlyCompleted) {
        fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "task_completion", planId: id })
        });
        toast.success("Progress Synced!", {
          description: "Your mastery heatmap has been updated."
        });
      }
    } catch (error) {
      toast.error("Sync Error", { description: "Changes were not saved to database." });
    } finally {
      setSyncing(false);
    }
  };

  const toggleTask = async (taskIndex: number) => {
    if (!plan || syncing) return;

    setPlan(prev => {
      if (!prev) return null;
      const updatedTasks = prev.tasks.map((task, idx) =>
        idx === taskIndex ? { ...task, completed: !task.completed } : task
      );
      updatePlanOnServer(updatedTasks);
      return { ...prev, tasks: updatedTasks };
    });
  };

  const handleTitleUpdate = async () => {
    if (!plan || !tempTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }

    const updatedPlan = { ...plan, title: tempTitle.trim().toUpperCase() };
    setPlan(updatedPlan);
    setIsEditingTitle(false);

    try {
      await fetch(`/api/study-plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: updatedPlan.title }),
      });
      toast.success("Path Name Updated");
    } catch (error) {
      toast.error("Update Failed");
    }
  };

  const handleTaskTitleUpdate = async (idx: number) => {
    if (!plan || !tempTaskTitle.trim()) {
      setEditingTaskIdx(null);
      return;
    }

    const updatedTasks = plan.tasks.map((t, i) =>
      i === idx ? { ...t, title: tempTaskTitle.trim().toUpperCase() } : t
    );

    setPlan({ ...plan, tasks: updatedTasks });
    setEditingTaskIdx(null);
    await updatePlanOnServer(updatedTasks);
    toast.success("Module Renamed");
  };



  const addTask = async () => {
    if (!plan || !newTaskTitle.trim()) return;
    const newTask: Task = { title: newTaskTitle.trim().toUpperCase(), completed: false, subtasks: [], resources: [] };
    const updatedTasks = [...plan.tasks, newTask];
    setPlan({ ...plan, tasks: updatedTasks });
    setNewTaskTitle("");
    setShowAddTask(false);
    await updatePlanOnServer(updatedTasks);
    toast.success("Module Added");
  };

  const deleteTask = async (taskIdx: number) => {
    if (!plan) return;
    const updatedTasks = plan.tasks.filter((_, i) => i !== taskIdx);
    if (activeTaskIdx >= updatedTasks.length) setActiveTaskIdx(Math.max(0, updatedTasks.length - 1));
    setPlan({ ...plan, tasks: updatedTasks });
    await updatePlanOnServer(updatedTasks);
    toast.success("Module Deleted");
  };

  const askTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !plan) return;

    const currentTask = plan.tasks[activeTaskIdx];
    const userMessage = { role: "user", content: query };
    setChatLog([...chatLog, userMessage]);
    setQuery("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: currentTask.title,
          context: plan.title,
          question: query,
          history: chatLog
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatLog(prev => [...prev, { role: "assistant", content: data.answer }]);
      } else {
        toast.error("Tutor Error", { description: "The StudyBuddy connection was interrupted." });
      }
    } catch (error) {
      toast.error("Network Error", { description: "Check your internet connection." });
    } finally {
      setChatLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#09090b] text-zinc-500 font-medium"><div className="flex items-center gap-3"><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Loading...</div></div>;
  if (!plan) return null;

  const activeTask = plan.tasks[activeTaskIdx];
  const progressPercent = Math.round((plan.tasks.filter(t => t.completed).length / plan.tasks.length) * 100);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#09090b] text-zinc-200 antialiased overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/[0.08] bg-[#09090b]/95 backdrop-blur-md transform transition-transform duration-300 md:relative md:translate-x-0 ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-white/[0.08] font-sans">
          <div className="flex items-center justify-between mb-6">
            <StudyBuddyLogo />
            <button onClick={() => setShowSidebar(false)} className="md:hidden text-zinc-500 hover:text-white transition-colors">&times;</button>
          </div>
          <div className="mt-4 flex items-center justify-between group/title">
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <input
                  autoFocus
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs font-black text-white outline-none focus:border-indigo-500 uppercase italic"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleTitleUpdate}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleUpdate()}
                />
              ) : (
                <h2 className="text-xs font-black text-zinc-300 uppercase tracking-widest truncate flex items-center gap-2">
                  <span className="truncate">{plan.title}</span>
                  <button
                    onClick={() => { setTempTitle(plan.title); setIsEditingTitle(true); }}
                    className="opacity-0 group-hover/title:opacity-100 transition-opacity text-zinc-600 hover:text-indigo-400"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                </h2>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <span className="text-[10px] font-semibold text-zinc-500 tracking-tighter uppercase">{progressPercent}%</span>
          </div>

          <div className="mt-8 relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="h-3 w-3 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Find a module..."
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-10 pr-4 py-2 text-xs font-medium text-white placeholder:text-zinc-600 focus:border-indigo-500/50 transition-all outline-none"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
          {(plan?.tasks || [])
            .map((t, i) => ({ ...t, originalIndex: i }))
            .filter(task => task.title.toLowerCase().includes(taskSearch.toLowerCase()))
            .map((task) => (
              <button
                key={task.originalIndex}
                onClick={() => { setActiveTaskIdx(task.originalIndex); setChatLog([]); setShowSidebar(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex gap-3 items-center group ${activeTaskIdx === task.originalIndex ? "bg-white/[0.06] text-white border border-white/[0.1]" : "text-zinc-500 hover:text-zinc-300 border border-transparent"}`}
              >
                <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${task.completed ? "bg-indigo-600 border-indigo-600 text-white" : "border-white/[0.2] bg-white/[0.02]"}`}>
                  {task.completed && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  {editingTaskIdx === task.originalIndex ? (
                    <input
                      autoFocus
                      className="w-full bg-white/[0.03] border border-white/[0.1] rounded-md px-2 py-1 text-xs font-medium text-white outline-none focus:border-indigo-500"
                      value={tempTaskTitle}
                      onChange={(e) => setTempTaskTitle(e.target.value)}
                      onBlur={() => handleTaskTitleUpdate(task.originalIndex)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTaskTitleUpdate(task.originalIndex)}
                    />
                  ) : (
                    <div className="flex items-center justify-between group/taskname">
                      <p className={`text-xs font-medium truncate tracking-tight ${activeTaskIdx === task.originalIndex ? 'text-white' : 'text-zinc-500'}`}>{task.title}</p>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                        <div
                          role="button" tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); setTempTaskTitle(task.title); setEditingTaskIdx(task.originalIndex); }}
                          onKeyDown={(e) => e.key === 'Enter' && (e.stopPropagation(), setTempTaskTitle(task.title), setEditingTaskIdx(task.originalIndex))}
                          className="p-1 text-zinc-600 hover:text-indigo-400 transition-all cursor-pointer"
                        >
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </div>
                        <div
                          role="button" tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); deleteTask(task.originalIndex); }}
                          onKeyDown={(e) => e.key === 'Enter' && (e.stopPropagation(), deleteTask(task.originalIndex))}
                          className="p-1 text-zinc-600 hover:text-red-400 transition-all cursor-pointer"
                        >
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          {(plan?.tasks || []).filter(task => task.title.toLowerCase().includes(taskSearch.toLowerCase())).length === 0 && (
            <div className="p-10 text-center">
              <p className="text-xs font-medium text-zinc-600">No modules found</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-white/[0.08] space-y-2">
          {showAddTask ? (
            <div className="flex gap-2">
              <input
                autoFocus
                className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-medium text-white outline-none focus:border-indigo-500 placeholder:text-zinc-600"
                placeholder="Module title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setShowAddTask(false); }}
              />
              <button onClick={addTask} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 transition">Add</button>
              <button onClick={() => setShowAddTask(false)} className="px-2 py-2 text-zinc-500 hover:text-white transition text-lg leading-none">&times;</button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddTask(true)}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-indigo-400 transition"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg>
              Add Module
            </button>
          )}
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-zinc-500 hover:text-white transition">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeWidth={2.5} /></svg>
            Home
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col relative bg-[#09090b] overflow-hidden transition-all duration-500 ${showZen ? "filter blur-lg brightness-50 pointer-events-none" : ""}`}>
        <header className="h-16 border-b border-white/[0.08] flex items-center justify-between px-6 md:px-8 shrink-0 bg-[#09090b]/50">
          <div className="flex items-center gap-3 text-xs">
            <button onClick={() => setShowSidebar(true)} className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="hidden sm:inline font-medium text-zinc-500 uppercase tracking-tighter text-[10px]">Study Module /</span>
            <span className="font-bold text-white truncate max-w-[150px] sm:max-w-none text-[10px] uppercase tracking-widest">{activeTask.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] animate-pulse">StudyBuddy Active</span>
          </div>

        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto py-8 md:py-12 px-6 md:px-8">
            <div className="mb-10 relative">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-[0.3em] block mb-4">Module {activeTaskIdx + 1}</span>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-8 uppercase italic">{activeTask.title}</h1>
              <div className="prose prose-zinc prose-invert max-w-none font-sans markdown-content text-zinc-400 leading-relaxed text-sm md:text-lg">
                <ReactMarkdown>
                  {activeTask.summary || "Deep dive into " + activeTask.title + ". Activate Zen Focus to concentrate entirely on the topic."}
                </ReactMarkdown>
              </div>

              <div className="mt-12 flex flex-col sm:flex-row flex-wrap gap-4">
                <button
                  onClick={() => {
                    setShowTutor(!showTutor);
                    if (!showTutor) toast.info("AI Mastery Activated", { description: "Deep context tutor is now online." });
                  }}
                  className={`px-8 py-5 rounded-2xl text-sm font-semibold transition-all border group relative overflow-hidden flex-1 sm:flex-none justify-center flex items-center gap-3 ${showTutor ? "bg-white/[0.03] text-zinc-500 border-white/[0.08]" : "bg-white text-black border-white hover:bg-zinc-200 shadow-2xl shadow-indigo-500/10"}`}
                >
                  <div className={`h-2 w-2 rounded-full ${showTutor ? "bg-zinc-700" : "bg-indigo-500 animate-pulse"}`}></div>
                  {showTutor ? "Exit Master Mode" : "✨ Master with AI"}
                </button>

                <button
                  onClick={() => {
                    setShowZen(true);
                    toast.info("Entering Zen Focus", { description: "Interface muted. Deep work mode engaged." });
                  }}
                  className="px-8 py-5 rounded-2xl text-sm font-semibold transition-all border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white hover:border-white/[0.15] flex-1 sm:flex-none justify-center flex items-center gap-3 group"
                >
                  <svg className="h-4 w-4 text-zinc-700 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Focus Mode
                </button>

                <button
                  disabled={syncing}
                  onClick={() => toggleTask(activeTaskIdx)}
                  className={`px-8 py-5 rounded-2xl text-sm font-semibold transition-all border flex-1 sm:flex-none justify-center flex items-center gap-3 ${syncing ? 'opacity-50 cursor-wait' : ''} ${activeTask.completed ? "bg-indigo-600/10 text-indigo-400 border-indigo-500/20" : "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"}`}
                >
                  {syncing ? (
                    <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <svg className={`h-4 w-4 ${activeTask.completed ? 'text-indigo-400' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {syncing ? "Syncing..." : (activeTask.completed ? "Completed" : "Mark Complete")}
                </button>
              </div>

              {/* Subtasks Section */}
              <div className="mt-16">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Subtasks</h3>
                  <span className="text-xs text-zinc-500">{activeTask.subtasks?.filter((s: Subtask) => s.completed).length}/{activeTask.subtasks?.length || 0} completed</span>
                </div>

                {activeTask.subtasks && activeTask.subtasks.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {activeTask.subtasks.map((subtask: Subtask, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all group">
                        <button
                          onClick={() => {
                            if (!plan || syncing) return;
                            const updatedSubtasks = [...activeTask.subtasks];
                            updatedSubtasks[idx] = { ...subtask, completed: !subtask.completed };
                            const updatedTasks = plan.tasks.map((t, i) => i === activeTaskIdx ? { ...t, subtasks: updatedSubtasks } : t);
                            setPlan({ ...plan, tasks: updatedTasks });
                            updatePlanOnServer(updatedTasks);
                          }}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${subtask.completed ? "bg-indigo-600 border-indigo-600" : "border-white/[0.2] hover:border-indigo-500"}`}
                        >
                          {subtask.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <span className={`flex-1 text-sm ${subtask.completed ? "text-zinc-500 line-through" : "text-zinc-300"}`}>{subtask.title}</span>
                        <button
                          onClick={() => {
                            if (!plan || syncing) return;
                            const updatedSubtasks = activeTask.subtasks.filter((_: any, i: number) => i !== idx);
                            const updatedTasks = plan.tasks.map((t, i) => i === activeTaskIdx ? { ...t, subtasks: updatedSubtasks } : t);
                            setPlan({ ...plan, tasks: updatedTasks });
                            updatePlanOnServer(updatedTasks);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600 mb-4">No subtasks added yet</p>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const input = form.elements.namedItem('newSubtask') as HTMLInputElement;
                    if (!input.value.trim() || !plan) return;
                    const newSubtasks = [...(activeTask.subtasks || []), { title: input.value.trim(), completed: false }];
                    const updatedTasks = plan.tasks.map((t, i) => i === activeTaskIdx ? { ...t, subtasks: newSubtasks } : t);
                    setPlan({ ...plan, tasks: updatedTasks });
                    updatePlanOnServer(updatedTasks);
                    input.value = '';
                  }}
                  className="flex gap-2"
                >
                  <input
                    name="newSubtask"
                    type="text"
                    placeholder="Add a subtask..."
                    className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 outline-none transition-all"
                  />
                  <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500 transition-all">
                    Add
                  </button>
                </form>
              </div>

              {/* Notes Section */}
              <div className="mt-12 pt-8 border-t border-white/[0.06]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">My Notes</h3>
                  <span className="text-xs text-zinc-600">Personal notes for this module</span>
                </div>
                <textarea
                  value={activeTask.notes || ''}
                  onChange={(e) => {
                    if (!plan) return;
                    const updatedTasks = plan.tasks.map((t, i) => i === activeTaskIdx ? { ...t, notes: e.target.value } : t);
                    setPlan({ ...plan, tasks: updatedTasks });
                  }}
                  onBlur={() => {
                    if (plan) updatePlanOnServer(plan.tasks);
                  }}
                  placeholder="Write your notes here... (saved automatically)"
                  className="w-full h-40 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-indigo-500/50 outline-none transition-all resize-none"
                />
              </div>

              <div className="mt-20 border-t border-white/[0.06] pt-16 pb-24 font-sans">
                <div className="flex items-center gap-3 mb-10">
                  <h4 className="text-sm font-bold text-white uppercase tracking-[0.4em]">Resource Hub</h4>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent"></div>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeTask.title + ' ' + plan.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 hover:border-red-500/40 transition-all p-5"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">YouTube Videos</p>
                        <p className="text-xs text-zinc-500">Find tutorials for this module</p>
                      </div>
                      <svg className="w-5 h-5 text-zinc-600 ml-auto group-hover:text-red-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </a>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(activeTask.title + ' documentation guide')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/20 hover:border-indigo-500/40 transition-all p-5"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Documentation</p>
                        <p className="text-xs text-zinc-500">Official docs & guides</p>
                      </div>
                      <svg className="w-5 h-5 text-zinc-600 ml-auto group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </a>
                </div>

                {(activeTask.resources || []).length === 0 ? (
                  <div className="col-span-full py-12 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium mb-1">No resources added yet</p>
                    <p className="text-zinc-600 text-xs">AI-generated plans include curated learning resources</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(activeTask.resources || []).map((res, ridx) => {
                      const getYoutubeId = (url: string) => {
                        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                        const match = url.match(regExp);
                        return (match && match[2].length === 11) ? match[2] : null;
                      };
                      const ytId = getYoutubeId(res.url);

                      const getResourceIcon = (url: string) => {
                        const urlLower = url.toLowerCase();
                        if (urlLower.includes('github') || urlLower.includes('gitlab')) {
                          return { icon: 'github', color: 'white', bg: 'bg-zinc-800' };
                        } else if (urlLower.includes('medium') || urlLower.includes('blog')) {
                          return { icon: 'article', color: 'text-green-400', bg: 'bg-green-500/10' };
                        } else if (urlLower.includes('stackoverflow')) {
                          return { icon: 'stack', color: 'text-orange-400', bg: 'bg-orange-500/10' };
                        } else if (urlLower.includes('docs') || urlLower.includes('documentation')) {
                          return { icon: 'docs', color: 'text-blue-400', bg: 'bg-blue-500/10' };
                        }
                        return { icon: 'link', color: 'text-purple-400', bg: 'bg-purple-500/10' };
                      };

                      const resourceInfo = getResourceIcon(res.url);

                      return (
                        <div key={ridx} className="group relative flex flex-col rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] overflow-hidden transition-all hover:shadow-xl hover:shadow-indigo-500/5">
                          <div className="aspect-[16/9] w-full bg-zinc-900/50 flex items-center justify-center overflow-hidden relative">
                            {ytId ? (
                              <>
                                <img
                                  src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                                  alt="Thumbnail"
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <div className="w-14 h-14 rounded-full bg-red-500/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className={`flex flex-col items-center gap-2 ${resourceInfo.color} transition-colors`}>
                                {resourceInfo.icon === 'github' && (
                                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                )}
                                {resourceInfo.icon === 'article' && (
                                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                                )}
                                {resourceInfo.icon === 'stack' && (
                                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M15 21h-10v-2h10v2zm6-11.665l-1.621-9.335-1.344.346 1.957 4.667h-6.928l1.957-4.667-1.344-.346-1.621 9.335 1.792-.486 1.801 4.694 1.782-.486 1.957-4.694-1.782.486-1.801-4.694zm-6.082 3.105l-1.623-4.654-1.305.336 1.926 4.653 1.002-.335zm6.997-1.891l1.305-.336-1.926-4.653-1.002.335 1.623 4.654zm-5.561 1.504l-1.801-4.694-1.782.486 1.801 4.694 1.782-.486z"/></svg>
                                )}
                                {resourceInfo.icon === 'docs' && (
                                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                                )}
                                {resourceInfo.icon === 'link' && (
                                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                )}
                                <span className="text-[7px] font-bold uppercase tracking-widest">External Resource</span>
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                            <div>
                              <h5 className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors mb-1 line-clamp-1">{res.label}</h5>
                              <p className="text-xs text-zinc-600 truncate">{new URL(res.url).hostname}</p>
                            </div>
                            <button
                              onClick={() => window.open(res.url, '_blank')}
                              className="w-full py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-semibold text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Open Resource
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showTutor && (
          <div className="fixed md:absolute inset-y-0 right-0 w-full md:w-[450px] bg-zinc-900 border-l border-zinc-800 shadow-2xl z-[60] flex flex-col font-sans overflow-hidden">
            <header className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40 backdrop-blur-3xl">
              <div>
                <h5 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">StudyBuddy Tutor</h5>
                <p className="text-[10px] text-zinc-600 uppercase font-bold truncate w-48">{activeTask.title}</p>
              </div>
              <button onClick={() => setShowTutor(false)} className="h-10 w-10 rounded-full hover:bg-zinc-800 flex items-center justify-center transition-all text-zinc-500 hover:text-white text-2xl">&times;</button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-950/30">
              {chatLog.length === 0 && (
                <div className="text-center py-20 px-10">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                    <span className="text-xl">✨</span>
                  </div>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Ready to Help</p>
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest leading-loose">I have context of your curriculum. Ask for help with this module.</p>
                </div>
              )}
              {chatLog.map((msg, i) => (
                <div key={`${msg.role}-${i}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] prose prose-invert prose-sm ${msg.role === 'user' ? 'bg-indigo-600 shadow-[0_0_30px_rgba(79,70,229,0.2)] text-white p-5 rounded-2xl rounded-tr-none' : 'bg-zinc-800/80 text-zinc-300 p-6 rounded-2xl rounded-tl-none border border-zinc-700/50 shadow-xl'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="markdown-content">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="text-xs font-bold tracking-tight uppercase">{msg.content}</span>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && <div className="text-[10px] font-black text-indigo-500 animate-pulse pl-4 tracking-[0.6em] uppercase">Thinking...</div>}
            </div>
            <form onSubmit={askTutor} className="p-6 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-3xl">
              <div className="relative group">
                <input
                  autoFocus
                  type="text"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-5 text-[10px] font-black uppercase tracking-widest focus:border-indigo-500 outline-none text-white placeholder:text-zinc-700 transition-all group-hover:border-zinc-700"
                  placeholder="Ask your doubts to studyBuddy"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" className="absolute right-3 top-3 h-9 px-5 bg-indigo-600 text-white rounded-lg text-[10px] font-black hover:bg-indigo-500 transition-all shadow-lg active:scale-95">Ask</button>
              </div>
            </form>
          </div>
        )}
      </main>


      {/* Zen Mode Overlay */}
      {showZen && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-950/98 backdrop-blur-3xl p-10 font-sans">
          <div className="mb-12 text-center">
            <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.6em] mb-6">Deep Study Session</h3>
            <p className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 uppercase italic">{activeTask.title}</p>
            <p className="text-zinc-600 text-xs font-black uppercase tracking-[0.2em]">Distractions muted. Focus on learning.</p>
          </div>

          <div className="text-[180px] md:text-[280px] font-black text-white leading-none tracking-tighter tabular-nums mb-16 drop-shadow-[0_0_80px_rgba(99,102,241,0.15)]">
            {formatTime(zenTime)}
          </div>

          <div className="flex items-center gap-8">
            <button
              onClick={() => {
                setZenActive(!zenActive);
                toast(zenActive ? "Session Paused" : "Session Started", { description: zenActive ? "Study timer paused." : "Immersion resumed." });
              }}
              className={`px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all ${zenActive ? "bg-zinc-900 text-zinc-600 hover:text-white border border-zinc-800 shadow-none" : "bg-white text-black hover:bg-zinc-200 shadow-[0_0_50px_rgba(255,255,255,0.1)] scale-110 active:scale-100"}`}
            >
              {zenActive ? "PAUSE STUDY" : "START STUDY"}
            </button>
            <button
              onClick={() => { setShowZen(false); setZenActive(false); toast.info("Exiting Deep Focus"); }}
              className="px-10 py-5 rounded-2xl bg-zinc-950 border border-zinc-900 text-zinc-700 hover:text-white text-[11px] font-black uppercase tracking-[0.3em] transition-all"
            >
              TERMINATE
            </button>
          </div>

          <div className="mt-24 flex items-center gap-10">
            <button onClick={() => { setZenTime(25 * 60); toast.info("Set 25 min Study"); }} className="text-[10px] font-black text-zinc-600 hover:text-indigo-400 transition tracking-[0.3em] uppercase">25 MIN</button>
            <button onClick={() => { setZenTime(45 * 60); toast.info("Set 45 min Study"); }} className="text-[10px] font-black text-zinc-600 hover:text-indigo-400 transition tracking-[0.3em] uppercase">45 MIN</button>
            <button onClick={() => { setZenTime(60 * 60); toast.info("Set 60 min Study"); }} className="text-[10px] font-black text-zinc-600 hover:text-indigo-400 transition tracking-[0.3em] uppercase">60 MIN</button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .markdown-content h1 { font-size: 1.5rem; font-weight: 900; margin-bottom: 2rem; color: white; border-bottom: 1px solid #18181b; padding-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.15em; font-style: italic; }
        .markdown-content h2 { font-size: 1.25rem; font-weight: 800; margin-bottom: 1rem; color: #f4f4f5; text-transform: uppercase; }
        .markdown-content p { margin-bottom: 1.5rem; font-size: 1rem; font-weight: 500; }
        .markdown-content code { background: #111111; padding: 0.25rem 0.5rem; border-radius: 0.5rem; font-size: 0.85rem; color: #818cf8; font-family: ui-monospace, monospace; border: 1px solid #18181b; }
        .markdown-content pre { background: #000000; padding: 2rem; border-radius: 2rem; overflow-x: auto; margin-bottom: 2rem; border: 1px solid #18181b; box-shadow: inset 0 0 40px rgba(0,0,0,1); }
        .markdown-content pre code { background: transparent; padding: 0; color: #e4e4e7; font-size: 0.85rem; border: none; }
        .markdown-content ul { list-style-type: none; padding-left: 0; margin-bottom: 1.5rem; }
        .markdown-content li { margin-bottom: 0.75rem; padding-left: 1.5rem; position: relative; }
        .markdown-content li::before { content: '•'; position: absolute; left: 0; color: #6366f1; font-weight: 900; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
