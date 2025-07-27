import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ServiceImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  serviceIndex: number;
}

const ServiceImageUpload: React.FC<ServiceImageUploadProps> = ({
  images,
  onImagesChange,
  serviceIndex
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `service-${serviceIndex}-${Date.now()}.${fileExt}`;
      const filePath = `service-images/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

      // Replace with single image (limit to one)
      const newImages = [publicUrl];
      onImagesChange(newImages);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image must be less than 5MB",
          variant: "destructive"
        });
        return;
      }

      uploadImage(file);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const triggerFileSelect = () => {
    // Only allow upload if no image exists (limit to one)
    if (images.length === 0) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      <Label>Service Images</Label>
      
      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileSelect}
          disabled={uploading || images.length > 0}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading...' : images.length > 0 ? 'One Image Max' : 'Upload Image'}
        </Button>
        <span className="text-sm text-muted-foreground">
          Max 5MB, JPG/PNG/GIF {images.length > 0 && '(1 image limit)'}
        </span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Single Image Display */}
      {images.length > 0 && (
        <div className="max-w-sm">
          <Card className="relative group overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square relative">
                <img
                  src={images[0]}
                  alt="Service image"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
                
                {/* Remove button overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(0)}
                    className="flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && (
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No images uploaded yet</p>
               <Button
                type="button"
                variant="outline"
                onClick={triggerFileSelect}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Service Image
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export { ServiceImageUpload };
export default ServiceImageUpload;