import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react';
import { 
  Plus, 
  Clock, 
  User, 
  Trash2, 
  Database,
  Check,
  X,
  LogOut,
  Edit3,
  Send,
  Users,
  Briefcase,
  Search,
  Download,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  UserCog,
  ListFilter,
  BadgeCheck,
  Building2,
  FileBarChart,
  TrendingUp,
  Loader2,
  ShieldAlert,
  Crown,
  Briefcase as BriefcaseIcon,
  Save,
  Filter,
  PieChart,
  GitBranch,
  LayoutDashboard,
  UserPlus
} from 'lucide-react';

// --- MSAL (MICROSOFT ENTRA ID) KONFİGÜRASYONU ---

const msalConfig = {
    auth: {
        // ÖNEMLİ: Bu ID'yi Azure Portal'dan aldığınız kendi 'Application (client) ID'niz ile değiştirin.
        clientId: "YOUR_CLIENT_ID_HERE", 
        authority: "https://login.microsoftonline.com/common",
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage", 
        storeAuthStateInCookie: false,
    }
};

const msalInstance = new PublicClientApplication(msalConfig);

if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
    msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
}

msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        // @ts-ignore
        const account = event.payload.account;
        msalInstance.setActiveAccount(account);
    }
});


// --- TİP TANIMLAMALARI ---

type UserRole = 'admin' | 'team_lead' | 'user';

type UserDefinition = {
  id: string;
  username: string; // E-posta adresi
  role: UserRole;
  name: string;
  department?: string; // Departman bilgisi raporlama için kalsın
  manager?: string; // Bağlı olduğu yöneticinin username'i
};

type MesaiDurumu = 'bekliyor' | 'onaylandi' | 'reddedildi';
type MesaiTuru = 'Normal' | 'Hafta Sonu' | 'Resmi Tatil';

type MesaiKaydi = {
  id: string;
  donem: string;
  isim: string;
  tarih: string;
  baslangic: string;
  bitis: string;
  neden: string;
  kaydeden: string;
  kayitZamani: string;
  durum: MesaiDurumu;
  mesaiTuru: MesaiTuru;
  carpan: number;
  reddedilmeNedeni?: string;
};

// --- LOGO BİLEŞENİ ---
const AppLogo = ({ size = 40, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="36" height="36" rx="12" fill="#2563EB" />
    <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
    <path d="M20 10V20L26 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="32" cy="8" r="4" fill="#60A5FA" stroke="white" strokeWidth="2"/>
  </svg>
);

// --- SABİTLER ---

const DONEMLER = [
  "Ocak 2024", "Şubat 2024", "Mart 2024", "Nisan 2024", 
  "Mayıs 2024", "Haziran 2024", "Temmuz 2024", "Ağustos 2024",
  "Eylül 2024", "Ekim 2024", "Kasım 2024", "Aralık 2024"
];

const RESMI_TATILLER = [
  "01-01", "04-23", "05-01", "05-19", "07-15", "08-30", "10-29",
  "2024-04-10", "2024-04-11", "2024-04-12",
  "2024-06-16", "2024-06-17", "2024-06-18", "2024-06-19",
];

// Simülasyon için kullanıcı listesi.
const INITIAL_USERS: UserDefinition[] = [
  { id: "1", username: "ahmet.admin@sirket.com", role: 'admin', name: "Ahmet Yılmaz", department: "Yönetim" },
  { id: "2", username: "ali.lider@sirket.com", role: 'team_lead', name: "Ali Koç", department: "Yazılım" },
  { id: "3", username: "mehmet.user@sirket.com", role: 'user', name: "Mehmet Demir", department: "Yazılım", manager: "ali.lider@sirket.com" },
  { id: "4", username: "ayse.user@sirket.com", role: 'user', name: "Ayşe Kara", department: "Satış", manager: "veli.lider@sirket.com" },
  { id: "5", username: "veli.lider@sirket.com", role: 'team_lead', name: "Veli Can", department: "Satış" }
];

const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- YARDIMCI FONKSİYONLAR ---

const getDayStatus = (dateString: string): { type: MesaiTuru, label: string, color: string, carpan: number } => {
  if (!dateString) return { type: 'Normal', label: 'Normal Mesai', color: 'bg-slate-100 text-slate-600', carpan: 1.0 };
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();
  const formattedDate = dateString;
  const monthDay = dateString.slice(5);

  if (RESMI_TATILLER.includes(monthDay) || RESMI_TATILLER.includes(formattedDate)) {
    return { type: 'Resmi Tatil', label: 'Resmi Tatil', color: 'bg-red-100 text-red-700 border-red-200', carpan: 2.0 };
  }
  if (dayOfWeek === 0) {
    return { type: 'Hafta Sonu', label: 'Hafta Sonu', color: 'bg-orange-100 text-orange-700 border-orange-200', carpan: 1.5 };
  }
  return { type: 'Normal', label: 'Hafta İçi', color: 'bg-blue-50 text-blue-700 border-blue-200', carpan: 1.0 };
};

const calculateHours = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  if (isNaN(startH) || isNaN(endH)) return 0;
  const startDate = new Date(0, 0, 0, startH, startM || 0, 0);
  const endDate = new Date(0, 0, 0, endH, endM || 0, 0);
  let diff = endDate.getTime() - startDate.getTime();
  if (diff < 0) return -1; 
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
};

const checkForOverlap = (date: string, start: string, end: string, existingItems: MesaiKaydi[], excludeId?: string): boolean => {
  const toInt = (t: string) => parseInt(t.replace(':', ''), 10);
  const newStart = toInt(start);
  const newEnd = toInt(end);
  return existingItems.some(item => {
    if (item.id === excludeId) return false;
    if (item.tarih !== date) return false;
    if (item.durum === 'reddedildi') return false;
    const existStart = toInt(item.baslangic);
    const existEnd = toInt(item.bitis);
    return (newStart < existEnd && newEnd > existStart);
  });
};

const exportToCSV = (data: MesaiKaydi[]) => {
  const headers = ["ID", "Dönem", "İsim", "Tarih", "Mesai Türü", "Çarpan", "Başlangıç", "Bitiş", "Süre (Saat)", "Neden", "Durum", "Red Nedeni", "Kaydeden", "Kayıt Zamanı"];
  const rows = data.map(item => [
    item.id, `"${item.donem}"`, `"${item.isim}"`, item.tarih, item.mesaiTuru || "Normal", (item.carpan || 1.0).toString().replace('.', ','), item.baslangic, item.bitis, Math.max(0, calculateHours(item.baslangic, item.bitis)).toFixed(2).replace('.', ','), `"${item.neden ? item.neden.replace(/"/g, '""') : ''}"`, item.durum, `"${item.reddedilmeNedeni ? item.reddedilmeNedeni.replace(/"/g, '""') : ''}"`, item.kaydeden, item.kayitZamani
  ]);
  const csvContent = "\uFEFF" + headers.join(";") + "\n" + rows.map(e => e.join(";")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `mesai_takip_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// --- ORTAK BİLEŞENLER ---

const StatusBadge = ({ status }: { status: MesaiDurumu }) => {
  switch (status) {
    case 'onaylandi': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"><Check size={12} className="mr-1"/> Onaylandı</span>;
    case 'reddedildi': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"><X size={12} className="mr-1"/> Reddedildi</span>;
    default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"><Clock size={12} className="mr-1"/> Bekliyor</span>;
  }
};

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return (
    <div className={`fixed top-24 right-4 z-[999] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-right fade-in duration-300 ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
      <span className="font-semibold">{message}</span>
    </div>
  );
};

// --- SAYFALAR ---

const MicrosoftLoginPage = ({ onDemoLogin }: { onDemoLogin: (userIndex: number) => void }) => {
  const { instance } = useMsal();
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      await instance.loginPopup({ scopes: ["User.Read"], prompt: "select_account" });
    } catch (e: any) {
      console.error(e);
      setError("Azure ID Hatası: 'YOUR_CLIENT_ID_HERE' geçerli bir ID değil. Lütfen aşağıdaki Demo butonlarını kullanın.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200 text-center relative overflow-hidden">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-50 p-4 rounded-3xl">
             <AppLogo size={64} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Mesai Takip</h1>
        <p className="text-sm text-slate-400 mb-8">Kurumsal hesabınızla güvenli giriş.</p>
        
        <button onClick={handleLogin} className="w-full bg-[#2F2F2F] hover:bg-[#1a1a1a] text-white py-3.5 rounded-xl font-medium transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>
          <span className="font-semibold">Microsoft ile Giriş Yap</span>
        </button>

        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Veya Demo Seçin</span></div>
        </div>

        <div className="grid grid-cols-1 gap-3">
             <button onClick={() => onDemoLogin(2)} className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all bg-white">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><User size={20}/></div>
                    <div className="text-left"><div className="font-bold text-slate-700 group-hover:text-blue-700 text-sm">Personel</div><div className="text-[10px] text-slate-400">Mehmet Demir</div></div>
                 </div>
                 <div className="text-slate-300 group-hover:text-blue-500"><TrendingUp size={16}/></div>
             </button>

             <button onClick={() => onDemoLogin(1)} className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50 transition-all bg-white">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><BriefcaseIcon size={20}/></div>
                    <div className="text-left"><div className="font-bold text-slate-700 group-hover:text-orange-700 text-sm">Takım Lideri</div><div className="text-[10px] text-slate-400">Ali Koç</div></div>
                 </div>
                 <div className="text-slate-300 group-hover:text-orange-500"><Users size={16}/></div>
             </button>

             <button onClick={() => onDemoLogin(0)} className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-all bg-white">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><Crown size={20}/></div>
                    <div className="text-left"><div className="font-bold text-slate-700 group-hover:text-purple-700 text-sm">Admin</div><div className="text-[10px] text-slate-400">Ahmet Yılmaz</div></div>
                 </div>
                 <div className="text-slate-300 group-hover:text-purple-500"><UserCog size={16}/></div>
             </button>
        </div>

        {error && <div className="mt-6 p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-start gap-2 text-left"><AlertCircle size={16} className="shrink-0 mt-0.5"/><span>{error}</span></div>}
        <div className="mt-8 pt-6 border-t border-slate-100"><p className="text-[10px] text-slate-400">Powered by Microsoft Entra ID</p></div>
      </div>
    </div>
  );
};

const UserPage = ({ currentUser, onSaveToDatabase, onUpdateDatabase, database }: { currentUser: UserDefinition, onSaveToDatabase: (items: MesaiKaydi[]) => void, onUpdateDatabase: (db: MesaiKaydi[]) => void, database: MesaiKaydi[] }) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [stagingList, setStagingList] = useState<MesaiKaydi[]>([]);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [editItem, setEditItem] = useState<MesaiKaydi | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ donem: DONEMLER[0], isim: currentUser.name, tarih: getTodayString(), baslangic: "18:00", bitis: "20:00", neden: "" });

  const myHistory = useMemo(() => database.filter(i => i.kaydeden === currentUser.username).reverse(), [database, currentUser]);
  const totalApprovedHours = useMemo(() => myHistory.filter(i => i.durum === 'onaylandi').reduce((acc, curr) => { const h = calculateHours(curr.baslangic, curr.bitis); return acc + (h > 0 ? h : 0); }, 0), [myHistory]);
  const dayStatus = useMemo(() => getDayStatus(formData.tarih), [formData.tarih]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddToList = () => {
    if (!formData.neden.trim()) return setNotification({ msg: "Açıklama giriniz.", type: 'error' });
    const hours = calculateHours(formData.baslangic, formData.bitis);
    if (hours <= 0) return setNotification({ msg: "Geçersiz saat aralığı.", type: 'error' });
    if (checkForOverlap(formData.tarih, formData.baslangic, formData.bitis, myHistory) || checkForOverlap(formData.tarih, formData.baslangic, formData.bitis, stagingList)) return setNotification({ msg: "Çakışan kayıt mevcut.", type: 'error' });

    setStagingList([...stagingList, { id: Math.random().toString(36).substr(2, 9), ...formData, kaydeden: currentUser.username, kayitZamani: new Date().toLocaleString('tr-TR'), durum: 'bekliyor', mesaiTuru: dayStatus.type, carpan: dayStatus.carpan }]);
    setFormData({ ...formData, neden: "", baslangic: "18:00", bitis: "20:00" });
    setNotification({ msg: "Listeye eklendi.", type: 'success' });
  };

  const handleSend = () => { if (stagingList.length > 0) { onSaveToDatabase(stagingList); setStagingList([]); setActiveTab('history'); setNotification({ msg: "Onaya gönderildi.", type: 'success' }); } };
  const confirmDelete = () => { if (deleteId) { onUpdateDatabase(database.filter(i => i.id !== deleteId)); setDeleteId(null); setNotification({ msg: "Silindi.", type: 'success' }); } };
  const saveEdit = () => { if (editItem) { 
      const updatedDB = database.map(item => item.id === editItem.id ? { ...editItem, mesaiTuru: getDayStatus(editItem.tarih).type, carpan: getDayStatus(editItem.tarih).carpan } : item);
      onUpdateDatabase(updatedDB); setEditItem(null); setNotification({ msg: "Güncellendi.", type: 'success' }); 
  }};

  const inputClass = "w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none";
  
  return (
    <div className="relative">
      {notification && <Toast message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />}
      <div className="flex justify-end mb-4"><div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3"><Clock className="text-green-700" size={18} /><p className="text-lg font-bold text-slate-800">{totalApprovedHours.toFixed(1)} <span className="text-sm font-normal text-slate-500">Saat Onaylı</span></p></div></div>
      <div className="flex gap-4 mb-6 border-b pb-1">
        <button onClick={() => setActiveTab('new')} className={`pb-2 px-4 font-medium flex items-center gap-2 ${activeTab === 'new' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}><Plus size={18}/> Yeni Giriş</button>
        <button onClick={() => setActiveTab('history')} className={`pb-2 px-4 font-medium flex items-center gap-2 ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}><ListFilter size={18}/> Geçmiş ({myHistory.length})</button>
      </div>

      {activeTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Plus className="text-blue-600"/> Giriş Paneli</h2>
             <select name="donem" value={formData.donem} onChange={handleInputChange} className={inputClass}>{DONEMLER.map(d => <option key={d} value={d}>{d}</option>)}</select>
             <input type="text" value={formData.isim} readOnly className={`${inputClass} bg-slate-50 font-semibold`} />
             <input type="date" name="tarih" value={formData.tarih} onChange={handleInputChange} className={inputClass} />
             <div className="grid grid-cols-2 gap-3"><input type="time" name="baslangic" value={formData.baslangic} onChange={handleInputChange} className={inputClass}/><input type="time" name="bitis" value={formData.bitis} onChange={handleInputChange} className={inputClass}/></div>
             <textarea name="neden" value={formData.neden} onChange={handleInputChange} rows={3} className={inputClass} placeholder="Açıklama..."></textarea>
             <button onClick={handleAddToList} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"><Plus size={18}/> Ekle</button>
          </div>
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="p-4 border-b bg-slate-50 flex justify-between"><h3 className="font-bold text-slate-700">Taslaklar</h3><span className="text-xs bg-white px-2 py-1 rounded border">{stagingList.length}</span></div>
            <div className="flex-1 p-4 space-y-3 min-h-[300px]">
              {stagingList.map(item => (
                <div key={item.id} className="flex justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative">
                  <div><div className="font-bold text-slate-800">{item.tarih} ({item.baslangic}-{item.bitis})</div><div className="text-sm text-slate-600">{item.neden}</div></div>
                  <button onClick={() => setStagingList(stagingList.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-slate-50"><button onClick={handleSend} disabled={stagingList.length === 0} className="w-full bg-green-600 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Send size={18}/> ONAYA GÖNDER</button></div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs"><tr><th className="px-6 py-3">Durum</th><th className="px-6 py-3">Tarih</th><th className="px-6 py-3">Saat</th><th className="px-6 py-3">Süre</th><th className="px-6 py-3">Neden</th><th className="px-6 py-3 text-right">İşlem</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {myHistory.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4"><StatusBadge status={item.durum} />{item.reddedilmeNedeni && <div className="text-[10px] text-red-600 font-medium">{item.reddedilmeNedeni}</div>}</td>
                  <td className="px-6 py-4">{item.tarih}</td><td className="px-6 py-4">{item.baslangic}-{item.bitis}</td><td className="px-6 py-4">{Math.max(0, calculateHours(item.baslangic, item.bitis)).toFixed(2)} sa</td><td className="px-6 py-4 truncate max-w-xs">{item.neden}</td>
                  <td className="px-6 py-4 text-right">{item.durum === 'bekliyor' && <div className="flex justify-end gap-2"><button onClick={() => setEditItem(item)} className="text-blue-400"><Edit3 size={18}/></button><button onClick={() => setDeleteId(item.id)} className="text-red-400"><Trash2 size={18}/></button></div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* MODALS: Edit & Delete (Simplified for brevity but functional) */}
      {editItem && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-2xl w-96"><h3 className="font-bold mb-4">Düzenle</h3><input type="date" value={editItem.tarih} onChange={e => setEditItem({...editItem, tarih: e.target.value})} className={inputClass + " mb-2"}/><div className="flex gap-2 mb-2"><input type="time" value={editItem.baslangic} onChange={e=>setEditItem({...editItem, baslangic: e.target.value})} className={inputClass}/><input type="time" value={editItem.bitis} onChange={e=>setEditItem({...editItem, bitis: e.target.value})} className={inputClass}/></div><textarea value={editItem.neden} onChange={e=>setEditItem({...editItem, neden: e.target.value})} className={inputClass} rows={3}></textarea><div className="flex justify-end gap-2 mt-4"><button onClick={()=>setEditItem(null)} className="px-4 py-2">İptal</button><button onClick={saveEdit} className="bg-blue-600 text-white px-4 py-2 rounded">Kaydet</button></div></div></div>}
      {deleteId && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-2xl"><p className="mb-4">Emin misiniz?</p><div className="flex gap-2"><button onClick={()=>setDeleteId(null)} className="flex-1 py-2 bg-slate-100">Vazgeç</button><button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white">Sil</button></div></div></div>}
    </div>
  );
};

const TeamLeadPage = ({ currentUser, database, onUpdateDatabase, onSaveToDatabase, users }: { currentUser: UserDefinition, database: MesaiKaydi[], onUpdateDatabase: (db: MesaiKaydi[]) => void, onSaveToDatabase: (items: MesaiKaydi[]) => void, users: UserDefinition[] }) => {
  const [activeTab, setActiveTab] = useState<'team' | 'personal'>('team');
  const [rejectModal, setRejectModal] = useState<{isOpen: boolean, itemId: string | null, reason: string}>({isOpen: false, itemId: null, reason: ''});
  
  // -- DASHBOARD STATES --
  const [filterMonth, setFilterMonth] = useState("Tümü");
  const [filterPerson, setFilterPerson] = useState("Tümü");

  // -- PERSONAL ENTRY STATES --
  const [stagingList, setStagingList] = useState<MesaiKaydi[]>([]);
  const [formData, setFormData] = useState({ donem: DONEMLER[0], isim: currentUser.name, tarih: getTodayString(), baslangic: "18:00", bitis: "20:00", neden: "" });
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // -- TEAM DATA & FILTERS --
  const myDirectReports = useMemo(() => 
    users.filter(u => u.manager === currentUser.username).map(u => u.username), 
  [users, currentUser]);

  const teamDB = useMemo(() => database.filter(item => myDirectReports.includes(item.kaydeden)), [database, myDirectReports]);
  const pending = teamDB.filter(i => i.durum === 'bekliyor');
  
  const historyFiltered = useMemo(() => {
     return teamDB.filter(i => i.durum !== 'bekliyor').filter(item => {
        const matchMonth = filterMonth === "Tümü" || item.donem === filterMonth;
        const matchPerson = filterPerson === "Tümü" || item.isim === filterPerson;
        return matchMonth && matchPerson;
     });
  }, [teamDB, filterMonth, filterPerson]);

  // -- STATS --
  const teamStats = useMemo(() => {
     const totalApproved = teamDB.filter(i => i.durum === 'onaylandi').reduce((acc, curr) => acc + Math.max(0, calculateHours(curr.baslangic, curr.bitis)), 0);
     const pendingCount = pending.length;
     // Takım üyeleri listesi (filtre dropdown için)
     const teamMembers = users.filter(u => myDirectReports.includes(u.username)).map(u => u.name);
     return { totalApproved, pendingCount, teamMembers };
  }, [teamDB, pending, users, myDirectReports]);

  const dayStatus = useMemo(() => getDayStatus(formData.tarih), [formData.tarih]);

  // -- ACTIONS --
  const approve = (id: string) => onUpdateDatabase(database.map(i => i.id === id ? { ...i, durum: 'onaylandi' } : i));
  const reject = () => { if(rejectModal.itemId) { onUpdateDatabase(database.map(i => i.id === rejectModal.itemId ? { ...i, durum: 'reddedildi', reddedilmeNedeni: rejectModal.reason } : i)); setRejectModal({isOpen: false, itemId: null, reason: ''}); }};

  // -- PERSONAL ENTRY LOGIC --
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleAddToList = () => {
    if (!formData.neden.trim()) return setNotification({ msg: "Açıklama giriniz.", type: 'error' });
    const hours = calculateHours(formData.baslangic, formData.bitis);
    if (hours <= 0) return setNotification({ msg: "Geçersiz saat aralığı.", type: 'error' });
    if (checkForOverlap(formData.tarih, formData.baslangic, formData.bitis, stagingList)) return setNotification({ msg: "Çakışan kayıt mevcut.", type: 'error' });

    setStagingList([...stagingList, { id: Math.random().toString(36).substr(2, 9), ...formData, kaydeden: currentUser.username, kayitZamani: new Date().toLocaleString('tr-TR'), durum: 'onaylandi', mesaiTuru: dayStatus.type, carpan: dayStatus.carpan }]);
    setFormData({ ...formData, neden: "", baslangic: "18:00", bitis: "20:00" });
    setNotification({ msg: "Otomatik onaylı olarak listeye eklendi.", type: 'success' });
  };

  const handleSend = () => { if (stagingList.length > 0) { onSaveToDatabase(stagingList); setStagingList([]); setNotification({ msg: "Kayıtlar sisteme işlendi.", type: 'success' }); } };

  const inputClass = "w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-800 shadow-sm focus:ring-2 focus:ring-orange-500 outline-none";

  return (
    <div className="space-y-6">
      {notification && <Toast message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />}
      
      <div className="flex gap-4 mb-6">
         <button onClick={() => setActiveTab('team')} className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'team' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}><LayoutDashboard size={20}/> Ekip Yönetimi & Dashboard</button>
         <button onClick={() => setActiveTab('personal')} className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'personal' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}><UserPlus size={20}/> Şahsi Mesai Girişi (Oto-Onay)</button>
      </div>
      
      {activeTab === 'team' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
           {/* DASHBOARD STATS */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                 <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><Users size={24}/></div>
                 <div><div className="text-2xl font-bold text-slate-800">{myDirectReports.length}</div><div className="text-xs text-slate-500">Bağlı Personel</div></div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                 <div className="p-3 bg-red-100 text-red-600 rounded-lg"><AlertCircle size={24}/></div>
                 <div><div className="text-2xl font-bold text-slate-800">{teamStats.pendingCount}</div><div className="text-xs text-slate-500">Onay Bekleyen Talep</div></div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                 <div className="p-3 bg-green-100 text-green-600 rounded-lg"><Clock size={24}/></div>
                 <div><div className="text-2xl font-bold text-slate-800">{teamStats.totalApproved.toFixed(1)}</div><div className="text-xs text-slate-500">Bu Ay Onaylanan Saat</div></div>
              </div>
           </div>

           {/* PENDING APPROVALS */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 bg-orange-50 font-bold text-orange-800 border-b border-orange-100 flex items-center gap-2"><AlertCircle size={18}/> Onay Bekleyenler ({pending.length})</div>
             <table className="w-full text-sm text-left text-slate-600">
               <thead className="bg-slate-50 text-slate-500 uppercase text-xs"><tr><th className="px-6 py-3">Personel</th><th className="px-6 py-3">Tarih</th><th className="px-6 py-3">Saat</th><th className="px-6 py-3">Açıklama</th><th className="px-6 py-3 text-center">İşlem</th></tr></thead>
               <tbody className="divide-y divide-slate-100">
                 {pending.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-slate-400">Bekleyen talep yok, her şey yolunda! 👍</td></tr> : pending.map(i => (
                   <tr key={i.id}><td className="px-6 py-4 font-bold">{i.isim}</td><td className="px-6 py-4">{i.tarih}</td><td className="px-6 py-4">{i.baslangic}-{i.bitis}</td><td className="px-6 py-4">{i.neden}</td><td className="px-6 py-4 flex justify-center gap-2"><button onClick={()=>approve(i.id)} className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded font-bold transition-colors">Onayla</button><button onClick={()=>setRejectModal({isOpen:true, itemId: i.id, reason: ''})} className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded font-bold transition-colors">Reddet</button></td></tr>
                 ))}
               </tbody>
             </table>
           </div>

           {/* HISTORY WITH FILTERS */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 bg-slate-50 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="font-bold text-slate-700 flex items-center gap-2"><Database size={18}/> Ekip Geçmişi</div>
                 <div className="flex gap-2">
                    <select value={filterPerson} onChange={e => setFilterPerson(e.target.value)} className="text-sm p-2 border rounded-lg bg-white"><option value="Tümü">Tüm Personel</option>{teamStats.teamMembers.map(m => <option key={m} value={m}>{m}</option>)}</select>
                    <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="text-sm p-2 border rounded-lg bg-white"><option value="Tümü">Tüm Dönemler</option>{DONEMLER.map(d => <option key={d} value={d}>{d}</option>)}</select>
                 </div>
             </div>
             <div className="max-h-[400px] overflow-y-auto">
             <table className="w-full text-sm text-left text-slate-600">
               <thead className="bg-slate-50 text-slate-500 uppercase text-xs sticky top-0"><tr><th className="px-6 py-3">Durum</th><th className="px-6 py-3">Personel</th><th className="px-6 py-3">Tarih</th><th className="px-6 py-3">Saat</th><th className="px-6 py-3">Açıklama</th></tr></thead>
               <tbody className="divide-y divide-slate-100">
                 {historyFiltered.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-slate-400">Kayıt bulunamadı.</td></tr> : historyFiltered.map(i => (<tr key={i.id}><td className="px-6 py-4"><StatusBadge status={i.durum}/></td><td className="px-6 py-4 font-bold">{i.isim}</td><td className="px-6 py-4">{i.tarih}</td><td className="px-6 py-4 text-xs font-mono">{i.baslangic}-{i.bitis} <span className="text-slate-400">({Math.max(0, calculateHours(i.baslangic, i.bitis))}s)</span></td><td className="px-6 py-4">{i.neden}</td></tr>))}
               </tbody>
             </table>
             </div>
           </div>
        </div>
      )}

      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4 border-l-4 border-l-blue-600">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><UserPlus className="text-blue-600"/> Şahsi Giriş Paneli</h2>
             <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg mb-4">
                <strong>Bilgi:</strong> Takım Lideri olarak girdiğiniz kayıtlar <u>otomatik olarak onaylanacaktır</u>.
             </div>
             <select name="donem" value={formData.donem} onChange={handleInputChange} className={inputClass}>{DONEMLER.map(d => <option key={d} value={d}>{d}</option>)}</select>
             <input type="text" value={formData.isim} readOnly className={`${inputClass} bg-slate-50 font-semibold`} />
             <input type="date" name="tarih" value={formData.tarih} onChange={handleInputChange} className={inputClass} />
             <div className="grid grid-cols-2 gap-3"><input type="time" name="baslangic" value={formData.baslangic} onChange={handleInputChange} className={inputClass}/><input type="time" name="bitis" value={formData.bitis} onChange={handleInputChange} className={inputClass}/></div>
             <textarea name="neden" value={formData.neden} onChange={handleInputChange} rows={3} className={inputClass} placeholder="Açıklama..."></textarea>
             <button onClick={handleAddToList} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"><Plus size={18}/> Oto-Onaylı Ekle</button>
          </div>
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="p-4 border-b bg-slate-50 flex justify-between"><h3 className="font-bold text-slate-700">Kaydedilecek Listesi</h3><span className="text-xs bg-white px-2 py-1 rounded border">{stagingList.length}</span></div>
            <div className="flex-1 p-4 space-y-3 min-h-[300px]">
              {stagingList.map(item => (
                <div key={item.id} className="flex justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative group">
                  <div>
                      <div className="font-bold text-slate-800 flex items-center gap-2">{item.tarih} <span className="text-xs bg-green-100 text-green-700 px-2 rounded-full">Otomatik Onay</span></div>
                      <div className="text-sm text-slate-600">{item.neden} ({item.baslangic}-{item.bitis})</div>
                  </div>
                  <button onClick={() => setStagingList(stagingList.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-slate-50"><button onClick={handleSend} disabled={stagingList.length === 0} className="w-full bg-green-600 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Save size={18}/> KAYDET VE BİTİR</button></div>
          </div>
        </div>
      )}
      
      {rejectModal.isOpen && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-2xl w-96"><h3 className="font-bold mb-2 text-red-600">Reddet</h3><textarea value={rejectModal.reason} onChange={e=>setRejectModal({...rejectModal, reason: e.target.value})} className="w-full border p-2 rounded" rows={3} placeholder="Sebep..."></textarea><div className="flex justify-end gap-2 mt-4"><button onClick={()=>setRejectModal({isOpen:false, itemId:null, reason:''})} className="px-4 py-2">İptal</button><button onClick={reject} className="bg-red-600 text-white px-4 py-2 rounded">Reddet</button></div></div></div>}
    </div>
  );
};

const AdminPage = ({ database, onUpdateDatabase, users, setUsers }: { database: MesaiKaydi[], onUpdateDatabase: (db: MesaiKaydi[]) => void, users: UserDefinition[], setUsers: (u: UserDefinition[]) => void }) => {
  const [tab, setTab] = useState<'report' | 'db' | 'users'>('report');
  
  // Filter States
  const [filterText, setFilterText] = useState("");
  const [filterMonth, setFilterMonth] = useState("Tümü");
  const [filterStatus, setFilterStatus] = useState("Tümü");
  const [filterDept, setFilterDept] = useState("Tümü");

  // Edit States
  const [adminEditItem, setAdminEditItem] = useState<MesaiKaydi | null>(null);
  const [userEditModal, setUserEditModal] = useState<{isOpen: boolean, user: UserDefinition | null, isNew: boolean}>({isOpen: false, user: null, isNew: false});

  // --- DERIVED DATA ---
  const departments = useMemo(() => Array.from(new Set(users.map(u => u.department || "Diğer"))), [users]);
  // Mevcut Takım Liderlerini Listele (User Edit Modalı için)
  const availableLeaders = useMemo(() => users.filter(u => u.role === 'team_lead'), [users]);
  
  const filteredDB = useMemo(() => {
    return database.filter(item => {
      const matchText = item.isim.toLowerCase().includes(filterText.toLowerCase()) || item.neden.toLowerCase().includes(filterText.toLowerCase());
      const matchMonth = filterMonth === "Tümü" || item.donem === filterMonth;
      const matchStatus = filterStatus === "Tümü" || item.durum === filterStatus;
      // Departman filtresi için kullanıcı listesinden eşleşme bulmamız gerek
      const userDept = users.find(u => u.username === item.kaydeden)?.department || "Diğer";
      const matchDept = filterDept === "Tümü" || userDept === filterDept;
      
      return matchText && matchMonth && matchStatus && matchDept;
    });
  }, [database, filterText, filterMonth, filterStatus, filterDept, users]);

  const stats = useMemo(() => {
    const totalHours = database.reduce((acc, curr) => acc + Math.max(0, calculateHours(curr.baslangic, curr.bitis)), 0);
    const approvedHours = database.filter(i => i.durum === 'onaylandi').reduce((acc, curr) => acc + Math.max(0, calculateHours(curr.baslangic, curr.bitis)), 0);
    const costFactor = database.filter(i => i.durum === 'onaylandi').reduce((acc, curr) => acc + (Math.max(0, calculateHours(curr.baslangic, curr.bitis)) * curr.carpan), 0);
    const pendingCount = database.filter(i => i.durum === 'bekliyor').length;
    
    // Dept Stats
    const deptStats = departments.map(dept => {
       const deptUsers = users.filter(u => u.department === dept).map(u => u.username);
       const deptHours = database.filter(i => deptUsers.includes(i.kaydeden) && i.durum === 'onaylandi')
                                 .reduce((acc, curr) => acc + Math.max(0, calculateHours(curr.baslangic, curr.bitis)), 0);
       return { name: dept, value: deptHours };
    }).sort((a,b) => b.value - a.value);

    return { totalHours, approvedHours, pendingCount, costFactor, deptStats };
  }, [database, users, departments]);

  // --- ACTIONS ---
  const handleSaveAdminEdit = () => {
    if (adminEditItem) {
      const dayInfo = getDayStatus(adminEditItem.tarih);
      const updated = { ...adminEditItem, mesaiTuru: dayInfo.type, carpan: dayInfo.carpan };
      onUpdateDatabase(database.map(i => i.id === adminEditItem.id ? updated : i));
      setAdminEditItem(null);
    }
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Bu kayıt kalıcı olarak silinecek. Onaylıyor musunuz?")) {
      onUpdateDatabase(database.filter(i => i.id !== id));
    }
  };

  const handleUserSave = (user: UserDefinition) => {
    // Eğer rol 'user' değilse manager alanını temizleyebiliriz veya tutabiliriz. Şimdilik temizleyelim.
    if (user.role !== 'user') {
        user.manager = undefined;
    }

    if (userEditModal.isNew) {
      setUsers([...users, { ...user, id: Math.random().toString() }]);
    } else {
      setUsers(users.map(u => u.id === user.id ? user : u));
    }
    setUserEditModal({isOpen: false, user: null, isNew: false});
  };

  const handleUserDelete = (id: string) => {
    if (confirm("Kullanıcı silindiğinde geçmiş mesai kayıtları silinmez ancak sisteme giriş yapamaz. Devam edilsin mi?")) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const getManagerName = (managerUsername?: string) => {
      if(!managerUsername) return "-";
      const m = users.find(u => u.username === managerUsername);
      return m ? m.name : managerUsername;
  };

  return (
    <div className="space-y-6">
       {/* TAB NAVIGATION */}
       <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button onClick={() => setTab('report')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${tab === 'report' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}><PieChart size={16}/> Raporlar</button>
          <button onClick={() => setTab('db')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${tab === 'db' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}><Database size={16}/> Veritabanı</button>
          <button onClick={() => setTab('users')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${tab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}><Users size={16}/> Kullanıcılar</button>
       </div>
       
       {/* --- RAPORLAR TAB --- */}
       {tab === 'report' && (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4"><div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Clock size={24}/></div><span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">Onaylı</span></div>
                  <div className="text-3xl font-bold text-slate-800">{stats.approvedHours.toFixed(1)}</div>
                  <div className="text-sm text-slate-500 mt-1">Toplam Onaylı Saat</div>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4"><div className="p-2 bg-orange-50 rounded-lg text-orange-600"><AlertCircle size={24}/></div></div>
                  <div className="text-3xl font-bold text-slate-800">{stats.pendingCount}</div>
                  <div className="text-sm text-slate-500 mt-1">Bekleyen Talep</div>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4"><div className="p-2 bg-purple-50 rounded-lg text-purple-600"><TrendingUp size={24}/></div></div>
                  <div className="text-3xl font-bold text-slate-800">{stats.costFactor.toFixed(1)}</div>
                  <div className="text-sm text-slate-500 mt-1">Maliyet Birimi (x Çarpan)</div>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4"><div className="p-2 bg-slate-50 rounded-lg text-slate-600"><Briefcase size={24}/></div></div>
                  <div className="text-3xl font-bold text-slate-800">{stats.totalHours.toFixed(1)}</div>
                  <div className="text-sm text-slate-500 mt-1">Genel Toplam (Tüm Durumlar)</div>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-700 mb-6">Departman Bazlı Mesai Dağılımı (Saat)</h3>
               <div className="space-y-4">
                  {stats.deptStats.map(d => (
                    <div key={d.name}>
                       <div className="flex justify-between text-sm font-medium mb-1"><span className="text-slate-600">{d.name}</span><span className="text-slate-800">{d.value.toFixed(1)} Saat</span></div>
                       <div className="w-full bg-slate-100 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, (d.value / (stats.approvedHours || 1)) * 100)}%` }}></div></div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
       )}

       {/* --- VERİTABANI TAB --- */}
       {tab === 'db' && (
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="p-4 bg-slate-50 border-b space-y-4">
               <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                  <span className="font-bold flex items-center gap-2"><Database size={18}/> Kayıt Yönetimi ({filteredDB.length})</span>
                  <button onClick={()=>exportToCSV(database)} className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex gap-2 items-center transition-all"><Download size={16}/> Excel İndir</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={16}/><input type="text" placeholder="İsim veya Açıklama Ara..." value={filterText} onChange={e => setFilterText(e.target.value)} className="w-full pl-9 p-2 border rounded-lg text-sm"/></div>
                  <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="p-2 border rounded-lg text-sm bg-white"><option value="Tümü">Tüm Dönemler</option>{DONEMLER.map(d => <option key={d} value={d}>{d}</option>)}</select>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="p-2 border rounded-lg text-sm bg-white"><option value="Tümü">Tüm Durumlar</option><option value="bekliyor">Bekliyor</option><option value="onaylandi">Onaylandı</option><option value="reddedildi">Reddedildi</option></select>
                  <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="p-2 border rounded-lg text-sm bg-white"><option value="Tümü">Tüm Departmanlar</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select>
               </div>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
               <thead className="bg-slate-50 text-slate-500 uppercase text-xs"><tr><th className="px-6 py-3">Durum</th><th className="px-6 py-3">Personel</th><th className="px-6 py-3">Tarih</th><th className="px-6 py-3">Saat</th><th className="px-6 py-3">Tür</th><th className="px-6 py-3">İşlem</th></tr></thead>
               <tbody className="divide-y divide-slate-100">
                 {filteredDB.map(i => (
                    <tr key={i.id} className="hover:bg-slate-50">
                       <td className="px-6 py-4"><StatusBadge status={i.durum}/></td>
                       <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{i.isim}</div>
                          <div className="text-xs text-slate-400">{i.kaydeden}</div>
                       </td>
                       <td className="px-6 py-4">{i.tarih}</td>
                       <td className="px-6 py-4">{i.baslangic} - {i.bitis}</td>
                       <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs border border-slate-200">{i.mesaiTuru} (x{i.carpan})</span></td>
                       <td className="px-6 py-4 flex gap-2">
                          <button onClick={() => setAdminEditItem(i)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit3 size={16}/></button>
                          <button onClick={() => handleDeleteItem(i.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                       </td>
                    </tr>
                 ))}
               </tbody>
            </table>
            </div>
         </div>
       )}

       {/* --- KULLANICILAR TAB --- */}
       {tab === 'users' && (
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
               <span className="font-bold flex items-center gap-2"><Users size={18}/> Sistem Kullanıcıları</span>
               <button onClick={() => setUserEditModal({isOpen: true, isNew: true, user: {id: "", name:"", username:"", role:"user", department:""}})} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2"><Plus size={16}/> Yeni Kullanıcı</button>
            </div>
            <table className="w-full text-sm text-left text-slate-600">
               <thead className="bg-slate-50 text-slate-500 uppercase text-xs"><tr><th className="px-6 py-3">İsim</th><th className="px-6 py-3">Email</th><th className="px-6 py-3">Rol</th><th className="px-6 py-3">Bağlı Olduğu Lider</th><th className="px-6 py-3">İşlem</th></tr></thead>
               <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                     <tr key={u.id}>
                        <td className="px-6 py-4 font-bold">{u.name}</td><td className="px-6 py-4">{u.username}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'team_lead' ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>{u.role}</span></td>
                        <td className="px-6 py-4">
                            {u.role === 'user' ? (
                                u.manager ? <div className="flex items-center gap-1 text-slate-800"><GitBranch size={14} className="text-slate-400"/> {getManagerName(u.manager)}</div> : <span className="text-red-400 text-xs italic">Yönetici Atanmadı</span>
                            ) : (
                                <span className="text-slate-300">-</span>
                            )}
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                           <button onClick={()=>setUserEditModal({isOpen: true, isNew: false, user: u})} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit3 size={16}/></button>
                           {u.role !== 'admin' && <button onClick={()=>handleUserDelete(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
       )}

       {/* --- MODAL: ADMIN EDIT RECORD --- */}
       {adminEditItem && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
               <div className="flex justify-between items-center mb-6 border-b pb-2">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><ShieldAlert className="text-purple-600"/> Kayıt Düzenle (Admin)</h3>
                  <button onClick={() => setAdminEditItem(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
               </div>
               <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Durum (Zorla Değiştir)</label>
                    <select value={adminEditItem.durum} onChange={e => setAdminEditItem({...adminEditItem, durum: e.target.value as MesaiDurumu})} className="w-full p-2 border-2 border-purple-100 rounded-lg bg-purple-50 font-bold text-purple-900 focus:outline-none focus:border-purple-500">
                       <option value="bekliyor">Bekliyor</option>
                       <option value="onaylandi">ONAYLANDI</option>
                       <option value="reddedildi">REDDEDİLDİ</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="text-xs text-slate-500">Tarih</label><input type="date" value={adminEditItem.tarih} onChange={e => setAdminEditItem({...adminEditItem, tarih: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
                     <div><label className="text-xs text-slate-500">Dönem</label><select value={adminEditItem.donem} onChange={e => setAdminEditItem({...adminEditItem, donem: e.target.value})} className="w-full p-2 border rounded-lg">{DONEMLER.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="text-xs text-slate-500">Başlangıç</label><input type="time" value={adminEditItem.baslangic} onChange={e => setAdminEditItem({...adminEditItem, baslangic: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
                     <div><label className="text-xs text-slate-500">Bitiş</label><input type="time" value={adminEditItem.bitis} onChange={e => setAdminEditItem({...adminEditItem, bitis: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
                  </div>
                  <div>
                     <label className="text-xs text-slate-500">Açıklama</label>
                     <textarea value={adminEditItem.neden} onChange={e => setAdminEditItem({...adminEditItem, neden: e.target.value})} rows={3} className="w-full p-2 border rounded-lg"></textarea>
                  </div>
               </div>
               <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setAdminEditItem(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">İptal</button>
                  <button onClick={handleSaveAdminEdit} className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 flex items-center gap-2"><Save size={18}/> Değişiklikleri Kaydet</button>
               </div>
            </div>
         </div>
       )}

       {/* --- MODAL: USER EDIT/ADD --- */}
       {userEditModal.isOpen && userEditModal.user && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
               <h3 className="font-bold text-lg mb-4">{userEditModal.isNew ? "Yeni Kullanıcı Ekle" : "Kullanıcı Düzenle"}</h3>
               <div className="space-y-3">
                  <input type="text" placeholder="Ad Soyad" value={userEditModal.user.name} onChange={e => setUserEditModal({...userEditModal, user: {...userEditModal.user!, name: e.target.value}})} className="w-full p-2 border rounded-lg"/>
                  <input type="email" placeholder="E-Posta" value={userEditModal.user.username} onChange={e => setUserEditModal({...userEditModal, user: {...userEditModal.user!, username: e.target.value}})} className="w-full p-2 border rounded-lg" disabled={!userEditModal.isNew}/>
                  
                  <div className="grid grid-cols-2 gap-2">
                     <div>
                        <label className="text-xs text-slate-500 ml-1">Kullanıcı Rolü</label>
                        <select value={userEditModal.user.role} onChange={e => setUserEditModal({...userEditModal, user: {...userEditModal.user!, role: e.target.value as UserRole}})} className="w-full p-2 border rounded-lg">
                            <option value="user">Personel (User)</option>
                            <option value="team_lead">Takım Lideri</option>
                            <option value="admin">Yönetici (Admin)</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-xs text-slate-500 ml-1">Departman</label>
                        <input type="text" placeholder="IT, Satış..." value={userEditModal.user.department || ''} onChange={e => setUserEditModal({...userEditModal, user: {...userEditModal.user!, department: e.target.value}})} className="w-full p-2 border rounded-lg"/>
                     </div>
                  </div>

                  {userEditModal.user.role === 'user' && (
                      <div className="animate-in fade-in slide-in-from-top-1">
                          <label className="text-xs text-slate-500 ml-1 font-bold text-orange-600">Bağlı Olduğu Lider (Zorunlu)</label>
                          <select value={userEditModal.user.manager || ''} onChange={e => setUserEditModal({...userEditModal, user: {...userEditModal.user!, manager: e.target.value}})} className="w-full p-2 border-2 border-orange-100 rounded-lg bg-orange-50 text-slate-800">
                             <option value="">Lider Seçiniz...</option>
                             {availableLeaders.map(l => (
                                 <option key={l.id} value={l.username}>{l.name} ({l.department})</option>
                             ))}
                          </select>
                      </div>
                  )}
                  {/* Eski Takım Alanı - Artık opsiyonel veya gizli olabilir ama veri yapısını bozmamak için tutuyoruz, sadece readonly yapıyoruz veya otomatik dolduruyoruz */}
               </div>
               <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setUserEditModal({isOpen: false, user: null, isNew: false})} className="px-4 py-2 text-slate-600">İptal</button>
                  <button onClick={() => handleUserSave(userEditModal.user!)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Kaydet</button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

// --- ANA UYGULAMA MANTIĞI (Routing ve State) ---

const MainContent = () => {
  const { accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  
  // State
  const [currentUser, setCurrentUser] = useState<UserDefinition | null>(null);
  const [database, setDatabase] = useState<MesaiKaydi[]>([]);
  const [users, setUsers] = useState<UserDefinition[]>(INITIAL_USERS);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Demo modunda özel kullanıcı atanmadıysa (MainContent mount olduğunda)
    // Bu kısım handleDemoLogin fonksiyonu tarafından yönetilecek
    if (!isDemoMode && isAuthenticated && accounts.length > 0) {
      const email = accounts[0].username; // Entra ID'den gelen email
      const matchedUser = users.find(u => u.username.toLowerCase() === email.toLowerCase());
      
      if (matchedUser) {
        setCurrentUser(matchedUser);
      } else {
        // Sistemde kayıtlı değilse misafir/standart kullanıcı olarak ekle
        const newUser: UserDefinition = {
           id: Math.random().toString(),
           username: email,
           name: accounts[0].name || "Misafir Kullanıcı",
           role: 'user',
           department: 'Genel'
        };
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
      }
    } else if (!isDemoMode && !isAuthenticated) {
      setCurrentUser(null);
    }
  }, [isAuthenticated, accounts, users, isDemoMode]);

  const handleDemoLogin = (userIndex: number) => {
      setIsDemoMode(true);
      setCurrentUser(INITIAL_USERS[userIndex]);
  };

  const handleLogout = () => {
     if (isDemoMode) {
         setIsDemoMode(false);
         setCurrentUser(null);
     } else {
         msalInstance.logoutPopup();
         setCurrentUser(null);
     }
  };

  if (!isAuthenticated && !isDemoMode) {
    return <MicrosoftLoginPage onDemoLogin={handleDemoLogin} />;
  }

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48}/></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-10">
       <header className="bg-white border-b border-slate-200 sticky top-0 z-[100] shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
             <div className="flex items-center gap-3"><AppLogo size={32}/><div><h1 className="text-lg font-bold text-slate-800">Mesai Takip</h1><p className="text-xs text-slate-400">Kurumsal</p></div></div>
             <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end"><span className="text-sm font-bold text-slate-800">{currentUser.name}</span><span className="text-xs text-slate-500">{currentUser.role}</span></div>
                <button onClick={handleLogout} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"><LogOut size={20}/></button>
             </div>
          </div>
       </header>

       <main className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
          {currentUser.role === 'user' && (
             <div className="space-y-2">
                <div className="flex items-center justify-between mb-4"><h2 className="text-2xl font-bold text-slate-800">Merhaba, {currentUser.name.split(' ')[0]} 👋</h2></div>
                <UserPage currentUser={currentUser} onSaveToDatabase={items => setDatabase([...database, ...items])} onUpdateDatabase={setDatabase} database={database} />
             </div>
          )}
          {currentUser.role === 'team_lead' && (
             <div>
                <div className="mb-6"><h2 className="text-2xl font-bold text-slate-800">Lider Paneli</h2></div>
                <TeamLeadPage currentUser={currentUser} database={database} onUpdateDatabase={setDatabase} onSaveToDatabase={items => setDatabase([...database, ...items])} users={users} />
             </div>
          )}
          {currentUser.role === 'admin' && (
             <div>
                <div className="mb-6"><h2 className="text-2xl font-bold text-slate-800">Yönetim Konsolu</h2></div>
                <AdminPage database={database} onUpdateDatabase={setDatabase} users={users} setUsers={setUsers} />
             </div>
          )}
       </main>
    </div>
  );
};

const App = () => {
  return (
    <MsalProvider instance={msalInstance}>
      <MainContent />
    </MsalProvider>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}