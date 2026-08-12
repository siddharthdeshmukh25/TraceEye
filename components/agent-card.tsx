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
    <div className="w-full max-w-5xl mx-auto space-y-4">
      <div ref={cardRef} className="relative rounded-[36px] bg-gradient-to-br from-[#FCFCF9] to-white border border-[#D7D8D2] shadow-lg overflow-hidden">
        {/* Dark green left accent strip */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#123D20] rounded-l-[36px]"></div>
        
        {/* Download icon in top-right corner */}
        <button
          onClick={handleDownload}
          className="absolute top-6 right-6 z-20 grid h-10 w-10 place-items-center rounded-full bg-[#EAF4DF] text-[#123D20] hover:bg-[#5FAF24] hover:text-white transition-colors"
          title="Download card"
        >
          <Download size={18} />
        </button>
        
        <div className="flex flex-col">
          {/* Content Area */}
          <div className="p-8 md:p-10 pl-10 md:pl-12">
            {/* ID with QR icon */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#EAF4DF] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#123D20]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <span className="text-[#123D20] font-semibold tracking-wider text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                {id}
              </span>
            </div>

            {/* Main Title with Script Word */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl text-[#10251C] leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                {title}{" "}
                <span className="text-[#5FAF24] font-normal" style={{ fontFamily: 'Allura, cursive' }}>
                  {highlightedWord}
                </span>
                <span className="text-[#10251C] font-normal" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {" "}{subtitle}
                </span>
              </h1>
              {/* Decorative line */}
              <div className="w-16 h-0.5 bg-[#EAF4DF] mt-4"></div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 text-sm mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="text-[#727A70]">{location}</span>
              <span className="text-[#5FAF24]">•</span>
              <span className="text-[#5FAF24] font-medium">{category}</span>
            </div>

            {/* Button */}
            <a
              href={passportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#EAF4DF] rounded-[14px] text-[#123D20] font-medium hover:bg-[#EAF4DF] transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <ExternalLink size={18} />
              Open public passport
            </a>
          </div>

          {/* QR Code Area at Bottom */}
          <div className="flex justify-center p-8 md:p-10 pt-0">
            <div className="bg-[#EAF4DF] rounded-[28px] border border-[#D7D8D2] p-4">
              <QRCodeSVG
                value={passportUrl}
                size={220}
                level="H"
                includeMargin={true}
                marginSize={10}
                fgColor="#123D20"
                bgColor="transparent"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}