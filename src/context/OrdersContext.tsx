import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, PaymentMethod } from '../types';
import { db, IS_FIREBASE_ENABLED, app } from '../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { orderConverter } from '../lib/converters';
import { useAuth } from './AuthContext';
import { generateIdempotencyKey } from '../utils/uuid';

export interface PlaceOrderParams {
  shipping: any;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  deliverySpeed?: string;
  items?: Array<{ productId: string; quantity: number; selectedOption?: string }>;
  idempotencyKey?: string;
}

export interface OrdersContextType {
  orders: Order[];
  isLoadingOrders: boolean;
  placeOrder: (params: PlaceOrderParams) => Promise<any>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, isAdminUser, isSellerUser, sellerId } = useAuth();
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('yallalb_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);

  useEffect(() => {
    if (!IS_FIREBASE_ENABLED || !db || !firebaseUser) {
      setIsLoadingOrders(false);
      return;
    }

    try {
      let q;
      if (isAdminUser) {
        q = query(collection(db, 'orders').withConverter(orderConverter), orderBy('date', 'desc'));
      } else if (isSellerUser && sellerId) {
        q = query(collection(db, 'orders').withConverter(orderConverter), where('sellerIds', 'array-contains', sellerId));
      } else {
        q = query(collection(db, 'orders').withConverter(orderConverter), where('userId', '==', firebaseUser.uid));
      }

      const unsub = onSnapshot(q, (snap) => {
        setOrders(snap.docs.map(d => d.data()));
        setIsLoadingOrders(false);
      }, () => setIsLoadingOrders(false));

      return () => unsub();
    } catch {
      setIsLoadingOrders(false);
    }
  }, [firebaseUser, isAdminUser, isSellerUser, sellerId]);

  const placeOrder = async (params: PlaceOrderParams): Promise<any> => {
    if (IS_FIREBASE_ENABLED && app) {
      try {
        const functions = getFunctions(app, 'europe-west1');
        const placeOrderFn = httpsCallable<any, any>(functions, 'placeOrder');
        const rawShipping = params.shipping || {};
        const idempotencyKey = (params.idempotencyKey || generateIdempotencyKey()).trim();
        const sanitizedPayload = {
          items: (params.items || []).map(it => ({
            productId: it.productId,
            quantity: it.quantity,
            ...(it.selectedOption ? { selectedOption: it.selectedOption } : {})
          })),
          shipping: {
            fullName: String(rawShipping.fullName || '').trim(),
            phone: String(rawShipping.phone || '').trim(),
            governorate: String(rawShipping.governorate || 'Beirut').trim(),
            city: String(rawShipping.city || '').trim(),
            street: String(rawShipping.street || rawShipping.address || '').trim(),
            building: String(rawShipping.building || 'N/A').trim(),
            deliveryNotes: String(rawShipping.deliveryNotes || rawShipping.notes || '').trim(),
            deliverySpeed: rawShipping.deliverySpeed || params.deliverySpeed || 'standard',
          },
          paymentMethod: params.paymentMethod || 'cod_usd',
          couponCode: params.couponCode || undefined,
          deliverySpeed: rawShipping.deliverySpeed || params.deliverySpeed || 'standard',
          idempotencyKey: idempotencyKey,
        };
        const result = await placeOrderFn(sanitizedPayload);
        return result.data;
      } catch (err: any) {
        console.error('[OrdersContext] Cloud Function placeOrder failed:', err);
        throw err;
      }
    } else {
      throw new Error('Online checkout requires an active backend connection and Firebase configuration. Local mock order creation is disabled.');
    }
  };

  return (
    <OrdersContext.Provider value={{
      orders,
      isLoadingOrders,
      placeOrder
    }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};
