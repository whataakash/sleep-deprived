import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Parishram — Autonomous AI Coding Harness | Understand. Execute. Verify. Prove.',
  description:
    'Parishram turns foundation models into verified software engineers through context retrieval, tool orchestration, failure recovery, and evidence-backed verification.',
  keywords: [
    'Parishram',
    'AI coding harness',
    'autonomous coding agent',
    'software engineering agent',
    'verified code repair',
    'evidence-based coding',
    'agentic workflow',
  ],
  authors: [{ name: 'Parishram Systems' }],
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
