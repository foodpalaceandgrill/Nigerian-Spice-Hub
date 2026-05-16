import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLoginAdmin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useLoginAdmin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } }, {
      onSuccess: (data) => {
        login(data.token, data.user, true); // true for admin
        toast.success("Admin access granted");
        setLocation("/admin");
      },
      onError: (err: any) => {
        toast.error(err?.message || "Invalid admin credentials");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary text-primary-foreground p-4">
      <div className="w-full max-w-md bg-card text-card-foreground p-8 rounded-2xl shadow-2xl border border-primary/20">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-primary">ADMIN PORTAL</h1>
          <p className="text-muted-foreground text-sm mt-1">Authorized personnel only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Admin Email</Label>
            <Input 
              id="email" 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-11 bg-primary hover:bg-primary/90 mt-2 text-primary-foreground font-bold"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Authenticating..." : "Access Dashboard"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            &larr; Back to Customer Login
          </Link>
        </div>
      </div>
    </div>
  );
}