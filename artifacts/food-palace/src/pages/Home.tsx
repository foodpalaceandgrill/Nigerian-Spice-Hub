import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { Link } from "wouter";
import { useGetSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Utensils, MapPin, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/ProductCard";
import { useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: settings, isLoading: isSettingsLoading } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() }
  });

  const { data: featuredProducts, isLoading: isProductsLoading } = useListProducts(
    { query: { queryKey: getListProductsQueryKey() } }
  );

  const displayFeatured = featuredProducts?.filter(p => p.isFeatured && p.isAvailable).slice(0, 4) || [];

  return (
    <CustomerLayout>
      {/* Hero Section */}
      <section className="relative bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src="/images/jollof-rice.png" 
            alt="Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 mix-blend-multiply" />
        </div>
        
        <div className="container mx-auto px-4 md:px-6 py-24 md:py-32 relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight mb-6 text-secondary">
              {settings?.heroTitle || "A Taste of Royalty."}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-xl">
              {settings?.heroSubtitle || "Premium Nigerian cuisine crafted with passion and delivered fresh to your door."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/menu">
                <Button size="lg" className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base font-bold">
                  Order Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Menu */}
      <section className="py-16 md:py-24 container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-2">Signature Dishes</h2>
            <p className="text-muted-foreground">Our most loved meals, prepared fresh daily.</p>
          </div>
          <Link href="/menu" className="hidden sm:inline-flex text-secondary font-semibold hover:underline items-center gap-1">
            View Full Menu <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isProductsLoading ? (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayFeatured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        
        <div className="mt-8 sm:hidden text-center">
          <Link href="/menu">
            <Button variant="outline" className="w-full">
              View Full Menu
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="font-serif text-3xl font-bold text-center text-primary mb-12">What are you craving?</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <CategoryBox title="Main Meals" image="/images/fried-rice.png" href="/menu?category=meals" />
            <CategoryBox title="Shawarma" image="/images/shawarma.png" href="/menu?category=shawarma" />
            <CategoryBox title="Soups & Swallows" image="/images/egusi-soup.png" href="/menu?category=soups" />
            <CategoryBox title="Burgers" image="/images/burger.png" href="/menu?category=burgers" />
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center p-6">
              <div className="h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
                <Utensils className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif">Premium Quality</h3>
              <p className="text-primary-foreground/80">Only the finest ingredients make it into our kitchen.</p>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
                <MapPin className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif">Fast Delivery</h3>
              <p className="text-primary-foreground/80">Hot food delivered promptly across designated zones.</p>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
                <LayoutDashboard className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif">Easy Ordering</h3>
              <p className="text-primary-foreground/80">Seamless experience from menu browsing to checkout.</p>
            </div>
          </div>
        </div>
      </section>
    </CustomerLayout>
  );
}

function CategoryBox({ title, image, href }: { title: string, image: string, href: string }) {
  return (
    <Link href={href} className="group relative rounded-xl overflow-hidden aspect-square block">
      <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
      <div className="absolute inset-0 flex items-end p-4 md:p-6">
        <h3 className="text-white font-serif font-bold text-lg md:text-2xl">{title}</h3>
      </div>
    </Link>
  );
}