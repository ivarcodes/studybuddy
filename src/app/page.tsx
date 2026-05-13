"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoadingGuest, setIsLoadingGuest] = useState(false);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleGuestLogin = async () => {
    setIsLoadingGuest(true);
    try {
      const res = await fetch("/api/guest", { method: "POST" });
      const data = await res.json();

      if (data.error) {
        console.error("Guest login error:", data.error);
        setIsLoadingGuest(false);
        return;
      }

      await signIn("credentials", {
        email: data.user.email,
        password: data.password,
        redirect: false,
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Guest login error:", error);
      setIsLoadingGuest(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background Gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-200 bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-150 h-150 bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Main Content - Centered */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Logo / Brand */}
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
        </div>

        {/* Bold Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Your personal AI
          <br />
          <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            study assistant
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-gray-400 max-w-md mx-auto mb-12 leading-relaxed">
          Generate personalized study plans, track your progress, and achieve
          your learning goals with AI.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="px-8 py-3.5 text-base font-semibold bg-white text-black rounded-xl hover:bg-gray-200 transition-all hover:scale-105 hover:shadow-lg hover:shadow-white/20">
            Sign In
          </Link>
          <button
            onClick={handleGuestLogin}
            disabled={isLoadingGuest}
            className="px-8 py-3.5 text-base font-medium text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-all disabled:opacity-50">
            {isLoadingGuest ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Setting up...
              </span>
            ) : (
              "Try as Guest"
            )}
          </button>
        </div>

        {/* Optional small note */}
        <p className="text-xs text-gray-600 mt-8">
          No credit card required • Free forever
        </p>
      </div>
    </div>
  );
}
