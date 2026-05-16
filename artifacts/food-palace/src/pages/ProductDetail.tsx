import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id || "0", 10);
  
  const { data: product, isLoading } = useGetProduct(productId, {
    query: { queryKey: getGetProductQueryKey(productId), enabled: !!productId }
  });

  const { addItem } = useCart();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]);
  const [notes, setNotes] = useState("");

  const selectedVariant = useMemo(() => {
    return product?.variants?.find(v => v.id === selectedVariantId);
  }, [product, selectedVariantId]);

  const selectedAddons = useMemo(() => {
    return product?.addons?.filter(a => selectedAddonIds.includes(a.id)) || [];
  }, [product, selectedAddonIds]);

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    let price = selectedVariant ? selectedVariant.price : product.basePrice;
    selectedAddons.forEach(a => price += a.price);
    return price;
  }, [product, selectedVariant, selectedAddons]);

  const totalPrice = unitPrice * quantity;

  // Auto-select first variant if exists and none selected
  useMemo(() => {
    if (product?.variants && product.variants.length > 0 && selectedVariantId === null) {
      const available = product.variants.find(v => v.isAvailable);
      if (available) setSelectedVariantId(available.id);
    }
  }, [product, selectedVariantId]);

  const toggleAddon = (id: number) => {
    setSelectedAddonIds(prev => 
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    );
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Require variant selection if variants exist
    if (product.variants && product.variants.length > 0 && !selectedVariantId) {
      toast.error("Please select an option");
      return;
    }

    addItem({
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      addonIds: selectedAddons.map(a => a.id),
      addonNames: selectedAddons.map(a => a.name).join(", "),
      quantity,
      unitPrice,
      totalPrice,
      imageUrl: product.imageUrl,
      notes: notes.trim() || undefined
    });

    toast.success(`Added ${quantity} ${product.name} to cart`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(price);
  };

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!product) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Link href="/menu">
            <Button>Back to Menu</Button>
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/menu" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Menu
        </Link>
        
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="aspect-square rounded-xl overflow-hidden bg-muted relative">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/10">
                <span className="font-serif text-2xl opacity-50">FOOD PALACE</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
            <p className="text-2xl font-bold text-secondary mb-4">{formatPrice(unitPrice)}</p>
            
            {product.description && (
              <p className="text-muted-foreground mb-8">{product.description}</p>
            )}

            <div className="flex-1 space-y-6">
              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold border-b pb-2">Size / Option</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {product.variants.map(variant => (
                      <Button
                        key={variant.id}
                        type="button"
                        variant={selectedVariantId === variant.id ? "default" : "outline"}
                        className={`justify-between h-auto py-3 ${selectedVariantId === variant.id ? "border-primary bg-primary/5 text-primary" : ""}`}
                        disabled={!variant.isAvailable}
                        onClick={() => setSelectedVariantId(variant.id)}
                      >
                        <span>{variant.name}</span>
                        <span className="font-semibold">{formatPrice(variant.price)}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Addons */}
              {product.addons && product.addons.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold border-b pb-2">Extras</h3>
                  <div className="space-y-2">
                    {product.addons.map(addon => (
                      <label key={addon.id} className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${selectedAddonIds.includes(addon.id) ? "bg-primary/5 border-primary" : "hover:bg-muted/50"}`}>
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                            checked={selectedAddonIds.includes(addon.id)}
                            onChange={() => toggleAddon(addon.id)}
                            disabled={!addon.isAvailable}
                          />
                          <span className={!addon.isAvailable ? "text-muted-foreground line-through" : ""}>{addon.name}</span>
                        </div>
                        <span className="font-semibold text-secondary">+{formatPrice(addon.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-3">
                <h3 className="font-bold border-b pb-2">Special Instructions</h3>
                <Textarea 
                  placeholder="Any allergies or special requests?" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center border rounded-md h-12 w-full sm:w-auto">
                <button 
                  className="px-4 h-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button 
                  className="px-4 h-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setQuantity(q => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <Button 
                className="w-full h-12 text-lg font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={handleAddToCart}
                disabled={!product.isAvailable || (product.variants && product.variants.length > 0 && !selectedVariantId)}
              >
                Add {quantity} to Cart — {formatPrice(totalPrice)}
              </Button>
            </div>
            
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}