
import React, { useState, useRef } from 'react';
import { Settings, Play, Square, Image as ImageIcon, FileText, Plus, User, Map, Trash2, X, Check } from 'lucide-react';
import { AppSettings, Asset } from '../types';

interface SidebarProps {
  settings: AppSettings;
  onSettingsChange: (s: AppSettings) => void;
  onStart: (prompts: string) => void;
  onStop: () => void;
  isProcessing: boolean;
}

const TEMPLATES = [
  { 
    label: "--- Chọn mẫu prompt (Templates) ---", 
    value: "" 
  },
  { 
    label: "🐱 Động vật (Mèo demo)", 
    value: "A cute cat sitting on a roof, sunset background | The cat stands up and stretches" 
  },
  { 
    label: "🌊 Thiên nhiên (Thác nước)", 
    value: "A majestic waterfall in a lush green forest, cinematic lighting | The water flows rapidly with mist rising" 
  },
  { 
    label: "🏙️ Cyberpunk (Thành phố)", 
    value: "Futuristic city street at night, neon signs, rain reflections | Flying cars zoom past the camera" 
  },
  { 
    label: "⚔️ Nhân vật (Chiến binh)", 
    value: "Anime style warrior girl standing in a field of flowers, holding a sword | Wind blows through her hair and flowers wave" 
  },
  { 
    label: "🚀 Sci-Fi (Vũ trụ)", 
    value: "A massive spaceship orbiting a blue planet, stars in background | The spaceship engages thrusters and moves forward" 
  }
];

const Sidebar: React.FC<SidebarProps> = ({ 
  settings, 
  onSettingsChange, 
  onStart, 
  onStop, 
  isProcessing
}) => {
  const [promptText, setPromptText] = useState<string>("");
  const [savePath] = useState<string>("Downloads/Ultra_Output");
  
  // Asset Management
  const [activeTab, setActiveTab] = useState<'CHARACTER' | 'CONTEXT'>('CHARACTER');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rename Modal State
  const [pendingFile, setPendingFile] = useState<{ file: File, base64: string } | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");

  const handleStart = () => {
    if (!promptText.trim()) return alert("Vui lòng nhập prompt!");
    onStart(promptText);
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      setPromptText(val);
      e.target.value = ""; 
    }
  };

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Open Modal
        const defaultName = file.name.split('.')[0].substring(0, 15).replace(/[^a-zA-Z0-9]/g, '');
        setRenameValue(defaultName);
        setPendingFile({ file, base64 });
      };
      reader.readAsDataURL(file);
    }
    // Reset input to allow re-selecting same file
    e.target.value = "";
  };

  const confirmUpload = () => {
    if (!pendingFile || !renameValue.trim()) return;
    
    const newAsset: Asset = {
        id: Date.now().toString(),
        name: renameValue.trim(),
        type: activeTab,
        data: pendingFile.base64
    };
    const newAssets = [...settings.assets, newAsset];
    
    // Auto select the new asset
    let updates: Partial<AppSettings> = { assets: newAssets };
    if (activeTab === 'CHARACTER') {
        updates.selectedCharacterId = newAsset.id;
        updates.filePrefix = newAsset.name; // Auto update prefix
    } else {
        updates.selectedContextId = newAsset.id;
    }

    onSettingsChange({ ...settings, ...updates });
    
    // Close modal
    setPendingFile(null);
    setRenameValue("");
  };

  const cancelUpload = () => {
    setPendingFile(null);
    setRenameValue("");
  };

  const deleteAsset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Xóa tài nguyên này?")) return;
    
    const newAssets = settings.assets.filter(a => a.id !== id);
    let updates: Partial<AppSettings> = { assets: newAssets };
    
    if (settings.selectedCharacterId === id) updates.selectedCharacterId = undefined;
    if (settings.selectedContextId === id) updates.selectedContextId = undefined;
    
    onSettingsChange({ ...settings, ...updates });
  };

  const toggleAsset = (asset: Asset) => {
    if (asset.type === 'CHARACTER') {
        if (settings.selectedCharacterId === asset.id) {
            // Deselect
            onSettingsChange({ ...settings, selectedCharacterId: undefined });
        } else {
            // Select and update prefix
            onSettingsChange({ 
                ...settings, 
                selectedCharacterId: asset.id,
                filePrefix: asset.name 
            });
        }
    } else {
         if (settings.selectedContextId === asset.id) {
            // Deselect
            onSettingsChange({ ...settings, selectedContextId: undefined });
        } else {
            // Select
            onSettingsChange({ ...settings, selectedContextId: asset.id });
        }
    }
  };

  const filteredAssets = settings.assets.filter(a => a.type === activeTab);

  return (
    <div className="w-96 flex flex-col border-r border-gray-300 bg-gray-50 h-full shadow-lg z-10 relative">
      
      {/* Upload Name Modal Overlay */}
      {pendingFile && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-xs animate-in zoom-in-95 duration-200">
                <h3 className="text-sm font-bold text-gray-700 mb-2">Đặt tên {activeTab === 'CHARACTER' ? 'Nhân vật' : 'Bối cảnh'}</h3>
                
                <div className="flex justify-center mb-3 bg-gray-100 rounded p-2">
                    <img src={pendingFile.base64} className="h-20 object-contain" alt="Preview" />
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-gray-500">Tên (dùng để gợi ý trong prompt):</label>
                    <input 
                        autoFocus
                        type="text" 
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 outline-none"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        placeholder="VD: Lucy, NhanVatA..."
                        onKeyDown={(e) => e.key === 'Enter' && confirmUpload()}
                    />
                </div>
                
                <div className="flex gap-2 mt-4">
                    <button onClick={cancelUpload} className="flex-1 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded">Hủy</button>
                    <button onClick={confirmUpload} className="flex-1 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-bold">Lưu</button>
                </div>
            </div>
        </div>
      )}

      {/* Header Tabs */}
      <div className="flex border-b border-gray-300 bg-white shrink-0">
        <button className="flex-1 py-2 px-4 text-blue-600 font-semibold border-b-2 border-blue-600 flex items-center justify-center gap-2 hover:bg-gray-50 transition">
          <ImageIcon size={16} /> Tạo Ảnh & Video
        </button>
        <button className="flex-1 py-2 px-4 text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-100 transition">
          <Settings size={16} /> Cài Đặt
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        
        {/* Project Frame */}
        <div className="border border-gray-300 rounded bg-white p-3 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-blue-700 font-bold flex items-center gap-2">
               Khung dự án <span className="text-xl">🎨</span>
            </h3>
          </div>

          {/* Asset Library Tabs */}
          <div className="flex text-xs font-bold border-b border-gray-200 mb-2">
             <button 
                className={`flex-1 py-1.5 flex items-center justify-center gap-1 ${activeTab === 'CHARACTER' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('CHARACTER')}
             >
                <User size={12}/> Nhân vật
             </button>
             <button 
                className={`flex-1 py-1.5 flex items-center justify-center gap-1 ${activeTab === 'CONTEXT' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('CONTEXT')}
             >
                <Map size={12}/> Bối cảnh
             </button>
          </div>

          {/* Asset Grid */}
          <div className="grid grid-cols-4 gap-2 mb-2 min-h-[80px]">
             {/* Add Button */}
             <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition text-gray-400 hover:text-blue-500"
                title="Thêm mới"
             >
                <Plus size={20} />
                <span className="text-[9px] mt-1">Thêm</span>
             </div>

             {filteredAssets.map(asset => {
                const isSelected = activeTab === 'CHARACTER' ? settings.selectedCharacterId === asset.id : settings.selectedContextId === asset.id;
                return (
                    <div 
                        key={asset.id}
                        onClick={() => toggleAsset(asset)}
                        className={`relative aspect-square rounded overflow-hidden border-2 cursor-pointer group ${isSelected ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400'}`}
                        title={asset.name}
                    >
                        <img src={asset.data} alt={asset.name} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] truncate px-1 py-0.5 text-center">
                            {asset.name}
                        </div>
                         {/* Delete Button */}
                         <div 
                             onClick={(e) => deleteAsset(asset.id, e)}
                             className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition hover:bg-red-600 rounded-bl"
                         >
                             <Trash2 size={10} />
                         </div>
                         {isSelected && <div className="absolute top-0 left-0 bg-blue-600 text-white text-[8px] px-1 rounded-br shadow">✓</div>}
                    </div>
                );
             })}
          </div>
          <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleAssetUpload}
          />

          {/* Filename Prefix Input (Auto-updated but editable) */}
          <div className="mb-2 flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
             <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Tên file:</span>
             <input 
                type="text"
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
                placeholder="vd: nhanvat"
                value={settings.filePrefix}
                onChange={(e) => onSettingsChange({...settings, filePrefix: e.target.value})}
             />
             <span className="text-[10px] text-gray-400">_001</span>
          </div>
          
          <div className="mb-2 relative">
             <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                <FileText size={14} className="text-gray-400" />
             </div>
             <select
                className="w-full border border-gray-300 rounded pl-8 pr-2 py-1.5 text-xs bg-gray-50 text-gray-700 outline-none focus:border-blue-500 cursor-pointer appearance-none hover:bg-white transition-colors"
                onChange={handleTemplateChange}
                defaultValue=""
             >
                {TEMPLATES.map((t, idx) => (
                    <option key={idx} value={t.value}>{t.label}</option>
                ))}
             </select>
          </div>

          <textarea
            className="w-full h-32 border border-gray-600 rounded p-2 text-xs font-mono bg-gray-900 text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            placeholder={`Nhập prompt theo định dạng:\n[Prompt ảnh] | [Prompt video]\n\nVí dụ:\nA cat sitting on a roof | The cat jumps off the roof`}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            disabled={isProcessing}
          ></textarea>
           <p className="text-[10px] text-gray-500 mt-1 italic">
             * Sử dụng ảnh Nhân vật & Bối cảnh (nếu chọn) để tạo sự nhất quán.
           </p>
        </div>

        {/* Excel Import (Visual Only for UI match) */}
        <div className="border border-gray-300 rounded bg-white p-3 shadow-sm">
           <h3 className="text-blue-700 font-bold mb-2 text-xs flex items-center gap-1">
             Lấy prompt hàng loạt từ Excel <span className="text-yellow-500">📁</span>
           </h3>
           <div className="flex gap-1">
             <input disabled type="text" className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs bg-gray-100" value="D:/Ultra/DemoPrompt.xlsx" readOnly />
             <button disabled className="border border-gray-300 rounded px-3 py-1 text-xs hover:bg-gray-50">Chọn File</button>
           </div>
        </div>

        {/* Settings */}
        <div className="border border-gray-300 rounded bg-white p-3 shadow-sm">
            <h3 className="text-blue-700 font-bold mb-3 text-xs flex items-center gap-1">
             Cài đặt tạo ảnh & video <span className="text-gray-600">📷</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center">
                 <label className="w-24 text-xs font-medium text-gray-600">Chế độ:</label>
                 <select 
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                    value={settings.engine}
                    onChange={(e) => onSettingsChange({...settings, engine: e.target.value})}
                    disabled={isProcessing}
                 >
                   <option value="gemini-3-pro-image-preview">Google AI Ultra (Best Quality)</option>
                   <option value="gemini-2.5-flash-image">Google AI Flash (Fastest)</option>
                 </select>
              </div>

               <div className="flex items-center">
                 <label className="w-24 text-xs font-medium text-gray-600">Tỷ lệ ảnh:</label>
                 <select 
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                    value={settings.aspectRatio}
                    onChange={(e) => onSettingsChange({...settings, aspectRatio: e.target.value})}
                    disabled={isProcessing}
                 >
                   <option value="16:9">16:9 (Ngang)</option>
                   <option value="1:1">1:1 (Vuông)</option>
                   <option value="9:16">9:16 (Dọc)</option>
                 </select>
              </div>
              
              <div className="flex items-center">
                 <label className="w-24 text-xs font-medium text-gray-600">Độ phân giải:</label>
                 <select 
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                    value={settings.resolution}
                    onChange={(e) => onSettingsChange({...settings, resolution: e.target.value})}
                    disabled={isProcessing}
                 >
                   <option value="720p">720p (Ultra Fast)</option>
                   <option value="1080p">1080p (Ultra HD)</option>
                 </select>
              </div>

               <div className="flex items-center">
                 <label className="w-24 text-xs font-medium text-gray-600">Thời gian chờ:</label>
                 <div className="flex-1 flex items-center border border-gray-300 rounded bg-white">
                    <input 
                      type="number" 
                      className="w-full px-2 py-1 text-xs outline-none" 
                      value={settings.delay}
                      onChange={(e) => onSettingsChange({...settings, delay: parseInt(e.target.value) || 0})}
                      disabled={isProcessing}
                    />
                    <span className="text-xs text-gray-500 pr-2">giây</span>
                 </div>
              </div>

              <div className="flex items-center">
                 <label className="w-24 text-xs font-medium text-gray-600">Thư mục lưu:</label>
                 <div className="flex-1 flex gap-1">
                    <input 
                      type="text" 
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs text-gray-500 bg-gray-50" 
                      value={savePath} 
                      readOnly
                    />
                    <button className="border border-gray-300 rounded px-2 py-1 text-xs hover:bg-gray-50">Đổi</button>
                 </div>
              </div>
            </div>
            
            <div className="mt-2 text-[10px] text-gray-400">
               * Ảnh sẽ tự động tải xuống thư mục Downloads mặc định của trình duyệt.
            </div>
        </div>

      </div>

      {/* Footer Controls */}
      <div className="p-4 border-t border-gray-300 bg-white shrink-0">
          <h3 className="text-blue-700 font-bold mb-2 text-xs flex items-center gap-1">
             Điều khiển <span className="text-blue-400">⏯</span>
           </h3>
           <div className="flex gap-2">
             <button 
                onClick={handleStart}
                disabled={isProcessing}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-white font-bold shadow transition ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
             >
                <Play size={16} fill="white" /> Bắt đầu tạo
             </button>
             <button 
                onClick={onStop}
                disabled={!isProcessing}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-white font-bold shadow transition ${!isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
             >
                <Square size={16} fill="white" /> Dừng lại
             </button>
           </div>
           <p className="text-[10px] text-gray-500 mt-2">Đã kết nối Google AI Ultra.</p>
      </div>

    </div>
  );
};

export default Sidebar;
