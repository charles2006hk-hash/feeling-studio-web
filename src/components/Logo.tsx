// src/components/Logo.tsx
import Link from 'next/link';
import React from 'react';

// 定義 Logo 的屬性，例如大小，方便未來在不同地方使用
interface LogoProps {
  className?: string; // 允許外部傳入 Tailwind Class 來控制樣式
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    // 使用 Next.js 的 Link 連接回首頁
    <Link href="/" className={`group flex items-center gap-2.5 ${className}`}>
      {/* 視覺符號 (Icon)：一個極簡的方框，象徵鏡頭畫面或畫框 */}
      <div className="w-5 h-5 border border-white opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* 文字主體 */}
      <div className="flex flex-col md:flex-row md:items-baseline md:gap-1.5 leading-none">
        {/* 'Feeling' - 使用稍厚實的字重 */}
        <span className="text-xl font-medium tracking-[0.15em] text-white uppercase">
          Feeling
        </span>
        
        {/* 'Studio' - 使用纖細的字重，顏色稍微淡化增加層次 */}
        <span className="text-xl font-light tracking-[0.2em] text-neutral-400 uppercase">
          Studio
        </span>
      </div>
    </Link>
  );
}