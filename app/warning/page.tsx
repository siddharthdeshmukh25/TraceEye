"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ShieldAlert, Home, ArrowLeft, Lock, Zap, AlertOctagon } from "lucide-react";

export default function WarningPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="rounded-3xl border-4 border-rose-400 bg-gradient-to-br from-rose-100 to-rose-50 p-8 shadow-2xl">
          {/* Enhanced Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white mx-auto mb-4 shadow-xl animate-pulse">
                <AlertOctagon size={48} />
              </div>
              <div className="absolute -top-2 -right-2 grid h-10 w-10 place-items-center rounded-full bg-amber-500 text-white shadow-lg">
                <Lock size={20} />
              </div>
            </div>
            <h1 className="text-4xl font-black text-rose-900 tracking-tight">
              ⚠️ SECURITY ALERT
            </h1>
            <p className="text-base text-rose-700 mt-2 font-bold">
              Tampered Product Detected
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="flex items-center gap-1 rounded-full bg-rose-200 px-3 py-1 text-xs font-bold text-rose-800">
                <Zap size={10} />
                <span>Encryption Failed</span>
              </div>
            </div>
          </div>

          <div className="space-y-5 mb-8">
            {/* Enhanced Integrity Failure Section */}
            <div className="rounded-2xl bg-white p-5 border-2 border-rose-300 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-rose-900 text-lg">QR Code Integrity Failed</h3>
                  <p className="text-sm text-rose-700 mt-2">
                    The scanned QR code could not be decrypted using AES-256-GCM encryption. This may indicate:
                  </p>
                  <ul className="text-sm text-rose-700 mt-3 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">•</span>
                      <span><strong>Fake or counterfeit product</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">•</span>
                      <span><strong>Tampered QR code</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">•</span>
                      <span><strong>Invalid security credentials</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">•</span>
                      <span><strong>Potential security breach</strong></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Enhanced Warning Section */}
            <div className="rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 p-5 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle size={24} className="text-white" />
                <h3 className="font-black text-white text-xl">⚠️ DO NOT CONSUME</h3>
              </div>
              <p className="text-sm text-rose-100 leading-relaxed">
                This product cannot be verified as authentic through our military-grade AES-256 encryption system. For your safety, do not consume or use this product.
              </p>
            </div>

            {/* Enhanced Report Section */}
            <div className="rounded-2xl bg-white p-5 border-2 border-rose-300 shadow-lg">
              <h3 className="font-bold text-rose-900 mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-600" />
                Report This Incident
              </h3>
              <p className="text-sm text-rose-700 mb-4">
                Help protect others by reporting suspected counterfeit products. Your report helps maintain supply chain integrity.
              </p>
              <button className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-3 text-sm font-bold text-white hover:from-rose-700 hover:to-rose-800 transition-all shadow-md hover:shadow-lg">
                📋 Report Counterfeit Product
              </button>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-rose-400 bg-white px-4 py-4 text-sm font-bold text-rose-700 hover:bg-rose-50 transition-colors shadow-md"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-4 text-sm font-bold text-white hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
            >
              <Home size={18} />
              Home
            </button>
          </div>

          {/* Enhanced Footer */}
          <div className="mt-8 pt-6 border-t-2 border-rose-300">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lock size={14} className="text-rose-600" />
              <p className="text-xs font-bold text-rose-700">
                TraceEye Security System
              </p>
            </div>
            <p className="text-xs text-rose-600 text-center font-medium">
              AES-256-GCM Military-Grade Encryption • Tamper Detection Active
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}