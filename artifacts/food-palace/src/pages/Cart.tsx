import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { useCart } from "@/contexts/CartContext";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(price);
  };

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-24 text-center max-w-md flex flex-col items-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-3xl font-bold mb-4">Your Cart is Empty</h2>
          <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet. Let's fix that!</p>
          <Link href="/menu">
            <Button size="lg" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">Browse Menu</Button>
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8 text-primary">Your Cart</h1>
        
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground hover:text-destructive">
                Clear Cart
              </Button>
            </div>
            
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-4 p-4 border rounded-lg bg-card">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg leading-tight">{item.productName}</h3>
                        <span className="font-bold text-secondary">{formatPrice(item.totalPrice)}</span>
                      </div>
                      
                      {(item.variantName || item.addonNames) && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.variantName && <div><span className="font-medium text-foreground/80">Option:</span> {item.variantName}</div>}
                          {item.addonNames && <div><span className="font-medium text-foreground/80">Extras:</span> {item.addonNames}</div>}
                        </div>
                      )}
                      
                      {item.notes && (
                        <div className="text-sm italic text-muted-foreground mt-1 line-clamp-1">
                          Note: {item.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border rounded-md h-9">
                        <button 
                          className="px-3 h-full flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                        <button 
                          className="px-3 h-full flex items-center justify-center hover:bg-muted transition-colors"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="border rounded-xl p-6 bg-card sticky top-24">
              <h3 className="font-bold text-xl mb-6 font-serif border-b pb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>Delivery Fee</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
              
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-secondary">{formatPrice(subtotal)}</span>
                </div>
              </div>
              
              <Link href="/checkout">
                <Button className="w-full h-12 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}