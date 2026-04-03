// src/app/page.tsx
'use client'; // 客戶端組件，用於向 Firebase 請求資料

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import InquiryForm from '@/components/InquiryForm';
import Logo from '@/components/Logo'; // 匯入新的 Logo 元件
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// 定義作品資料結構
interface PortfolioWork {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
}

export default function Home() {
  const [works, setWorks] = useState<PortfolioWork[]>([]);
  const [loading, setLoading] = useState(true);

  // 固定服務類別 (Expertise) 封面圖仍使用 public/images 內的靜態圖
  const expertises = [
    { id: '01', title: '藝術品 / 商品拍攝', desc: '大型拍賣行藝術品、畫作墨寶、陶瓷珠寶及專業商品', image: '/images/art.jpg', span: 'md:col-span-1 md:row-span-2' }, 
    { id: '02', title: '人像攝影', desc: '專業燈光人像造型照、高質感戶外人像寫真', image: '/images/portrait.jpg', span: 'md:col-span-2 md:row-span-1' }, 
    { id: '03', title: '旅遊風光攝影', desc: '極致風景創作、專屬隨團旅拍服務', image: '/images/landscape.jpg', span: 'md:col-span-2 md:row-span-1' }, 
    { id: '04', title: '婚禮及活動攝影', desc: '浪漫婚禮紀錄、各類大型商業與私人活動拍攝', image: '/images/event.jpg', span: 'md:col-span-2 md:row-span-1' }, 
    { id: '05', title: '企業人像造型照', desc: '高階主管形象照、專業企業團隊造型紀錄', image: '/images/corporate.jpg', span: 'md:col-span-1 md:row-span-2' }, 
    { id: '06', title: '建築與室內空間', desc: '室內設計美學展現、戶外建築物造型紀錄', image: '/images/architecture.jpg', span: 'md:col-span-2 md:row-span-1' } 
  ];

  // 定義瀑布流畫廊的交錯版型 (8 格循環)
  const masonrySpans = [
    'col-span-2 row-span-2', // 大直/橫幅
    'col-span-1 row-span-1', // 小方格
    'col-span-1 row-span-2', // 直長條
    'col-span-1 row-span-2', // 直長條
    'col-span-2 row-span-1', // 橫長條
    'col-span-1 row-span-1', // 小方格
    'col-span-2 row-span-2', // 大直/橫幅
    'col-span-2 row-span-1'  // 橫長條
  ];

  // 網頁載入時，抓取 Firebase 資料
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        // 抓取最新的 8 筆作品
        const q = query(collection(db, 'portfolio'), orderBy('createdAt', 'desc'), limit(8));
        const snapshot = await getDocs(q);
        const fetchedWorks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PortfolioWork[];

        setWorks(fetchedWorks);
      } catch (error) {
        console.error("Error fetching portfolio data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950">
      
      {/* ==========================================
          導覽列 (Navbar) - 半透明且毛玻璃效果
         ========================================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-sm border-b border-neutral-800/50 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* 使用專業 Logo 元件 */}
          <Logo />
          
          {/* 右側導覽連結 (錨點跳轉) */}
          <div className="space-x-8 text-sm tracking-widest text-neutral-300 font-light uppercase hidden md:flex">
            {['Expertise', 'Works', 'Inquiry'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors relative group">
                {item}
                {/* 下底線 Hover 動畫 */}
                <span className="absolute -bottom-1.5 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300"></span>
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ==========================================
          Hero 區塊 (使用秋色風景作為背景)
         ========================================== */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden border-b border-neutral-900">
        {/* 背景圖 */}
        <div className="absolute inset-0 z-0 opacity-40">
          <Image 
            src="/images/landscape.jpg" 
            alt="Feeling Studio Hero" 
            fill 
            className="object-cover" 
            priority 
          />
        </div>
        {/* 底部漸層遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neutral-950 z-10" /> 
        
        {/* Hero 區塊中間的標語 - 簡潔排版展现相片質感 */}
        <div className="z-20 text-center space-y-6 px-4 pt-32 md:pt-20"> {/* 增加 pt 以避免 Logo 遮擋 */}
            <p className="text-xl md:text-2xl font-light tracking-[0.3em] text-neutral-200 uppercase drop-shadow-xl">
                Art • Photography • Vision
            </p>
            <div className="w-16 h-px bg-neutral-700 mx-auto"></div>
        </div>
      </section>

      {/* ==========================================
          創始人簡介 (About Mak)
         ========================================== */}
      <section className="max-w-6xl mx-auto py-32 px-6 grid md:grid-cols-2 gap-16 items-center">
        {/* 相片容器 */}
        <div className="relative h-[550px] bg-neutral-900 overflow-hidden shadow-2xl border border-neutral-800 group rounded-sm">
          <Image 
            src="/images/mak.jpg" 
            alt="Mak - Founder of Feeling Studio" 
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center transition duration-1000 ease-in-out group-hover:scale-105 grayscale hover:grayscale-0"
            priority 
          />
          {/* 藝術光影遮罩 */}
          <div className="absolute inset-0 bg-black/20 transition-opacity duration-700 group-hover:opacity-0 z-10" />
        </div>
        
        {/* 文字內容 */}
        <div className="space-y-8">
          <h2 className="text-3xl md:text-4xl font-medium tracking-widest uppercase text-white">About Mak</h2>
          <div className="w-12 h-0.5 bg-neutral-600"></div>
          <div className="space-y-6 text-neutral-400 leading-loose font-light text-justify text-sm md:text-base">
            <p>擁有 35 年以上專業藝術創作經驗的香港土生土長攝影師。曾任職英文導師，後轉戰音響雜誌主編，最終因對藝術攝影的熱愛，全心投入攝影產業。</p>
            <p>Mak 老師專精於大型拍賣行的中大型藝術品（如畫作、墨寶、陶瓷、珠寶）拍攝，能精準捕捉文物獨有的歷史厚度與材質紋理。同時致力於專業人像與風景創作。</p>
            <p className="border-l-2 border-neutral-700 pl-6 italic text-neutral-500">「攝影不僅是紀錄，更是對靈魂與美學的深刻洞察。」</p>
            <p>近年更積極探索 AI 視覺藝術創作，將傳統攝影美學與前沿科技完美融合，持續拓展視覺表達的邊界。</p>
            {/* 加入這顆按鈕 */}
            <div className="pt-4">
              <Link href="/about" className="inline-block text-sm tracking-widest text-neutral-100 border border-neutral-700 px-8 py-3 hover:bg-white hover:text-black transition-colors duration-300 uppercase">
                Read Full Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          六大專業領域 (Expertise) - 加入 id 用於錨點跳轉
         ========================================== */}
      <section id="expertise" className="py-32 px-6 border-y border-neutral-900 bg-neutral-950 scroll-mt-20"> {/* 加上 scroll-mt-20 避免被 fixed navbar 遮擋 */}
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-medium tracking-widest uppercase mb-6 text-white">Expertise</h2>
            <div className="w-12 h-0.5 bg-neutral-700 mx-auto"></div>
          </div>
          
          {/* 3 欄配置的 Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
            {expertises.map((item) => (
              <div key={item.id} className={`group cursor-pointer relative overflow-hidden shadow-xl border border-neutral-900 ${item.span} col-span-1 row-span-1 bg-neutral-900 rounded-sm`}>
                
                {/* 核心相片展示 */}
                <Image 
                    src={item.image} 
                    alt={item.title} 
                    fill 
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover object-center opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 ease-out z-0" 
                />
                
                {/* 漸層遮罩 (確保文字清晰) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent z-10" />

                {/* 文字內容 */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20 space-y-2 md:space-y-3">
                    <div className="flex items-center gap-3 md:gap-4">
                        <span className="text-white/40 font-serif text-2xl md:text-3xl italic drop-shadow-md">{item.id}</span>
                        <h3 className="text-xl md:text-2xl font-light tracking-widest text-neutral-100 drop-shadow-md">{item.title}</h3>
                    </div>
                    {/* 手機版預設顯示說明，桌面版 hover 顯示 */}
                    <p className="text-sm text-neutral-400 font-light leading-relaxed max-w-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        {item.desc}
                    </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          動態精選作品集 (Selected Works) - 加入 id
         ========================================== */}
      <section id="works" className="py-32 px-6 bg-neutral-950 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
           <div className="flex justify-between items-end mb-16">
              <div>
                <h2 className="text-3xl md:text-4xl font-medium tracking-widest uppercase mb-4 text-white">Selected Works</h2>
                <div className="w-12 h-0.5 bg-neutral-600"></div>
              </div>
              {/* 若有更多作品，此按鈕未來可連結到獨立的 Portfolio 頁面 */}
              <button className="text-sm tracking-widest text-neutral-500 hover:text-white transition-colors uppercase border-b border-transparent hover:border-white pb-1 relative group">
                View All
              </button>
           </div>
           
           {/* 瀑布流畫廊展示 */}
           {loading ? (
             <div className="text-center text-neutral-600 py-20 tracking-widest animate-pulse font-light">載入最新作品中...</div>
           ) : works.length > 0 ? (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[220px]">
                {works.map((work, index) => {
                  const spanClass = masonrySpans[index % masonrySpans.length]; // 循環套用交錯版型
                  return (
                    <div key={work.id} className={`bg-neutral-900 relative group overflow-hidden border border-neutral-900 rounded-sm ${spanClass}`}>
                      <Image 
                        src={work.imageUrl} 
                        alt={work.title} 
                        fill 
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover object-center transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100 z-0" 
                      />
                      {/* Hover 時從底部浮現漸層與文字 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 flex flex-col justify-end p-6">
                        <h4 className="text-white font-light tracking-widest text-lg mb-2">{work.title}</h4>
                        {/* 桌面版 Hover 顯示說明 */}
                        <p className="text-neutral-400 text-xs font-light leading-relaxed hidden md:block">{work.description}</p>
                      </div>
                    </div>
                  );
                })}
             </div>
           ) : (
             <div className="text-center text-neutral-600 py-20 font-light border border-neutral-800 border-dashed rounded-sm">
                尚無精選作品，請至後台上傳。
             </div>
           )}
        </div>
      </section>

      {/* ==========================================
          聯絡我們 (Get in Touch) - 加入 id
         ========================================== */}
      <section id="inquiry" className="max-w-6xl mx-auto py-32 px-6 border-t border-neutral-900 scroll-mt-20">
        <div className="grid md:grid-cols-2 gap-20">
          <div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-widest uppercase mb-6 text-white">Get in Touch</h2>
            <div className="w-12 h-0.5 bg-neutral-600 mb-8"></div>
            <p className="text-neutral-400 mb-12 font-light leading-loose text-justify text-sm md:text-base">
              請填寫右方表單，簡述您的拍攝需求（如類別、大概時間與地點），我們將會由專人盡快與您聯繫。您亦可透過下方行動條碼直接使用微信或 WhatsApp 與我們對話。
            </p>
            {/* QR Codes */}
            <div className="flex space-x-6 mb-12">
              <div className="w-32 h-32 bg-neutral-900 flex items-center justify-center text-neutral-600 text-sm border border-neutral-800 shadow-lg rounded-sm font-light">
                [ WeChat QR ]
              </div>
              <div className="w-32 h-32 bg-neutral-900 flex items-center justify-center text-neutral-600 text-sm border border-neutral-800 shadow-lg rounded-sm font-light">
                [ WhatsApp QR ]
              </div>
            </div>
            {/* 地點資訊 */}
            <div className="space-y-2 border-l-2 border-neutral-800 pl-6">
              <p className="text-xs text-neutral-600 tracking-wider uppercase">Locations</p>
              <p className="text-neutral-400 font-light tracking-wide">Hong Kong | Greater Bay Area</p>
            </div>
          </div>
          
          {/* 聯絡表單容器 */}
          <div className="bg-neutral-900 p-8 md:p-10 border border-neutral-800 shadow-2xl rounded-sm">
            <InquiryForm />
          </div>
        </div>
      </section>
      
      {/* ==========================================
          Footer
         ========================================== */}
      <footer className="py-12 text-center border-t border-neutral-900 bg-neutral-950 text-neutral-600 text-sm font-light">
        <p>&copy; {new Date().getFullYear()} Feeling Studio. All rights reserved.</p>
        <p className="text-xs mt-2 opacity-50 uppercase tracking-widest">Art • Photography • Vision</p>
      </footer>
    </main>
  );
}
