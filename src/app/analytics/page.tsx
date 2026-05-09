"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend, LabelList
} from "recharts";
import { RefreshCw, Star, Users, ThumbsUp, Clock, MessageSquare, AlertCircle } from "lucide-react";
import { AnalyticsData } from "@/app/api/analytics/route";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const COLORS = ['#4F35D2', '#8B5CF6', '#D946EF', '#6366F1', '#3B82F6'];

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A0A0F]/90 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-2xl">
        <p className="text-white/60 text-xs mb-1 uppercase tracking-wider font-medium">{label || payload[0].name}</p>
        <p className="text-white font-bold text-lg">{payload[0].value} <span className="text-white/40 text-sm font-normal">responses</span></p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { data, error, isLoading, mutate } = useSWR<AnalyticsData>("/api/analytics", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  const [timeAgo, setTimeAgo] = useState("Just now");

  useEffect(() => {
    if (!data?.lastUpdated) return;
    
    const interval = setInterval(() => {
      const seconds = Math.floor((new Date().getTime() - new Date(data.lastUpdated).getTime()) / 1000);
      if (seconds < 60) setTimeAgo(`${seconds} seconds ago`);
      else setTimeAgo(`${Math.floor(seconds / 60)} mins ago`);
    }, 1000);

    return () => clearInterval(interval);
  }, [data?.lastUpdated]);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-[calc(100vh-160px)]">
        <div className="glass p-8 text-center max-w-md border-red-500/30 bg-red-500/5">
          <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
          <h2 className="text-xl font-bold text-red-400 mb-2">Error loading data</h2>
          <p className="text-white/60 mb-4">Could not connect to the Google Sheet live feed.</p>
          <button 
            onClick={() => mutate()}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center justify-center gap-2 mx-auto font-medium"
          >
            <RefreshCw size={18} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    // Mobile: full scrollable page. Desktop (lg+): fixed viewport dashboard
    <div className="w-full max-w-[1920px] mx-auto px-4 py-4
                    lg:h-[calc(100vh-100px)] lg:flex lg:flex-col lg:overflow-hidden lg:pb-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0 flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Live Analytics Dashboard</h1>
          <p className="text-primary/80 text-sm font-medium">Real-time data from Google Forms</p>
        </div>
        <div className="flex items-center gap-3 text-xs bg-white/5 border border-white/10 p-1.5 pr-4 rounded-full backdrop-blur-md">
          <button
            onClick={() => { mutate(); setTimeAgo("Just now"); }}
            className="w-8 h-8 flex items-center justify-center bg-primary/20 hover:bg-primary/40 text-primary rounded-full transition-colors"
            title="Refresh now"
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
          <span className="text-white/60 font-medium">
            {isLoading ? "Updating..." : `Updated: ${timeAgo}`}
          </span>
        </div>
      </div>

      {!data && isLoading ? (
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : data ? (
        // ── MOBILE: single column, scrollable ──────────────────────────────
        // ── DESKTOP (lg+): two-column fixed-height layout ──────────────────
        <div className="flex flex-col gap-5 lg:flex-1 lg:flex lg:flex-row lg:min-h-0">

          {/* ── Left / Main column ── */}
          <div className="flex flex-col gap-5 lg:w-[75%] lg:min-h-0">

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-5 shrink-0">
              <StatCard
                title="Total Responses"
                value={data.totalResponses}
                icon={<Users className="text-indigo-400" />}
                gradient="from-indigo-500/10 to-transparent"
              />
              <StatCard
                title="Avg Rating"
                value={data.averageRating}
                suffix="/ 5"
                icon={<Star className="text-yellow-400 fill-yellow-400/20" />}
                gradient="from-yellow-500/10 to-transparent"
              />
              <StatCard
                title="Would Use"
                value={data.wouldUsePercentage}
                suffix="%"
                icon={<ThumbsUp className="text-emerald-400" />}
                gradient="from-emerald-500/10 to-transparent"
              />
            </div>

            {/* Rating & Concept Clarity */}
            <div className="flex flex-col sm:flex-row gap-5 lg:flex-1 lg:min-h-0">
              <div className="h-64 sm:h-auto sm:flex-1 lg:w-1/2 lg:min-h-0 lg:h-full">
                <ChartCard title="Rating Distribution">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={data.ratingDistribution} margin={{ top: 25, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="rating" tick={{ fill: '#ffffff', fontSize: 14, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#ffffff90', fontSize: 13, fontWeight: 'bold' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff0a' }} />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} maxBarSize={60}>
                        <LabelList dataKey="count" position="top" fill="#ffffff" fontSize={14} fontWeight="bold" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <div className="h-64 sm:h-auto sm:flex-1 lg:w-1/2 lg:min-h-0 lg:h-full">
                <ChartCard title="Concept Clarity">
                  <div className="w-full h-full flex flex-col justify-center gap-5 px-2">
                    {data.conceptClarity.map((item, i) => {
                      const total = data.conceptClarity.reduce((acc, curr) => acc + curr.value, 0) || 1;
                      const percent = Math.round((item.value / total) * 100);
                      return (
                        <div key={i} className="w-full group">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-white/90 text-sm font-bold flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                              {item.name}
                            </span>
                            <span className="text-white/50 text-xs font-semibold">{item.value} <span className="font-normal text-[10px]">votes</span> ({percent}%)</span>
                          </div>
                          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full rounded-full relative"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                            </motion.div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ChartCard>
              </div>
            </div>

            {/* Standout & Future Features */}
            <div className="flex flex-col sm:flex-row gap-5 lg:flex-1 lg:min-h-0">
              <div className="h-72 sm:h-auto sm:flex-1 lg:w-1/2 lg:min-h-0 lg:h-full">
                <ChartCard title="Standout Features">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={data.standoutFeatures} layout="vertical" margin={{ top: 10, right: 40, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#ffffff90', fontSize: 12, fontWeight: 'bold' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={110} tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff0a' }} />
                      <Bar dataKey="count" fill="#4F35D2" radius={[0, 6, 6, 0]} barSize={20}>
                        <LabelList dataKey="count" position="right" fill="#ffffff" fontSize={13} fontWeight="bold" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <div className="h-72 sm:h-auto sm:flex-1 lg:w-1/2 lg:min-h-0 lg:h-full">
                <ChartCard title="Exciting Future Features">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={data.futureFeatures} layout="vertical" margin={{ top: 10, right: 40, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#ffffff90', fontSize: 12, fontWeight: 'bold' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={110} tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff0a' }} />
                      <Bar dataKey="count" fill="#D946EF" radius={[0, 6, 6, 0]} barSize={20}>
                        <LabelList dataKey="count" position="right" fill="#ffffff" fontSize={13} fontWeight="bold" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </div>

          </div>

          {/* ── Right / Sidebar column ── */}
          <div className="flex flex-col gap-5 lg:w-[25%] lg:min-h-0 lg:shrink-0">

            {/* Would You Use It */}
            <div className="h-64 lg:h-[35%] lg:shrink-0 lg:min-h-0">
              <ChartCard title="Would You Use It?">
                <div className="w-full flex flex-col justify-start gap-4 px-2 py-2 overflow-y-auto overflow-x-hidden custom-scrollbar h-full">
                  {data.wouldUseIt.map((item, i) => {
                    const total = data.wouldUseIt.reduce((acc, curr) => acc + curr.value, 0) || 1;
                    const percent = Math.round((item.value / total) * 100);
                    return (
                      <div key={i} className="w-full group">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-white/90 text-sm font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(i + 2) % COLORS.length] }}></span>
                            {item.name}
                          </span>
                          <span className="text-white/50 text-xs font-semibold">{item.value} <span className="font-normal text-[10px]">votes</span> ({percent}%)</span>
                        </div>
                        <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
                            className="h-full rounded-full relative"
                            style={{ backgroundColor: COLORS[(i + 2) % COLORS.length] }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            </div>

            {/* Live Feedback — fixed height on mobile, flex-1 on desktop */}
            <div className="h-80 lg:flex-1 glass p-5 flex flex-col lg:min-h-0 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#0A0A0F]/80 to-transparent pointer-events-none z-10 rounded-t-2xl" />
              <div className="flex items-center gap-3 mb-4 shrink-0 relative z-20">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <MessageSquare size={16} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Live Feedback</h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar relative z-0 pb-4">
                <AnimatePresence>
                  {data.suggestions.length > 0 ? (
                    data.suggestions.map((suggestion, i) => (
                      <motion.div
                        key={`${suggestion.timestamp}-${i}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-primary/30 transition-colors shadow-lg"
                      >
                        <p className="text-white/90 text-sm leading-relaxed mb-3">"{suggestion.text}"</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-1.5 text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                            <Clock size={12} />
                            {suggestion.timestamp || "Recently"}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-white/40 text-sm flex flex-col items-center gap-3">
                      <MessageSquare size={24} className="opacity-20" />
                      No feedback submitted yet.
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ title, value, suffix = "", icon, gradient }: { title: string, value: number, suffix?: string, icon: React.ReactNode, gradient: string }) {
  return (
    <div className={`glass p-6 relative overflow-hidden group h-full flex flex-col justify-center border-white/10 hover:border-white/20 transition-colors bg-gradient-to-br ${gradient}`}>
      <div className="absolute top-1/2 -translate-y-1/2 right-6 opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500 pointer-events-none">
        <div className="w-16 h-16 [&>svg]:w-full [&>svg]:h-full drop-shadow-2xl">{icon}</div>
      </div>
      <h3 className="text-white/50 text-[10px] sm:text-xs font-bold mb-1 sm:mb-2 uppercase tracking-widest">{title}</h3>
      <div className="flex items-baseline gap-1 relative z-10">
        <span className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter drop-shadow-md">{value}</span>
        {suffix && <span className="text-sm sm:text-lg lg:text-xl font-bold text-white/50">{suffix}</span>}
      </div>
    </div>
  );
}

function ChartCard({ title, children, className = "" }: { title: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={`glass p-5 flex flex-col min-h-0 h-full w-full relative border-white/10 bg-black/20 ${className}`}>
      <h3 className="text-base font-bold mb-4 shrink-0 text-white/90 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary/80"></span>
        {title}
      </h3>
      <div className="flex-1 min-h-0 relative w-full h-full overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
