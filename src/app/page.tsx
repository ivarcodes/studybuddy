"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-950 p-6 text-zinc-100">
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

        {session ? (
          <div className="space-y-6">
            <p className="text-lg font-medium">
              Welcome back, <span className="text-indigo-400">{session.user?.name}</span>!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/dashboard"
                className="rounded-xl bg-indigo-600 px-10 py-4 text-white font-bold hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded-xl border border-zinc-700 bg-zinc-800/50 px-10 py-4 text-zinc-300 font-semibold hover:bg-zinc-800 hover:text-white transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
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
      
      <div className="mt-12 text-zinc-600 text-sm">
        Built with Next.js 15 & MongoDB
      </div>
    </div>
  );
}
