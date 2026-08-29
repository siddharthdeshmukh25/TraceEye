"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ShieldCheck, Loader2, RefreshCw, Lock, Zap, Camera, QrCode } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const [encryptedData, setEncryptedData] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    reason?: string;
    batchId?: string;
    traceUrl?: string;
  } | null>(null);

  const handleVerifyWithData = async (data: string) => {
    if (!data.trim()) return;
    setVerifying(true);
    setResult(null);
    try {
      const response = await fetch("/api/qr/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ encryptedData: data }),
      });
      const responseData = await response.json();
      setResult(responseData);
      if (responseData.valid && responseData.traceUrl) {
        setTimeout(() => {
          router.push(responseData.traceUrl);
        }, 1500);
      }
    } catch (error) {
      setResult({
        valid: false,
        reason: "Network error during verification",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = async () => {
    await handleVerifyWithData(encryptedData);
  };

  // Check if encrypted data is in URL query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const data = urlParams.get("data");
    if (data) {
      setEncryptedData(data);
      // Auto-verify with slight delay for better UX
      setTimeout(() => {
        handleVerifyWithData(data);
      }, 500);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-mint flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border-2 border-emerald-200 bg-white p-8 shadow-xl">
          {/* Enhanced Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-lime mx-auto mb-4 shadow-lg">
                <ShieldCheck size={40} />
              </div>
              <div className="absolute -top-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-amber-400 text-amber-900 shadow-md">
                <Lock size={14} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-forest">Secure QR Scanner</h1>
            <p className="text-sm text-slate-600 mt-2">
              AES-256-GCM Encrypted Product Verification
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                <Zap size={10} />
                <span>Military-Grade Security</span>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {/* Mobile-friendly Instructions */}
            <div className="rounded-2xl bg-blue-50 border-2 border-blue-200 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600">
                  <Camera size={14} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900">Easy Mobile Scanning</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Just scan the QR code with your phone's camera - it will automatically open this page and verify the product!
                  </p>
                </div>
              </div>
            </div>

            {/* Manual Input Section */}
            <div>
              <label className="text-sm font-bold text-forest block mb-2 flex items-center gap-2">
                <QrCode size={14} className="text-emerald-600" />
                Encrypted QR Data
              </label>
              <textarea
                value={encryptedData}
                onChange={(e) => setEncryptedData(e.target.value)}
                placeholder="Paste encrypted QR data here..."
                className="w-full rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-mono focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                rows={4}
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Scan or paste the encrypted QR code from TraceEye products
              </p>
            </div>

            {/* Enhanced Verify Button */}
            <button
              onClick={handleVerify}
              disabled={verifying || !encryptedData.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-4 text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:from-emerald-700 hover:to-emerald-800 shadow-lg hover:shadow-xl"
            >
              {verifying ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verifying Encryption...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Verify & Decrypt QR Code</span>
                </>
              )}
            </button>

            {/* Enhanced Result Display */}
            {result && (
              <div
                className={`rounded-2xl p-5 border-2 ${
                  result.valid
                    ? "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-300"
                    : "bg-gradient-to-r from-rose-50 to-rose-100 border-rose-300"
                }`}
              >
                {result.valid ? (
                  <div className="text-center">
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white mx-auto mb-4 shadow-lg">
                      <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-900">✅ QR Verified Successfully</h3>
                    <p className="text-sm text-emerald-700 mt-2">
                      Batch ID: <span className="font-mono font-bold">{result.batchId}</span>
                    </p>
                    <p className="text-sm text-emerald-600 mt-1">
                      Redirecting to product passport...
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-700">Secure Connection</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-rose-500 text-white mx-auto mb-4 shadow-lg">
                      <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-rose-900">⚠️ QR Verification Failed</h3>
                    <p className="text-sm text-rose-700 mt-2 font-medium">
                      {result.reason || "Invalid or tampered QR code"}
                    </p>
                    <div className="mt-4 p-3 rounded-xl bg-white/50 border border-rose-200">
                      <p className="text-xs text-rose-600">
                        This QR code could not be decrypted. It may be fake, tampered, or corrupted.
                      </p>
                    </div>
                    <button
                      onClick={() => setResult(null)}
                      className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-rose-700 hover:text-rose-800 mx-auto bg-white px-4 py-2 rounded-xl border border-rose-300 hover:bg-rose-50 transition-colors"
                    >
                      <RefreshCw size={14} />
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Footer */}
          <div className="mt-8 pt-6 border-t border-emerald-100">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lock size={12} className="text-emerald-600" />
              <p className="text-xs font-bold text-emerald-700">
                AES-256-GCM Encryption
              </p>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Military-grade security for product authentication and anti-counterfeiting
            </p>
          </div>
        </div>

        {/* Quick Help Section */}
        <div className="mt-6 rounded-2xl bg-white/80 border border-emerald-200 p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <Camera size={14} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-forest">How to Scan</h4>
              <p className="text-xs text-slate-600 mt-1">
                Open your phone's camera app and point it at the QR code. Your phone will automatically detect it and open this page for verification!
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}