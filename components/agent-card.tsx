"use client";

import { ExternalLink, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";

interface AgentCardProps {
  id: string;
  title: string;
  highlightedWord: string;
  subtitle: string;
  location: string;
  category: string;
  passportUrl: string;
}

export default function AgentCard({
  id,
  title,
  highlightedWord,
  subtitle,
  location,
  category,
  passportUrl,
}: AgentCardProps) {
  const [mounted, setMounted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const downloadButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      setIsDownloading(true);
      
      // Hide download button before capturing
      if (downloadButtonRef.current) {
        downloadButtonRef.current.style.display = 'none';
      }
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#FCFCF9",
        scale: 2, // Higher quality
        useCORS: true,
      });
      
      const link = document.createElement("a");
      link.download = `agent-card-${id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      // Show download button after capturing
      if (downloadButtonRef.current) {
        downloadButtonRef.current.style.display = 'grid';
      }
    } catch (error) {
      console.error("Download failed:", error);
      // Make sure button is visible even if download fails
      if (downloadButtonRef.current) {
        downloadButtonRef.current.style.display = 'grid';
      }
    } finally {
      setIsDownloading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full max-w-[85vw] sm:max-w-md md:max-w-2xl lg:max-w-5xl mx-auto space-y-4 px-2 sm:px-4">
      <div ref={cardRef} className="relative rounded-[20px] sm:rounded-[28px] md:rounded-[36px] bg-gradient-to-br from-[#FCFCF9] to-white border border-[#D7D8D2] shadow-lg overflow-hidden">
        {/* Dark green left accent strip */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 sm:w-2 bg-[#123D20] rounded-l-[20px] sm:rounded-l-[28px] md:rounded-l-[36px]"></div>
        
        {/* Download icon in top-right corner */}
        <button
          ref={downloadButtonRef}
          onClick={handleDownload}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-full bg-[#EAF4DF] text-[#123D20] hover:bg-[#5FAF24] hover:text-white transition-colors"
          title="Download card"
        >
          <Download size={16} className="sm:hidden" />
          <Download size={18} className="hidden sm:block" />
        </button>
        
        <div className="flex flex-col">
          {/* Content Area */}
          <div className="p-4 sm:p-6 md:p-8 lg:p-10 pl-6 sm:pl-8 md:pl-10 lg:pl-12">
            {/* ID with QR icon */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#EAF4DF] flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-[#123D20]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <span className="text-[#123D20] font-semibold tracking-wider text-xs sm:text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                {id}
              </span>
            </div>

            {/* Main Title with Script Word */}
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#10251C] leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                {title}{" "}
                <span className="text-[#5FAF24] font-normal" style={{ fontFamily: 'Allura, cursive' }}>
                  {highlightedWord}
                </span>
                <span className="text-[#10251C] font-normal" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {" "}{subtitle}
                </span>
              </h1>
              {/* Decorative line */}
              <div className="w-12 sm:w-16 h-0.5 bg-[#EAF4DF] mt-3 sm:mt-4"></div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm mb-4 sm:mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="text-[#727A70]">{location}</span>
              <span className="text-[#5FAF24]">•</span>
              <span className="text-[#5FAF24] font-medium">{category}</span>
            </div>

            {/* Button */}
            <a
              href={passportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-3 border border-[#EAF4DF] rounded-[10px] sm:rounded-[14px] text-[#123D20] font-medium text-xs sm:text-sm hover:bg-[#EAF4DF] transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <ExternalLink size={14} className="sm:hidden" />
              <ExternalLink size={18} className="hidden sm:block" />
              Open public passport
            </a>
          </div>

          {/* QR Code Area at Bottom */}
          <div className="flex justify-center p-4 sm:p-6 md:p-8 lg:p-10 pt-0">
            <div className="bg-[#EAF4DF] rounded-[16px] sm:rounded-[20px] md:rounded-[28px] border border-[#D7D8D2] p-2 sm:p-3 md:p-4">
              <QRCodeSVG
                value={passportUrl}
                size={120}
                level="H"
                includeMargin={true}
                marginSize={10}
                fgColor="#123D20"
                bgColor="transparent"
                className="w-full h-auto max-w-[120px] sm:max-w-[160px] md:max-w-[220px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}