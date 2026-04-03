// src/app/services/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ServiceData {
  title: string;
  introduction: string;
  process: string;
  priceBase: string;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const categoryId = params.id as string; // 例如 '01', '02'
  
  const [service, setService] = useState<ServiceData | null>(null);
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 分類名稱對照表 (Fallback 用)
  const categoryMap: { [key: string]: string } = {
    '01': '藝術品 / 商品拍攝', '02': '人像攝影', '03': '旅遊風光攝影',
    '04': '婚禮及活動攝影', '05': '企業人像造型照', '06': '建築與室內空間'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. 抓取服務詳細文字與報價
        const docRef = doc(db, 'services', categoryId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setService(docSnap.data() as ServiceData);
        } else {
          // 如果後台還沒設定，給予預設值
          setService({
            title: categoryMap[categoryId] || '專業攝影服務',
            introduction: '服務詳情準備中，請直接與我們聯絡洽詢。',
            process: '1. 需求溝通\n2. 方案報價\n3. 拍攝執行\n4. 後期精修與交付',
            priceBase: '請洽詢'
          });
        }

        // 2. 抓取該類別的作品 Sample (portfolio 中 category == id)
        const q = query(
          collection(db, 'portfolio'), 
          where('category', '==', categoryId),
          where('isServiceFeatured', '==', true) // ✅ 關鍵修改
        );
        const sampleSnap = await getDocs(q);
        setSamples(sampleSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
      } catch (error) {
        console.error("Error fetching service data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) fetchData();
  }, [categoryId]);

  if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white tracking-widest animate-pulse">載入中...</div>;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 font-sans pb-32">
      {/* 導覽列 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/50 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Logo />
          <Link href="/#expertise" className="text-sm tracking-widest text-neutral-400 hover:text-white transition uppercase border-b border-neutral-700 hover:border-white pb-1">
            Back to Expertise
          </Link>
        </div>
      </nav>

      {/* Header 區塊 */}
      <section className="pt-40 pb-16 px-6 max-w-6xl mx-auto border-b border-neutral-900">
        <div className="flex items-center gap-6 mb-6">
          <span className="text-5xl md:text-7xl font-serif italic text-neutral-800">{categoryId}</span>
          <h1 className="text-3xl md:text-5xl font-light tracking-widest text-white">{service?.title}</h1>
        </div>
      </section>

      {/* 服務詳情與報價 */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-12 gap-16">
        {/* 左側簡介 */}
        <div className="md:col-span-7 space-y-8">
          <h2 className="text-xl font-medium tracking-widest text-white uppercase border-l-2 border-neutral-600 pl-4">Service Overview</h2>
          <p className="text-neutral-400 font-light leading-loose text-justify whitespace-pre-wrap">
            {service?.introduction}
          </p>
        </div>

        {/* 右側流程與價格 */}
        <div className="md:col-span-5 space-y-12 bg-neutral-900 p-8 md:p-10 border border-neutral-800 rounded-sm">
          <div>
            <h2 className="text-sm font-medium tracking-widest text-neutral-500 uppercase mb-6">Base Rate / 起步報價</h2>
            <p className="text-3xl font-light text-white tracking-wider">
              {service?.priceBase !== '請洽詢' ? `HK$ ${Number(service?.priceBase).toLocaleString()}` : '請洽詢'} <span className="text-sm text-neutral-500">起</span>
            </p>
          </div>
          
          <div className="w-full h-px bg-neutral-800"></div>

          <div>
            <h2 className="text-sm font-medium tracking-widest text-neutral-500 uppercase mb-6">Process / 服務流程</h2>
            <ol className="space-y-4 text-neutral-300 font-light text-sm leading-relaxed">
              {service?.process.split('\n').map((step, idx) => (
                <li key={idx} className="flex gap-4">
                  <span className="text-yellow-700 font-serif italic">{idx + 1}.</span>
                  <span>{step.replace(/^\d+\.\s*/, '')}</span> {/* 移除可能自帶的數字編號 */}
                </li>
              ))}
            </ol>
          </div>

          <div className="pt-6">
            <Link href="/#inquiry" className="block text-center w-full bg-white text-black py-4 font-medium tracking-widest hover:bg-neutral-300 transition-colors text-sm uppercase rounded-sm">
              預約諮詢
            </Link>
          </div>
        </div>
      </section>

      {/* 作品 Sample 畫廊 */}
      <section className="max-w-7xl mx-auto px-6 pt-16">
        <h2 className="text-2xl font-medium tracking-widest text-white uppercase mb-12 text-center">Featured Samples</h2>
        
        {samples.length === 0 ? (
          <p className="text-center text-neutral-600 font-light">目前尚無展示作品。</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {samples.map((item) => (
              <div key={item.id} className="relative aspect-square bg-neutral-900 overflow-hidden group border border-neutral-800">
                <Image src={item.imageUrl} alt={item.title} fill className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-500 flex items-end p-6">
                  <span className="text-white font-light tracking-widest">{item.title}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
