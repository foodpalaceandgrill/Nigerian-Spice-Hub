import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useListZones, getListZonesQueryKey, useCreateOrder, useGetSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: zones } = useListZones({
    query: { queryKey: getListZonesQueryKey() }
  });
  
  const { data: settings } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() }
  });

  const createOrder = useCreateOrder();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: "",
    zoneId: "",
    location: "",
    notes: "",
    paymentMethod: "CASH" // "CASH" or "TRANSFER"
  });

  const selectedZone = useMemo(() => {
    if (!formData.zoneId || !zones) return null;
    return zones.find(z => z.id === parseInt(formData.zoneId, 10));
  }, [formData.zoneId, zones]);

  const deliveryFee = selectedZone ? selectedZone.fee : 0;
  const total = subtotal + deliveryFee;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!selectedZone) {
      toast.error("Please select a delivery zone");
      return;
    }

    createOrder.mutate({
      data: {
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        paymentMethod: formData.paymentMethod,
        subtotal,
        deliveryFee,
        total,
        deliveryAddress: formData.address,
        deliveryLocation: formData.location || undefined,
        zoneId: selectedZone.id,
        deliveryNotes: formData.notes || undefined,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          variantId: item.variantId,
          variantName: item.variantName,
          addonIds: item.addonIds,
          addonNames: item.addonNames,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: item.notes
        }))
      }
    }, {
      onSuccess: (order) => {
        clearCart();
        toast.success("Order placed successfully!");
        setLocation(`/orders/${order.id}`);
      },
      onError: (err: any) => {
        toast.error(err?.message || "Failed to place order");
      }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(price);
  };

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-24 text-center max-w-md flex flex-col items-center">
          <h2 className="font-serif text-3xl font-bold mb-4">Your Cart is Empty</h2>
          <Link href="/menu">
            <Button size="lg" className="w-full">Browse Menu</Button>
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8 text-primary">Checkout</h1>
        
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3 space-y-8">
            
            {/* Contact Details */}
            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-6 font-serif border-b pb-2">1. Contact Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" required value={formData.name} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" required value={formData.phone} onChange={handleChange} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-6 font-serif border-b pb-2">2. Delivery Details</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="zoneId">Delivery Zone</Label>
                  <select 
                    id="zoneId" 
                    name="zoneId" 
                    required 
                    value={formData.zoneId} 
                    onChange={handleChange}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a zone...</option>
                    {zones?.filter(z => z.isActive).map(zone => (
                      <option key={zone.id} value={zone.id}>{zone.name} - {formatPrice(zone.fee)}</option>
                    ))}
                  </select>
                </div>
                
                {selectedZone && selectedZone.locations && selectedZone.locations.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="location">Specific Location/Area</Label>
                    <select 
                      id="location" 
                      name="location" 
                      required 
                      value={formData.location} 
                      onChange={handleChange}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">Select area...</option>
                      {selectedZone.locations.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="address">Full Delivery Address</Label>
                  <Textarea id="address" name="address" required value={formData.address} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                  <Input id="notes" name="notes" placeholder="e.g. Leave at the gate" value={formData.notes} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-6 font-serif border-b pb-2">3. Payment Method</h2>
              <div className="space-y-4">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'CASH' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
                  <input type="radio" name="paymentMethod" value="CASH" checked={formData.paymentMethod === 'CASH'} onChange={handleChange} className="w-4 h-4 text-primary mr-3" />
                  <div>
                    <div className="font-bold">Cash on Delivery</div>
                    <div className="text-sm text-muted-foreground">Pay when you receive your order</div>
                  </div>
                </label>
                
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'TRANSFER' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
                  <input type="radio" name="paymentMethod" value="TRANSFER" checked={formData.paymentMethod === 'TRANSFER'} onChange={handleChange} className="w-4 h-4 text-primary mr-3" />
                  <div>
                    <div className="font-bold">Bank Transfer</div>
                    <div className="text-sm text-muted-foreground">Transfer to our bank account</div>
                  </div>
                </label>
                
                {formData.paymentMethod === 'TRANSFER' && settings?.bankAccountNumber && (
                  <div className="p-4 bg-muted/50 rounded-lg text-sm">
                    <p className="mb-2">Please make payment to:</p>
                    <p><strong>Bank:</strong> {settings.bankName}</p>
                    <p><strong>Account Name:</strong> {settings.bankAccountName}</p>
                    <p className="text-lg font-bold mt-1 text-primary">{settings.bankAccountNumber}</p>
                    <p className="mt-3 text-muted-foreground text-xs">You will be prompted to confirm your payment after placing the order.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
          
          <div className="lg:col-span-2">
            <div className="border rounded-xl p-6 bg-card sticky top-24 shadow-sm">
              <h3 className="font-bold text-xl mb-6 font-serif border-b pb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1 pr-4">
                      <span className="font-semibold">{item.quantity}x</span> {item.productName}
                      {(item.variantName || item.addonNames) && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {item.variantName} {item.addonNames && `+ ${item.addonNames}`}
                        </div>
                      )}
                    </div>
                    <div className="font-medium">{formatPrice(item.totalPrice)}</div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span>{selectedZone ? formatPrice(deliveryFee) : "---"}</span>
                </div>
              </div>
              
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span className="text-secondary">{formatPrice(total)}</span>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? "Processing..." : "Place Order"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}