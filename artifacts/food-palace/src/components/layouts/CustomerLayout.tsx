import { ReactNode } from "react";
import { Link } from "wouter";
import { ShoppingCart, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

export function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background font-sans">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

function Header() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-primary">FOOD PALACE</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium hover:text-secondary transition-colors">Home</Link>
          <Link href="/menu" className="text-sm font-medium hover:text-secondary transition-colors">Menu</Link>
          {user && (
            <>
              <Link href="/orders" className="text-sm font-medium hover:text-secondary transition-colors">Orders</Link>
              <Link href="/favorites" className="text-sm font-medium hover:text-secondary transition-colors">Favorites</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative" data-testid="link-cart">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Hi, {user.name.split(' ')[0]}</span>
                <Button variant="outline" size="sm" onClick={logout} data-testid="button-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/auth/login">
                <Button variant="default" size="sm" data-testid="link-login">
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b bg-background"
          >
            <nav className="flex flex-col p-4 gap-4">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium py-2">Home</Link>
              <Link href="/menu" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium py-2">Menu</Link>
              {user ? (
                <>
                  <Link href="/orders" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium py-2">Orders</Link>
                  <Link href="/favorites" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium py-2">Favorites</Link>
                  <div className="pt-4 border-t flex flex-col gap-4">
                    <span className="text-sm text-muted-foreground">Logged in as {user.name}</span>
                    <Button variant="outline" className="justify-start" onClick={() => { logout(); setIsMobileMenuOpen(false); }}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <div className="pt-4 border-t flex flex-col gap-4">
                  <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-12 mt-auto">
      <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <h2 className="font-serif text-2xl font-bold mb-4 text-secondary">FOOD PALACE</h2>
          <p className="text-primary-foreground/80 max-w-md">
            Experience the rich, bold flavors of authentic Nigerian cuisine, crafted with passion and delivered to your doorstep.
          </p>
        </div>
        <div>
          <h3 className="font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li><Link href="/menu" className="text-primary-foreground/80 hover:text-secondary transition-colors">Full Menu</Link></li>
            <li><Link href="/orders" className="text-primary-foreground/80 hover:text-secondary transition-colors">Track Order</Link></li>
            <li><Link href="/auth/login" className="text-primary-foreground/80 hover:text-secondary transition-colors">Login</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-4">Contact</h3>
          <ul className="space-y-2 text-primary-foreground/80">
            <li>Mon - Sun: 9:00 AM - 10:00 PM</li>
            <li>WhatsApp: +234 911 006 4364</li>
            <li>Delivery available across designated zones</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 md:px-6 mt-12 pt-8 border-t border-primary-foreground/20 text-center text-primary-foreground/60 text-sm">
        &copy; {new Date().getFullYear()} Food Palace Restaurant. All rights reserved.
      </div>
    </footer>
  );
}