"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Video as VideoIcon, CheckCircle2, AlertCircle, Trash2, Link as LinkIcon, Youtube, PlusCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

type VideoRecord = {
  id: string;
  created_at: string;
  title: string;
  uploader: string;
  description: string;
  public_url: string | null;
  storage_path: string | null;
  video_url: string | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ── Utility: extract YouTube / Vimeo embed URL ─────────────────────────────
function getEmbedUrl(url: string): { embedUrl: string; type: "youtube" | "vimeo" | "unknown"; thumbnailUrl: string } {
  // YouTube formats:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://youtube.com/shorts/VIDEO_ID
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`,
      type: "youtube",
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  // Vimeo formats:
  // https://vimeo.com/VIDEO_ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    return {
      embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1`,
      type: "vimeo",
      thumbnailUrl: `https://vumbnail.com/${id}.jpg`, // free Vimeo thumbnail service
    };
  }

  return { embedUrl: url, type: "unknown", thumbnailUrl: "" };
}

function getThumbnailUrl(video: VideoRecord): string {
  const src = video.video_url || video.public_url || "";
  if (!src) return "";
  const { thumbnailUrl } = getEmbedUrl(src);
  return thumbnailUrl;
}

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

    mutate(
      (current) => current ? { videos: current.videos.filter((v) => v.id !== deletedId) } : current,
      { revalidate: false }
    );
    setSelectedVideo(null);
    setConfirmDelete(false);
    setIsDeleting(false);

    try {
      const res = await fetch("/api/delete-video", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletedId, storage_path: selectedVideo.storage_path }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Delete failed");
      mutate();
    } catch (err: unknown) {
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

  const selectedEmbedInfo = selectedVideo
    ? getEmbedUrl(selectedVideo.video_url || selectedVideo.public_url || "")
    : null;

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
              onClick={() => { setAutoplayNext(true); setSelectedVideo(data.videos[0]); }}
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
            {isUploadOpen ? <X size={20} /> : <LinkIcon size={20} />}
            {isUploadOpen ? "Close" : "Add Video"}
          </button>
        </div>
      </div>

      {/* Upload Panel */}
      <AnimatePresence>
        {isUploadOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <SubmitPanel onSuccess={() => { mutate(); setIsUploadOpen(false); }} />
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
          {data.videos.map((video, i) => {
            const thumb = getThumbnailUrl(video);
            return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass overflow-hidden group cursor-pointer hover:border-primary/50 transition-all hover:shadow-[0_0_30px_rgba(79,53,210,0.2)]"
                onClick={() => setSelectedVideo(video)}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-black relative overflow-hidden flex items-center justify-center">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={video.title}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-indigo-900/30 flex items-center justify-center">
                      <VideoIcon size={40} className="text-white/20" />
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center text-white backdrop-blur-md scale-90 opacity-90 group-hover:scale-100 group-hover:opacity-100 transition-all shadow-lg shadow-primary/30">
                      <Play size={22} className="ml-1" />
                    </div>
                  </div>
                  {/* YouTube badge */}
                  {(video.video_url || video.public_url || "").includes("youtube") && (
                    <div className="absolute top-2 right-2 bg-red-600/90 backdrop-blur-sm rounded-md px-2 py-0.5 flex items-center gap-1">
                      <Youtube size={12} />
                      <span className="text-[10px] font-bold">YouTube</span>
                    </div>
                  )}
                  {(video.video_url || video.public_url || "").includes("vimeo") && (
                    <div className="absolute top-2 right-2 bg-[#1ab7ea]/90 backdrop-blur-sm rounded-md px-2 py-0.5 flex items-center gap-1">
                      <VideoIcon size={12} />
                      <span className="text-[10px] font-bold">Vimeo</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-1 truncate">{video.title}</h3>
                  <div className="flex items-center justify-between text-sm text-white/50">
                    <span className="truncate">{video.uploader}</span>
                    <span>{new Date(video.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="glass p-16 text-center rounded-2xl">
          <VideoIcon className="mx-auto text-white/20 mb-4" size={48} />
          <h2 className="text-xl font-bold mb-2">No videos yet</h2>
          <p className="text-white/60">Be the first to share what you&apos;ve built!</p>
        </div>
      )}

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && selectedEmbedInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => { setSelectedVideo(null); setConfirmDelete(false); setDeleteError(""); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0A0A0F] border border-white/10 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/50 shrink-0">
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
                  {/* Delete */}
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

              {/* Embed player */}
              <div className="w-full bg-black shrink-0" style={{ aspectRatio: "16/9" }}>
                <iframe
                  key={selectedVideo.id}
                  src={selectedEmbedInfo.embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  onLoad={autoplayNext ? undefined : undefined}
                />
              </div>

              {/* Info */}
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

// ── Submit Panel (YouTube / Vimeo URL form) ────────────────────────────────
function SubmitPanel({ onSuccess }: { onSuccess: () => void }) {
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [uploader, setUploader] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const urlInfo = videoUrl ? getEmbedUrl(videoUrl) : null;
  const isValidUrl = urlInfo && urlInfo.type !== "unknown";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl || !title || !uploader) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!isValidUrl) {
      setError("Please enter a valid YouTube or Vimeo URL.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { error: dbError } = await supabase.from("videos").insert([{
        title,
        uploader,
        description,
        video_url: videoUrl,
        // These are nullable now; we don't use Supabase Storage anymore
        storage_path: null,
        public_url: null,
      }]);

      if (dbError) throw new Error("Failed to save video details: " + dbError.message);

      setSuccess(true);
      setTimeout(() => onSuccess(), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      setIsSubmitting(false);
    }
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
          <h3 className="text-2xl font-bold mb-2">Video Added!</h3>
          <p className="text-white/60">Your video has been added to the showcase.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
          {/* URL Input Side */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                YouTube or Vimeo URL *
              </label>
              <div className="relative">
                <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => { setVideoUrl(e.target.value); setError(""); }}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Live preview / validation */}
            {videoUrl && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-4 flex items-start gap-3 ${
                  isValidUrl
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}
              >
                {isValidUrl ? (
                  <>
                    {urlInfo?.type === "youtube" && <Youtube size={18} className="text-red-400 shrink-0 mt-0.5" />}
                    {urlInfo?.type === "vimeo" && <VideoIcon size={18} className="text-[#1ab7ea] shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-sm font-medium text-green-400">Valid {urlInfo?.type === "youtube" ? "YouTube" : "Vimeo"} URL ✓</p>
                      <p className="text-xs text-white/40 mt-0.5">Video will be embedded directly — no file size limits!</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-400">Not a recognized URL</p>
                      <p className="text-xs text-white/40 mt-0.5">Paste a YouTube or Vimeo link.</p>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {!videoUrl && (
              <div className="flex-1 min-h-[120px] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center p-6 text-center bg-black/20 gap-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                    <Youtube size={20} className="text-red-400" />
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#1ab7ea]/20 flex items-center justify-center">
                    <VideoIcon size={20} className="text-[#1ab7ea]" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-white/80 text-sm">Paste a YouTube or Vimeo link</p>
                  <p className="text-xs text-white/40 mt-1">No file size limits — any video length works!</p>
                </div>
              </div>
            )}

            {/* Thumbnail preview */}
            {isValidUrl && urlInfo?.thumbnailUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative aspect-video rounded-xl overflow-hidden border border-white/10"
              >
                <img src={urlInfo.thumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center">
                    <Play size={20} className="ml-1 text-white" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white/60 px-2 py-0.5 rounded-md">Preview</span>
              </motion.div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Details Side */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Video Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Building a fullstack app with Agent Mode"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white"
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>

            <div className="mt-auto pt-2">
              <button
                type="submit"
                disabled={!videoUrl || !title || !uploader || isSubmitting || !isValidUrl}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/30 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <PlusCircle size={18} />
                )}
                {isSubmitting ? "Adding..." : "Add to Showcase"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
