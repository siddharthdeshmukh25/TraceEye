"use client";

import { Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { AudioCtx } from "@/lib/audio";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    AudioCtx.preload('ui_click_3d', 'ui_click_deep');
  }, []);

  const playClickSound = () => {
    try {
      AudioCtx.play("ui_click_3d");
    } catch {
      /* audio not ready */
    }
  };

  const handleShare = async () => {
    playClickSound();
    if (!mounted) return;
    
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TraceEye Food Passport',
          text: 'Check out this verified food product',
          url: shareUrl
        });
      } catch (err) {
        // Share failed silently
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!mounted) return null;

  return (
    <button 
      onClick={handleShare}
      className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/30 transition-all hover:from-emerald-400 hover:to-teal-400 hover:shadow-lg hover:shadow-emerald-500/40 active:scale-95"
    >
      <Share2 size={16} className="transition-transform group-hover:rotate-12" />
      <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
    </button>
  );
}