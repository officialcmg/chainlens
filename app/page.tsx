'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/types/chat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { ExampleQueries } from '@/components/chat/ExampleQueries';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Network, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { replaceENSNamesInText } from '@/lib/ens-resolver';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let processedContent = content;
      const ensResult = await replaceENSNamesInText(content);

      if (ensResult.replacements.length > 0) {
        processedContent = ensResult.text;
        console.log('ENS Resolved:', ensResult.replacements);

        const resolutionInfo = ensResult.replacements
          .map(r => `${r.ens} → ${r.address}`)
          .join(', ');

        const infoMessage: ChatMessage = {
          id: `${Date.now()}-info`,
          role: 'assistant',
          content: `Resolved: ${resolutionInfo}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, infoMessage]);
      }

      if (ensResult.errors.length > 0) {
        console.warn('ENS Resolution Errors:', ensResult.errors);
      }

      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: processedContent,
          history: conversationHistory,
        }),
      });

      const data = await response.json();

      if (data.error) {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${data.error}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          data: data.data,
          type: data.type,
          tool: data.tool,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Failed to send message: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-5xl mx-auto h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
              <Network className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                ChainLens AI
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Conversational Blockchain Explorer
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="text-center max-w-2xl">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mx-auto mb-6">
                  <Network className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                  Welcome to ChainLens AI
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-8">
                  Explore blockchain data through natural language. Ask questions about addresses,
                  transactions, tokens, smart contracts, and more across multiple blockchains.
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 px-6 py-6" ref={scrollAreaRef}>
              <div className="max-w-4xl mx-auto">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {isLoading && <TypingIndicator />}
              </div>
            </ScrollArea>
          )}

          <div className="px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-4xl mx-auto">
              {messages.length === 0 && (
                <ExampleQueries
                  onSelectQuery={handleSendMessage}
                  disabled={isLoading}
                />
              )}
              <ChatInput onSend={handleSendMessage} disabled={isLoading} />
            </div>
          </div>
        </div>

        <footer className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>Powered by</span>
            <a
              href="https://docs.blockscout.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Blockscout MCP
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
