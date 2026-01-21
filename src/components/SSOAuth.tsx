'use client';

import { useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { logAuditEvent } from '@/lib/firebase/enterprise';
import { RefreshCw } from 'lucide-react';

interface SSOAuthProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  allowedDomains?: string[];
  mode?: 'login' | 'signup';
}

export function SSOAuth({ onSuccess, onError, allowedDomains, mode = 'login' }: SSOAuthProps) {
  const [isLoading, setIsLoading] = useState<'google' | 'microsoft' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateDomain = (email: string): boolean => {
    if (!allowedDomains || allowedDomains.length === 0) return true;
    const domain = email.split('@')[1];
    return allowedDomains.includes(domain);
  };

  const handleGoogleSignIn = async () => {
    if (!auth) {
      setError('Authentication not initialized');
      return;
    }

    setIsLoading('google');
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email) {
        throw new Error('No email associated with this account');
      }

      if (!validateDomain(user.email)) {
        await auth.signOut();
        throw new Error(`Email domain not allowed. Please use an email from: ${allowedDomains?.join(', ')}`);
      }

      // Check if user exists, if not create them
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // New user - create account
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL,
          provider: 'google',
          role: 'member',
          teamIds: [],
          createdAt: Timestamp.now(),
          lastLoginAt: Timestamp.now(),
        });
      } else {
        // Existing user - update last login
        await updateDoc(userRef, {
          lastLoginAt: Timestamp.now(),
          photoURL: user.photoURL,
        });
      }

      // Log the SSO login
      const userData = userDoc.exists() ? userDoc.data() : null;
      if (userData?.currentTeamId) {
        const teamDoc = await getDoc(doc(db, 'teams', userData.currentTeamId));
        if (teamDoc.exists()) {
          await logAuditEvent({
            orgId: teamDoc.data().orgId || userData.currentTeamId,
            teamId: userData.currentTeamId,
            userId: user.uid,
            userEmail: user.email,
            action: 'user.sso_login',
            resourceType: 'user',
            resourceId: user.uid,
            details: { provider: 'google' },
          });
        }
      }

      onSuccess?.();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google');
      onError?.(err);
    } finally {
      setIsLoading(null);
    }
  };

  const handleMicrosoftSignIn = async () => {
    if (!auth) {
      setError('Authentication not initialized');
      return;
    }

    setIsLoading('microsoft');
    setError(null);

    try {
      const provider = new OAuthProvider('microsoft.com');
      provider.addScope('email');
      provider.addScope('profile');
      provider.addScope('User.Read');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email) {
        throw new Error('No email associated with this account');
      }

      if (!validateDomain(user.email)) {
        await auth.signOut();
        throw new Error(`Email domain not allowed. Please use an email from: ${allowedDomains?.join(', ')}`);
      }

      // Check if user exists, if not create them
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL,
          provider: 'microsoft',
          role: 'member',
          teamIds: [],
          createdAt: Timestamp.now(),
          lastLoginAt: Timestamp.now(),
        });
      } else {
        await updateDoc(userRef, {
          lastLoginAt: Timestamp.now(),
          photoURL: user.photoURL,
        });
      }

      // Log the SSO login
      const userData = userDoc.exists() ? userDoc.data() : null;
      if (userData?.currentTeamId) {
        const teamDoc = await getDoc(doc(db, 'teams', userData.currentTeamId));
        if (teamDoc.exists()) {
          await logAuditEvent({
            orgId: teamDoc.data().orgId || userData.currentTeamId,
            teamId: userData.currentTeamId,
            userId: user.uid,
            userEmail: user.email,
            action: 'user.sso_login',
            resourceType: 'user',
            resourceId: user.uid,
            details: { provider: 'microsoft' },
          });
        }
      }

      onSuccess?.();
    } catch (err: any) {
      console.error('Microsoft sign-in error:', err);
      setError(err.message || 'Failed to sign in with Microsoft');
      onError?.(err);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-950/50 border border-red-800 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading !== null}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-neutral-900 border border-neutral-700 hover:border-neutral-600 text-neutral-200 transition-colors disabled:opacity-50"
      >
        {isLoading === 'google' ? (
          <RefreshCw className="w-5 h-5 animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        <span className="font-medium">
          {mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
        </span>
      </button>

      <button
        onClick={handleMicrosoftSignIn}
        disabled={isLoading !== null}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-neutral-900 border border-neutral-700 hover:border-neutral-600 text-neutral-200 transition-colors disabled:opacity-50"
      >
        {isLoading === 'microsoft' ? (
          <RefreshCw className="w-5 h-5 animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 23 23">
            <path fill="#f25022" d="M1 1h10v10H1z"/>
            <path fill="#00a4ef" d="M1 12h10v10H1z"/>
            <path fill="#7fba00" d="M12 1h10v10H12z"/>
            <path fill="#ffb900" d="M12 12h10v10H12z"/>
          </svg>
        )}
        <span className="font-medium">
          {mode === 'signup' ? 'Sign up with Microsoft' : 'Continue with Microsoft'}
        </span>
      </button>

      {allowedDomains && allowedDomains.length > 0 && (
        <p className="text-xs text-neutral-500 text-center mt-2">
          Allowed domains: {allowedDomains.join(', ')}
        </p>
      )}
    </div>
  );
}
