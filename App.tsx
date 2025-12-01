
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ResultGallery from './components/ResultGallery';
import { Task, TaskStatus, AppSettings, DEFAULT_SETTINGS } from './types';
import { generateImage, generateVideo, wait, checkApiKeySelection, promptForKeySelection } from './services/geminiService';
import { User, LogIn, HelpCircle } from 'lucide-react';

// Internal Help Modal Component
const HelpModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 relative flex flex-col max-h-[90vh]">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
        ✕
      </button>
      
      <h2 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2">
        📖 Hướng dẫn sử dụng Google AI Ultra Studio
      </h2>
      
      <div className="space-y-4 text-sm text-gray-700 overflow-y-auto pr-2 flex-1">
        
        <div className="bg-blue-50 p-3 rounded border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-1 flex items-center gap-2">
                1️⃣ Bước 1: Kết nối tài khoản
            </h3>
            <p>Nhấn nút <span className="font-bold text-white bg-blue-600 px-2 py-0.5 rounded text-xs">Kết nối Ultra</span> ở góc phải trên cùng.</p>
            <p className="mt-1 text-xs text-blue-600">⚠️ Quan trọng: Đảm bảo tài khoản Google Cloud Project của bạn đã kích hoạt thanh toán (Billing enabled) để sử dụng Veo.</p>
        </div>

        <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
            <h3 className="font-bold text-yellow-800 mb-1 flex items-center gap-2">
                2️⃣ Bước 2: Thiết lập & Nhập nội dung
            </h3>
            <p className="mb-1 font-semibold text-xs">Tùy chọn nâng cao:</p>
             <ul className="list-disc pl-5 mb-2 text-xs">
                <li><b>Thư viện tài nguyên:</b> Thêm Nhân vật & Bối cảnh vào danh sách.</li>
                <li><b>Đồng bộ nhân vật:</b> Click chọn 1 Nhân vật trong Sidebar HOẶC <b>nhắc tên nhân vật</b> trong prompt (VD: "Lucy đang cười"). Ứng dụng sẽ tự động dùng ảnh mẫu của Lucy.</li>
                <li><b>Tên file:</b> Tự động đổi theo tên Nhân vật bạn chọn.</li>
             </ul>
            <div className="font-mono bg-white p-2 rounded border border-gray-200 text-xs shadow-sm">
                [Mô tả ảnh] | [Mô tả chuyển động video]
            </div>
            <p className="mt-2 text-xs text-gray-600">
                Ví dụ:<br/>
                <i>Lucy đang cầm kiếm | Gió thổi tóc bay và hoa rơi</i><br/>
                <i>Mèo con ngủ trên sofa | Mèo thức dậy và vươn vai</i>
            </p>
        </div>

        <div className="bg-green-50 p-3 rounded border border-green-100">
             <h3 className="font-bold text-green-800 mb-1 flex items-center gap-2">
                3️⃣ Bước 3: Bắt đầu & Tự động lưu
             </h3>
             <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Chọn <b>Google AI Ultra</b> (Chất lượng cao nhất).</li>
                <li>Nhấn nút <span className="text-white bg-green-600 px-2 py-0.5 rounded text-xs font-bold">Bắt đầu tạo</span>.</li>
                <li>Hệ thống sẽ chạy tự động: <b>Tạo Ảnh ➔ Chờ (tránh nghẽn) ➔ Tạo Video</b>.</li>
                <li>Khi hoàn tất, file sẽ <b>tự động tải xuống</b> thư mục Downloads của máy tính.</li>
             </ul>
        </div>
      </div>

      <div className="mt-6 flex justify-end shrink-0">
        <button 
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold transition shadow"
        >
            Đã hiểu, bắt đầu làm việc!
        </button>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  
  // Ref to control the loop cancellation
  const shouldStopRef = useRef<boolean>(false);

  useEffect(() => {
    // Check login status on mount
    const checkLogin = async () => {
        const hasKey = await checkApiKeySelection();
        setIsLoggedIn(hasKey);
    };
    checkLogin();
  }, []);

  const handleLogin = async () => {
    try {
        await promptForKeySelection();
        // Assume success if prompt returns, or re-check
        const hasKey = await checkApiKeySelection();
        setIsLoggedIn(hasKey);
    } catch (e) {
        console.error("Login failed", e);
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const base64ToBlobUrl = (base64: string, mime: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mime });
    return URL.createObjectURL(blob);
  };

  const handleAuthError = async (error: any) => {
    const msg = error.message || JSON.stringify(error);
    if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('permission')) {
        alert("⚠️ Phiên kết nối hết hạn hoặc không có quyền (403).\n\nVui lòng kết nối lại tài khoản Ultra (Paid Project).");
        await handleLogin();
        return true; // Was auth error
    }
    return false;
  };

  const processQueue = async (queue: Task[]) => {
    setIsProcessing(true);
    shouldStopRef.current = false;

    // Collect items to download in batch
    const downloadQueue: { url: string, filename: string }[] = [];

    for (let i = 0; i < queue.length; i++) {
        if (shouldStopRef.current) break;

        const task = queue[i];
        if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED) continue;

        // --- SMART ASSET DETECTION LOGIC ---
        // 1. Determine which references to use. 
        // Logic: If prompt mentions an asset name, use that asset. Else use selected in settings.
        const currentRefImages: string[] = [];
        let usedCharName = "";

        // Check for Character in prompt
        const mentionedChar = settings.assets.find(a => a.type === 'CHARACTER' && task.imagePrompt.toLowerCase().includes(a.name.toLowerCase()));
        if (mentionedChar) {
            currentRefImages.push(mentionedChar.data);
            usedCharName = mentionedChar.name;
        } else if (settings.selectedCharacterId) {
             const char = settings.assets.find(a => a.id === settings.selectedCharacterId);
             if (char) {
                currentRefImages.push(char.data);
                usedCharName = char.name;
             }
        }

        // Check for Context (Always use selected for now, unless specific logic needed)
        if (settings.selectedContextId) {
            const ctx = settings.assets.find(a => a.id === settings.selectedContextId);
            if (ctx) currentRefImages.push(ctx.data);
        }
        // -----------------------------------

        // 1. Image Generation
        if (task.status === TaskStatus.PENDING) {
             const logMsg = usedCharName 
                ? `Đang tạo ảnh với nhân vật "${usedCharName}"...` 
                : `Ultra đang tạo ảnh (${settings.engine === 'gemini-3-pro-image-preview' ? 'Best Quality' : 'Fast'})...`;

             setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.GENERATING_IMAGE, log: logMsg } : t));
             
             try {
                // Pass all selected references
                const imgResult = await generateImage(
                    task.imagePrompt, 
                    settings.aspectRatio, 
                    settings.engine,
                    currentRefImages
                );
                
                // Prepare for batch download
                const imgFilename = `${task.projectName}.png`;
                const imgUrl = base64ToBlobUrl(imgResult.data, imgResult.mimeType);
                downloadQueue.push({ url: imgUrl, filename: imgFilename });

                setTasks(prev => prev.map(t => t.id === task.id ? { 
                    ...t, 
                    status: TaskStatus.WAITING_VIDEO, 
                    imageData: imgResult.data,
                    imageMimeType: imgResult.mimeType,
                    log: `Ảnh xong. Đang chờ ${settings.delay}s để tránh nghẽn server...`
                } : t));

                // Wait Delay
                await wait(settings.delay * 1000);

             } catch (error: any) {
                console.error(error);
                const isAuth = await handleAuthError(error);
                if (isAuth) {
                    shouldStopRef.current = true; // Stop on auth error
                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.PENDING, log: 'Dừng do lỗi kết nối. Vui lòng thử lại.' } : t));
                    break;
                }

                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.FAILED, log: `Ultra lỗi: ${error.message}` } : t));
                continue; // Skip to next task
             }
        }

        if (shouldStopRef.current) break;

        // 2. Video Generation
        // Find current task state to ensure we have imageData
        let latestTask: Task | undefined;
        setTasks(prev => {
            latestTask = prev.find(t => t.id === task.id);
            return prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.GENERATING_VIDEO, log: 'Veo đang tạo chuyển động video...' } : t);
        });
        
        // Small delay to let state update logic settle
        await wait(100); 

        if (latestTask && latestTask.imageData && latestTask.imageMimeType) {
             try {
                const videoUrl = await generateVideo(
                    task.videoPrompt, 
                    latestTask.imageData, 
                    latestTask.imageMimeType, 
                    settings.resolution, 
                    settings.aspectRatio
                );

                // Prepare for batch download
                let finalVideoUrl = videoUrl;
                try {
                    const vidRes = await fetch(videoUrl);
                    if (!vidRes.ok) throw new Error(`Fetch failed: ${vidRes.statusText}`);
                    const vidBlob = await vidRes.blob();
                    finalVideoUrl = URL.createObjectURL(vidBlob);
                } catch (e) {
                    console.warn("Direct blob download failed, using link", e);
                }
                
                // Filename Format: prefix_index.mp4 (e.g. nhanvat_001.mp4)
                downloadQueue.push({ url: finalVideoUrl, filename: `${task.projectName}.mp4` });

                setTasks(prev => prev.map(t => t.id === task.id ? { 
                    ...t, 
                    status: TaskStatus.COMPLETED, 
                    videoUrl: videoUrl,
                    log: 'Hoàn tất! Đã lưu vào danh sách tải xuống.'
                } : t));

             } catch (error: any) {
                 console.error(error);
                 const isAuth = await handleAuthError(error);
                 if (isAuth) {
                    shouldStopRef.current = true;
                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.FAILED, log: 'Lỗi quyền truy cập khi tạo video.' } : t));
                    break;
                 }

                 setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.FAILED, log: `Veo lỗi: ${error.message}` } : t));
             }
        } else {
             if (!latestTask?.imageData) {
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.FAILED, log: 'Lỗi dữ liệu ảnh.' } : t));
             }
        }

        // Wait Delay between tasks
        if (i < queue.length - 1) {
            await wait(settings.delay * 1000);
        }
    }

    // Execute Batch Download
    if (downloadQueue.length > 0) {
        console.log(`Starting batch download of ${downloadQueue.length} files...`);
        // Notify user if browser blocks
        if (downloadQueue.length > 1) {
             setTasks(prev => {
                const last = prev[prev.length - 1];
                return prev.map(t => t.id === last.id ? { ...t, log: 'Đang tải xuống tất cả file. Vui lòng chọn "Cho phép" nếu trình duyệt chặn popup.' } : t);
             });
        }

        for (const item of downloadQueue) {
            downloadFile(item.url, item.filename);
            await wait(1000); // Wait 1s between downloads to try and satisfy browser throttles
            if (item.url.startsWith('blob:')) {
                setTimeout(() => URL.revokeObjectURL(item.url), 60000);
            }
        }
    }

    setIsProcessing(false);
  };

  const handleStart = async (promptText: string) => {
    // Check Login
    if (!isLoggedIn) {
        const hasKey = await checkApiKeySelection();
        if (!hasKey) {
            // alert("Vui lòng kết nối tài khoản trước khi bắt đầu.");
            await handleLogin();
            return; // Wait for user to click start again after login
        } else {
            setIsLoggedIn(true);
        }
    }

    // Parse prompts
    const lines = promptText.split('\n').filter(line => line.trim() !== "");
    // Use asset name if selected, else default
    let baseName = settings.filePrefix || 'duan';
    // If user has a character selected, ensure prefix matches
    if (settings.selectedCharacterId) {
        const char = settings.assets.find(a => a.id === settings.selectedCharacterId);
        if (char) baseName = char.name;
    }
    
    const newTasks: Task[] = lines.map((line, idx) => {
        const parts = line.split('|');
        const imgP = parts[0]?.trim() || line.trim();
        const vidP = parts[1]?.trim() || "Animate this image naturally"; // Default fallback
        
        // Generate name: nhanvat_001
        const projectId = `${baseName}_${(idx + 1).toString().padStart(3, '0')}`;
        
        return {
            id: (idx + 1).toString().padStart(3, '0'),
            projectName: projectId,
            imagePrompt: imgP,
            videoPrompt: vidP,
            status: TaskStatus.PENDING
        };
    });

    setTasks(newTasks);
    processQueue(newTasks);
  };

  const handleStop = () => {
    shouldStopRef.current = true;
    setTasks(prev => prev.map(t => (t.status === TaskStatus.GENERATING_IMAGE || t.status === TaskStatus.GENERATING_VIDEO || t.status === TaskStatus.WAITING_VIDEO) ? { ...t, status: TaskStatus.STOPPED, log: 'Đã dừng. Đang tải các file đã hoàn thành...' } : t));
  };

  const activeTaskIndex = tasks.findIndex(t => 
    t.status === TaskStatus.GENERATING_IMAGE || 
    t.status === TaskStatus.GENERATING_VIDEO || 
    t.status === TaskStatus.WAITING_VIDEO
  );
  
  const completedCount = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans overflow-hidden">
      {/* Help Modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* Title Bar / Header */}
      <div className="h-10 bg-white border-b border-gray-300 flex items-center justify-between px-4 select-none shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-2">
            <span className="text-lg">🥣</span>
            <span className="font-semibold text-gray-700 text-xs sm:text-sm">Google AI Ultra Studio</span>
            <button 
                onClick={() => setShowHelp(true)}
                className="ml-2 text-gray-400 hover:text-blue-600 transition" 
                title="Hướng dẫn sử dụng"
            >
                <HelpCircle size={16} />
            </button>
        </div>
        
        <div className="flex items-center gap-3">
            {isLoggedIn ? (
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Tài khoản: <span className="font-bold text-gray-800">Ultra Active</span>
                </div>
            ) : (
                <button 
                    onClick={handleLogin}
                    className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition shadow-sm"
                >
                    <LogIn size={12} /> Kết nối Ultra
                </button>
            )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
            settings={settings} 
            onSettingsChange={setSettings}
            onStart={handleStart}
            onStop={handleStop}
            isProcessing={isProcessing}
        />
        <ResultGallery 
            tasks={tasks} 
            totalTasks={tasks.length} 
            completedTasks={completedCount}
            currentTaskIndex={activeTaskIndex !== -1 ? activeTaskIndex : null}
        />
      </div>
    </div>
  );
};

export default App;
