"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-950 p-6 text-zinc-100 min-h-screen">
      <div className="w-full max-w-4xl rounded-3xl bg-zinc-900 p-12 shadow-2xl border border-zinc-800 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 text-sm font-medium tracking-wider uppercase bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
          AI Powered Learning
        </div>
        <h1 className="text-6xl font-black tracking-tighter text-white mb-6">
          AI Study <span className="text-indigo-500">Planner</span>
        </h1>
        <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          The smartest way to organize your learning. Generate personalized study plans using AI and track your progress in real-time.
        </p>

        {!session && (
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/login"
              className="rounded-xl bg-indigo-600 px-10 py-4 text-white font-bold hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-xl border border-zinc-700 bg-zinc-800/50 px-10 py-4 text-zinc-300 font-semibold hover:bg-zinc-800 hover:text-white transition-all"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
