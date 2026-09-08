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
            const data = snap.data();
            setUser({
              uid: snap.id,
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
              role: data.role || 'customer',
              sellerId: data.sellerId,
              emailVerified: fbUser.emailVerified,
              isOtpVerified: data.isOtpVerified
            });
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
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUser(prev => prev ? ({ ...prev, ...data }) : null);
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
