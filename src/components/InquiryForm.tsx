// src/components/InquiryForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';

export default function InquiryForm() {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    category: '藝術品/商品拍攝',
    details: ''
  });
  
  const [status, setStatus] = useState<'idle'|'submitting'|'success'|'error'>('idle');

  // 防機器人驗證碼狀態
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    setCaptcha({
      num1: Math.floor(Math.random() * 10) + 1,
      num2: Math.floor(Math.random() * 10) + 1
    });
    setUserAnswer('');
    setCaptchaError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (parseInt(userAnswer) !== captcha.num1 + captcha.num2) {
      setCaptchaError(true);
      return;
    }

    setStatus('submitting');
    setCaptchaError(false);
    
    try {
      await addDoc(collection(db, 'inquiries'), {
        ...formData,
        status: 'pending',
        createdAt: new Date()
      });

      await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      setStatus('success');
      setFormData({ name: '', contact: '', category: '藝術品/商品拍攝', details: '' });
      generateCaptcha();
      
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error("Error submitting form: ", error);
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-neutral-400 mb-2">私人或公司名稱</label>
        <input 
          type="text" required
          // ✅ 修復：加入了 text-white
          className="w-full bg-neutral-900 border border-neutral-700 p-3 text-white focus:outline-none focus:border-white transition-colors"
          value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
        />
      </div>
      <div>
        <label className="block text-sm text-neutral-400 mb-2">聯絡電話或 Email</label>
        <input 
          type="text" required
          // ✅ 修復：加入了 text-white
          className="w-full bg-neutral-900 border border-neutral-700 p-3 text-white focus:outline-none focus:border-white transition-colors"
          value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})}
        />
      </div>
      <div>
        <label className="block text-sm text-neutral-400 mb-2">需要攝影的類別</label>
        <select 
          // ✅ 修復：加入了 text-white
          className="w-full bg-neutral-900 border border-neutral-700 p-3 text-white focus:outline-none focus:border-white transition-colors appearance-none"
          value={formData.category} 
          onChange={e => setFormData({...formData, category: e.target.value})}
        >
          <option value="藝術品/商品拍攝">01. 藝術品 / 商品拍攝</option>
          <option value="人像攝影(燈光/戶外)">02. 人像攝影 (含燈光造型及戶外)</option>
          <option value="旅遊風光/隨團旅拍">03. 旅遊風光攝影 / 隨團旅拍</option>
          <option value="婚禮及活動攝影">04. 婚禮及各類活動攝影</option>
          <option value="企業人像造型照">05. 企業人像造型照</option>
          <option value="室內設計/建築記錄">06. 室內設計 / 戶外建築物造型紀錄</option>
          <option value="其他/AI創作">其他 / AI 視覺創作</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-neutral-400 mb-2">大概要求與細節</label>
        <textarea 
          rows={4} required
          // ✅ 修復：加入了 text-white
          className="w-full bg-neutral-900 border border-neutral-700 p-3 text-white focus:outline-none focus:border-white transition-colors resize-none"
          value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})}
        ></textarea>
      </div>

      <div className="bg-neutral-950 p-4 border border-neutral-800 flex items-center justify-between">
        <label className="text-sm text-neutral-400">
          為防機器人，請回答：<span className="text-white font-medium ml-1 tracking-widest">{captcha.num1} + {captcha.num2} = ?</span>
        </label>
        <input 
          type="number" required
          // ✅ 修復：加入了 text-white
          className={`w-20 bg-neutral-900 border p-2 text-white text-center focus:outline-none transition-colors ${captchaError ? 'border-red-500 focus:border-red-500' : 'border-neutral-700 focus:border-white'}`}
          value={userAnswer} onChange={e => {
            setUserAnswer(e.target.value);
            setCaptchaError(false); 
          }}
        />
      </div>
      {captchaError && <p className="text-red-500 text-xs text-right mt-1">驗證碼錯誤，請重新計算。</p>}
      
      {status === 'error' && <p className="text-red-500 text-sm">系統發生錯誤，請稍後再試或直接聯絡我們。</p>}
      
      <button 
        type="submit" 
        disabled={status === 'submitting' || status === 'success'}
        className="w-full bg-neutral-100 text-neutral-950 py-4 mt-2 font-medium tracking-wider hover:bg-neutral-300 transition-colors disabled:opacity-50"
      >
        {status === 'submitting' ? '發送中...' : status === 'success' ? '已成功送出！' : '發送需求'}
      </button>
    </form>
  );
}
