// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth, db, storage } from '@/lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import Logo from '@/components/Logo'; // 新增這行

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // 上傳表單狀態
  const [uploadData, setUploadData] = useState({ title: '', category: '01', description: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  // 詢問單資料
  const [inquiries, setInquiries] = useState<any[]>([]);

  // 監聽登入狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) fetchInquiries(); // 登入成功後抓取詢問單
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoginError('');
    } catch (err: any) {
      setLoginError('登入失敗，請檢查帳號密碼。');
    }
  };

  const handleLogout = () => signOut(auth);

  // 抓取客戶詢問單
  const fetchInquiries = async () => {
    const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // 處理圖片壓縮與上傳
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      setUploadMsg('請先選擇一張相片');
      return;
    }

    setIsUploading(true);
    setUploadMsg('壓縮圖片中...');

    try {
      // 1. 設定壓縮參數 (限制最大約 130KB)
      const options = {
        maxSizeMB: 0.13, 
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      
      // 2. 執行壓縮
      const compressedFile = await imageCompression(imageFile, options);
      setUploadMsg(`壓縮完成 (${(compressedFile.size / 1024).toFixed(1)} KB)，準備上傳...`);

      // 3. 上傳至 Firebase Storage
      const fileName = `${Date.now()}_${compressedFile.name}`;
      const storageRef = ref(storage, `portfolio/${fileName}`);
      await uploadBytes(storageRef, compressedFile);
      const downloadURL = await getDownloadURL(storageRef);

      // 4. 將資料與 URL 寫入 Firestore
      setUploadMsg('儲存資料中...');
      await addDoc(collection(db, 'portfolio'), {
        title: uploadData.title,
        category: uploadData.category,
        description: uploadData.description,
        imageUrl: downloadURL,
        createdAt: new Date(),
      });

      setUploadMsg('上傳成功！');
      setUploadData({ title: '', category: '01', description: '' });
      setImageFile(null);
    } catch (error) {
      console.error(error);
      setUploadMsg('上傳失敗，請檢查權限或網路。');
    } finally {
      setIsUploading(false);
    }
  };

  // ---------------- 如果未登入，顯示登入介面 ----------------
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <form onSubmit={handleLogin} className="bg-neutral-900 p-8 border border-neutral-800 shadow-2xl w-full max-w-md space-y-6">
          <h1 className="text-2xl font-light tracking-widest text-center text-white mb-8">ADMIN LOGIN</h1>
          {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
          <input 
            type="email" placeholder="Email" required
            className="w-full bg-neutral-950 border border-neutral-800 p-3 text-white focus:border-neutral-500 outline-none"
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full bg-neutral-950 border border-neutral-800 p-3 text-white focus:border-neutral-500 outline-none"
            value={password} onChange={e => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-white text-black py-3 hover:bg-neutral-300 transition tracking-widest">
            登入
          </button>
        </form>
      </div>
    );
  }

  // ---------------- 登入後的 Admin 儀表板 ----------------
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-4">
            {/* 放置我們做好的 Logo */}
            <Logo />
            {/* 後台標記 */}
            <span className="text-sm font-light tracking-widest text-yellow-600 bg-yellow-950 px-3 py-1 rounded-sm">
                SYSTEM ADMIN
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-neutral-500 text-sm font-light">{user.email}</span>
            <button onClick={handleLogout} className="text-sm border border-neutral-700 px-4 py-2 hover:bg-neutral-800 transition rounded-sm">
              登出
            </button>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-12">
          {/* 左側：上傳作品 */}
          <section className="bg-neutral-900 p-8 border border-neutral-800">
            <h2 className="text-xl font-medium tracking-widest mb-6 border-l-2 border-white pl-4">發佈新作品</h2>
            <form onSubmit={handleUpload} className="space-y-5">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">作品標題</label>
                <input type="text" required className="w-full bg-neutral-950 border border-neutral-800 p-3 outline-none" 
                  value={uploadData.title} onChange={e => setUploadData({...uploadData, title: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm text-neutral-400 mb-2">分類</label>
                <select className="w-full bg-neutral-950 border border-neutral-800 p-3 outline-none"
                  value={uploadData.category} onChange={e => setUploadData({...uploadData, category: e.target.value})}>
                  <option value="01">01. 藝術品 / 商品拍攝</option>
                  <option value="02">02. 人像攝影</option>
                  <option value="03">03. 旅遊風光攝影</option>
                  <option value="04">04. 婚禮及活動攝影</option>
                  <option value="05">05. 企業人像造型照</option>
                  <option value="06">06. 建築與室內空間</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">圖片說明 / 背後故事</label>
                <textarea rows={4} className="w-full bg-neutral-950 border border-neutral-800 p-3 outline-none resize-none"
                  value={uploadData.description} onChange={e => setUploadData({...uploadData, description: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">選擇圖片 (自動壓縮至 130KB)</label>
                <input type="file" accept="image/*" required className="text-sm text-neutral-400"
                  onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} />
              </div>

              {uploadMsg && <p className="text-sm text-yellow-500">{uploadMsg}</p>}

              <button type="submit" disabled={isUploading} 
                className="w-full bg-white text-black py-3 hover:bg-neutral-300 transition disabled:opacity-50 tracking-widest">
                {isUploading ? '處理中...' : '壓縮並發佈'}
              </button>
            </form>
          </section>

          {/* 右側：客戶詢問單 */}
          <section className="bg-neutral-900 p-8 border border-neutral-800 flex flex-col h-[700px]">
            <div className="flex justify-between items-center mb-6 border-l-2 border-white pl-4">
              <h2 className="text-xl font-medium tracking-widest">客戶詢問單</h2>
              <button onClick={fetchInquiries} className="text-xs text-neutral-400 hover:text-white transition">重新整理</button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {inquiries.length === 0 ? (
                <p className="text-neutral-500 text-sm">目前尚無詢問紀錄。</p>
              ) : (
                inquiries.map((inq) => (
                  <div key={inq.id} className="bg-neutral-950 p-4 border border-neutral-800">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">{inq.name}</h3>
                      <span className="text-xs text-neutral-500">
                        {inq.createdAt?.toDate ? inq.createdAt.toDate().toLocaleDateString() : '剛剛'}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-400 mb-1">聯絡：{inq.contact}</p>
                    <p className="text-sm text-yellow-600 mb-2">需求：{inq.category}</p>
                    <p className="text-sm text-neutral-300 font-light bg-neutral-900 p-3 rounded-sm">{inq.details}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}