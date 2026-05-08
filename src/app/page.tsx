"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BarChart2, PlayCircle, Terminal, BookOpen, SearchCode, Cpu } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-4">
        {/* Abstract Background Effect */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/40 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-600/30 rounded-full blur-[128px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
        </div>

        <div className="z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-sm text-primary mb-8 border-primary/20"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Buildex is now live
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight"
          >
            AI that helps you <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">build</span>, not copy
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl"
          >
            An interactive AI-powered IDE that teaches you to code — step by step, concept by concept.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
          >
            <Link
              href="/analytics"
              className="px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium flex items-center gap-2 transition-all hover:gap-3 w-full sm:w-auto justify-center shadow-[0_0_40px_8px_rgba(79,53,210,0.3)]"
            >
              <BarChart2 size={20} />
              See Live Analytics
            </Link>
            <Link
              href="/videos"
              className="px-8 py-4 rounded-xl glass hover:bg-white/10 text-white font-medium flex items-center gap-2 transition-all w-full sm:w-auto justify-center"
            >
              <PlayCircle size={20} />
              Watch Demos
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Problem vs Solution */}
      <section className="w-full py-24 px-4 bg-black/40">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass p-8 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />
              <h3 className="text-2xl font-bold mb-4 text-red-400">The Problem</h3>
              <p className="text-white/60 leading-relaxed">
                Students blindly copy AI-generated code without understanding it. The tools that were supposed to accelerate learning have become crutches, creating a generation of developers who can't build from scratch or debug effectively.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass p-8 relative overflow-hidden group border-primary/30 bg-primary/5"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <h3 className="text-2xl font-bold mb-4 text-primary">The Buildex Way</h3>
              <p className="text-white/60 leading-relaxed">
                AI as a mentor, not a coder. Buildex guides you through implementation, explains complex logic, and helps you identify bugs — ensuring you actually learn the underlying concepts while shipping real software.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How it works</h2>
            <p className="text-white/50">A structured path from idea to real understanding</p>
          </div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 z-0" />
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
              {[
                { step: "01", title: "User Gives Idea" },
                { step: "02", title: "AI Creates Roadmap" },
                { step: "03", title: "Guided Coding" },
                { step: "04", title: "AI Explains & Debugs" },
                { step: "05", title: "Project Completed" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 rounded-2xl glass bg-[#0A0A0F] border-primary/40 flex items-center justify-center text-xl font-bold text-primary mb-4 shadow-[0_0_15px_rgba(79,53,210,0.2)]">
                    {item.step}
                  </div>
                  <h4 className="font-medium text-white/90">{item.title}</h4>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Four Modes */}
      <section className="w-full py-24 px-4 bg-black/40">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Four powerful modes</h2>
            <p className="text-white/50">Everything you need to master your stack</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: BookOpen, title: "Learn Mode", desc: "Step-by-step guided coding sessions tailored to your skill level." },
              { icon: SearchCode, title: "Explain Mode", desc: "Deep syntax & logic breakdowns of any code block you highlight." },
              { icon: Terminal, title: "Debug Mode", desc: "Terminal-aware debugging that helps you find and fix the root cause." },
              { icon: Cpu, title: "Agent Mode", desc: "Autonomous coding with real-time explanations of what's being built." },
            ].map((mode, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-8 hover:bg-white/10 transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <mode.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">{mode.title}</h3>
                <p className="text-white/60">{mode.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="w-full py-24 px-4 border-t border-white/5">
        <div className="container mx-auto max-w-5xl text-center">
          <h3 className="text-sm font-semibold tracking-widest uppercase text-white/40 mb-8">Powered by</h3>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
            {["React", "Electron", "Monaco Editor", "Node.js", "Tailwind", "Pollinations AI"].map((tech, i) => (
              <div key={i} className="px-6 py-3 rounded-full glass text-sm font-medium">
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
