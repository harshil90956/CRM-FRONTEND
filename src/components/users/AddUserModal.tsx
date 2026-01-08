import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { mockApi } from "@/lib/mockApi";

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editUser?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: "manager" | "agent";
  };
}

export const AddUserModal = ({ open, onOpenChange, onSuccess, editUser }: AddUserModalProps) => {
  const [name, setName] = useState(editUser?.name || "");
  const [email, setEmail] = useState(editUser?.email || "");
  const [phone, setPhone] = useState(editUser?.phone || "");
  const [role, setRole] = useState<"manager" | "agent">(editUser?.role || "agent");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when editUser changes
  useEffect(() => {
    if (editUser) {
      setName(editUser.name);
      setEmail(editUser.email);
      setPhone(editUser.phone);
      setRole(editUser.role);
    } else {
      resetForm();
    }
  }, [editUser]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setRole("agent");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Valid email is required");
      return;
    }
    if (!phone.trim()) {
      toast.error("Phone is required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editUser?.id) {
        // For editing, only send changed fields
        const changedFields: any = {};
        
        if (name !== editUser.name) changedFields.name = name;
        if (email !== editUser.email) changedFields.email = email;
        if (phone !== editUser.phone) changedFields.phone = phone;
        if (role !== editUser.role) changedFields.role = role;
        
        // Only update if there are actual changes
        if (Object.keys(changedFields).length > 0) {
          await mockApi.patch("/users", editUser.id, changedFields);
          toast.success("User updated successfully");
        } else {
          toast.info("No changes made");
        }
      } else {
        // For adding new user, send all fields
        const payload = {
          name,
          email,
          phone,
          role,
          isActive: true,
          tenantId: "t_soundarya",
        };

        // Check if user already exists
        const existingUsers = await mockApi.get<any[]>("/users");
        if (existingUsers.some((u) => u.email === email)) {
          toast.error("User with this email already exists");
          setIsSubmitting(false);
          return;
        }
        await mockApi.post("/users", payload);
        toast.success("User added successfully");
      }

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error("Failed to save user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editUser ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>

          <div>
            <Label>Phone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v: "manager" | "agent") => setRole(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editUser ? "Update User" : "Add User"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
