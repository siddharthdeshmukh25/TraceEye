"use client";

import { useState, useEffect, useRef } from "react";
import { X, Camera, ScanLine, RefreshCw, QrCode, CheckCircle2 } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onClose: () => void;
  onScan: (result: string) => void;
}

export default function QRScanner({ onClose, onScan }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = useRef<string>("qr-reader");

  const startScanner = async () => {
    try {
      setLoading(true);
      setError(null);
      setDetectedCode(null);
      console.log('Starting QR scanner...');
      
      // Clean up existing scanner if any
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
          scannerRef.current = null;
          console.log('Cleaned up existing scanner');
        } catch (e) {
          console.log('Stop error (normal):', e);
        }
      }

      // Clear any existing video elements in the container
      const container = document.getElementById(readerId.current);
      if (container) {
        container.innerHTML = '';
        console.log('Cleared container');
      }

      // Remove any video elements with html5-qrcode class
      const existingVideos = document.querySelectorAll('video[id^="qr-reader"]');
      existingVideos.forEach(video => video.remove());
      console.log('Removed existing videos:', existingVideos.length);

      const html5QrCode = new Html5Qrcode(readerId.current);
      scannerRef.current = html5QrCode;
      console.log('Created Html5Qrcode instance');

      const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
      console.log('Scanner config:', config);
      
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          console.log('QR Code detected:', decodedText);
          // QR code detected - show it to user for confirmation
          setDetectedCode(decodedText);
        },
        (errorMessage) => {
          console.log('Scanning error (normal):', errorMessage);
          // Ignore scanning errors
        }
      );
      
      console.log('Scanner started successfully');
      setScanning(true);
      setLoading(false);
      setCameraReady(true);
    } catch (err) {
      console.error('Scanner error:', err);
      setError("Camera access denied or not available");
      setScanning(false);
      setLoading(false);
      setCameraReady(false);
    }
  };

  const handleConfirmScan = () => {
    if (detectedCode) {
      onScan(detectedCode);
      stopScanner();
      onClose();
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (e) {
        // Ignore stop errors
      }
    }
    
    // Clear container
    const container = document.getElementById(readerId.current);
    if (container) {
      container.innerHTML = '';
    }
    
    setScanning(false);
  };

  useEffect(() => {
    // Auto-start scanner when component mounts
    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gradient-to-br from-slate-50 to-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-white">
              <QrCode size={20} />
            </div>
            <h2 className="text-lg font-bold text-white">Scan QR Code</h2>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative aspect-square bg-slate-900">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center z-10 bg-slate-900">
              <RefreshCw size={56} className="mb-4 text-emerald-400 animate-spin" />
              <p className="text-sm font-medium text-slate-300">Starting camera...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center z-10 bg-slate-900">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-rose-500/20 mb-4">
                <Camera size={32} className="text-rose-400" />
              </div>
              <p className="text-sm font-medium text-slate-300">{error}</p>
              <button
                onClick={startScanner}
                className="mt-4 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
              >
                Retry Camera
              </button>
            </div>
          ) : (
            <>
              <div id={readerId.current} className="w-full h-full overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
              {/* Scan Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="relative w-72 h-72">
                  {/* Corner markers with glow effect */}
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg shadow-[0_0_20px_rgba(52,211,153,0.5)]" />
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg shadow-[0_0_20px_rgba(52,211,153,0.5)]" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg shadow-[0_0_20px_rgba(52,211,153,0.5)]" />
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-400 rounded-br-lg shadow-[0_0_20px_rgba(52,211,153,0.5)]" />
                  
                  {/* Scan line with glow - moves up and down */}
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-[scanMove_2s_ease-in-out_infinite]">
                    <ScanLine className="absolute -top-2 left-1/2 -translate-x-1/2 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" size={20} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-gradient-to-b from-slate-50 to-white">
          {detectedCode ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 p-4 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white">
                    <CheckCircle2 size={14} />
                  </div>
                  <p className="text-sm font-bold text-emerald-800">QR Code Detected!</p>
                </div>
                <p className="text-sm font-mono text-emerald-900 bg-white/50 rounded-lg px-3 py-2">{detectedCode}</p>
              </div>
              <button
                onClick={handleConfirmScan}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-forest text-white font-bold text-sm hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                Confirm Scan
              </button>
              <button
                onClick={() => setDetectedCode(null)}
                className="w-full py-3 rounded-xl bg-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-300 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Scan Again
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-slate-600">
              <ScanLine size={16} className="text-emerald-500 animate-pulse" />
              <p className="text-sm font-medium">Position QR code within the frame</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
