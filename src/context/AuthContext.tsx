import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { auth, db, IS_FIREBASE_ENABLED } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';

export interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: UserProfile | null;
  isAdminUser: boolean;
  isSellerUser: boolean;
  sellerId: string | null;
  isLoadingAuth: boolean;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

/**
 * Maps allowlisted profile fields from Firestore user document, strictly isolating
 * and preventing any overwrite of authoritative identity, roles, or claims.
 */
export function mapSafeUserProfile(
  fbUser: FirebaseUser,
  uid: string,
  data: Record<string, any> | undefined,
  claimSellerId: string | null
): UserProfile {
  const safeData = data || {};
  return {
    uid: fbUser.uid || uid,
    name: typeof safeData.name === 'string' && safeData.name ? safeData.name : (fbUser.displayName || ''),
    firstName: typeof safeData.firstName === 'string' ? safeData.firstName : undefined,
    lastName: typeof safeData.lastName === 'string' ? safeData.lastName : undefined,
    email: typeof safeData.email === 'string' && safeData.email ? safeData.email : (fbUser.email || ''),
    phone: typeof safeData.phone === 'string' ? safeData.phone : '',
    avatar: typeof safeData.avatar === 'string' ? safeData.avatar : '',
    defaultGovernorate: typeof safeData.defaultGovernorate === 'string' ? safeData.defaultGovernorate : '',
    defaultCity: typeof safeData.defaultCity === 'string' ? safeData.defaultCity : '',
    defaultAddress: typeof safeData.defaultAddress === 'string' ? safeData.defaultAddress : '',
    defaultBuilding: typeof safeData.defaultBuilding === 'string' ? safeData.defaultBuilding : undefined,
    defaultNotes: typeof safeData.defaultNotes === 'string' ? safeData.defaultNotes : undefined,
    role: 'customer',
    sellerId: claimSellerId || undefined,
    emailVerified: fbUser.emailVerified,
    isOtpVerified: typeof safeData.isOtpVerified === 'boolean' ? safeData.isOtpVerified : undefined
  };
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

      // Check custom claims ONLY
      const tokenResult = await fbUser.getIdTokenResult().catch(() => null);
      const hasAdminClaim = Boolean(tokenResult?.claims?.admin === true);
      const hasSellerClaim = Boolean(tokenResult?.claims?.seller === true);
      const claimSellerId = typeof tokenResult?.claims?.sellerId === 'string' ? tokenResult.claims.sellerId : null;

      setIsAdminUser(hasAdminClaim);
      setIsSellerUser(hasSellerClaim);
      setSellerId(claimSellerId);

      // Listen to user profile document
      if (db) {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubProfile = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            setUser(mapSafeUserProfile(fbUser, snap.id, snap.data(), claimSellerId));
            // Strictly enforce custom claims only, do not fallback to db fields or role values
            setIsAdminUser(hasAdminClaim);
            setIsSellerUser(hasSellerClaim);
            setSellerId(claimSellerId);
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
          setIsLoadingAuth(false);
        }, () => {
          setIsLoadingAuth(false);
        });

        return () => unsubProfile();
      } else {
        setIsLoadingAuth(false);
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
      // Re-verify authoritative claims on refresh to ensure fresh state
      const tokenResult = await firebaseUser.getIdTokenResult().catch(() => null);
      const hasAdminClaim = Boolean(tokenResult?.claims?.admin === true);
      const hasSellerClaim = Boolean(tokenResult?.claims?.seller === true);
      const claimSellerId = typeof tokenResult?.claims?.sellerId === 'string' ? tokenResult.claims.sellerId : null;

      setIsAdminUser(hasAdminClaim);
      setIsSellerUser(hasSellerClaim);
      setSellerId(claimSellerId);

      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUser(mapSafeUserProfile(firebaseUser, snap.id, data, claimSellerId));
      }
    } catch {}
  };

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      user,
      isAdminUser,
      isSellerUser,
      sellerId,
      isLoadingAuth,
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
