// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Logo from '@/components/Logo';
import { auth, db, storage } from '@/lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from 'firebase/auth';
// 新增引入 doc, updateDoc, deleteDoc 用於修改和刪除 Firestore 資料
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
// 新增引入 deleteObject 用於刪除 Storage 實體檔案
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // 1. 狀態管理優化：區分編輯模式與新增模式
  const initialFormState = { title: '', category: '01', description: '' };
  const [uploadData, setUploadData] = useState(initialFormState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  
  // 新增：用於記錄當前是否正在編輯作品，儲存正在編輯的作品 ID
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  // 新增：用於記錄編輯模式下舊圖片的網址，以便在更換新圖時刪除舊圖
  const [oldImageUrl, setOldImageUrl] = useState<string | null>(null);

  // 數據列表狀態
  const [inquiries, setInquiries] = useState<any[]>([]);
  // 新增：儲存所有作品集項目
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);

  // 監聽登入狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchInquiries();
        fetchPortfolio(); // 登入成功後抓取作品列表
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

  // 抓取客戶詢問單
  const fetchInquiries = async () => {
    const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // 2. 新增：抓取所有作品列表
  const fetchPortfolio = async () => {
    const q = query(collection(db, 'portfolio'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setPortfolioItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // 3. 修改：處理圖片壓縮與上傳 (整合新增與修改邏輯)
  const handleUploadOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證：若是新增模式，必須選擇圖片
    if (!editingItemId && !imageFile) {
      setUploadMsg('請先選擇一張相片');
      return;
    }

    setIsUploading(true);
    setUploadMsg(editingItemId ? '正在更新作品...' : '正在發佈作品...');

    try {
      let finalImageUrl = oldImageUrl; // 預設保留舊圖 (修改模式)

      // 情況 A：Mak 老師選擇了新圖片 (無論是新增還是修改)
      if (imageFile) {
        setUploadMsg('壓縮圖片中...');
        // 設定壓縮參數 (限制最大約 130KB)
        const options = {
          maxSizeMB: 0.13, 
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(imageFile, options);
        setUploadMsg(`壓縮完成 (${(compressedFile.size / 1024).toFixed(1)} KB)，準備上傳...`);

        // 上傳至 Firebase Storage
        const fileName = `${Date.now()}_${compressedFile.name}`;
        const storageRef = ref(storage, `portfolio/${fileName}`);
        await uploadBytes(storageRef, compressedFile);
        finalImageUrl = await getDownloadURL(storageRef);

        // 情況 B：修改模式下更換了新圖，需要刪除舊的實體檔案 (節省空間)
        if (editingItemId && oldImageUrl) {
            try {
                // 從網址解析出 Storage路徑
                const decodedUrl = decodeURIComponent(oldImageUrl);
                const startIndex = decodedUrl.indexOf('/o/') + 3;
                const endIndex = decodedUrl.indexOf('?');
                const filePath = decodedUrl.substring(startIndex, endIndex);
                const oldStorageRef = ref(storage, filePath);
                await deleteObject(oldStorageRef);
                console.log("Old image deleted from storage.");
            } catch (error) {
                // 即使舊圖刪除失敗（例如之前手動刪除了），也不影響更新流程
                console.error("Error deleting old image:", error);
            }
        }
      }

      // 4. 修改 Firestore 資料
      const portfolioData = {
        title: uploadData.title,
        category: uploadData.category,
        description: uploadData.description,
        imageUrl: finalImageUrl,
        updatedAt: new Date(), // 紀錄更新時間
      };

      if (editingItemId) {
        // 修改模式：執行 updateDoc
        const docRef = doc(db, 'portfolio', editingItemId);
        await updateDoc(docRef, portfolioData);
        setUploadMsg('作品更新成功！');
      } else {
        // 新增模式：執行 addDoc
        await addDoc(collection(db, 'portfolio'), {
            ...portfolioData,
            createdAt: new Date(), // 只有新增時紀錄建立時間
        });
        setUploadMsg('作品發佈成功！');
      }

      // 5. 完成後重置表單狀態
      resetForm();
      // 重新抓取作品列表，即時更新介面
      fetchPortfolio();

    } catch (error) {
      console.error(error);
      setUploadMsg(editingItemId ? '更新失敗，請檢查權限或網路。' : '發佈失敗，請檢查權限或網路。');
    } finally {
      setIsUploading(false);
    }
  };

  // 6. 新增：開始編輯模式
  const startEdit = (item: any) => {
    setEditingItemId(item.id); // 設置正在編輯的 ID
    setUploadData({
        title: item.title,
        category: item.category,
        description: item.description || ''
    });
    setOldImageUrl(item.imageUrl); // 儲存舊圖網址以便未來比較或刪除
    setUploadMsg(`正在編輯作品：${item.title}`);
    // 捲動回頂部讓老師看到表單
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 7. 新增：刪除作品邏輯 (整合 Firestore 與 Storage)
  const handleDeletePortfolio = async (item: any) => {
    // 專業架構提醒：執行刪除前必須彈窗確認，避免誤刪
    if (!window.confirm(`確定要「永久刪除」作品：${item.title} 嗎？此操作無法還原。`)) {
        return;
    }

    setUploadMsg(`正在刪除作品：${item.title}...`);
    setIsUploading(true);

    try {
        // A. 先刪除 Storage 上的實體圖片檔案
        if (item.imageUrl) {
            const decodedUrl = decodeURIComponent(item.imageUrl);
            const startIndex = decodedUrl.indexOf('/o/') + 3;
            const endIndex = decodedUrl.indexOf('?');
            const filePath = decodedUrl.substring(startIndex, endIndex);
            const storageRef = ref(storage, filePath);
            await deleteObject(storageRef);
            console.log("Image file deleted from storage.");
        }

        // B. 再刪除 Firestore 的數據記錄
        const docRef = doc(db, 'portfolio', item.id);
        await deleteDoc(docRef);
        console.log("Firestore document deleted.");

        setUploadMsg('作品已永久刪除。');
        // 如果刪除的正好是正在編輯的作品，則取消編輯模式
        if (item.id === editingItemId) {
            resetForm();
        }
        // 即時更新列表
        fetchPortfolio();

    } catch (error) {
        console.error("Error deleting portfolio item:", error);
        setUploadMsg('刪除失敗，請檢查權限。');
    } finally {
        setIsUploading(false);
    }
  };

  // 公用：重置表單與模式
  const resetForm = () => {
    setUploadData(initialFormState);
    setImageFile(null);
    setEditingItemId(null);
    setOldImageUrl(null);
    setUploadMsg('');
  };

  // 分類映射，用於列表顯示
  const categoryMap: { [key: string]: string } = {
    '01': '藝術品/商品', '02': '人像攝影', '03': '旅遊風光',
    '04': '婚禮/活動', '05': '企業形象', '06': '建築空間'
  };

  // ---------------- 如果未登入，顯示登入介面 ----------------
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

  // ---------------- 登入後的 Admin 儀表板 ----------------
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 md:p-12 font-sans">
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

        {/* 3 欄配置：上傳表單 | 客戶詢問 | 作品管理 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* 左側：上傳/編輯作品表單 (復用邏輯) */}
          <section className="bg-neutral-900 p-8 border border-neutral-800 rounded-sm lg:col-span-1 self-start">
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
                <input type="text" required className="w-full bg-neutral-950 border border-neutral-800 p-3 text-sm outline-none rounded-sm" 
                  value={uploadData.title} onChange={e => setUploadData({...uploadData, title: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm text-neutral-400 mb-2 font-light">類別</label>
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
                <textarea rows={4} className="w-full bg-neutral-950 border border-neutral-800 p-3 text-sm outline-none resize-none rounded-sm font-light"
                  value={uploadData.description} onChange={e => setUploadData({...uploadData, description: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2 font-light">
                    選擇圖片檔 {editingItemId && <span className="text-neutral-600">(不更換則留空，自動壓縮至 130KB)</span>}
                </label>
                <input type="file" accept="image/*" required={!editingItemId} className="text-xs text-neutral-500 font-light"
                  onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} />
              </div>

              {/* 編輯模式下的舊圖預覽 */}
              {editingItemId && oldImageUrl && !imageFile && (
                  <div className="mt-4 border border-neutral-800 p-2 rounded-sm bg-neutral-950">
                      <p className="text-xs text-neutral-600 mb-2 font-light">目前圖片預覽：</p>
                      <Image src={oldImageUrl} alt="Preview" width={100} height={100} className="object-cover rounded-sm opacity-60" />
                  </div>
              )}

              {uploadMsg && <p className="text-sm text-yellow-500 font-light bg-yellow-950/30 p-3 rounded-sm">{uploadMsg}</p>}

              <button type="submit" disabled={isUploading} 
                className="w-full bg-neutral-100 text-black py-4 hover:bg-neutral-300 transition disabled:opacity-50 tracking-widest text-sm font-medium rounded-sm">
                {isUploading ? '處理中...' : editingItemId ? '壓縮並更新作品' : '壓縮並發佈作品'}
              </button>
            </form>
          </section>

          {/* 右側：分類列表區區 (詢問單 & 作品管理) */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* 區塊 1：客戶詢問單 */}
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
                    <div key={inq.id} className="bg-neutral-950 p-5 border border-neutral-800 rounded-sm">
                        <div className="flex justify-between items-start mb-3">
                        <h3 className="font-medium text-neutral-100 text-base">{inq.name}</h3>
                        <span className="text-xs text-neutral-600">
                            {inq.createdAt?.toDate ? inq.createdAt.toDate().toLocaleDateString('zh-HK') : '剛剛'}
                        </span>
                        </div>
                        <p className="text-neutral-400 mb-1">聯絡方式：{inq.contact}</p>
                        <p className="text-yellow-600 mb-3">需要攝影：{inq.category}</p>
                        <p className="text-neutral-300 font-light bg-neutral-900 p-4 rounded-sm leading-relaxed">{inq.details}</p>
                    </div>
                    ))
                )}
                </div>
            </section>

            {/* 區塊 2：新增：已發佈作品管理 */}
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
                                    {/* 作品小圖預覽 */}
                                    <div className="relative w-20 h-20 flex-shrink-0 bg-neutral-800 rounded-sm overflow-hidden border border-neutral-800">
                                        <Image src={item.imageUrl} alt={item.title} fill className="object-cover opacity-60" />
                                    </div>
                                    
                                    {/* 作品資訊與操作 */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-sm font-medium text-neutral-100 mb-1 truncate">{item.title}</h3>
                                            <p className="text-xs text-yellow-700 font-light uppercase tracking-wider">
                                                {categoryMap[item.category] || '未分類'}
                                            </p>
                                        </div>
                                        
                                        {/* 操作按鈕 */}
                                        <div className="flex gap-3 text-xs font-light mt-3">
                                            <button 
                                                onClick={() => startEdit(item)} 
                                                disabled={isUploading && editingItemId === item.id}
                                                className="text-neutral-400 hover:text-white transition disabled:opacity-30">
                                                編輯
                                            </button>
                                            <span className="text-neutral-800">|</span>
                                            <button 
                                                onClick={() => handleDeletePortfolio(item)} 
                                                disabled={isUploading}
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
      </div>
      
      {/* 底部邊距 */}
      <div className="h-20"></div>
    </div>
  );
}