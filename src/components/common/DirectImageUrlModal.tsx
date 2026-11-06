import { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  RefreshCw,
  Link as LinkIcon,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { resolveDirectImageUrl } from './ImageWithFallback';

interface DirectImageUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentUrl: string;
  currentPosition?: string;
  onSave: (url: string, position: string) => Promise<void>;
  suggestedAspectRatio?: string;
}

// Compress image on canvas to avoid huge base64 payload in Firestore (under 200KB)
async function compressImageFile(file: File, maxDimension = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Không thể giải mã dữ liệu ảnh'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Try webp first, fallback to jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function DirectImageUrlModal({
  isOpen,
  onClose,
  title,
  currentUrl,
  currentPosition = '50% 50%',
  onSave,
  suggestedAspectRatio = '3/4'
}: DirectImageUrlModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [positionInput, setPositionInput] = useState('50% 50%');
  const [previewSrc, setPreviewSrc] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initial = currentUrl || '';
      setUrlInput(initial);
      setPreviewSrc(resolveDirectImageUrl(initial));
      setPositionInput(currentPosition || '50% 50%');
      setStatus(initial ? 'valid' : 'idle');
      setErrorMessage('');
      // Default to file upload tab for smoother mobile usage
      setActiveTab(initial.startsWith('data:') ? 'upload' : 'url');
    }
  }, [isOpen, currentUrl, currentPosition]);

  if (!isOpen) return null;

  // Auto clean & resolve url
  const handleUrlInputChange = (val: string) => {
    setUrlInput(val);
    const resolved = resolveDirectImageUrl(val);
    setPreviewSrc(resolved);

    if (!val.trim()) {
      setStatus('idle');
      setErrorMessage('');
      return;
    }

    setStatus('checking');
    setErrorMessage('');

    const img = new Image();
    img.onload = () => {
      setStatus('valid');
      setErrorMessage('');
    };
    img.onerror = () => {
      // Even if img.onerror fires, Google Drive or proxy links might still work with fallback
      if (val.includes('drive.google.com') || val.includes('dropbox.com')) {
        setStatus('valid');
        setErrorMessage('');
      } else {
        setStatus('invalid');
        setErrorMessage('Không thể tải ảnh từ URL này. Bạn có thể dùng tab "Tải ảnh từ máy" bên cạnh.');
      }
    };
    img.src = resolved;
  };

  // Local device file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatus('invalid');
      setErrorMessage('Tệp được chọn không phải là hình ảnh hợp lệ (JPG, PNG, WEBP).');
      return;
    }

    try {
      setIsCompressing(true);
      setErrorMessage('');
      setStatus('checking');

      const compressedDataUrl = await compressImageFile(file);
      setUrlInput(compressedDataUrl);
      setPreviewSrc(compressedDataUrl);
      setStatus('valid');
      setIsCompressing(false);
    } catch (err: any) {
      setIsCompressing(false);
      setStatus('invalid');
      setErrorMessage(err?.message || 'Lỗi khi xử lý tệp ảnh từ thiết bị');
    }
  };

  const handleSave = async () => {
    const finalUrl = resolveDirectImageUrl(urlInput.trim());
    if (!finalUrl) {
      setStatus('invalid');
      setErrorMessage('Vui lòng chọn hoặc dán đường dẫn ảnh.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(finalUrl, positionInput);
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage('Không thể lưu ảnh: ' + (err?.message || 'Lỗi không xác định'));
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0b0b0f] border border-white/[0.1] rounded-2xl shadow-2xl p-5 sm:p-6 text-neutral-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-neutral-400" />
            <h3 className="font-serif text-sm sm:text-base font-semibold text-white tracking-wide">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers: File Upload vs URL */}
        <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl my-4 text-xs font-serif">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-neutral-100 text-neutral-900 font-medium shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Tải ảnh từ máy / điện thoại</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'url'
                ? 'bg-neutral-100 text-neutral-900 font-medium shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Dán URL ảnh</span>
          </button>
        </div>

        {/* Body content based on active tab */}
        <div className="space-y-4">
          {activeTab === 'upload' && (
            <div key="tab-upload-pane" className="space-y-3">
              <input
                key="image-file-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/[0.15] hover:border-white/30 rounded-xl p-5 text-center cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.04]"
              >
                <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                <p className="font-serif text-xs sm:text-sm text-neutral-200 font-medium">
                  Nhấn để chọn ảnh từ thư viện hoặc chụp ảnh mới
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Ảnh tải lên sẽ được lưu trực tiếp vào Firebase của bạn
                </p>
              </div>
            </div>
          )}

          {activeTab === 'url' && (
            <div key="tab-url-pane" className="space-y-2">
              <label className="block font-serif text-xs text-neutral-300">
                Đường dẫn hình ảnh (Hỗ trợ URL trực tiếp, Google Drive, Pinterest, Imgur, v.v.):
              </label>
              <input
                key="image-url-input"
                type="text"
                value={urlInput ?? ''}
                onChange={(e) => handleUrlInputChange(e.target.value)}
                placeholder="https://... hoặc link Google Drive"
                className="w-full bg-[#121217] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/40 transition-colors"
                style={{ fontSize: '15px' }}
              />
              <p className="text-[10px] text-neutral-500 font-serif">
                Mẹo: Nếu là link Google Drive, hệ thống sẽ tự động chuyển đổi thành ảnh hiển thị.
              </p>
            </div>
          )}

          {/* Position Selector */}
          <div>
            <label className="block font-serif text-xs text-neutral-400 mb-1">
              Trọng tâm cắt ảnh (Căn chỉnh khung nhìn):
            </label>
            <div className="flex items-center gap-1.5">
              {[
                { label: 'Chân dung trên', val: '50% 20%' },
                { label: 'Trung tâm', val: '50% 50%' },
                { label: 'Góc nghiêng', val: '50% 35%' },
                { label: 'Toàn thân', val: '50% 70%' }
              ].map((pos) => (
                <button
                  key={pos.val}
                  type="button"
                  onClick={() => setPositionInput(pos.val)}
                  className={`flex-1 py-1 text-[11px] font-serif rounded border transition-colors ${
                    positionInput === pos.val
                      ? 'bg-neutral-200 text-neutral-900 border-neutral-200 font-medium'
                      : 'bg-white/[0.02] text-neutral-400 border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5 font-serif text-xs text-neutral-400">
              <span>Xem trước:</span>
              {status === 'valid' && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <Check className="w-3 h-3" /> Ảnh đã sẵn sàng
                </span>
              )}
            </div>

            <div
              className="relative w-full h-44 rounded-xl bg-[#070709] border border-white/[0.08] overflow-hidden flex items-center justify-center shadow-inner"
              style={{ aspectRatio: suggestedAspectRatio }}
            >
              {isCompressing ? (
                <div className="flex items-center gap-2 text-xs text-neutral-400 font-serif">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý hình ảnh...</span>
                </div>
              ) : previewSrc && status === 'valid' ? (
                <img
                  src={previewSrc}
                  alt="Xem trước"
                  style={{ objectPosition: positionInput }}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <ImageIcon className="w-6 h-6 text-neutral-600 mb-1.5 stroke-[1.5]" />
                  <p className="text-xs text-neutral-500 font-serif">
                    {status === 'checking'
                      ? 'Đang kiểm tra hình ảnh...'
                      : status === 'invalid'
                      ? errorMessage || 'Không thể hiển thị ảnh'
                      : 'Chọn tệp ảnh hoặc dán URL ở trên'}
                  </p>
                </div>
              )}
            </div>

            {errorMessage && (
              <p className="text-[11px] text-rose-400 mt-2 bg-rose-950/20 border border-rose-900/30 p-2 rounded-lg font-serif">
                {errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 mt-5 pt-3.5 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 font-serif text-xs text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isCompressing || !previewSrc}
            className="px-4 py-1.5 font-serif text-xs font-semibold bg-white hover:bg-neutral-200 text-neutral-900 rounded-lg transition-colors shadow disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang cập nhật...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" /> Áp dụng ảnh
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
