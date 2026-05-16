import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const statusParam = statusFilter !== "ALL" ? { status: statusFilter } : undefined;

  const { data: orders, isLoading } = useListOrders(
    statusParam,
    { query: { queryKey: getListOrdersQueryKey(statusParam), refetchInterval: 30000 } }
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'AWAITING_CONFIRMATION': return 'bg-sky-100 text-sky-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PREPARING': return 'bg-purple-100 text-purple-800';
      case 'OUT_FOR_DELIVERY': return 'bg-orange-100 text-orange-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (status: string) => {
    if (status === 'PAID') return 'bg-green-100 text-green-800';
    if (status === 'FAILED') return 'bg-red-100 text-red-800';
    if (status === 'AWAITING_CONFIRMATION') return 'bg-blue-100 text-blue-800';
    if (status === 'UNPAID') return 'bg-gray-100 text-gray-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getPaymentLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Paid';
      case 'FAILED': return 'Failed';
      case 'AWAITING_CONFIRMATION': return 'Confirming';
      case 'UNPAID': return 'Unpaid';
      case 'PENDING': return 'Pending';
      default: return status;
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold font-serif text-primary">Orders</h1>

        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="AWAITING_CONFIRMATION">Awaiting Confirmation</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="PREPARING">Preparing</SelectItem>
              <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-md border overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading orders...</TableCell>
              </TableRow>
            ) : !orders || orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No orders found.</TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/30 cursor-pointer">
                  <TableCell className="font-medium">#{order.id.toString().padStart(4, '0')}</TableCell>
                  <TableCell className="whitespace-nowrap">{format(new Date(order.createdAt), "MMM d, HH:mm")}</TableCell>
                  <TableCell className="whitespace-nowrap">{order.customerName}</TableCell>
                  <TableCell className="font-semibold text-secondary whitespace-nowrap">{formatPrice(order.total)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getPaymentColor(order.paymentStatus)}`}>
                      {getPaymentLabel(order.paymentStatus)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/orders/${order.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
