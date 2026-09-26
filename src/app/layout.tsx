import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'परिश्रम — Autonomous AI Coding-Agent Harness | Build it. Test it. Prove it.',
  description:
    'परिश्रम turns foundation models into verified software engineers through context retrieval, tool orchestration, failure recovery, and evidence-backed verification.',
  keywords: [
    'परिश्रम',
    'AI coding harness',
    'autonomous coding agent',
    'software engineering agent',
    'verified code repair',
    'evidence-based coding',
    'agentic workflow',
  ],
  authors: [{ name: 'परिश्रम Systems' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
