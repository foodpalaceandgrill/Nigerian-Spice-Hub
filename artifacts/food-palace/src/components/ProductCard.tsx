import { Product } from "@workspace/api-client-react/api.schemas";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const hasVariantsOrAddons = (product.variants && product.variants.length > 0) || (product.addons && product.addons.length > 0);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to detail page
    if (hasVariantsOrAddons) {
      // Must go to detail page to select options
      return;
    }
    
    addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.basePrice,
      totalPrice: product.basePrice,
      imageUrl: product.imageUrl,
    });
    
    toast.success(`Added ${product.name} to cart`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <Link href={`/menu/${product.id}`}>
      <motion.div whileHover={{ y: -5 }} className="h-full">
        <Card className="h-full flex flex-col overflow-hidden border-border/50 hover:shadow-lg transition-shadow cursor-pointer bg-card">
          <div className="aspect-video relative overflow-hidden bg-muted">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/10">
                <span className="font-serif text-lg opacity-50">FOOD PALACE</span>
              </div>
            )}
            {!product.isAvailable && (
              <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
                Sold Out
              </div>
            )}
          </div>
          
          <CardContent className="flex-1 p-4">
            <div className="flex justify-between items-start gap-2 mb-2">
              <h3 className="font-bold text-lg leading-tight line-clamp-2">{product.name}</h3>
              <span className="font-bold text-secondary whitespace-nowrap">{formatPrice(product.basePrice)}</span>
            </div>
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
            )}
          </CardContent>
          
          <CardFooter className="p-4 pt-0">
            {hasVariantsOrAddons ? (
              <Button variant="outline" className="w-full font-semibold border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground" disabled={!product.isAvailable}>
                Select Options
              </Button>
            ) : (
              <Button 
                className="w-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90" 
                onClick={handleQuickAdd}
                disabled={!product.isAvailable}
              >
                <Plus className="h-4 w-4 mr-2" /> Add to Cart
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </Link>
  );
}