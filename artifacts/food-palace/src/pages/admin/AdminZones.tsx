import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useListZones, getListZonesQueryKey, useCreateZone, useUpdateZone, useDeleteZone } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AdminZones() {
  const { data: zones, isLoading } = useListZones({
    query: { queryKey: getListZonesQueryKey() }
  });
  
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();
  const deleteZone = useDeleteZone();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", fee: "0", isActive: true, locationsStr: "" });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(price);
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({ name: "", fee: "0", isActive: true, locationsStr: "" });
    setIsDialogOpen(true);
  };

  const openEdit = (zone: any) => {
    setEditingId(zone.id);
    setFormData({ 
      name: zone.name, 
      fee: zone.fee.toString(), 
      isActive: zone.isActive,
      locationsStr: zone.locations?.map((l: any) => l.name).join(", ") || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this zone?")) {
      deleteZone.mutate({ id }, {
        onSuccess: () => {
          toast.success("Zone deleted");
          queryClient.invalidateQueries({ queryKey: getListZonesQueryKey() });
        }
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const locations = formData.locationsStr.split(",").map(s => s.trim()).filter(Boolean);
    
    const payload = {
      name: formData.name,
      fee: parseFloat(formData.fee),
      isActive: formData.isActive,
      locations
    };

    if (editingId) {
      // API spec currently doesn't allow sending locations on update directly without custom endpoints, 
      // but we send it per schema
      updateZone.mutate({ id: editingId, data: payload }, {
        onSuccess: () => {
          toast.success("Zone updated");
          setIsDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: getListZonesQueryKey() });
        }
      });
    } else {
      createZone.mutate({ data: payload }, {
        onSuccess: () => {
          toast.success("Zone created");
          setIsDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: getListZonesQueryKey() });
        }
      });
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-serif text-primary">Delivery Zones</h1>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Add Zone
        </Button>
      </div>

      <div className="bg-card rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone Name</TableHead>
              <TableHead>Locations</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : zones?.map((zone) => (
              <TableRow key={zone.id}>
                <TableCell className="font-bold">{zone.name}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {zone.locations?.map(l => l.name).join(", ") || "-"}
                </TableCell>
                <TableCell className="font-semibold text-secondary">{formatPrice(zone.fee)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${zone.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {zone.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(zone)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(zone.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Zone" : "New Zone"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Zone Name</Label>
              <Input required value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} placeholder="e.g. Zone A" />
            </div>
            <div className="space-y-2">
              <Label>Delivery Fee (₦)</Label>
              <Input required type="number" min="0" value={formData.fee} onChange={(e) => setFormData(p => ({...p, fee: e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label>Locations (comma separated)</Label>
              <Input value={formData.locationsStr} onChange={(e) => setFormData(p => ({...p, locationsStr: e.target.value}))} placeholder="e.g. Unguwan Dosa, Kawo" />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch checked={formData.isActive} onCheckedChange={(c) => setFormData(p => ({...p, isActive: c}))} />
              <Label>Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingId ? "Save Changes" : "Create Zone"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}