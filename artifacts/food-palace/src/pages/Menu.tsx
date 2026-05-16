import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { useListProducts, useListCategories, getListProductsQueryKey, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Menu() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const { data: categories, isLoading: isCategoriesLoading } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  const { data: products, isLoading: isProductsLoading } = useListProducts(undefined, {
    query: { queryKey: getListProductsQueryKey() }
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let filtered = products.filter(p => p.isAvailable);
    
    if (activeCategory) {
      filtered = filtered.filter(p => p.categoryId === activeCategory);
    }
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || (p.description && p.description.toLowerCase().includes(s)));
    }
    
    return filtered;
  }, [products, activeCategory, search]);

  return (
    <CustomerLayout>
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="font-serif text-3xl md:text-5xl font-bold mb-6">Our Menu</h1>
          
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-foreground/50 h-5 w-5" />
            <Input 
              type="search"
              placeholder="Search for your favorite meals..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-secondary"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Categories */}
        <div className="flex overflow-x-auto pb-4 mb-8 gap-2 no-scrollbar">
          <Button 
            variant={activeCategory === null ? "default" : "outline"}
            className={activeCategory === null ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : ""}
            onClick={() => setActiveCategory(null)}
          >
            All
          </Button>
          {isCategoriesLoading ? (
            [...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-24 rounded-md flex-shrink-0" />)
          ) : (
            categories?.filter(c => c.isActive).map(cat => (
              <Button 
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                className={activeCategory === cat.id ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 flex-shrink-0" : "flex-shrink-0"}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))
          )}
        </div>

        {/* Products Grid */}
        {isProductsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full mt-2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-muted-foreground mb-2">No items found</h3>
            <p className="text-muted-foreground/80">Try adjusting your search or category filter.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setActiveCategory(null); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}