"use client";

import { Share2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleShare = async () => {
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
        console.log('Share failed:', err);
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
      className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/20 transition-colors"
    >
      <Share2 size={16} />
      <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
    </button>
  );
}