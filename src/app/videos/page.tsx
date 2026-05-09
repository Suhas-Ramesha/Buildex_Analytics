"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Play, Video as VideoIcon, PlusCircle, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

type VideoRecord = {
  id: string;
  created_at: string;
  title: string;
  uploader: string;
  description: string;
  public_url: string;
  storage_path: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function VideosPage() {
  const { data, error, isLoading, mutate } = useSWR<{ videos: VideoRecord[] }>("/api/videos", fetcher);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [autoplayNext, setAutoplayNext] = useState(false);

  const handleDelete = async () => {
    if (!selectedVideo) return;
    setIsDeleting(true);
    setDeleteError("");

    const deletedId = selectedVideo.id;

    // Optimistically remove the video from the cache immediately
    mutate(
      (current) => current
        ? { videos: current.videos.filter((v) => v.id !== deletedId) }
        : current,
      { revalidate: false }
    );

    // Close modal right away — no waiting
    setSelectedVideo(null);
    setConfirmDelete(false);
    setIsDeleting(false);

    // Fire the actual delete in the background
    try {
      const res = await fetch("/api/delete-video", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletedId, storage_path: selectedVideo.storage_path }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Delete failed");
      // Revalidate to sync with server (runs silently in background)
      mutate();
    } catch (err: unknown) {
      // Rollback: re-fetch the real list and surface the error
      mutate();
      const msg = err instanceof Error ? err.message : "An error occurred.";
      console.error("Delete failed, rolled back:", msg);
    }
  };

  const handleVideoEnd = () => {
    if (!autoplayNext || !data?.videos || !selectedVideo) return;
    const currentIndex = data.videos.findIndex((v) => v.id === selectedVideo.id);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % data.videos.length;
      setSelectedVideo(data.videos[nextIndex]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Video Showcase</h1>
          <p className="text-white/60">See what others are building with Buildex</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {data?.videos && data.videos.length > 0 && (
            <button
              onClick={() => {
                setAutoplayNext(true);
                setSelectedVideo(data.videos[0]);
              }}
              className="px-6 py-3 glass hover:bg-white/10 text-white rounded-xl font-medium flex items-center gap-2 transition-colors w-full sm:w-auto justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              <Play size={20} className="fill-white" />
              Play All
            </button>
          )}
          <button
            onClick={() => setIsUploadOpen(!isUploadOpen)}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
          >
            {isUploadOpen ? <X size={20} /> : <Upload size={20} />}
            {isUploadOpen ? "Close Upload" : "Upload Video"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isUploadOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <UploadPanel onSuccess={() => {
              mutate();
              setIsUploadOpen(false);
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-video rounded-2xl glass animate-pulse bg-white/5" />
          ))}
        </div>
      ) : error ? (
        <div className="glass p-12 text-center border-red-500/30 bg-red-500/5 rounded-2xl">
          <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
          <h2 className="text-xl font-bold text-red-400 mb-2">Failed to load videos</h2>
          <p className="text-white/60 mb-4">Make sure you have configured Supabase correctly.</p>
        </div>
      ) : data?.videos && data.videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.videos.map((video, i) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedVideo(video)}
            >
              <div className="aspect-video bg-black relative overflow-hidden flex items-center justify-center">
                {/* We use a hidden video element to get the first frame, or just show an icon and load the video on hover/click to save bandwidth */}
                <video 
                  src={`${video.public_url}#t=0.1`} 
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/10 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center text-white backdrop-blur-md scale-90 opacity-80 group-hover:scale-100 group-hover:opacity-100 transition-all shadow-lg">
                    <Play size={24} className="ml-1" />
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg mb-1 truncate">{video.title}</h3>
                <div className="flex items-center justify-between text-sm text-white/50">
                  <span className="truncate">{video.uploader}</span>
                  <span>{new Date(video.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass p-16 text-center rounded-2xl">
          <VideoIcon className="mx-auto text-white/20 mb-4" size={48} />
          <h2 className="text-xl font-bold mb-2">No videos yet</h2>
          <p className="text-white/60">Be the first to share what you've built!</p>
        </div>
      )}

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0A0A0F] border border-white/10 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/50">
                <h3 className="font-bold truncate pr-4">{selectedVideo.title}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Autoplay Toggle */}
                  <label className="hidden sm:flex items-center gap-2 cursor-pointer group mr-2 bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={autoplayNext} 
                      onChange={(e) => setAutoplayNext(e.target.checked)} 
                      className="w-4 h-4 rounded border-white/20 bg-black/50 text-primary focus:ring-primary/50 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">Autoplay</span>
                  </label>
                  {/* Delete button */}
                  {!confirmDelete ? (
                    <button
                      onClick={() => { setConfirmDelete(true); setDeleteError(""); }}
                      className="p-2 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-full transition-colors"
                      title="Delete video"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-1.5">
                      <span className="text-sm text-red-300 font-medium">Delete?</span>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-2.5 py-1 rounded-lg font-medium transition-colors"
                      >
                        {isDeleting ? "Deleting…" : "Yes"}
                      </button>
                      <button
                        onClick={() => { setConfirmDelete(false); setDeleteError(""); }}
                        disabled={isDeleting}
                        className="text-xs text-white/50 hover:text-white px-1.5 py-1 rounded-lg transition-colors"
                      >
                        No
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => { setSelectedVideo(null); setConfirmDelete(false); setDeleteError(""); }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              {deleteError && (
                <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  {deleteError}
                </div>
              )}
              <div className="flex-1 bg-black flex items-center justify-center shrink-0">
                <video 
                  src={selectedVideo.public_url} 
                  controls 
                  autoPlay 
                  onEnded={handleVideoEnd}
                  className="w-full max-h-[60vh]"
                />
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
                  <span className="text-white/90 font-medium">{selectedVideo.uploader}</span>
                  <span>•</span>
                  <span>{new Date(selectedVideo.created_at).toLocaleDateString()}</span>
                </div>
                {selectedVideo.description ? (
                  <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{selectedVideo.description}</p>
                ) : (
                  <p className="text-white/40 italic">No description provided.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UploadPanel({ onSuccess }: { onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploader, setUploader] = useState("");
  const [description, setDescription] = useState("");
  
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      // Max 500MB
      if (selected.size > 500 * 1024 * 1024) {
        setError("File size exceeds 500MB limit.");
        return;
      }
      
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!validTypes.includes(selected.type)) {
        setError("Please select a valid video file (MP4, WebM, or MOV).");
        return;
      }
      
      setFile(selected);
      setError("");
      
      if (!title) {
        setTitle(selected.name.split('.')[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !uploader) {
      setError("Please fill in all required fields.");
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setError("Supabase configuration is missing in environment variables.");
      return;
    }

    setIsUploading(true);
    setError("");
    setProgress(0);

    // Prepare direct upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const storagePath = `uploads/${fileName}`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/project-videos/${storagePath}`;

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 95);
          setProgress(pct);
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            // File uploaded successfully, now insert the metadata
            const supabase = createClient(supabaseUrl, supabaseAnonKey);
            const { data: publicUrlData } = supabase.storage.from("project-videos").getPublicUrl(storagePath);
            
            const { error: dbError } = await supabase.from("videos").insert([{
              title,
              uploader,
              description,
              storage_path: storagePath,
              public_url: publicUrlData.publicUrl
            }]);

            if (dbError) {
              throw new Error("Video uploaded, but failed to save video details.");
            }

            setProgress(100);
            setSuccess(true);
            setTimeout(() => { onSuccess(); }, 1500);
            resolve();
          } catch (err: any) {
            reject(new Error(err.message || "Failed to process video metadata."));
          }
        } else {
          try {
            const result = JSON.parse(xhr.responseText);
            reject(new Error(result?.message || result?.error || `Upload failed (${xhr.status})`));
          } catch {
            reject(new Error(`Unexpected server response (${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Network error — check your connection and try again."));
      xhr.ontimeout = () => reject(new Error("Upload timed out. Try a smaller file or check your connection."));
      xhr.timeout = 30 * 60 * 1000; // 30 minutes for large files

      xhr.open("POST", uploadUrl);
      xhr.setRequestHeader("Authorization", `Bearer ${supabaseAnonKey}`);
      xhr.setRequestHeader("apikey", supabaseAnonKey);
      xhr.setRequestHeader("Content-Type", file.type);
      // Send the raw file directly to bypass Next.js API and Vercel limits
      xhr.send(file);
    }).catch((err: Error) => {
      setError(err.message || "An error occurred during upload.");
      setIsUploading(false);
      setProgress(0);
    });
  };

  return (
    <div className="glass p-6 md:p-8 rounded-2xl border-primary/20 bg-primary/5">
      {success ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-6"
          >
            <CheckCircle2 size={40} />
          </motion.div>
          <h3 className="text-2xl font-bold mb-2">Upload Successful!</h3>
          <p className="text-white/60">Your video has been added to the showcase.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
          {/* File Selection Area */}
          <div className="flex flex-col">
            <div 
              className={`flex-1 min-h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center transition-colors cursor-pointer
                ${file ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-white/30 bg-black/20'}
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="video/mp4,video/webm,video/quicktime" 
                className="hidden" 
              />
              
              {file ? (
                <>
                  <VideoIcon className="w-12 h-12 text-primary mb-4" />
                  <p className="font-medium text-white mb-1 truncate max-w-[200px]">{file.name}</p>
                  <p className="text-sm text-white/50">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  <button 
                    type="button"
                    className="mt-4 text-sm text-primary hover:text-primary/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    Change file
                  </button>
                </>
              ) : (
                <>
                  <PlusCircle className="w-12 h-12 text-white/20 mb-4" />
                  <p className="font-medium text-white mb-1">Click to select video</p>
                  <p className="text-sm text-white/50">MP4, WebM, MOV up to 500MB</p>
                </>
              )}
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Form Fields Area */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Video Title *</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Building a fullstack app with Agent Mode"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white"
                disabled={isUploading}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Your Name *</label>
              <input 
                type="text" 
                value={uploader}
                onChange={(e) => setUploader(e.target.value)}
                placeholder="e.g. Alex Developer"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white"
                disabled={isUploading}
                required
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-white/80 mb-1.5">Description (Optional)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share some details about what you built..."
                className="w-full h-full min-h-[100px] bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white resize-none"
                disabled={isUploading}
              />
            </div>

            <div className="mt-auto pt-4">
              <button
                type="submit"
                disabled={!file || !title || !uploader || isUploading}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/30 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all relative overflow-hidden"
              >
                <span className={`relative z-10 flex items-center justify-center gap-2 ${isUploading ? 'opacity-0' : 'opacity-100'}`}>
                  <Upload size={18} />
                  Upload Video
                </span>
                
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <span className="text-sm font-medium">Uploading... {progress}%</span>
                  </div>
                )}
                
                {isUploading && (
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300 z-0"
                    style={{ width: `${progress}%` }}
                  />
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
