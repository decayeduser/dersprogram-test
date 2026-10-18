import React, { useState } from 'react';
import {
  X,
  Keyboard,
  Info,
  Download,
  Upload,
  CheckCircle2,
  FolderOpen,
  Terminal,
  FileCode,
  Copy,
  Check,
} from 'lucide-react';
import { syncEngine } from '../../utils/syncEngine';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
        {/* Başlık */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-850 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-100">ÖğretmenMasası.exe Hakkında</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* İçerik */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/desktop_app_icon_1792329731004.jpg"
              alt="Öğretmen Masası Logo"
              className="w-12 h-12 rounded-lg object-cover ring-1 ring-slate-700"
            />
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">Öğretmen Masası</h4>
              <p className="text-slate-400 text-xs font-mono">v4.0.0 (Windows Taşınabilir Masaüstü - x64)</p>
              <p className="text-emerald-400 text-[11px]">Ders Başı Ücretlendirme & Sınav Takip Yazılımı</p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono text-[11px]">
              <span className="text-slate-400">Ücretlendirme Modeli:</span>
              <span className="text-emerald-400 font-bold">Ders Başına Sabit Ücret (₺/ders)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono text-[11px]">
              <span className="text-slate-400">Geri Alma (Undo):</span>
              <span className="text-amber-400 font-bold">Ctrl + Z (Sınırsız Geçmiş)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono text-[11px]">
              <span className="text-slate-400">Sürükle-Bırak Düzeni:</span>
              <span className="text-sky-300 font-bold">30 Dakikalık Aralıklarla Yapışma (:00, :30)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono text-[11px]">
              <span className="text-slate-400">Haftalık Tekrarlama:</span>
              <span className="text-slate-200">Gelecek tüm haftalara tek tıkla çoğaltma</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono text-[11px]">
              <span className="text-slate-400">Depolama:</span>
              <span className="text-slate-200">100% Yerel / Çevrimdışı (Bulutsuz)</span>
            </div>
          </div>

          <p className="text-slate-400 text-[11px] leading-relaxed">
            ÖğretmenMasası, özel ders veren öğretmenler için geliştirilmiş yerel masaüstü yazılımıdır.
            Dersleri çizelge üzerinde elinizle sürükleyip bırakarak her yarım saate (:00, :30) anında oturtabilir,
            hatalı işlemleri Ctrl+Z ile geri alabilir ve dersleri gelecek haftalara zahmetsizce planlayabilirsiniz.
          </p>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded text-xs font-medium transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ShortcutsModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + Z', desc: 'Son Yapılan İşlemi Geri Al (Undo)' },
    { key: 'Fare ile Sürükle', desc: 'Dersi 30 Dakikalık Dilimlere (:00, :30) Yapıştırarak Taşı' },
    { key: 'Ctrl + K', desc: 'Hızlı Arama ve Komut Paletini Aç' },
    { key: 'Ctrl + N', desc: 'Yeni Ders Planla' },
    { key: 'Ctrl + U', desc: 'Yeni Öğrenci Ekle' },
    { key: '1, 2, 3, 4', desc: 'Takvim, Öğrenciler, Sınav Sonuçları, İstatistikler arasında geçiş yap' },
    { key: 'Esc', desc: 'Açık pencere veya menüyü kapat' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-850 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-100">Masaüstü Klavye Kısayolları</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-800/60 text-xs"
            >
              <span className="text-slate-300">{sc.desc}</span>
              <kbd className="font-mono text-[11px] bg-slate-800 border border-slate-700 text-sky-300 px-2 py-0.5 rounded shadow-xs">
                {sc.key}
              </kbd>
            </div>
          ))}

          <div className="flex justify-end pt-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded text-xs font-medium transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LauncherDownloadModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const scriptCode = syncEngine.generateWindowsLauncherScript();

  const handleDownload = () => {
    const blob = new Blob([scriptCode], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'OgretmenMasasi-Baslatici.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-850 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              OgretmenMasasi.exe Masaüstü Başlatıcı Dosyası
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-slate-300">
          <p className="text-slate-300 leading-relaxed">
            ÖğretmenMasası'nı Windows üzerinde tıpkı derlenmiş bir{' '}
            <code className="text-emerald-300 font-mono bg-slate-800 px-1 py-0.5 rounded">.exe</code>{' '}
            yazılımı gibi çerçevesiz yerel pencerede çalıştırmak için başlatıcı toplu iş dosyasını (.bat) indirin!
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-md p-3 relative font-mono text-[11px] text-slate-300 overflow-x-auto max-h-40">
            <pre>{scriptCode}</pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
              title="Kopyala"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="bg-sky-950/40 border border-sky-800/60 rounded p-3 text-[11px] text-sky-200 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-sky-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>%100 Çevrimdışı Çalışma Garantisi</span>
            </div>
            <p className="text-sky-300/80">
              Veritabanı doğrudan yerel diskinizdeki IndexedDB depolama alanına kaydedilir. İnternet olmasa dahi
              çift tıklayarak anında çalıştırabilirsiniz.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-xs transition-colors"
            >
              Kapat
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>OgretmenMasasi-Baslatici.bat İndir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ExportBackupModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleExport = () => {
    const jsonStr = syncEngine.exportDatabaseAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OgretmenMasasi-Yedek-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-850 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-100">Veritabanını Dışa Aktar</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            Öğrenci kayıtlarınızı, ders programınızı, sınav notlarını ve mali defterinizi tek bir{' '}
            <code className="text-sky-300 font-mono">.json</code> yedek dosyası olarak bilgisayarınıza indirin.
          </p>

          <div className="bg-slate-950 border border-slate-800 p-3 rounded text-[11px] font-mono text-slate-400">
            <div>İçerik: Tüm Öğrenciler, Dersler, Notlar ve Ücretler</div>
            <div>Format: JSON Nesne Yapısı</div>
            <div>Uyumluluk: Çevrimdışı ve Platform Bağımsız</div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-xs transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON Yedeği İndir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ImportBackupModal: React.FC<ModalProps & { onImportSuccess: () => void }> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!jsonInput.trim()) {
      setError('Lütfen bir yedek dosyası seçin veya JSON metnini yapıştırın.');
      return;
    }

    const success = syncEngine.importDatabaseFromJson(jsonInput);
    if (success) {
      onImportSuccess();
      onClose();
    } else {
      setError('Geçersiz yedek formatı. Dosyanın ÖğretmenMasası şemasına uygun olduğundan emin olun.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-850 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">Yedekten Geri Yükle</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            Daha önce indirdiğiniz bir <code className="text-sky-300 font-mono">.json</code> yedek dosyasını
            yükleyerek tüm öğrenci ve ders kayıtlarınızı geri yükleyin.
          </p>

          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
          />

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Veya JSON içeriğini buraya yapıştırın:</label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"app": "OgretmenMasasi.exe", "database": { ... }}'
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded p-2 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-sky-500"
            />
          </div>

          {error && <p className="text-rose-400 text-xs">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-xs transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Veritabanını Yükle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
