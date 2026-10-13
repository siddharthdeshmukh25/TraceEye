"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Sparkles, Shield, Zap } from "lucide-react";
import { AudioCtx } from "@/lib/audio";

interface LoginTransitionProps {
  onComplete: () => void;
}

export default function LoginTransition({ onComplete }: LoginTransitionProps) {
  const [stage, setStage] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    AudioCtx.preload('ui_click_3d', 'ui_click_deep');

    const timeline = [
      () => setStage(1),
      () => setStage(2),
      () => setStage(3),
      () => setStage(4),
      () => onComplete(),
    ];

    const delays = [0, 300, 600, 900, 1200];
    const timers = delays.map((delay, index) =>
      setTimeout(() => timeline[index](), delay)
    );

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [onComplete]);

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900"
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-emerald-400/30"
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
              scale: 0,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Logo animation */}
        <AnimatePresence mode="wait">
          {stage >= 1 && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.5
              }}
              className="mb-8"
            >
              <div className="relative mx-auto h-24 w-24">
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-2xl shadow-emerald-500/50"
                >
                  <Leaf size={48} />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brand name */}
        <AnimatePresence mode="wait">
          {stage >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h1 className="text-5xl font-bold text-white mb-2 brand-wordmark">
                TraceEye
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-emerald-300 text-sm tracking-[0.3em]"
              >
                FOOD. TRUST. TRACE.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature icons */}
        <AnimatePresence mode="wait">
          {stage >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mt-12 flex justify-center gap-8"
            >
              {[
                { icon: Shield, label: "Secure" },
                { icon: Sparkles, label: "Smart" },
                { icon: Zap, label: "Fast" },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: index * 0.15,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 backdrop-blur-sm text-emerald-400">
                    <item.icon size={24} />
                  </div>
                  <span className="text-xs text-white/70">{item.label}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator */}
        <AnimatePresence mode="wait">
          {stage >= 4 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="mt-12"
            >
              <div className="flex items-center justify-center gap-2">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-2 w-2 rounded-full bg-emerald-400"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
              <p className="mt-4 text-sm text-white/60">Initializing workspace...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3D perspective floor */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-emerald-500/20 to-transparent"
        style={{
          transform: "perspective(1000px) rotateX(60deg)",
          transformOrigin: "bottom",
        }}
      />
    </motion.div>
  );
}
