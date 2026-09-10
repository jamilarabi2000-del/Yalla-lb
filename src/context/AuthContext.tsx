import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { auth, db, IS_FIREBASE_ENABLED } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated_non_admin' | 'authenticated_admin';

export interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: UserProfile | null;
  isAdminUser: boolean;
  isSellerUser: boolean;
  sellerId: string | null;
  isLoadingAuth: boolean;
  authStatus: AuthStatus;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

/**
 * Maps allowlisted profile fields from Firestore user document, strictly isolating
 * and preventing any overwrite of authoritative identity, roles, or claims.
 */
export function mapUserProfile(
  data: Record<string, any>,
  fbUser: FirebaseUser,
  authoritativeSellerId: string | null
): UserProfile {
  return {
    uid: fbUser.uid,
    name: data.name || fbUser.displayName || '',
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email || fbUser.email || '',
    phone: data.phone || '',
    avatar: data.avatar || '',
    defaultGovernorate: data.defaultGovernorate || '',
    defaultCity: data.defaultCity || '',
    defaultAddress: data.defaultAddress || '',
    defaultBuilding: data.defaultBuilding,
    defaultNotes: data.defaultNotes,

    // NEVER use Firestore role for authorization.
    role: 'customer',

    // ONLY Firebase Auth custom claim.
    sellerId: authoritativeSellerId || undefined,

    emailVerified: fbUser.emailVerified,
    isOtpVerified: data.isOtpVerified
  };
}

export function mapSafeUserProfile(
  fbUser: FirebaseUser,
  _uid: string,
  data: Record<string, any> | undefined,
  claimSellerId: string | null
): UserProfile {
  return mapUserProfile(data || {}, fbUser, claimSellerId);
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [isSellerUser, setIsSellerUser] = useState<boolean>(false);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  useEffect(() => {
    if (!IS_FIREBASE_ENABLED || !auth) {
      setIsLoadingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setIsAdminUser(false);
        setIsSellerUser(false);
        setSellerId(null);
        setIsLoadingAuth(false);
        return;
      }

      let hasAdminClaim = false;
      let hasSellerClaim = false;
      let claimSellerId: string | null = null;

      try {
        await fbUser.getIdToken(true);
        const tokenResult = await fbUser.getIdTokenResult(true);
        hasAdminClaim = Boolean(tokenResult?.claims?.admin === true);
        hasSellerClaim = Boolean(tokenResult?.claims?.seller === true);
        claimSellerId = typeof tokenResult?.claims?.sellerId === 'string' ? tokenResult.claims.sellerId : null;
      } catch {
        // Token refresh failed
      }

      setIsAdminUser(hasAdminClaim);
      setIsSellerUser(hasSellerClaim);
      setSellerId(claimSellerId);
      setIsLoadingAuth(false); // Independent of Firestore user document existence

      // Listen to user profile document asynchronously
      if (db) {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubProfile = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            setUser(mapUserProfile(snap.data(), fbUser, claimSellerId));
          } else {
            setUser({
              uid: fbUser.uid,
              name: fbUser.displayName || '',
              email: fbUser.email || '',
              phone: '',
              avatar: '',
              defaultGovernorate: '',
              defaultCity: '',
              defaultAddress: '',
              role: 'customer',
              emailVerified: fbUser.emailVerified
            });
          }
        }, () => {});

        return () => unsubProfile();
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if (auth) {
      await fbSignOut(auth).catch(() => {});
    }
    setFirebaseUser(null);
    setUser(null);
    setIsAdminUser(false);
    setIsSellerUser(false);
    setSellerId(null);
  };

  const refreshUserProfile = async () => {
    if (!firebaseUser || !db) return;

    try {
      await firebaseUser.getIdToken(true).catch(() => {});
      const [snap, tokenResult] = await Promise.all([
        getDoc(doc(db, 'users', firebaseUser.uid)),
        firebaseUser.getIdTokenResult(true)
      ]);

      const hasAdminClaim = tokenResult.claims.admin === true;
      const hasSellerClaim = tokenResult.claims.seller === true;

      const claimSellerId =
        typeof tokenResult.claims.sellerId === 'string'
          ? tokenResult.claims.sellerId
          : null;

      setIsAdminUser(hasAdminClaim);
      setIsSellerUser(hasSellerClaim);
      setSellerId(claimSellerId);

      if (snap.exists()) {
        const data = snap.data();
        setUser(
          mapUserProfile(
            data,
            firebaseUser,
            claimSellerId
          )
        );
      }
    } catch {
      // Fail closed.
    }
  };

  const authStatus: AuthStatus = isLoadingAuth
    ? 'loading'
    : !firebaseUser
    ? 'unauthenticated'
    : isAdminUser
    ? 'authenticated_admin'
    : 'authenticated_non_admin';

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      user,
      isAdminUser,
      isSellerUser,
      sellerId,
      isLoadingAuth,
      authStatus,
      logout,
      refreshUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
