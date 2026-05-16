import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useGetOrder, getGetOrderQueryKey, useConfirmPayment, useUpdateOrderStatus, useGetSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Clock, MapPin, CheckCircle2, Banknote, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "wouter";

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [location] = useLocation();
  const isAdmin = location.startsWith('/admin');
  const orderId = parseInt(id || "0", 10);

  const queryClient = useQueryClient();
  const confirmPayment = useConfirmPayment();
  const updateStatus = useUpdateOrderStatus();

  const { data: order, isLoading, refetch } = useGetOrder(orderId, {
    query: { queryKey: getGetOrderQueryKey(orderId), enabled: !!orderId, refetchInterval: isAdmin ? 30000 : false }
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
      case 'AWAITING_CONFIRMATION': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PREPARING': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OUT_FOR_DELIVERY': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentColor = (status: string) => {
    if (status === 'PAID') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'FAILED') return 'bg-red-100 text-red-800 border-red-200';
    if (status === 'AWAITING_CONFIRMATION') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (status === 'UNPAID') return 'bg-gray-100 text-gray-800 border-gray-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getPaymentLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Paid';
      case 'FAILED': return 'Payment Failed';
      case 'AWAITING_CONFIRMATION': return 'Awaiting Confirmation';
      case 'UNPAID': return 'Unpaid (Cash)';
      case 'PENDING': return 'Pending Transfer';
      default: return status;
    }
  };

  const handleCustomerPaymentConfirm = () => {
    confirmPayment.mutate({ id: orderId, data: { action: "customer_confirmed" } }, {
      onSuccess: () => {
        toast.success("Payment marked as made. We'll confirm shortly.");
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
      },
      onError: () => toast.error("Failed to update payment status")
    });
  };

  const handleAdminPaymentConfirm = (status: string) => {
    confirmPayment.mutate({ id: orderId, data: { action: "admin_verified", paymentStatus: status } }, {
      onSuccess: () => {
        toast.success(`Payment marked as ${status}`);
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
      },
      onError: () => toast.error("Failed to update payment")
    });
  };

  const handleStatusUpdate = (status: string) => {
    updateStatus.mutate({ id: orderId, data: { status } }, {
      onSuccess: () => {
        toast.success(`Order updated to: ${status.replace(/_/g, ' ')}`);
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
      },
      onError: () => toast.error("Failed to update status")
    });
  };

  if (isLoading) {
    const Layout = isAdmin ? AdminLayout : CustomerLayout;
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-24 bg-muted rounded-xl" />
            <div className="h-48 bg-muted rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    const Layout = isAdmin ? AdminLayout : CustomerLayout;
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <Link href={isAdmin ? "/admin/orders" : "/orders"}>
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';

  const content = (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Link href={isAdmin ? "/admin/orders" : "/orders"} className="inline-flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Link>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-muted-foreground">
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">Order #{order.id.toString().padStart(4, '0')}</h1>
          <p className="text-muted-foreground mt-1">{format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${getStatusColor(order.status)}`}>
            {order.status.replace(/_/g, ' ')}
          </span>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${getPaymentColor(order.paymentStatus)}`}>
            {getPaymentLabel(order.paymentStatus)}
          </span>
        </div>
      </div>

      {/* Progress tracker (customer view, not cancelled) */}
      {!isAdmin && !isCancelled && currentStepIndex >= 0 && (
        <div className="bg-card border rounded-xl p-6 mb-6">
          <h2 className="font-bold mb-4 text-base">Order Progress</h2>
          <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-2">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center flex-1 min-w-0">
                <div className={`h-2.5 w-2.5 rounded-full mb-1.5 flex-shrink-0 ${i <= currentStepIndex ? 'bg-secondary' : 'bg-border'}`} />
                <span className={`text-[9px] sm:text-xs font-medium text-center leading-tight ${i <= currentStepIndex ? 'text-secondary' : 'text-muted-foreground'}`}>
                  {step.replace(/_/g, ' ')}
                </span>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`hidden sm:block absolute h-0.5 w-full ${i < currentStepIndex ? 'bg-secondary' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Order Items</h2>
            <div className="space-y-4">
              {order.items?.map(item => (
                <div key={item.id} className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <span className="font-bold mr-2">{item.quantity}×</span>
                    <span className="font-medium">{item.productName}</span>
                    {(item.variantName || item.addonNames) && (
                      <div className="text-sm text-muted-foreground mt-1 ml-6">
                        {item.variantName && <div>{item.variantName}</div>}
                        {item.addonNames && <div>+ {item.addonNames}</div>}
                      </div>
                    )}
                    {item.notes && <div className="text-sm italic text-muted-foreground ml-6 mt-1">Note: {item.notes}</div>}
                  </div>
                  <div className="font-medium whitespace-nowrap">{formatPrice(item.totalPrice)}</div>
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

          {/* Delivery */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 border-b pb-2 flex items-center"><MapPin className="mr-2 h-5 w-5" /> Delivery Details</h2>
            <div className="space-y-2 text-sm">
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
            <p className="mb-4 text-sm"><strong>Method:</strong> {order.paymentMethod === 'TRANSFER' ? 'Bank Transfer' : 'Cash on Delivery'}</p>

            {/* Customer: show bank details and confirm button */}
            {!isAdmin && order.paymentMethod === 'TRANSFER' && order.paymentStatus === 'PENDING' && (
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <p className="text-sm font-medium">Please transfer {formatPrice(order.total)} to:</p>
                <div className="bg-background p-3 rounded border text-sm space-y-1">
                  <p>Bank: <strong>{settings?.bankName || 'MONIEPOINT MFB'}</strong></p>
                  <p>Name: <strong>{settings?.bankAccountName || 'USMAN SAMBO MARAFA'}</strong></p>
                  <p className="text-lg font-bold text-primary">{settings?.bankAccountNumber || '9110064364'}</p>
                </div>
                <Button
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  onClick={handleCustomerPaymentConfirm}
                  disabled={confirmPayment.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> I Have Made Payment
                </Button>
              </div>
            )}

            {!isAdmin && order.paymentStatus === 'AWAITING_CONFIRMATION' && (
              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm flex items-start gap-2">
                <Clock className="h-5 w-5 shrink-0 mt-0.5" />
                <p>Payment received and under review. We'll start preparing your order once confirmed.</p>
              </div>
            )}

            {!isAdmin && order.paymentStatus === 'PAID' && (
              <div className="bg-green-50 text-green-800 p-4 rounded-lg text-sm flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                <p>Payment confirmed! Your order is being processed.</p>
              </div>
            )}

            {/* Admin Payment Controls */}
            {isAdmin && order.paymentMethod === 'TRANSFER' && (
              <div className="space-y-3 mt-2">
                <p className="text-sm text-muted-foreground">Current: <strong>{getPaymentLabel(order.paymentStatus)}</strong></p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleAdminPaymentConfirm('PAID')}
                    disabled={order.paymentStatus === 'PAID' || confirmPayment.isPending}
                  >
                    Mark Paid
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleAdminPaymentConfirm('FAILED')}
                    disabled={confirmPayment.isPending}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Admin Order Status Controls */}
          {isAdmin && (
            <div className="bg-card border rounded-xl p-6 border-primary/20">
              <h2 className="text-xl font-bold mb-4 border-b pb-2 text-primary">Update Status</h2>
              <div className="flex flex-col gap-2">
                {['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((s) => (
                  <Button
                    key={s}
                    variant={order.status === s ? 'default' : 'outline'}
                    className={
                      order.status === s && s === 'DELIVERED' ? 'bg-green-600 hover:bg-green-700 text-white' :
                      order.status === s && s === 'CANCELLED' ? 'bg-red-600 hover:bg-red-700 text-white' :
                      s === 'CANCELLED' ? 'text-red-600 border-red-200 hover:bg-red-50' : ''
                    }
                    disabled={updateStatus.isPending}
                    onClick={() => handleStatusUpdate(s)}
                  >
                    {s.replace(/_/g, ' ')}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return isAdmin ? <AdminLayout>{content}</AdminLayout> : <CustomerLayout>{content}</CustomerLayout>;
}
