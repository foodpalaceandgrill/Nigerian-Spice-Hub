import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useGetSettings, getGetSettingsQueryKey, useUpdateSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminSettings() {
  const { data: settings, isLoading } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() }
  });
  
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    restaurantName: "",
    tagline: "",
    phone: "",
    email: "",
    address: "",
    heroTitle: "",
    heroSubtitle: "",
    isOpen: true,
    openingHours: "",
    whatsappNumber: "",
    instagramUrl: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: ""
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        restaurantName: settings.restaurantName || "",
        tagline: settings.tagline || "",
        phone: settings.phone || "",
        email: settings.email || "",
        address: settings.address || "",
        heroTitle: settings.heroTitle || "",
        heroSubtitle: settings.heroSubtitle || "",
        isOpen: settings.isOpen ?? true,
        openingHours: settings.openingHours || "",
        whatsappNumber: settings.whatsappNumber || "",
        instagramUrl: settings.instagramUrl || "",
        bankName: settings.bankName || "",
        bankAccountName: settings.bankAccountName || "",
        bankAccountNumber: settings.bankAccountNumber || ""
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isOpen: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({ data: formData }, {
      onSuccess: () => {
        toast.success("Settings saved successfully");
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      },
      onError: (err: any) => toast.error(err?.message || "Failed to save settings")
    });
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading settings...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-serif text-primary">Restaurant Settings</h1>
          <div className="flex items-center space-x-3 bg-card p-2 rounded-lg border px-4">
            <Label htmlFor="isOpen" className="font-bold cursor-pointer">Accepting Orders</Label>
            <Switch id="isOpen" checked={formData.isOpen} onCheckedChange={handleSwitchChange} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General */}
          <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
            <h2 className="text-xl font-bold border-b pb-2 mb-4">General Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Restaurant Name</Label>
                <Input name="restaurantName" value={formData.restaurantName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input name="tagline" value={formData.tagline} onChange={handleChange} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Hero Title (Homepage)</Label>
                <Input name="heroTitle" value={formData.heroTitle} onChange={handleChange} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Hero Subtitle (Homepage)</Label>
                <Textarea name="heroSubtitle" value={formData.heroSubtitle} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
            <h2 className="text-xl font-bold border-b pb-2 mb-4">Contact & Location</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" value={formData.email} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Opening Hours</Label>
                <Input name="openingHours" value={formData.openingHours} onChange={handleChange} placeholder="e.g. Mon-Sun: 9am - 10pm" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Physical Address</Label>
                <Textarea name="address" value={formData.address} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Bank */}
          <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
            <h2 className="text-xl font-bold border-b pb-2 mb-4">Bank Details (For Transfers)</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input name="bankName" value={formData.bankName} onChange={handleChange} placeholder="e.g. MONIEPOINT MFB" />
              </div>
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input name="bankAccountName" value={formData.bankAccountName} onChange={handleChange} placeholder="e.g. USMAN SAMBO MARAFA" />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} placeholder="e.g. 9110064364" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? "Saving..." : "Save All Settings"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}