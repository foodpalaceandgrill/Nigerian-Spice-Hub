import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useGetOrder, getGetOrderQueryKey, useConfirmPayment, useUpdateOrderStatus, useGetSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Clock, MapPin, CheckCircle2, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "wouter";

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [location] = useLocation();
  const isAdmin = location.startsWith('/admin');
  const orderId = parseInt(id || "0", 10);
  
  const queryClient = useQueryClient();
  const confirmPayment = useConfirmPayment();
  const updateStatus = useUpdateOrderStatus();

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: { queryKey: getGetOrderQueryKey(orderId), enabled: !!orderId }
  });
  
  const { data: settings } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() }
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PREPARING': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OUT_FOR_DELIVERY': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCustomerPaymentConfirm = () => {
    confirmPayment.mutate({ id: orderId, data: { action: "customer_confirmed" } }, {
      onSuccess: () => {
        toast.success("Payment marked as made. We will confirm shortly.");
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
      }
    });
  };

  const handleAdminPaymentConfirm = (status: string) => {
    confirmPayment.mutate({ id: orderId, data: { action: "admin_verified", paymentStatus: status } }, {
      onSuccess: () => {
        toast.success("Payment status updated.");
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
      }
    });
  };

  const handleStatusUpdate = (status: string) => {
    updateStatus.mutate({ id: orderId, data: { status } }, {
      onSuccess: () => {
        toast.success(`Order marked as ${status.replace(/_/g, ' ')}`);
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
      }
    });
  };

  if (isLoading) {
    const Layout = isAdmin ? AdminLayout : CustomerLayout;
    return <Layout><div className="p-8">Loading order...</div></Layout>;
  }

  if (!order) {
    const Layout = isAdmin ? AdminLayout : CustomerLayout;
    return <Layout><div className="p-8 text-center text-xl font-bold">Order not found</div></Layout>;
  }

  const content = (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href={isAdmin ? "/admin/orders" : "/orders"} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">Order #{order.id.toString().padStart(4, '0')}</h1>
          <p className="text-muted-foreground mt-1">{format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
        </div>
        <div className="flex gap-2">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${getStatusColor(order.status)}`}>
            {order.status.replace(/_/g, ' ')}
          </span>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${
            order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 
            order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
          }`}>
            Payment: {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Order Items</h2>
            <div className="space-y-4">
              {order.items?.map(item => (
                <div key={item.id} className="flex justify-between items-start">
                  <div>
                    <span className="font-bold mr-2">{item.quantity}x</span>
                    <span className="font-medium">{item.productName}</span>
                    {(item.variantName || item.addonNames) && (
                      <div className="text-sm text-muted-foreground mt-1 ml-6">
                        {item.variantName && <div>{item.variantName}</div>}
                        {item.addonNames && <div>+ {item.addonNames}</div>}
                      </div>
                    )}
                    {item.notes && <div className="text-sm italic text-muted-foreground ml-6 mt-1">Note: {item.notes}</div>}
                  </div>
                  <div className="font-medium">{formatPrice(item.totalPrice)}</div>
                </div>
              ))}
            </div>
            
            <div className="border-t mt-6 pt-4 space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-secondary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 border-b pb-2 flex items-center"><MapPin className="mr-2 h-5 w-5" /> Delivery Details</h2>
            <div className="space-y-2">
              <p><strong>Name:</strong> {order.customerName}</p>
              <p><strong>Phone:</strong> {order.customerPhone}</p>
              <p><strong>Address:</strong> {order.deliveryAddress}</p>
              {order.deliveryLocation && <p><strong>Area:</strong> {order.deliveryLocation}</p>}
              {order.deliveryNotes && <p><strong>Notes:</strong> {order.deliveryNotes}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Payment Info */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 border-b pb-2 flex items-center"><Banknote className="mr-2 h-5 w-5" /> Payment</h2>
            <p className="mb-4"><strong>Method:</strong> {order.paymentMethod === 'TRANSFER' ? 'Bank Transfer' : 'Cash on Delivery'}</p>
            
            {!isAdmin && order.paymentMethod === 'TRANSFER' && order.paymentStatus === 'PENDING' && (
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <p className="text-sm font-medium">Please transfer {formatPrice(order.total)} to:</p>
                <div className="bg-background p-3 rounded border text-sm">
                  <p>Bank: {settings?.bankName || 'MONIEPOINT MFB'}</p>
                  <p>Name: {settings?.bankAccountName || 'FOOD PALACE'}</p>
                  <p className="text-lg font-bold text-primary mt-1">{settings?.bankAccountNumber || '9110064364'}</p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCustomerPaymentConfirm}
                  disabled={confirmPayment.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> I Have Made Payment
                </Button>
              </div>
            )}
            
            {!isAdmin && order.paymentMethod === 'TRANSFER' && order.paymentStatus === 'AWAITING_CONFIRMATION' && (
              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm flex items-start gap-2">
                <Clock className="h-5 w-5 shrink-0" />
                <p>We are verifying your payment. We will begin preparing your order once confirmed.</p>
              </div>
            )}

            {/* Admin Payment Controls */}
            {isAdmin && order.paymentMethod === 'TRANSFER' && (
              <div className="space-y-3 mt-4">
                <h3 className="font-semibold text-sm text-muted-foreground">Admin Payment Actions</h3>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-green-600 hover:bg-green-700" 
                    onClick={() => handleAdminPaymentConfirm('PAID')}
                    disabled={order.paymentStatus === 'PAID'}
                  >
                    Mark Paid
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => handleAdminPaymentConfirm('FAILED')}
                  >
                    Mark Failed
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Admin Order Controls */}
          {isAdmin && (
            <div className="bg-card border rounded-xl p-6 border-primary/20">
              <h2 className="text-xl font-bold mb-4 border-b pb-2 text-primary">Update Status</h2>
              <div className="flex flex-col gap-2">
                <Button variant={order.status === 'CONFIRMED' ? 'default' : 'outline'} onClick={() => handleStatusUpdate('CONFIRMED')}>Confirmed</Button>
                <Button variant={order.status === 'PREPARING' ? 'default' : 'outline'} onClick={() => handleStatusUpdate('PREPARING')}>Preparing</Button>
                <Button variant={order.status === 'OUT_FOR_DELIVERY' ? 'default' : 'outline'} onClick={() => handleStatusUpdate('OUT_FOR_DELIVERY')}>Out for Delivery</Button>
                <Button variant={order.status === 'DELIVERED' ? 'default' : 'outline'} className={order.status === 'DELIVERED' ? 'bg-green-600 hover:bg-green-700 text-white' : ''} onClick={() => handleStatusUpdate('DELIVERED')}>Delivered</Button>
                <Button variant={order.status === 'CANCELLED' ? 'default' : 'outline'} className={order.status === 'CANCELLED' ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-red-600 border-red-200 hover:bg-red-50'} onClick={() => handleStatusUpdate('CANCELLED')}>Cancelled</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return isAdmin ? <AdminLayout>{content}</AdminLayout> : <CustomerLayout>{content}</CustomerLayout>;
}