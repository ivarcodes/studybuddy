import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="w-full py-8 border-t border-zinc-900 bg-zinc-950 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-zinc-500 text-sm">
          © {new Date().getFullYear()} StudyBuddy. The smartest way to organize your learning.
        </div>
        
        <div className="flex items-center gap-6">
          <Link 
            href="https://github.com/ivarcodes" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
          >
            <span className="text-sm font-medium">GitHub</span>
            <svg className="h-4 w-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
          </Link>

          <Link 
            href="https://www.linkedin.com/in/ravibhushanv/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
          >
            <span className="text-sm font-medium">LinkedIn</span>
            <svg className="h-4 w-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-1.337-.025-3.062-1.865-3.062-1.867 0-2.153 1.459-2.153 2.964v5.702h-3v-11h2.88v1.503h.04c.401-.758 1.379-1.558 2.839-1.558 3.033 0 3.596 1.996 3.596 4.591v6.464z"/>
            </svg>
          </Link>

          <div className="h-4 w-[1px] bg-zinc-800 hidden md:block"></div>

          <span className="text-sm font-semibold text-white tracking-tight">
            Ravi Bhushan
          </span>
        </div>
      </div>
    </footer>
  );
};
