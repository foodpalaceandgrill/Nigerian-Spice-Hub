import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { useListFavorites, getListFavoritesQueryKey, useRemoveFavorite } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { HeartOff } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export default function Favorites() {
  const { data: favorites, isLoading } = useListFavorites({
    query: { queryKey: getListFavoritesQueryKey() }
  });

  const removeFavorite = useRemoveFavorite();
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="font-serif text-3xl font-bold mb-8 text-primary">Your Favorites</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full mt-2" />
              </div>
            ))}
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-24 text-center max-w-md flex flex-col items-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <HeartOff className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-3xl font-bold mb-4">No Favorites Yet</h2>
          <p className="text-muted-foreground mb-8">You haven't saved any meals to your favorites. Browse our menu and save the ones you love!</p>
          <Link href="/menu">
            <Button size="lg" className="w-full">Browse Menu</Button>
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl font-bold mb-8 text-primary">Your Favorites</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favorites.map(favorite => favorite.product ? (
            <div key={favorite.id} className="relative group">
              <ProductCard product={favorite.product} />
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  removeFavorite.mutate({ productId: favorite.productId }, {
                    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
                    }
                  });
                }}
                className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur rounded-full text-destructive hover:bg-destructive hover:text-white transition-colors z-10"
              >
                <HeartOff className="h-4 w-4" />
              </button>
            </div>
          ) : null)}
        </div>
      </div>
    </CustomerLayout>
  );
}