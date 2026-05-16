import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { format } from "date-fns";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Orders() {
  const { user } = useAuth();
  const { data: orders, isLoading } = useListOrders({
    query: { queryKey: getListOrdersQueryKey({ userId: user?.id }) }
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

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="font-serif text-3xl font-bold mb-8 text-primary">Your Orders</h1>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-24 text-center max-w-md flex flex-col items-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-3xl font-bold mb-4">No Orders Yet</h2>
          <p className="text-muted-foreground mb-8">You haven't placed any orders. Hungry? Check out our menu!</p>
          <Link href="/menu">
            <Button size="lg" className="w-full bg-secondary text-secondary-foreground">Browse Menu</Button>
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="font-serif text-3xl font-bold mb-8 text-primary">Your Orders</h1>
        
        <div className="space-y-4">
          {orders.map(order => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="bg-card border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">Order #{order.id.toString().padStart(4, '0')}</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                  
                  <div className="text-sm">
                    <span className="text-muted-foreground">Items: </span>
                    {order.items?.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                  <div className="font-bold text-lg text-secondary">{formatPrice(order.total)}</div>
                  <div className="flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
                    View Details <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </CustomerLayout>
  );
}