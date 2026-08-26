import React, { useState } from 'react';
import { useDialog } from '../hooks/useDialog';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Search,
  Calendar,
  Loader2,
  X,
  Compass,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Order, Product } from '../types';
import { db, IS_FIREBASE_ENABLED } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface OrderHistoryProps {
  orders: Order[];
  formatPrice: (price: number) => string;
  onNavigateProducts: () => void;
  language: string;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  formatPrice,
  onNavigateProducts,
  language
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { containerRef } = useDialog({
    isOpen: !!selectedOrder,
    onClose: () => setSelectedOrder(null)
  });

  const [trackingInput, setTrackingInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = trackingInput.trim();
    if (!cleanInput) return;

    setIsTrackingLoading(true);
    setTrackingError(null);
    setTrackedOrder(null);

    const localMatch = orders.find(
      o => o.id === cleanInput || o.trackingNumber === cleanInput || o.trackingNumber.toLowerCase() === cleanInput.toLowerCase()
    );

    if (!IS_FIREBASE_ENABLED) {
      setIsTrackingLoading(false);
      if (localMatch) {
        setTrackedOrder(localMatch);
      } else {
        setTrackingError(language === 'ar' ? 'لم يتم العثور على طلب بهذا الرمز' : 'No order found with this tracking code.');
      }
      return;
    }

    try {
      const docRef = doc(db, 'orders', cleanInput);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setTrackedOrder(docSnap.data() as Order);
        setIsTrackingLoading(false);
        return;
      }

      const q = query(collection(db, 'orders'), where('trackingNumber', '==', cleanInput));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        setTrackedOrder(querySnap.docs[0].data() as Order);
      } else if (localMatch) {
        setTrackedOrder(localMatch);
      } else {
        setTrackingError(language === 'ar' ? 'لم يتم العثور على طلب بهذا الرمز' : 'No order found with this ID or tracking number.');
      }
    } catch (err: any) {
      console.error("Error tracking order from Firestore:", err);
      if (localMatch) {
        setTrackedOrder(localMatch);
      } else {
        setTrackingError(language === 'ar' ? 'خطأ أثناء البحث عن الطلب. يرجى المحاولة لاحقاً.' : 'Error fetching order details. Please try again.');
      }
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'processing') {
        matchesStatus = order.status === 'pending' || order.status === 'confirmed' || order.status === 'crafting';
      } else if (statusFilter === 'in_transit') {
        matchesStatus = order.status === 'in_transit' || order.status === 'courier_assigned';
      } else {
        matchesStatus = order.status === statusFilter;
      }
    }
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.shipping?.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.shipping?.street || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.trackingNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(i => (i.product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (i.product.arabicName || '').toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{language === 'ar' ? 'ملغي' : 'Cancelled'}</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{language === 'ar' ? 'تم التوصيل' : 'Delivered'}</span>
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
            <Truck className="w-3.5 h-3.5 animate-pulse text-sky-600 shrink-0" />
            <span>{language === 'ar' ? 'في الطريق' : 'In Transit'}</span>
          </span>
        );
      case 'courier_assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
            <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>{language === 'ar' ? 'تم تعيين السائق' : 'Courier Assigned'}</span>
          </span>
        );
      case 'crafting':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{language === 'ar' ? 'قيد التجهيز الحرفي' : 'Crafting / Preparing'}</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-violet-50 text-violet-700 border border-violet-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
            <span>{language === 'ar' ? 'تم تأكيد الطلب' : 'Confirmed'}</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{language === 'ar' ? 'قيد المعالجة' : 'Pending / Processing'}</span>
          </span>
        );
    }
  };

  const getTrackingSteps = (status: Order['status']) => {
    const isCraftingDone = status === 'crafting' || status === 'courier_assigned' || status === 'in_transit' || status === 'delivered';
    const isTransitDone = status === 'in_transit' || status === 'delivered' || status === 'courier_assigned';
    const isDelivered = status === 'delivered';

    return [
      { id: 'placed', label: language === 'ar' ? 'تم استلام الطلب' : 'Order Placed', completed: true },
      { id: 'crafting', label: language === 'ar' ? 'تجهيز الحرفيين' : 'Artisan Crafting', completed: isCraftingDone },
      { id: 'transit', label: language === 'ar' ? 'في الطريق' : 'Courier Transit', completed: isTransitDone },
      { id: 'delivered', label: language === 'ar' ? 'تم التوصيل' : 'Delivered', completed: isDelivered }
    ];
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Order Tracking Form */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#a37f35] flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#a37f35]" />
            <span>{language === 'ar' ? 'التتبع المباشر للطلب' : 'Real-time Order Tracking'}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar' 
              ? 'أدخل رقم التتبع (مثال: LB-EXP-123456) أو رقم الطلب للاستعلام المباشر عن حالة التوصيل من فيرستور.' 
              : 'Enter your tracking number (e.g., LB-EXP-123456) or Order ID to query live delivery progress directly from Firestore.'}
          </p>
        </div>

        <form onSubmit={handleTrackOrder} className="flex gap-2 max-w-md">
          <input 
            type="text"
            required
            placeholder={language === 'ar' ? 'أدخل رقم التتبع أو رقم الطلب...' : 'Enter Tracking Code or Order ID...'}
            value={trackingInput}
            onChange={(e) => setTrackingInput(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={isTrackingLoading}
            className="px-5 py-2.5 bg-[#a37f35] hover:bg-[#8c6b2a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isTrackingLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{language === 'ar' ? 'جاري البحث...' : 'Tracking...'}</span>
              </>
            ) : (
              <span>{language === 'ar' ? 'تتبع' : 'Track'}</span>
            )}
          </button>
        </form>

        {trackingError && (
          <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl inline-block">
            {trackingError}
          </p>
        )}

        {/* Tracked Order Result Area */}
        {trackedOrder && (
          <div className="border border-[#a37f35]/20 bg-[#a37f35]/5 p-5 rounded-2xl relative space-y-4">
            <button
              onClick={() => {
                setTrackedOrder(null);
                setTrackingInput('');
              }}
              className="absolute top-4 right-4 p-1.5 bg-white hover:bg-slate-50 text-slate-500 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Clear results"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-[#a37f35]/10">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                {language === 'ar' ? 'حالة الطلب الحالي' : 'Live Shipment Status'}
              </span>
              <span className="text-xs font-mono font-bold bg-[#a37f35]/15 text-[#a37f35] px-2 py-0.5 rounded border border-[#a37f35]/20">
                #{trackedOrder.id}
              </span>
              <span className="text-xs text-slate-500 ml-auto mr-8">
                {new Date(trackedOrder.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-500">
                  {language === 'ar' ? 'رقم التتبع:' : 'Tracking Code:'} <span className="font-mono font-bold text-slate-900">{trackedOrder.trackingNumber}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {language === 'ar' ? 'المستلم:' : 'Recipient:'} <span className="font-semibold text-slate-900">{trackedOrder.shipping.fullName}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {language === 'ar' ? 'العنوان:' : 'Delivery Address:'} <span className="font-semibold text-slate-900">{trackedOrder.shipping.street}, {trackedOrder.shipping.city}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {language === 'ar' ? 'التوصيل المقدر:' : 'Estimated Delivery:'} <span className="font-bold text-[#a37f35]">{trackedOrder.estimatedDelivery}</span>
                </p>
              </div>

              <div className="flex items-center justify-start md:justify-end gap-3">
                <div className="text-left md:text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Price</p>
                  <p className="text-lg font-black text-slate-900">{formatPrice(trackedOrder.totalUSD)}</p>
                  <p className="text-[10px] text-slate-500">{trackedOrder.items.length} items • Paid via {trackedOrder.paymentMethod.toUpperCase()}</p>
                </div>
                <div>
                  {getStatusBadge(trackedOrder.status)}
                </div>
              </div>
            </div>

            {/* Visual Steps timeline for tracked order or Cancelled Banner */}
            <div className="pt-3">
              {trackedOrder.status === 'cancelled' ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-900">
                    <div className="font-extrabold">{language === 'ar' ? 'تم إلغاء هذا الطلب' : 'This Order Has Been Cancelled'}</div>
                    <p className="text-rose-700 text-[11px] mt-0.5">
                      {language === 'ar'
                        ? 'تم إلغاء هذا الطلب ولن يتم شحنه أو تحصيل أي مبالغ.'
                        : 'This order was cancelled by the store administrator. It will not be dispatched or billed.'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">{language === 'ar' ? 'مراحل التوصيل' : 'Shipment Stepper'}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {getTrackingSteps(trackedOrder.status).map((step) => (
                      <div key={step.id} className="flex flex-col items-center text-center p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-sm">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mb-1 ${step.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                          {step.completed ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1 h-1 rounded-full bg-slate-300" />}
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${step.completed ? 'text-slate-800' : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-600" />
            <span>{language === 'ar' ? 'سجل الطلبات' : 'Order History'}</span>
          </h2>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder={language === 'ar' ? 'البحث...' : 'Search orders...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all w-48 sm:w-60"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 transition-all cursor-pointer"
          >
            <option value="all">{language === 'ar' ? `كل الحالات (${orders.length})` : `All Statuses (${orders.length})`}</option>
            <option value="processing">{language === 'ar' ? 'قيد المعالجة والتجهيز' : 'Processing & Crafting'}</option>
            <option value="in_transit">{language === 'ar' ? 'في طريق التوصيل' : 'In Transit'}</option>
            <option value="delivered">{language === 'ar' ? 'تم التوصيل' : 'Delivered'}</option>
            <option value="cancelled">{language === 'ar' ? 'الملغية' : 'Cancelled'}</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center space-y-4 max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Matching Orders</h3>
          <p className="text-xs text-slate-500">
            {orders.length === 0 
              ? "You haven't placed any orders yet."
              : "No orders match your current filter."}
          </p>
          {orders.length === 0 && (
            <button
              onClick={onNavigateProducts}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
            >
              <span>Explore Products</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const steps = getTrackingSteps(order.status);
            
            return (
              <div 
                key={order.id} 
                className={`p-6 rounded-3xl bg-white border shadow-sm space-y-6 transition-all hover:border-slate-300 ${
                  order.status === 'cancelled' ? 'border-rose-200/80 bg-rose-50/10' : 'border-slate-200'
                }`}
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        #{order.id}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(order.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Estimated Delivery: <span className="text-slate-900 font-semibold">{order.estimatedDelivery}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total</p>
                      <p className="text-lg font-black text-slate-900">{formatPrice(order.totalUSD)}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Shipment Tracker Visual Stepper OR Cancelled Notice Banner */}
                {order.status === 'cancelled' ? (
                  <div className="bg-rose-50/90 p-4 sm:p-5 rounded-2xl border border-rose-200 flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                        {language === 'ar' ? 'تم إلغاء هذا الطلب' : 'Order Cancelled'}
                      </h4>
                      <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                        {language === 'ar'
                          ? 'تم إلغاء هذا الطلب من قبل الإدارة. لن يتم شحن المنتجات ولن يتم تحصيل أي مبالغ نقدية عند التوصيل.'
                          : 'This order was cancelled by the store administrator. Items will not be dispatched, and no cash will be collected upon delivery.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-slate-500" />
                        <span>Shipment Progress</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative">
                      {steps.map((step) => (
                        <div key={step.id} className="flex flex-col items-center text-center p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1.5 ${step.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                            {step.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${step.completed ? 'text-slate-800' : 'text-slate-400'}`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items Summary & Expand Action */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex -space-x-3 overflow-hidden">
                    {order.items.slice(0, 4).map((item, idx) => (
                      <img 
                        key={idx}
                        src={item.product.image} 
                        alt={item.product.name}
                        className="w-10 h-10 rounded-full border-2 border-white object-cover bg-slate-100"
                        title={`${item.quantity}x ${item.product.name}`}
                      />
                    ))}
                    {order.items.length > 4 && (
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => setSelectedOrder(null)}
          />
          <div 
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden focus:outline-hidden"
          >
            
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900">
                    {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
                  </h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p className="text-xs font-mono text-slate-500">
                  ID: #{selectedOrder.id} • {new Date(selectedOrder.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {selectedOrder.status === 'cancelled' && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-900">
                    <div className="font-extrabold">{language === 'ar' ? 'تم إلغاء هذا الطلب' : 'This Order Has Been Cancelled'}</div>
                    <p className="text-rose-700 text-[11px] mt-0.5">
                      {language === 'ar'
                        ? 'تم إلغاء هذا الطلب من قبل الإدارة ولن يتم شحنه أو تحصيل أي مبالغ نقدية.'
                        : 'This order was cancelled by the store administrator. It will not be dispatched or billed.'}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Delivery Address</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{selectedOrder.shipping.fullName}</p>
                  <p className="text-xs text-slate-600">{selectedOrder.shipping.phone}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {selectedOrder.shipping.building}, {selectedOrder.shipping.street}
                  </p>
                  <p className="text-xs text-slate-600">
                    {selectedOrder.shipping.city}, {selectedOrder.shipping.governorate}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Order Summary</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>{formatPrice(selectedOrder.subtotalUSD)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery</span>
                      <span>{formatPrice(selectedOrder.deliveryFeeUSD)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900 mt-2">
                      <span>Total USD</span>
                      <span>{formatPrice(selectedOrder.totalUSD)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Payment Method</span>
                      <span className="uppercase">{selectedOrder.paymentMethod}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Items in this Order</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 p-3 rounded-2xl border border-slate-100 bg-white items-center">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover bg-slate-50"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {language === 'ar' ? (item.product.arabicName || item.product.name) : item.product.name}
                        </h5>
                        <p className="text-xs text-slate-500">{item.product.origin}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{formatPrice(item.product.priceUSD * item.quantity)}</p>
                        <p className="text-[10px] text-slate-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};
