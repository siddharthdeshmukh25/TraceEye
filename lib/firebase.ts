import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, User as FirebaseUser, PhoneAuthProvider, signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Phone authentication setup
let phoneProvider: PhoneAuthProvider | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initialize phone authentication with reCAPTCHA
 */
export function initializePhoneAuth(containerId: string) {
  if (typeof window === 'undefined') return null;
  
  try {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: (response: any) => {
        // reCAPTCHA solved - allow phone auth
        console.log('reCAPTCHA verified');
      },
      'expired-callback': () => {
        // Reset reCAPTCHA
        console.log('reCAPTCHA expired');
      }
    });
    
    phoneProvider = new PhoneAuthProvider(auth);
    return phoneProvider;
  } catch (error) {
    console.error('Phone auth initialization error:', error);
    return null;
  }
}

/**
 * Send OTP to phone number
 */
export async function sendOTP(phoneNumber: string, containerId: string): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Phone auth can only be used in browser');
  }
  
  try {
    const provider = initializePhoneAuth(containerId);
    if (!provider || !recaptchaVerifier) {
      throw new Error('Phone provider not initialized');
    }
    
    const verificationId = await provider.verifyPhoneNumber(phoneNumber, recaptchaVerifier);
    return verificationId;
  } catch (error) {
    console.error('OTP send error:', error);
    throw error;
  }
}

/**
 * Verify OTP and sign in
 */
export async function verifyOTP(verificationId: string, otp: string): Promise<FirebaseUser> {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, otp);
    const userCredential = await auth.signInWithCredential(credential);
    return userCredential.user;
  } catch (error) {
    console.error('OTP verification error:', error);
    throw error;
  }
}

export { auth, googleProvider, signInWithPopup };
export type { FirebaseUser };