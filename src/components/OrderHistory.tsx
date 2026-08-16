import React, { useState } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ChevronRight, 
  ExternalLink,
  Search,
  Calendar,
  Sparkles,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Order, Product } from '../types';

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

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping.street.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(i => i.product.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case 'in_transit':
      case 'courier_assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <Truck className="w-3.5 h-3.5 animate-pulse" />
            <span>In Transit</span>
          </span>
        );
      case 'crafting':
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-lg bg-[#c5a059]/20 text-[#f1d592] border border-[#c5a059]/30">
            <Clock className="w-3.5 h-3.5" />
            <span>{status === 'crafting' ? 'Crafting' : 'Processing'}</span>
          </span>
        );
    }
  };

  const getTrackingSteps = (status: Order['status']) => {
    const isCraftingDone = status === 'crafting' || status === 'courier_assigned' || status === 'in_transit' || status === 'delivered';
    const isTransitDone = status === 'in_transit' || status === 'delivered' || status === 'courier_assigned';
    const isDelivered = status === 'delivered';

    const steps = [
      { id: 'placed', label: language === 'ar' ? 'تم استلام الطلب' : 'Order Placed', completed: true },
      { id: 'crafting', label: language === 'ar' ? 'تجهيز الحرفيين' : 'Artisan Crafting', completed: isCraftingDone },
      { id: 'transit', label: language === 'ar' ? 'في الطريق' : 'Courier Transit', completed: isTransitDone },
      { id: 'delivered', label: language === 'ar' ? 'تم التوصيل' : 'Delivered', completed: isDelivered }
    ];
    return steps;
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121222] p-4 sm:p-6 rounded-3xl border border-[#c5a059]/20">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-[#c5a059]" />
            <span>{language === 'ar' ? 'سجل الطلبات وتتبع الشحنات' : 'Order History & Shipment Tracker'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ar' ? 'تتبع حالة طلباتك الحرفية من بيروت وجميع المحافظات بدقة لحظية' : 'Real-time live status tracking for all your Lebanese artisanal shipments'}
          </p>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder={language === 'ar' ? 'البحث برقم الطلب...' : 'Search order ID or item...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/[0.05] text-white text-xs rounded-xl border border-[#c5a059]/30 focus:outline-none focus:border-[#c5a059] w-48 sm:w-60"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-[#1a1a2e] text-white text-xs font-medium rounded-xl border border-[#c5a059]/30 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses ({orders.length})</option>
            <option value="processing">Processing</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center space-y-4 max-w-md mx-auto bg-[#121222]/60 rounded-3xl border border-white/5 p-8">
          <div className="w-16 h-16 rounded-full bg-white/[0.05] border border-[#c5a059]/30 flex items-center justify-center mx-auto text-[#c5a059]">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Matching Orders</h3>
          <p className="text-xs text-slate-400">
            {orders.length === 0 
              ? "You haven't placed any orders yet. Discover our authentic artisanal crafts and pantry items."
              : "No orders match your current filter or search criteria."}
          </p>
          {orders.length === 0 && (
            <button
              onClick={onNavigateProducts}
              className="px-6 py-2.5 bg-[#c5a059] text-[#1a1a2e] font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-[#d4b068] transition-colors cursor-pointer"
            >
              Start Shopping
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const steps = getTrackingSteps(order.status);
            return (
              <div 
                key={order.id} 
                className="p-6 rounded-3xl premium-card space-y-6 transition-all hover:border-[#c5a059]/40 bg-[#121222]/80 backdrop-blur-sm"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-mono font-bold text-[#f1d592] bg-[#c5a059]/10 px-2.5 py-1 rounded-lg border border-[#c5a059]/30">
                        #{order.id}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(order.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                        ✓ Verified Order
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      Estimated Delivery: <span className="text-[#f1d592] font-semibold">{order.estimatedDelivery}</span> via {order.paymentMethod}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total Amount</p>
                      <p className="text-lg font-black text-[#f1d592]">{formatPrice(order.totalUSD)}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Shipment Tracker Visual Stepper */}
                <div className="bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#c5a059]" />
                      <span>Shipment Progress Tracker</span>
                    </span>
                    <span className="text-[11px] text-[#c5a059] font-mono">Carrier: Yalla Express Lebanon</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative">
                    {steps.map((step, idx) => (
                      <div key={step.id} className="flex flex-col items-center text-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-all ${
                          step.completed
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {step.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className={`text-[11px] font-semibold ${step.completed ? 'text-white' : 'text-slate-500'}`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ordered Items Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Artisanal Items in this Shipment ({order.items.reduce((acc, i) => acc + i.quantity, 0)})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {order.items.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#c5a059]/30 transition-colors">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          className="w-14 h-14 rounded-xl object-cover bg-slate-950 border border-[#c5a059]/30 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-slate-200 truncate">{item.product.name}</h5>
                          <p className="text-[11px] text-[#c5a059] font-semibold mt-0.5">
                            {formatPrice(item.product.priceUSD)} <span className="text-slate-400 font-normal">× {item.quantity}</span>
                          </p>
                          <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                            By {item.product.artisan || 'Lebanese Artisan'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Address & Actions */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-4 h-4 text-[#c5a059] flex-shrink-0" />
                    <span>
                      <strong className="text-white">Delivery Address:</strong> {order.shipping.street}, {order.shipping.city}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase tracking-wider text-[11px] border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#c5a059]" />
                      <span>Full Invoice & Details</span>
                    </button>

                    <button
                      onClick={onNavigateProducts}
                      className="px-4 py-2 rounded-xl bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#f1d592] font-bold uppercase tracking-wider text-[11px] border border-[#c5a059]/40 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reorder Items</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121222] border border-[#c5a059]/40 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-mono font-bold text-[#f1d592]">Order Invoice #{selectedOrder.id}</span>
                <h3 className="text-xl font-bold text-white mt-0.5">Shipment & Purchase Details</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-6 text-xs text-slate-300">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-white/5">
                <div>
                  <p className="text-slate-400 uppercase text-[10px] font-bold">Order Date</p>
                  <p className="text-white font-semibold mt-0.5">{new Date(selectedOrder.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase text-[10px] font-bold">Payment Method</p>
                  <p className="text-white font-semibold mt-0.5">{selectedOrder.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase text-[10px] font-bold">Current Status</p>
                  <p className="text-[#f1d592] font-bold uppercase mt-0.5">{selectedOrder.status.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Shipping info */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase text-slate-400 tracking-wider">Recipient & Shipping Destination</h4>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p className="text-white font-bold">{selectedOrder.shipping.fullName} ({selectedOrder.shipping.phone})</p>
                  <p>{selectedOrder.shipping.street}, {selectedOrder.shipping.city}, Lebanon</p>
                  <p className="text-slate-400 italic">Delivery Note: {selectedOrder.shipping.notes || 'Standard artisanal delivery'}</p>
                </div>
              </div>

              {/* Item breakdown */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase text-slate-400 tracking-wider">Purchased Items Breakdown</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3">
                        <img src={item.product.image} alt={item.product.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-white">{item.product.name}</p>
                          <p className="text-[11px] text-slate-400">Qty: {item.quantity} × {formatPrice(item.product.priceUSD)}</p>
                        </div>
                      </div>
                      <p className="font-bold text-[#f1d592]">{formatPrice(item.product.priceUSD * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary totals */}
              <div className="p-4 rounded-2xl bg-[#c5a059]/10 border border-[#c5a059]/30 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatPrice(selectedOrder.totalUSD - (selectedOrder.shippingFee || 5))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lebanon Express Shipping</span>
                  <span className="font-mono">{formatPrice(selectedOrder.shippingFee || 5)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#c5a059]/30 text-sm font-bold text-white">
                  <span>Total Paid</span>
                  <span className="font-mono text-[#f1d592]">{formatPrice(selectedOrder.totalUSD)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer transition-colors"
              >
                Close Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
