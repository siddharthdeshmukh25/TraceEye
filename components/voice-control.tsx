"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSpeechManager, parseVoiceCommand } from "@/lib/speech-recognition";
import { AudioCtx } from "@/lib/audio";

interface VoiceControlProps {
  onCommand?: (command: string, target?: string, action?: string) => void;
}

export default function VoiceControl({ onCommand }: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCommand, setLastCommand] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const speechManager = getSpeechManager();
    setIsSupported(speechManager.isSupported());

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const speechManager = getSpeechManager();
    
    const success = speechManager.startListening(
      (transcriptText) => {
        setTranscript(transcriptText);
        
        const command = parseVoiceCommand(transcriptText);
        if (command) {
          setLastCommand(transcriptText);
          setShowFeedback(true);
          
          if (onCommand) {
            onCommand(command.command, command.target, command.action);
          }

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            setShowFeedback(false);
            setTranscript("");
          }, 3000);
        }
      },
      (error) => {
        console.error('Voice control error:', error);
        setIsListening(false);
      },
      (status) => {
        setIsListening(status === 'listening');
      }
    );

    if (!success) {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    const speechManager = getSpeechManager();
    speechManager.stopListening();
    setIsListening(false);
    setTranscript("");
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={toggleListening}
        className={`grid h-9 w-9 place-items-center rounded-xl transition-all shadow-[1px_1px_0_rgba(0,0,0,0.08)] active:shadow-[0_0_0_rgba(0,0,0,0)] ${
          isListening
            ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white animate-pulse"
            : "bg-white text-slate-700 border border-emerald-950/10"
        }`}
        title={isListening ? "Stop voice control" : "Start voice control"}
      >
        {isListening ? <Mic size={18} /> : <MicOff size={18} />}
      </motion.button>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Voice Control Active</p>
                <p className="text-xs text-slate-500">Say a command...</p>
              </div>
            </div>

            {transcript && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500 mb-1">Listening:</p>
                <p className="text-sm font-medium text-slate-900">{transcript}</p>
              </div>
            )}

            <div className="mt-3 text-xs text-slate-500">
              <p className="font-medium mb-1">Try saying:</p>
              <ul className="space-y-1 text-slate-600">
                <li>• "Go to dashboard"</li>
                <li>• "Show batches"</li>
                <li>• "Register batch"</li>
                <li>• "Scan QR code"</li>
                <li>• "Scan document"</li>
                <li>• "Refresh"</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFeedback && lastCommand && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-12 z-50 flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg"
          >
            <Volume2 size={16} />
            <span>Command recognized!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
