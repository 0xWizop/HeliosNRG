'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
        
        // Create user document in Firestore
        await setDoc(doc(db!, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          displayName: email.split('@')[0],
          role: 'admin', // First user is admin of their team
          teamIds: [],
          createdAt: Timestamp.now(),
          lastLoginAt: Timestamp.now(),
        });

        // Redirect to team setup
        router.push('/setup');
      } else {
        // Login
        await signInWithEmailAndPassword(auth!, email, password);
        
        // Check if user has a team
        const userDoc = await getDoc(doc(db!, 'users', auth!.currentUser!.uid));
        const userData = userDoc.data();
        
        if (!userData?.teamIds?.length) {
          router.push('/setup');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOSignIn = async (providerType: 'google' | 'microsoft') => {
    setError(null);
    setIsLoading(true);

    try {
      let provider;
      if (providerType === 'google') {
        provider = new GoogleAuthProvider();
      } else {
        provider = new OAuthProvider('microsoft.com');
        provider.addScope('email');
        provider.addScope('profile');
      }
      
      const userCredential = await signInWithPopup(auth!, provider);
      
      // Check if user document exists
      const userDoc = await getDoc(doc(db!, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(doc(db!, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || userCredential.user.email?.split('@')[0],
          photoURL: userCredential.user.photoURL,
          provider: providerType,
          role: 'admin',
          teamIds: [],
          createdAt: Timestamp.now(),
          lastLoginAt: Timestamp.now(),
        });
        router.push('/setup');
      } else {
        // Update last login
        await setDoc(doc(db!, 'users', userCredential.user.uid), {
          lastLoginAt: Timestamp.now(),
          photoURL: userCredential.user.photoURL,
        }, { merge: true });
        
        const userData = userDoc.data();
        if (!userData?.teamIds?.length) {
          router.push('/setup');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      console.error(`${providerType} sign-in error:`, err);
      setError(`Failed to sign in with ${providerType === 'google' ? 'Google' : 'Microsoft'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-neutral-900 border-r border-neutral-800 flex-col justify-between p-12">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-sm font-mono font-medium tracking-wider text-neutral-100">HELIOS</span>
          </Link>
        </div>
        
        <div>
          <h1 className="text-3xl font-mono text-neutral-100 tracking-tight mb-4">
            Cloud Infrastructure<br />Carbon Intelligence
          </h1>
          <p className="text-neutral-500 max-w-md">
            Track, analyze, and optimize the environmental impact of your cloud workloads 
            with transparent, auditable calculations.
          </p>
          
          <div className="mt-12 grid grid-cols-3 gap-6">
            <div>
              <p className="text-2xl font-mono text-amber-500">6</p>
              <p className="text-xs text-neutral-600 mt-1">Cloud providers supported</p>
            </div>
            <div>
              <p className="text-2xl font-mono text-amber-500">50+</p>
              <p className="text-xs text-neutral-600 mt-1">Regions tracked</p>
            </div>
            <div>
              <p className="text-2xl font-mono text-amber-500">100%</p>
              <p className="text-xs text-neutral-600 mt-1">Open methodology</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-700 font-mono">
          © 2026 Helios Energy. All rights reserved.
        </p>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              <span className="text-sm font-mono font-medium tracking-wider text-neutral-100">HELIOS</span>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-mono text-neutral-100 tracking-tight mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-neutral-500">
              {mode === 'login' 
                ? 'Sign in to access your dashboard' 
                : 'Get started with Helios in minutes'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-950/50 border border-red-900 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-neutral-950 px-4 text-xs text-neutral-600">or</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleSSOSignIn('google')}
              disabled={isLoading}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 py-3 px-4 font-mono text-sm uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleSSOSignIn('microsoft')}
              disabled={isLoading}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 py-3 px-4 font-mono text-sm uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 23 23">
                <path fill="#f25022" d="M1 1h10v10H1z"/>
                <path fill="#00a4ef" d="M1 12h10v10H1z"/>
                <path fill="#7fba00" d="M12 1h10v10H12z"/>
                <path fill="#ffb900" d="M12 12h10v10H12z"/>
              </svg>
              Continue with Microsoft
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-neutral-500">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="text-amber-500 hover:text-amber-400"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); }}
                  className="text-amber-500 hover:text-amber-400"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
