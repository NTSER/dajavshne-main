
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Lock, Calendar, Users, GamepadIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import BookingHistory from "@/components/BookingHistory";
import FriendsManagement from "@/components/FriendsManagement";
import LobbyManagement from "@/components/LobbyManagement";

interface ProfileDialogProps {
  children: React.ReactNode;
  defaultTab?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ProfileDialog = ({ children, defaultTab = "profile", open: controlledOpen, onOpenChange }: ProfileDialogProps) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Use controlled or internal open state
  const isOpen = controlledOpen !== undefined ? controlledOpen : open;
  const handleOpenChange = (isOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    } else {
      setOpen(isOpen);
    }
    if (isOpen && profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        password: "",
        confirmPassword: "",
      });
      // Set tab when opening
      if (defaultTab) {
        setActiveTab(defaultTab);
      }
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // Update profile information
      if (formData.full_name !== profile?.full_name) {
        await updateProfile.mutateAsync({
          full_name: formData.full_name,
        });
      }

      // Update email if changed
      if (formData.email !== profile?.email && formData.email) {
        const { error } = await supabase.auth.updateUser({
          email: formData.email,
        });
        if (error) throw error;
      }

      // Update password if provided
      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase.auth.updateUser({
          password: formData.password,
        });
        if (error) throw error;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile & Friends
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="lobbies" className="flex items-center gap-2">
              <GamepadIcon className="h-4 w-4" />
              Lobbies
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Bookings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  New Password (optional)
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter new password"
                />
              </div>
              {formData.password && (
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateProfile}
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? "Updating..." : "Update Profile"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="friends" className="mt-4">
            <div className="max-h-[60vh] overflow-y-auto">
              <FriendsManagement />
            </div>
          </TabsContent>
          
          <TabsContent value="lobbies" className="mt-4">
            <div className="max-h-[60vh] overflow-y-auto">
              <LobbyManagement />
            </div>
          </TabsContent>
          
          <TabsContent value="bookings" className="mt-4">
            <BookingHistory />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
