const fs = require('fs');
const path = './src/components/OrderHistory.tsx';
let content = fs.readFileSync(path, 'utf8');

const newReturn = `  return (
    <div className="space-y-6">
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
            className="px-3.5 py-2 bg-slate-50 text-slate-900 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 transition-all cursor-pointer"
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
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 transition-all hover:border-slate-300"
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

                {/* Shipment Tracker Visual Stepper */}
                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-slate-500" />
                      <span>Shipment Progress</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative">
                    {steps.map((step, idx) => (
                      <div key={step.id} className="flex flex-col items-center text-center p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
                        <div className={\`w-6 h-6 rounded-full flex items-center justify-center mb-1.5 \${step.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}\`}>
                          {step.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                        </div>
                        <span className={\`text-[10px] font-bold uppercase tracking-wider \${step.completed ? 'text-slate-800' : 'text-slate-400'}\`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items Summary & Expand Action */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex -space-x-3 overflow-hidden">
                    {order.items.slice(0, 4).map((item, idx) => (
                      <img 
                        key={idx}
                        src={item.product.image} 
                        alt={item.product.name}
                        className="w-10 h-10 rounded-full border-2 border-white object-cover bg-slate-100"
                        title={\`\${item.quantity}x \${item.product.name}\`}
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
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Order Details
                </h3>
                <p className="text-xs font-mono text-slate-500">
                  ID: {selectedOrder.id}
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
};`;

const startIndex = content.indexOf('  return (');
if (startIndex !== -1) {
    content = content.substring(0, startIndex) + newReturn;
    fs.writeFileSync(path, content);
    console.log("Successfully rewrote OrderHistory.tsx");
} else {
    console.log("Could not find start string.");
}
