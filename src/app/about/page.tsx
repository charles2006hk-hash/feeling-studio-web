// src/app/about/page.tsx
import React from 'react';
import Image from 'next/image';
import Logo from '@/components/Logo';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 font-sans">
      {/* 導覽列 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/50 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Logo />
          <div className="space-x-8 text-sm tracking-widest text-neutral-300 font-light uppercase hidden md:flex">
            <Link href="/#expertise" className="hover:text-white transition-colors">Expertise</Link>
            <Link href="/#works" className="hover:text-white transition-colors">Works</Link>
            <Link href="/#inquiry" className="hover:text-white transition-colors">Inquiry</Link>
          </div>
        </div>
      </nav>

      {/* 頂部 Header */}
      <section className="pt-40 pb-20 px-6 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-light tracking-[0.2em] uppercase mb-6 text-white">Behind the Lens</h1>
        <div className="w-16 h-px bg-neutral-600 mx-auto mb-8"></div>
        <p className="text-lg md:text-xl font-light tracking-widest text-neutral-400 uppercase">
          The Journey of Mak
        </p>
      </section>

      {/* 內容區塊 */}
      <section className="max-w-5xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-12 gap-16 items-start">
          
          {/* 左側照片 */}
          <div className="md:col-span-5 sticky top-32">
            <div className="relative h-[600px] w-full bg-neutral-900 overflow-hidden rounded-sm border border-neutral-800 shadow-2xl">
              <Image 
                src="/images/mak.jpg" 
                alt="Mak" 
                fill
                className="object-cover object-center grayscale hover:grayscale-0 transition-all duration-1000"
                priority
              />
            </div>
          </div>

          {/* 右側故事文章 */}
          <div className="md:col-span-7 space-y-12 font-light leading-loose text-neutral-300 text-justify text-base md:text-lg">
            <div>
              <h2 className="text-2xl font-medium tracking-widest text-white mb-6 uppercase border-l-2 border-neutral-600 pl-4">
                跨界淬鍊的藝術視角
              </h2>
              <p className="mb-6">
                身為香港土生土長的攝影藝術家，Mak 老師的職業生涯充滿了跨界的傳奇色彩。從嚴謹的英文導師，到講究極致聽覺美學的音響雜誌主編，這些經歷不僅豐富了他的生命厚度，更為他的攝影作品注入了無可取代的節奏感與人文底蘊。
              </p>
              <p>
                「每一次按下快門，都像是在指揮一場視覺的交響樂。」跨界的背景讓他對光影的捕捉超越了純粹的技術層面，昇華為對靈魂與歷史的深刻洞察。
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-medium tracking-widest text-white mb-6 uppercase border-l-2 border-neutral-600 pl-4">
                凝結時光的工匠精神
              </h2>
              <p className="mb-6">
                35 年來，Mak 老師專精於頂級拍賣行的中大型藝術品攝影。無論是歷經滄桑的青銅器、溫潤的陶瓷，還是氣韻生動的畫作墨寶，他總能透過精準的燈光與獨到的視角，完美還原文物獨有的材質紋理與歷史厚度。
              </p>
              <p>
                除了商業與藝術品攝影，他同樣傾心於大自然的壯闊與人物的情感流露。近年更將觸角延伸至 AI 視覺藝術，積極探索傳統美學與前沿科技的完美融合。
              </p>
            </div>

            {/* 媒體專訪區塊 (引用外部連結) */}
            <div className="bg-neutral-900 p-8 border border-neutral-800 rounded-sm mt-16">
              <h2 className="text-xl font-medium tracking-widest text-white mb-6 uppercase">
                Press & Media
              </h2>
              <div className="space-y-4">
                <a 
                  href="https://www.touhk.com/dancing-together/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <p className="text-yellow-600 text-sm mb-2 tracking-wider">透視香港 (TouHK) 專訪</p>
                  <h3 className="text-xl text-neutral-200 group-hover:text-white transition-colors duration-300">
                    《與光影共舞：Mak 的視覺藝術之旅》
                  </h3>
                  <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500 group-hover:text-neutral-300 transition-colors">
                    <span>閱讀完整報導</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </a>
              </div>
            </div>
            
          </div>
        </div>
      </section>
      
      {/* 底部 Footer */}
      <footer className="py-12 text-center border-t border-neutral-900 bg-neutral-950 text-neutral-600 text-sm font-light">
        <p>&copy; {new Date().getFullYear()} Feeling Studio. All rights reserved.</p>
      </footer>
    </main>
  );
}
