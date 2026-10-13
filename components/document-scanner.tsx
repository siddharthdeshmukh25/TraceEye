"use client";

import { useState, useRef, useEffect } from "react";
import { X, Camera, Download, RotateCw, Check, Crop, Scissors } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AudioCtx } from "@/lib/audio";
import html2canvas from "html2canvas";

interface DocumentScannerProps {
  onClose: () => void;
  onScanComplete?: (imageData: string) => void;
}

export default function DocumentScanner({ onClose, onScanComplete }: DocumentScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied or not available');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    setIsCapturing(true);

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/png');
        setCapturedImage(imageData);
        setIsCapturing(false);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const downloadDocument = async () => {
    
    if (captureContainerRef.current && capturedImage) {
      try {
        const canvas = await html2canvas(captureContainerRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
        });
        
        const link = document.createElement('a');
        link.download = `tracery-scan-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        if (onScanComplete) {
          onScanComplete(capturedImage);
        }
      } catch (err) {
        console.error('Download error:', err);
        setError('Failed to download document');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-gradient-to-br from-slate-50 to-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-500 text-white">
              <Camera size={20} />
            </div>
            <h2 className="text-lg font-bold text-white">Document Scanner</h2>
          </div>
          <button
            onClick={() => {
              playClickSound();
              stopCamera();
              onClose();
            }}
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Camera/Preview Area */}
        <div className="relative bg-slate-900 aspect-[4/3] overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-rose-500/20 mb-4">
                <Camera size={32} className="text-rose-400" />
              </div>
              <p className="text-sm font-medium text-slate-300">{error}</p>
              <button
                onClick={() => {
                  playClickSound();
                  startCamera();
                }}
                className="mt-4 px-6 py-3 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
              >
                Retry Camera
              </button>
            </div>
          ) : capturedImage ? (
            <div ref={captureContainerRef} className="relative w-full h-full bg-white">
              <img
                src={capturedImage}
                alt="Captured document"
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                TraceEye Scan
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Scan overlay for camera */}
          {!capturedImage && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64 border-2 border-dashed border-white/50 rounded-lg">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
              </div>
            </div>
          )}

          {/* Flash effect when capturing */}
          <AnimatePresence>
            {isCapturing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white pointer-events-none"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Footer */}
        <div className="p-5 bg-gradient-to-b from-slate-50 to-white">
          {capturedImage ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Check size={16} className="text-emerald-500" />
                <span className="font-medium">Document captured successfully</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={downloadDocument}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30"
                >
                  <Download size={18} />
                  Download
                </button>
                <button
                  onClick={retakePhoto}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-300 transition-colors"
                >
                  <RotateCw size={18} />
                  Retake
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={captureImage}
              disabled={!stream}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera size={20} />
              Capture Document
            </button>
          )}
          
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Scissors size={14} />
            <span>Position document within the frame for best results</span>
          </div>
        </div>
      </div>
    </div>
  );
}
