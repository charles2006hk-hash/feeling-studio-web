// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Logo from '@/components/Logo';
import { auth, db, storage } from '@/lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'portfolio' | 'services'>('portfolio');

  const initialFormState = { title: '', category: '01', description: '', isServiceFeatured: false };
  const [uploadData, setUploadData] = useState(initialFormState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [oldImageUrl, setOldImageUrl] = useState<string | null>(null);

  const [inquiries, setInquiries] = useState<any[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);

  const [editingServiceId, setEditingServiceId] = useState('01');
  const [serviceData, setServiceData] = useState({ title: '', introduction: '', process: '', priceBase: '' });
  const [isSavingService, setIsSavingService] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchInquiries();
        fetchPortfolio();
      }
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

  const fetchInquiries = async () => {
    const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // ✅ 新增：切換詢問單狀態 (待處理 / 已跟進)
  const handleToggleInquiryStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await updateDoc(doc(db, 'inquiries', id), { status: newStatus });
      fetchInquiries(); // 重新整理列表
    } catch (error) {
      console.error("Error updating status:", error);
      alert("狀態更新失敗，請檢查權限。");
    }
  };

  // ✅ 新增：刪除詢問單
  const handleDeleteInquiry = async (id: string, name: string) => {
    if (!window.confirm(`確定要永久刪除來自「${name}」的詢問單嗎？此操作無法還原。`)) return;
    try {
      await deleteDoc(doc(db, 'inquiries', id));
      fetchInquiries(); // 重新整理列表
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      alert("刪除失敗，請檢查權限。");
    }
  };

  const fetchPortfolio = async () => {
    const q = query(collection(db, 'portfolio'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setPortfolioItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleUploadOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingItemId && !imageFile) {
      setUploadMsg('請先選擇一張相片');
      return;
    }

    setIsUploading(true);
    setUploadMsg(editingItemId ? '正在更新作品...' : '正在發佈作品...');

    try {
      let finalImageUrl = oldImageUrl; 

      if (imageFile) {
        setUploadMsg('壓縮圖片中...');
        const options = {
          maxSizeMB: 0.13, 
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(imageFile, options);
        setUploadMsg(`壓縮完成 (${(compressedFile.size / 1024).toFixed(1)} KB)，準備上傳...`);

        const fileName = `${Date.now()}_${compressedFile.name}`;
        const storageRef = ref(storage, `portfolio/${fileName}`);
        await uploadBytes(storageRef, compressedFile);
        finalImageUrl = await getDownloadURL(storageRef);

        if (editingItemId && oldImageUrl) {
            try {
                const decodedUrl = decodeURIComponent(oldImageUrl);
                const startIndex = decodedUrl.indexOf('/o/') + 3;
                const endIndex = decodedUrl.indexOf('?');
                const filePath = decodedUrl.substring(startIndex, endIndex);
                const oldStorageRef = ref(storage, filePath);
                await deleteObject(oldStorageRef);
            } catch (error) {
                console.error("Error deleting old image:", error);
            }
        }
      }

      const portfolioData = {
        title: uploadData.title,
        category: uploadData.category,
        description: uploadData.description,
        isServiceFeatured: uploadData.isServiceFeatured,
        imageUrl: finalImageUrl,
        updatedAt: new Date(),
      };

      if (editingItemId) {
        const docRef = doc(db, 'portfolio', editingItemId);
        await updateDoc(docRef, portfolioData);
        setUploadMsg('作品更新成功！');
      } else {
        await addDoc(collection(db, 'portfolio'), {
            ...portfolioData,
            createdAt: new Date(),
        });
        setUploadMsg('作品發佈成功！');
      }

      resetForm();
      fetchPortfolio();

    } catch (error) {
      console.error(error);
      setUploadMsg('操作失敗，請檢查網路或權限。');
    } finally {
      setIsUploading(false);
    }
  };

  const startEdit = (item: any) => {
    setEditingItemId(item.id);
    setUploadData({
        title: item.title,
        category: item.category,
        description: item.description || '',
        isServiceFeatured: item.isServiceFeatured || false
    });
    setOldImageUrl(item.imageUrl);
    setUploadMsg(`正在編輯作品：${item.title}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePortfolio = async (item: any) => {
    if (!window.confirm(`確定要「永久刪除」作品：${item.title} 嗎？此操作無法還原。`)) {
        return;
    }

    setUploadMsg(`正在刪除作品：${item.title}...`);
    setIsUploading(true);

    try {
        if (item.imageUrl) {
            const decodedUrl = decodeURIComponent(item.imageUrl);
            const startIndex = decodedUrl.indexOf('/o/') + 3;
            const endIndex = decodedUrl.indexOf('?');
            const filePath = decodedUrl.substring(startIndex, endIndex);
            const storageRef = ref(storage, filePath);
            await deleteObject(storageRef);
        }

        const docRef = doc(db, 'portfolio', item.id);
        await deleteDoc(docRef);

        setUploadMsg('作品已永久刪除。');
        if (item.id === editingItemId) resetForm();
        fetchPortfolio();

    } catch (error) {
        console.error("Error deleting portfolio item:", error);
        setUploadMsg('刪除失敗，請檢查權限。');
    } finally {
        setIsUploading(false);
    }
  };

  const resetForm = () => {
    setUploadData(initialFormState);
    setImageFile(null);
    setEditingItemId(null);
    setOldImageUrl(null);
    setUploadMsg('');
  };

  const fetchServiceData = async (id: string) => {
    setEditingServiceId(id);
    const docRef = doc(db, 'services', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      setServiceData(docSnap.data() as any);
    } else {
      setServiceData({ 
        title: '', 
        introduction: '', 
        process: '1. 需求溝通\n2. 方案報價\n3. 拍攝執行\n4. 後期精修與交付', 
        priceBase: '' 
      });
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingService(true);
    try {
      await setDoc(doc(db, 'services', editingServiceId), serviceData, { merge: true });
      alert('服務設定已成功更新！');
    } catch (error) {
      console.error(error);
      alert('更新失敗，請檢查權限。');
    } finally {
      setIsSavingService(false);
    }
  };

  const categoryMap: { [key: string]: string } = {
    '01': '藝術品/商品', '02': '人像攝影', '03': '旅遊風光',
    '04': '婚禮/活動', '05': '企業形象', '06': '建築空間'
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
        <form onSubmit={handleLogin} className="bg-neutral-900 p-8 border border-neutral-800 shadow-2xl w-full max-w-md space-y-6 rounded-sm">
          <div className="flex justify-center mb-6"><Logo /></div>
          <h1 className="text-xl font-light tracking-[0.2em] text-center text-neutral-400 mb-8 uppercase">Admin Access</h1>
          {loginError && <p className="text-red-500 text-sm text-center font-light">{loginError}</p>}
          <input 
            type="email" placeholder="Mak's Email" required
            className="w-full bg-neutral-950 border border-neutral-800 p-3 text-white focus:border-neutral-500 outline-none rounded-sm font-light text-sm"
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full bg-neutral-950 border border-neutral-800 p-3 text-white focus:border-neutral-500 outline-none rounded-sm font-light text-sm"
            value={password} onChange={e => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-neutral-100 text-black py-3 hover:bg-neutral-300 transition tracking-widest text-sm font-medium rounded-sm">
            LOGIN
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 md:p-12 font-sans pb-32">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="text-sm font-light tracking-widest text-yellow-600 bg-yellow-950 px-3 py-1 rounded-sm uppercase">
                SYSTEM ADMIN
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-neutral-500 text-sm font-light hidden md:block">{user.email}</span>
            <button onClick={handleLogout} className="text-sm border border-neutral-700 px-4 py-2 hover:bg-neutral-800 transition rounded-sm font-light tracking-wider">
              登出
            </button>
          </div>
        </header>

        <div className="flex gap-8 mb-8 border-b border-neutral-800">
            <button 
                onClick={() => setActiveTab('portfolio')}
                className={`pb-4 tracking-widest uppercase text-sm transition-colors ${activeTab === 'portfolio' ? 'text-white border-b-2 border-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
                作品與詢問單管理
            </button>
            <button 
                onClick={() => { setActiveTab('services'); fetchServiceData('01'); }}
                className={`pb-4 tracking-widest uppercase text-sm transition-colors ${activeTab === 'services' ? 'text-white border-b-2 border-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
                業務介紹與報價設定
            </button>
        </div>

        {activeTab === 'portfolio' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
                <section className="bg-neutral-900 p-8 border border-neutral-800 rounded-sm lg:col-span-1 relative z-20 lg:sticky lg:top-6 self-start">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-light tracking-widest uppercase border-l-2 border-white pl-4 text-white">
                            {editingItemId ? '更新作品' : '發佈新作品'}
                        </h2>
                        {editingItemId && (
                            <button onClick={resetForm} className="text-xs text-neutral-500 hover:text-white transition tracking-wider">
                                取消編輯
                            </button>
                        )}
                    </div>
                    
                    <form onSubmit={handleUploadOrUpdate} className="space-y-6">
                    <div>
                        <label className="block text-sm text-neutral-400 mb-2 font-light">作品標題</label>
                        <input type="text" required className="w-full bg-neutral-950 border border-neutral-800 p-3 text-sm outline-none rounded-sm text-white" 
                        value={uploadData.title} onChange={e => setUploadData({...uploadData, title: e.target.value})} />
                    </div>
                    
                    <div>
                        <label className="block text-sm text-neutral-400 mb-2 font-light">所屬類別</label>
                        <select className="w-full bg-neutral-950 border border-neutral-800 p-3 text-sm outline-none rounded-sm text-neutral-300 appearance-none"
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
                        <label className="block text-sm text-neutral-400 mb-2 font-light">圖片說明 / 背後故事 (選填)</label>
                        <textarea rows={4} className="w-full bg-neutral-950 border border-neutral-800 p-3 text-sm outline-none resize-none rounded-sm font-light text-white"
                        value={uploadData.description} onChange={e => setUploadData({...uploadData, description: e.target.value})} />
                    </div>

                    <div>
                        <label className="block text-sm text-neutral-400 mb-2 font-light">
                            選擇圖片檔 {editingItemId && <span className="text-neutral-600">(不更換則留空，自動壓縮至 ~130KB)</span>}
                        </label>
                        <input type="file" accept="image/*" required={!editingItemId} className="text-xs text-neutral-500 font-light"
                        onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} />
                    </div>

                    {editingItemId && oldImageUrl && !imageFile && (
                        <div className="mt-4 border border-neutral-800 p-2 rounded-sm bg-neutral-950">
                            <p className="text-xs text-neutral-600 mb-2 font-light">目前圖片預覽：</p>
                            <div className="relative w-full h-32">
                                <Image src={oldImageUrl} alt="Preview" fill className="object-contain rounded-sm opacity-60" />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 bg-neutral-950 p-4 border border-neutral-800 rounded-sm mt-4">
                      <input 
                        type="checkbox" 
                        id="isFeatured"
                        className="w-4 h-4 accent-yellow-700 cursor-pointer"
                        checked={uploadData.isServiceFeatured || false}
                        onChange={e => setUploadData({...uploadData, isServiceFeatured: e.target.checked})}
                      />
                      <label htmlFor="isFeatured" className="text-sm text-neutral-300 font-light cursor-pointer">
                        將此作品設為該業務頁面的「精選展示 (Featured Sample)」
                      </label>
                    </div>

                    {uploadMsg && <p className="text-sm text-yellow-500 font-light bg-yellow-950/30 p-3 rounded-sm">{uploadMsg}</p>}

                    <button type="submit" disabled={isUploading} 
                        className="w-full bg-neutral-100 text-black py-4 hover:bg-neutral-300 transition disabled:opacity-50 tracking-widest text-sm font-medium rounded-sm">
                        {isUploading ? '處理中...' : editingItemId ? '壓縮並更新作品' : '壓縮並發佈作品'}
                    </button>
                    </form>
                </section>

                <div className="lg:col-span-2 space-y-10">
                    {/* ✅ 詢問單管理區塊 (更新狀態與刪除按鈕) */}
                    <section className="bg-neutral-900 p-8 border border-neutral-800 rounded-sm flex flex-col h-[500px]">
                        <div className="flex justify-between items-center mb-8 border-l-2 border-white pl-4">
                            <h2 className="text-xl font-light tracking-widest uppercase text-white">客戶詢問單</h2>
                            <button onClick={fetchInquiries} className="text-xs text-neutral-500 hover:text-white transition tracking-wider">重新整理</button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-sm font-light scrollbar-thin">
                            {inquiries.length === 0 ? (
                                <p className="text-neutral-600 text-center py-10">目前尚無詢問紀錄。</p>
                            ) : (
                                inquiries.map((inq) => (
                                <div key={inq.id} className={`bg-neutral-950 p-5 border rounded-sm transition-all ${inq.status === 'completed' ? 'border-emerald-900/50 opacity-60' : 'border-neutral-800'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <h3 className="font-medium text-neutral-100 text-base inline-block">{inq.name}</h3>
                                        {/* 狀態標籤 */}
                                        <span className={`ml-3 text-[10px] px-2 py-1 rounded-sm uppercase tracking-wider ${inq.status === 'completed' ? 'bg-emerald-900/30 text-emerald-500' : 'bg-yellow-900/30 text-yellow-500'}`}>
                                          {inq.status === 'completed' ? '✓ 已跟進' : '待處理'}
                                        </span>
                                      </div>
                                      <span className="text-xs text-neutral-600">
                                          {inq.createdAt?.toDate ? inq.createdAt.toDate().toLocaleDateString('zh-HK') : '剛剛'}
                                      </span>
                                    </div>
                                    <p className="text-neutral-400 mb-1">聯絡方式：{inq.contact}</p>
                                    <p className="text-yellow-600 mb-3">需要攝影：{inq.category}</p>
                                    <p className="text-neutral-300 font-light bg-neutral-900 p-4 rounded-sm leading-relaxed">{inq.details}</p>
                                    
                                    {/* 操作按鈕 */}
                                    <div className="flex gap-4 mt-4 pt-4 border-t border-neutral-800/50 text-xs">
                                      <button 
                                        onClick={() => handleToggleInquiryStatus(inq.id, inq.status)}
                                        className={`${inq.status === 'completed' ? 'text-neutral-500 hover:text-white' : 'text-emerald-500 hover:text-emerald-400'} transition-colors`}
                                      >
                                        {inq.status === 'completed' ? '標示為「待處理」' : '標示為「已跟進」'}
                                      </button>
                                      <span className="text-neutral-800">|</span>
                                      <button 
                                        onClick={() => handleDeleteInquiry(inq.id, inq.name)}
                                        className="text-red-900 hover:text-red-500 transition-colors"
                                      >
                                        刪除紀錄
                                      </button>
                                    </div>
                                </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="bg-neutral-900 p-8 border border-neutral-800 rounded-sm flex flex-col h-[500px]">
                        <div className="flex justify-between items-center mb-8 border-l-2 border-white pl-4">
                            <h2 className="text-xl font-light tracking-widest uppercase text-white">作品管理系統</h2>
                            <button onClick={fetchPortfolio} className="text-xs text-neutral-500 hover:text-white transition tracking-wider">重新整理</button>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
                            {portfolioItems.length === 0 ? (
                                <p className="text-neutral-600 text-center py-10 font-light text-sm">尚無已發佈的作品。</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {portfolioItems.map((item) => (
                                        <div key={item.id} className="bg-neutral-950 p-4 border border-neutral-800 rounded-sm flex gap-4">
                                            <div className="relative w-20 h-20 flex-shrink-0 bg-neutral-800 rounded-sm overflow-hidden border border-neutral-800">
                                                <Image src={item.imageUrl} alt={item.title} fill className="object-cover opacity-60" />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="text-sm font-medium text-neutral-100 mb-1 truncate" title={item.title}>{item.title}</h3>
                                                    <p className="text-xs text-yellow-700 font-light uppercase tracking-wider">
                                                        {categoryMap[item.category] || '未分類'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-3 text-xs font-light mt-3">
                                                    <button onClick={() => startEdit(item)} disabled={isUploading && editingItemId === item.id}
                                                        className="text-neutral-400 hover:text-white transition disabled:opacity-30">
                                                        編輯
                                                    </button>
                                                    <span className="text-neutral-800">|</span>
                                                    <button onClick={() => handleDeletePortfolio(item)} disabled={isUploading}
                                                        className="text-red-900 hover:text-red-500 transition disabled:opacity-30">
                                                        刪除
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        ) : (
            <section className="bg-neutral-900 p-8 md:p-12 border border-neutral-800 rounded-sm max-w-5xl">
                <div className="flex gap-3 mb-10 overflow-x-auto pb-4 scrollbar-thin">
                    {['01', '02', '03', '04', '05', '06'].map(id => (
                        <button key={id} onClick={() => fetchServiceData(id)}
                            className={`px-5 py-3 border text-sm font-light tracking-widest whitespace-nowrap transition-colors ${editingServiceId === id ? 'bg-white text-black border-white' : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'}`}>
                            {id}. {categoryMap[id]}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSaveService} className="space-y-8">
                    <div>
                        <label className="block text-sm text-neutral-400 mb-3 font-light">業務標題 <span className="text-neutral-600 text-xs ml-2">(顯示於獨立頁面的大標題)</span></label>
                        <input type="text" required className="w-full bg-neutral-950 border border-neutral-800 p-4 text-sm outline-none text-white rounded-sm" 
                            value={serviceData.title} onChange={e => setServiceData({...serviceData, title: e.target.value})} 
                            placeholder="例如：婚禮及各類活動攝影" />
                    </div>
                    
                    <div>
                        <label className="block text-sm text-neutral-400 mb-3 font-light">服務總覽 (Service Overview) <span className="text-neutral-600 text-xs ml-2">(介紹您的拍攝理念與服務特色)</span></label>
                        <textarea rows={6} required className="w-full bg-neutral-950 border border-neutral-800 p-4 text-sm outline-none text-white leading-relaxed rounded-sm resize-none" 
                            value={serviceData.introduction} onChange={e => setServiceData({...serviceData, introduction: e.target.value})} 
                            placeholder="為您凝結人生中最珍貴的時刻..." />
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm text-neutral-400 mb-3 font-light">起步報價 (HK$) <span className="text-neutral-600 text-xs ml-2">(輸入整數數字，或輸入"請洽詢")</span></label>
                            <input type="text" required className="w-full bg-neutral-950 border border-neutral-800 p-4 text-sm outline-none text-white rounded-sm" 
                                value={serviceData.priceBase} onChange={e => setServiceData({...serviceData, priceBase: e.target.value})} 
                                placeholder="例如：15000 或 請洽詢" />
                        </div>
                        <div>
                            <label className="block text-sm text-neutral-400 mb-3 font-light">服務流程 (Process) <span className="text-neutral-600 text-xs ml-2">(請使用 Enter 換行，系統會自動編號)</span></label>
                            <textarea rows={6} required className="w-full bg-neutral-950 border border-neutral-800 p-4 text-sm outline-none text-white leading-relaxed rounded-sm resize-none" 
                                value={serviceData.process} onChange={e => setServiceData({...serviceData, process: e.target.value})} 
                                placeholder="需求溝通&#10;擬定拍攝計畫&#10;現場拍攝&#10;後期精修交付" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-800">
                        <button type="submit" disabled={isSavingService} 
                            className="w-full bg-yellow-700 text-white py-4 hover:bg-yellow-600 transition disabled:opacity-50 tracking-widest text-sm font-medium rounded-sm">
                            {isSavingService ? '儲存中...' : `儲存 [${categoryMap[editingServiceId]}] 設定`}
                        </button>
                    </div>
                </form>
            </section>
        )}
      </div>
    </div>
  );
}
