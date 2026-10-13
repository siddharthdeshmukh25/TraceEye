type SpeechRecognitionResult = {
  transcript: string;
  confidence: number;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): any;
    };
    webkitSpeechRecognition?: {
      new (): any;
    };
  }
}

class SpeechRecognitionManager {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;
  private onResultCallback: ((transcript: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onStatusCallback: ((status: 'idle' | 'listening' | 'processing') => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionConstructor) {
        try {
          this.recognition = new SpeechRecognitionConstructor();
          this.recognition.continuous = true;
          this.recognition.interimResults = true;
          this.recognition.lang = 'en-US';

          this.recognition.onresult = (event: SpeechRecognitionEvent) => {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript;

            if (this.onResultCallback) {
              this.onResultCallback(transcript);
            }
          };

          this.recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (this.onErrorCallback) {
              this.onErrorCallback(event.error);
            }
            this.isListening = false;
            if (this.onStatusCallback) {
              this.onStatusCallback('idle');
            }
          };

          this.recognition.onend = () => {
            if (this.isListening) {
              // Restart if still supposed to be listening
              setTimeout(() => {
                if (this.isListening && this.recognition) {
                  try {
                    this.recognition.start();
                  } catch (e) {
                    console.error('Failed to restart speech recognition:', e);
                  }
                }
              }, 100);
            } else {
              if (this.onStatusCallback) {
                this.onStatusCallback('idle');
              }
            }
          };
        } catch (error) {
          console.error('Failed to initialize SpeechRecognition:', error);
          this.recognition = null;
        }
      }
    }
  }

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    return !!SpeechRecognitionConstructor;
  }

  startListening(
    onResult: (transcript: string) => void,
    onError?: (error: string) => void,
    onStatus?: (status: 'idle' | 'listening' | 'processing') => void
  ): boolean {
    if (!this.recognition) {
      const error = 'Speech recognition not supported in this browser';
      if (onError) onError(error);
      return false;
    }

    if (this.isListening) {
      return true;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.onStatusCallback = onStatus || null;

    try {
      this.recognition.start();
      this.isListening = true;
      if (this.onStatusCallback) {
        this.onStatusCallback('listening');
      }
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      if (onError) {
        onError('Failed to start speech recognition');
      }
      return false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Failed to stop speech recognition:', error);
      }
      this.isListening = false;
      if (this.onStatusCallback) {
        this.onStatusCallback('idle');
      }
    }
  }

  getStatus(): 'idle' | 'listening' | 'processing' {
    return this.isListening ? 'listening' : 'idle';
  }
}

// Singleton instance
let speechManager: SpeechRecognitionManager | null = null;

export function getSpeechManager(): SpeechRecognitionManager {
  if (!speechManager) {
    speechManager = new SpeechRecognitionManager();
  }
  return speechManager;
}

export function parseVoiceCommand(transcript: string): {
  command: string;
  target?: string;
  action?: string;
} | null {
  const lowerTranscript = transcript.toLowerCase().trim();

  // Navigation commands
  if (lowerTranscript.includes('go to') || lowerTranscript.includes('navigate to')) {
    const target = lowerTranscript.replace(/go to|navigate to/g, '').trim();
    return { command: 'navigate', target };
  }

  if (lowerTranscript.includes('dashboard') || lowerTranscript.includes('overview')) {
    return { command: 'navigate', target: 'overview' };
  }

  if (lowerTranscript.includes('batches') || lowerTranscript.includes('registry')) {
    return { command: 'navigate', target: 'batches' };
  }

  if (lowerTranscript.includes('safety') || lowerTranscript.includes('recall')) {
    return { command: 'navigate', target: 'safety' };
  }

  if (lowerTranscript.includes('tracking') || lowerTranscript.includes('gps')) {
    return { command: 'navigate', target: 'tracking' };
  }

  if (lowerTranscript.includes('verification') || lowerTranscript.includes('seal')) {
    return { command: 'navigate', target: 'verification' };
  }

  if (lowerTranscript.includes('passport') || lowerTranscript.includes('qr')) {
    return { command: 'navigate', target: 'passports' };
  }

  // Action commands
  if (lowerTranscript.includes('register') && lowerTranscript.includes('batch')) {
    return { command: 'action', action: 'register_batch' };
  }

  if (lowerTranscript.includes('scan') && lowerTranscript.includes('qr')) {
    return { command: 'action', action: 'scan_qr' };
  }

  if (lowerTranscript.includes('scan') && (lowerTranscript.includes('document') || lowerTranscript.includes('doc') || lowerTranscript.includes('file'))) {
    return { command: 'action', action: 'scan_document' };
  }

  if (lowerTranscript.includes('refresh') || lowerTranscript.includes('reload')) {
    return { command: 'action', action: 'refresh' };
  }

  if (lowerTranscript.includes('logout') || lowerTranscript.includes('log out') || lowerTranscript.includes('sign out')) {
    return { command: 'action', action: 'logout' };
  }

  if (lowerTranscript.includes('search')) {
    const query = lowerTranscript.replace('search', '').replace('for', '').trim();
    return { command: 'action', action: 'search', target: query };
  }

  return null;
}
