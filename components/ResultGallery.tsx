
import React, { useRef, useEffect, useState } from 'react';
import { Task, TaskStatus } from '../types';
import { CheckCircle, Loader2, AlertCircle, Video, Image as ImageIcon, Download, Filter, ArrowUpDown, Maximize2, X } from 'lucide-react';

interface ResultGalleryProps {
  tasks: Task[];
  totalTasks: number;
  completedTasks: number;
  currentTaskIndex: number | null;
}

const ResultGallery: React.FC<ResultGalleryProps> = ({ tasks, totalTasks, completedTasks, currentTaskIndex }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [sort, setSort] = useState<string>('ID_ASC');
  
  // Preview Modal State
  const [previewMedia, setPreviewMedia] = useState<{ url: string, type: 'IMAGE' | 'VIDEO' } | null>(null);

  // Auto scroll to bottom only when in default view (All + ID ASC)
  useEffect(() => {
    if (filter === 'ALL' && sort === 'ID_ASC' && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [tasks, filter, sort]);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return 'bg-green-100 border-green-300';
      case TaskStatus.FAILED: return 'bg-red-100 border-red-300';
      case TaskStatus.GENERATING_IMAGE:
      case TaskStatus.GENERATING_VIDEO: return 'bg-blue-50 border-blue-300';
      case TaskStatus.WAITING_VIDEO: return 'bg-yellow-50 border-yellow-300';
      case TaskStatus.STOPPED: return 'bg-gray-100 border-gray-300';
      default: return 'bg-white border-gray-200';
    }
  };

  const processedTasks = [...tasks]
    .filter(t => {
        if (filter === 'ALL') return true;
        if (filter === 'COMPLETED') return t.status === TaskStatus.COMPLETED;
        if (filter === 'FAILED') return t.status === TaskStatus.FAILED || t.status === TaskStatus.STOPPED;
        if (filter === 'PROCESSING') return [TaskStatus.PENDING, TaskStatus.GENERATING_IMAGE, TaskStatus.WAITING_VIDEO, TaskStatus.GENERATING_VIDEO].includes(t.status);
        return true;
    })
    .sort((a, b) => {
        if (sort === 'ID_ASC') return a.id.localeCompare(b.id);
        if (sort === 'ID_DESC') return b.id.localeCompare(a.id);
        if (sort === 'NAME_ASC') return a.projectName.localeCompare(b.projectName);
        if (sort === 'NAME_DESC') return b.projectName.localeCompare(a.projectName);
        return 0;
    });

  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* Preview Modal */}
        {previewMedia && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <button 
                    onClick={() => setPreviewMedia(null)}
                    className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 rounded-full p-2"
                >
                    <X size={24} />
                </button>
                <div className="max-w-[90vw] max-h-[90vh] w-full flex items-center justify-center">
                    {previewMedia.type === 'VIDEO' ? (
                        <video controls autoPlay className="max-w-full max-h-[85vh] rounded shadow-2xl">
                            <source src={previewMedia.url} type="video/mp4" />
                        </video>
                    ) : (
                        <img src={previewMedia.url} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl" />
                    )}
                </div>
            </div>
        )}

        <div className="p-4 border-b border-gray-200 bg-white z-10 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-blue-700 font-bold flex items-center gap-2">
                    Kết quả tạo ảnh & video <span className="text-xl">🖼️</span>
                </h2>
                <span className="text-xs text-gray-500">
                    {completedTasks}/{totalTasks} Hoàn thành
                </span>
            </div>
            
            <div className="flex items-center gap-2">
                <div className="flex items-center border border-gray-300 rounded px-2 py-1 bg-gray-50">
                    <Filter size={14} className="text-gray-500 mr-2" />
                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)}
                        className="text-xs bg-transparent outline-none text-gray-700 cursor-pointer"
                    >
                        <option value="ALL">Tất cả</option>
                        <option value="PROCESSING">Đang xử lý</option>
                        <option value="COMPLETED">Hoàn thành</option>
                        <option value="FAILED">Lỗi / Dừng</option>
                    </select>
                </div>
                
                <div className="flex items-center border border-gray-300 rounded px-2 py-1 bg-gray-50">
                    <ArrowUpDown size={14} className="text-gray-500 mr-2" />
                    <select 
                        value={sort} 
                        onChange={(e) => setSort(e.target.value)}
                        className="text-xs bg-transparent outline-none text-gray-700 cursor-pointer"
                    >
                        <option value="ID_ASC">Thứ tự (ID 1-9)</option>
                        <option value="ID_DESC">Mới nhất (ID 9-1)</option>
                        <option value="NAME_ASC">Tên (A-Z)</option>
                        <option value="NAME_DESC">Tên (Z-A)</option>
                    </select>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
            {processedTasks.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon size={48} className="mb-2 opacity-50"/>
                    <p>{tasks.length === 0 ? "Chưa có dự án nào. Hãy nhập prompt và nhấn Bắt đầu." : "Không tìm thấy kết quả phù hợp."}</p>
                </div>
            )}

            {processedTasks.map((task) => (
                <div key={task.id} className={`p-4 rounded border-2 transition-all ${getStatusColor(task.status)} relative`}>
                    {/* Header: Status and ID */}
                    <div className="flex justify-between items-start mb-3 border-b border-gray-200/50 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-700">#{task.id}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/50 border border-gray-200">
                                {task.projectName}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                           {task.status === TaskStatus.GENERATING_IMAGE && <span className="text-blue-600 flex items-center gap-1"><Loader2 className="animate-spin" size={12}/> Đang tạo ảnh...</span>}
                           {task.status === TaskStatus.WAITING_VIDEO && <span className="text-yellow-600 flex items-center gap-1"><Loader2 className="animate-spin" size={12}/> Đang đợi...</span>}
                           {task.status === TaskStatus.GENERATING_VIDEO && <span className="text-purple-600 flex items-center gap-1"><Loader2 className="animate-spin" size={12}/> Đang tạo video...</span>}
                           {task.status === TaskStatus.COMPLETED && <span className="text-green-600 flex items-center gap-1"><CheckCircle size={12}/> Hoàn tất</span>}
                           {task.status === TaskStatus.FAILED && <span className="text-red-600 flex items-center gap-1"><AlertCircle size={12}/> Lỗi</span>}
                           {task.status === TaskStatus.STOPPED && <span className="text-gray-600 flex items-center gap-1"><AlertCircle size={12}/> Đã dừng</span>}
                           {task.status === TaskStatus.PENDING && <span className="text-gray-400">Chờ xử lý...</span>}
                        </div>
                    </div>
                    
                    {/* Content Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        
                        {/* Image Section */}
                        <div className="space-y-2">
                            <div className="relative aspect-video bg-gray-200 rounded overflow-hidden flex items-center justify-center border border-gray-300 shadow-inner group cursor-pointer"
                                 onClick={() => task.imageData && setPreviewMedia({ url: `data:${task.imageMimeType};base64,${task.imageData}`, type: 'IMAGE' })}
                            >
                                {task.imageData ? (
                                    <>
                                        <img src={`data:${task.imageMimeType};base64,${task.imageData}`} alt="Generated" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                             <Maximize2 className="text-white drop-shadow-md" size={32} />
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const link = document.createElement('a');
                                                link.href = `data:${task.imageMimeType};base64,${task.imageData}`;
                                                link.download = `img_${task.projectName}.png`;
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-blue-600 text-white rounded-md shadow-sm transition-all opacity-0 group-hover:opacity-100 z-10"
                                            title="Tải ảnh về máy"
                                        >
                                            <Download size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-gray-400 text-xs flex flex-col items-center">
                                        <ImageIcon size={24} className="mb-1"/>
                                        Chờ tạo ảnh
                                    </div>
                                )}
                            </div>
                            <div className="bg-white/60 p-2 rounded text-xs border border-gray-200 shadow-sm">
                                <span className="font-bold text-gray-600 block mb-1">Prompt Ảnh:</span>
                                <p className="line-clamp-2 text-gray-800" title={task.imagePrompt}>{task.imagePrompt}</p>
                            </div>
                        </div>

                        {/* Video Section */}
                        <div className="space-y-2">
                            <div 
                                className="relative aspect-video bg-gray-200 rounded overflow-hidden flex items-center justify-center border border-gray-300 shadow-inner group cursor-pointer"
                                onClick={() => task.videoUrl && setPreviewMedia({ url: task.videoUrl, type: 'VIDEO' })}
                            >
                                {task.videoUrl ? (
                                    <>
                                        <video className="w-full h-full object-cover pointer-events-none">
                                            <source src={task.videoUrl} type="video/mp4" />
                                        </video>
                                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center group-hover:bg-black/30 transition">
                                            <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm group-hover:scale-110 transition">
                                                 <Maximize2 className="text-white" size={24} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-gray-400 text-xs flex flex-col items-center">
                                        <Video size={24} className="mb-1"/>
                                        {task.status === TaskStatus.WAITING_VIDEO ? "Đang chờ đến lượt..." : "Chờ tạo video"}
                                    </div>
                                )}
                            </div>
                            <div className="bg-white/60 p-2 rounded text-xs border border-gray-200 shadow-sm">
                                <span className="font-bold text-gray-600 block mb-1">Prompt Video:</span>
                                <p className="line-clamp-2 text-gray-800" title={task.videoPrompt}>{task.videoPrompt}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Log Message */}
                    {task.log && (
                         <div className="mt-3 text-[10px] font-mono text-gray-500 border-t border-gray-200 pt-1">
                            &gt; {task.log}
                        </div>
                    )}
                </div>
            ))}
        </div>

        {/* Status Bar */}
        <div className="h-12 bg-gray-50 border-t border-gray-300 p-2 flex items-center gap-4 shadow-inner">
            <div className="w-32 text-xs font-bold text-gray-600 flex items-center gap-1">
                <span className="w-3 h-3 bg-gradient-to-br from-green-400 to-blue-500 rounded-sm inline-block"></span>
                Tiến độ:
            </div>
            <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden border border-gray-300 relative">
                <div 
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-700">
                    {progressPercentage}%
                </div>
            </div>
            <div className="w-64 text-[10px] text-gray-500 truncate text-right">
                {currentTaskIndex !== null ? `Đang xử lý ${currentTaskIndex + 1}/${totalTasks}: ${tasks[currentTaskIndex]?.projectName}` : 'Sẵn sàng'}
            </div>
        </div>
    </div>
  );
};

export default ResultGallery;
