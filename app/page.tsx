'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '@/lib/types/chat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Network, ArrowUpIcon, Search, TrendingUp, Clock, Wallet } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { replaceENSNamesInText } from '@/lib/ens-resolver';

interface AutoResizeProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function QuickAction({ icon, label, onClick }: QuickActionProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full border-slate-600 bg-black/50 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!message.trim() || isLoading) return;
    handleSendMessage(message);
    setMessage('');
    adjustHeight(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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

  if (messages.length > 0) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-5xl mx-auto h-screen flex flex-col">
          <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                <Network className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  ChainLens AI
                </h1>
                <p className="text-xs text-slate-400">
                  Conversational Blockchain Explorer
                </p>
              </div>
            </div>
          </header>

          <ScrollArea className="flex-1 px-6 py-6" ref={scrollAreaRef}>
            <div className="max-w-4xl mx-auto">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
            </div>
          </ScrollArea>

          <div className="px-6 py-4 bg-slate-900/80 backdrop-blur-sm border-t border-slate-800">
            <div className="max-w-4xl mx-auto">
              <div className="relative bg-black/60 backdrop-blur-md rounded-xl border border-slate-700">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    adjustHeight();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about addresses, transactions, tokens..."
                  disabled={isLoading}
                  className={cn(
                    "w-full px-4 py-3 resize-none border-none",
                    "bg-transparent text-white text-sm",
                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                    "placeholder:text-slate-400 min-h-[48px]"
                  )}
                  style={{ overflow: 'hidden' }}
                />

                <div className="flex items-center justify-end p-3">
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || !message.trim()}
                    className={cn(
                      "flex items-center gap-1 px-4 py-2 rounded-lg transition-colors",
                      message.trim() && !isLoading
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-slate-700 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    <ArrowUpIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-screen bg-cover bg-center flex flex-col items-center"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.4)), radial-gradient(ellipse at center bottom, rgba(96, 165, 250, 0.4) 0%, rgba(30, 58, 138, 0.3) 40%, rgba(0,0,0,0.9) 80%)",
        backgroundColor: "#000000",
      }}
    >
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        <div className="text-center mb-32">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mx-auto mb-6">
            <Network className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-semibold text-white drop-shadow-lg mb-3">
            ChainLens AI
          </h1>
          <p className="mt-2 text-slate-200 text-lg">
            Explore blockchain data through natural conversation
          </p>
        </div>
      </div>

      <div className="w-full max-w-3xl mb-[15vh] px-4">
        <div className="relative bg-black/60 backdrop-blur-md rounded-xl border border-slate-700 shadow-2xl">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about addresses, transactions, tokens, or smart contracts..."
            disabled={isLoading}
            className={cn(
              "w-full px-4 py-3 resize-none border-none",
              "bg-transparent text-white text-sm",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-slate-400 min-h-[48px]"
            )}
            style={{ overflow: 'hidden' }}
          />

          <div className="flex items-center justify-end p-3">
            <Button
              onClick={handleSend}
              disabled={isLoading || !message.trim()}
              className={cn(
                "flex items-center gap-1 px-4 py-2 rounded-lg transition-colors",
                message.trim() && !isLoading
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              )}
            >
              <ArrowUpIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center flex-wrap gap-3 mt-6">
          <QuickAction
            icon={<Wallet className="w-4 h-4" />}
            label="What tokens does vitalik.eth hold?"
            onClick={() => handleSendMessage("What tokens does vitalik.eth hold?")}
          />
          <QuickAction
            icon={<Clock className="w-4 h-4" />}
            label="Show latest transactions for vitalik.eth"
            onClick={() => handleSendMessage("Show latest transactions for vitalik.eth")}
          />
          <QuickAction
            icon={<TrendingUp className="w-4 h-4" />}
            label="Token portfolio on Base"
            onClick={() => handleSendMessage("What is chrismg.eth's token portfolio on Base?")}
          />
          <QuickAction
            icon={<Search className="w-4 h-4" />}
            label="Explain transaction"
            onClick={() => handleSendMessage("Explain transaction 0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060")}
          />
        </div>
      </div>

      <div className="absolute bottom-6 text-center text-slate-400 text-sm">
        Powered by Blockscout MCP
      </div>
    </div>
  );
}
