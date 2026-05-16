import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { 
  useGetProduct, 
  useCreateProduct, 
  useUpdateProduct, 
  useListCategories, 
  getListCategoriesQueryKey, 
  getGetProductQueryKey,
  getListProductsQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const productId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });
  
  const { data: product, isLoading: isProductLoading } = useGetProduct(productId, {
    query: { enabled: isEditing, queryKey: getGetProductQueryKey(productId) }
  });

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    categoryId: "",
    description: "",
    imageUrl: "",
    basePrice: "0",
    isAvailable: true,
    isFeatured: false
  });

  useEffect(() => {
    if (isEditing && product) {
      setFormData({
        name: product.name,
        slug: product.slug,
        categoryId: product.categoryId.toString(),
        description: product.description || "",
        imageUrl: product.imageUrl || "",
        basePrice: product.basePrice.toString(),
        isAvailable: product.isAvailable,
        isFeatured: product.isFeatured
      });
    }
  }, [product, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-generate slug from name if creating
      ...(name === 'name' && !isEditing ? { slug: value.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]+/g, '') } : {})
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast.error("Please select a category");
      return;
    }

    const payload = {
      name: formData.name,
      slug: formData.slug,
      categoryId: parseInt(formData.categoryId, 10),
      description: formData.description,
      imageUrl: formData.imageUrl,
      basePrice: parseFloat(formData.basePrice),
      isAvailable: formData.isAvailable,
      isFeatured: formData.isFeatured
    };

    if (isEditing) {
      updateMutation.mutate({ id: productId, data: payload }, {
        onSuccess: () => {
          toast.success("Product updated");
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
          setLocation("/admin/products");
        },
        onError: (err: any) => toast.error(err?.message || "Failed to update")
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          toast.success("Product created");
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          setLocation("/admin/products");
        },
        onError: (err: any) => toast.error(err?.message || "Failed to create")
      });
    }
  };

  if (isEditing && isProductLoading) return <AdminLayout><div>Loading...</div></AdminLayout>;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/products" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
        </Link>
        
        <h1 className="text-3xl font-bold font-serif text-primary mb-8">{isEditing ? "Edit Product" : "Add New Product"}</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" name="name" required value={formData.name} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL friendly)</Label>
              <Input id="slug" name="slug" required value={formData.slug} onChange={handleChange} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <select 
                id="categoryId" 
                name="categoryId" 
                required 
                value={formData.categoryId} 
                onChange={handleChange}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Select category...</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price (₦)</Label>
              <Input id="basePrice" name="basePrice" type="number" min="0" step="0.01" required value={formData.basePrice} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input id="imageUrl" name="imageUrl" placeholder="/images/jollof-rice.png" value={formData.imageUrl} onChange={handleChange} />
            {formData.imageUrl && (
              <div className="mt-2 h-32 w-32 rounded bg-muted overflow-hidden border">
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex gap-8 py-4 border-t border-b">
            <div className="flex items-center space-x-2">
              <Switch 
                id="isAvailable" 
                checked={formData.isAvailable} 
                onCheckedChange={(c) => handleSwitchChange("isAvailable", c)} 
              />
              <Label htmlFor="isAvailable">Available</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="isFeatured" 
                checked={formData.isFeatured} 
                onCheckedChange={(c) => handleSwitchChange("isFeatured", c)} 
              />
              <Label htmlFor="isFeatured">Featured (Shows on homepage)</Label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving..." : "Save Product"}
          </Button>
        </form>
      </div>
    </AdminLayout>
  );
}