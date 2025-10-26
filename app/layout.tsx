'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { NotificationProvider, TransactionPopupProvider } from '@blockscout/app-sdk';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>ChainLens AI - Conversational Blockchain Explorer</title>
        <meta name="description" content="Explore blockchain data through natural language using Blockscout MCP. Ask questions about addresses, transactions, tokens, and more across multiple chains." />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <NotificationProvider>
            <TransactionPopupProvider>
              {children}
              <Toaster />
            </TransactionPopupProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
