'use client';

import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start mb-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
        <Bot className="w-5 h-5 text-white" />
      </div>

      <div className="flex flex-col max-w-[80%] items-start">
        <div className="rounded-2xl px-4 py-3 bg-slate-100 dark:bg-slate-800">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
