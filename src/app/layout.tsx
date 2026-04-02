// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Feeling Studio | 專業藝術與視覺創作',
  description: '由擁有35年經驗的專業藝術創作者 Mak 帶領，專精藝術品拍賣、專業人像、風景創作與 AI 視覺藝術。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-HK" className="scroll-smooth">
      <body className="bg-neutral-900 text-neutral-100 font-sans selection:bg-neutral-600">
        {children}
      </body>
    </html>
  );
}