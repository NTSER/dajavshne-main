import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateVenue } from '@/hooks/usePartnerVenues';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const categories = [
  'Restaurant',
  'Spa',
  'Gym',
  'Salon',
  'Hotel',
  'Event Space',
  'Studio',
  'Clinic',
  'Outdoor Activity',
  'Entertainment'
];

const AddVenue = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    category: '',
    price: '',
    images: [''],
    uploadedImages: [] as File[],
    amenities: [],
    newAmenity: '',
    services: [{ name: '', description: '', price: '', duration: '' }],
    openingTime: '',
    closingTime: '',
  });

  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();
  const createVenue = useCreateVenue();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || !formData.category || !formData.price || !formData.openingTime || !formData.closingTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields including working hours.",
        variant: "destructive",
      });
      return;
    }

    // Validate services
    const validServices = formData.services.filter(service => 
      service.name.trim() && service.price.trim() && service.duration.trim()
    );

    try {
      setUploading(true);
      
      // Upload images to Supabase Storage
      const uploadedImageUrls = [];
      
      for (const file of formData.uploadedImages) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('venue-images')
          .upload(fileName, file);

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Get the public URL for the uploaded image
        const { data: urlData } = supabase.storage
          .from('venue-images')
          .getPublicUrl(uploadData.path);
        
        uploadedImageUrls.push(urlData.publicUrl);
      }

      // Combine uploaded images with URL images
      const allImages = [
        ...formData.images.filter(img => img.trim() !== ''),
        ...uploadedImageUrls
      ];

      const venueData = await createVenue.mutateAsync({
        name: formData.name,
        description: formData.description,
        location: formData.location,
        category: formData.category,
        price: parseFloat(formData.price),
        images: allImages,
        amenities: formData.amenities,
        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
      });

      // Create services if any are provided
      if (validServices.length > 0) {
        for (const service of validServices) {
          await supabase.from('venue_services').insert({
            venue_id: venueData.id,
            name: service.name,
            description: service.description,
            price: parseFloat(service.price),
            duration: service.duration,
          });
        }
      }

      toast({
        title: "Venue created!",
        description: "Your venue has been successfully added.",
      });

      navigate('/partner/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const updateImage = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? value : img)
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addAmenity = () => {
    if (formData.newAmenity.trim()) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, prev.newAmenity.trim()],
        newAmenity: ''
      }));
    }
  };

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { name: '', description: '', price: '', duration: '' }]
    }));
  };

  const updateService = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, [field]: value } : service
      )
    }));
  };

  const removeService = (index: number) => {
    if (formData.services.length > 1) {
      setFormData(prev => ({
        ...prev,
        services: prev.services.filter((_, i) => i !== index)
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
      }
      return isValid;
    });

    setFormData(prev => ({
      ...prev,
      uploadedImages: [...prev.uploadedImages, ...validFiles]
    }));
  };

  const removeUploadedImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      uploadedImages: prev.uploadedImages.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/partner/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Add New Venue</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Venue Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Venue Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Working Hours Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openingTime">Opening Time *</Label>
                  <Input
                    id="openingTime"
                    type="time"
                    value={formData.openingTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, openingTime: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="closingTime">Closing Time *</Label>
                  <Input
                    id="closingTime"
                    type="time"
                    value={formData.closingTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, closingTime: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Base Price (per hour) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-4">
                <Label>Images</Label>
                
                {/* File Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="image-upload" className="text-sm font-medium">
                      Upload from Device
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="flex-1"
                    />
                  </div>
                  
                  {/* Display uploaded images preview */}
                  {formData.uploadedImages.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Uploaded Images:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {formData.uploadedImages.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeUploadedImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* URL Input Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Or Enter Image URLs</Label>
                  {formData.images.map((image, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={image}
                        onChange={(e) => updateImage(index, e.target.value)}
                        placeholder="Enter image URL"
                      />
                      {formData.images.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addImageField}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Image URL
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amenities</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.newAmenity}
                    onChange={(e) => setFormData(prev => ({ ...prev, newAmenity: e.target.value }))}
                    placeholder="Add amenity"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                  />
                  <Button type="button" onClick={addAmenity}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Services Section */}
              <div className="space-y-4">
                <Label className="text-lg font-medium">Services (Optional)</Label>
                <p className="text-sm text-muted-foreground">Add services that customers can select when booking your venue.</p>
                
                {formData.services.map((service, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Service {index + 1}</h4>
                      {formData.services.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Service Name</Label>
                        <Input
                          value={service.name}
                          onChange={(e) => updateService(index, 'name', e.target.value)}
                          placeholder="e.g., Basic Gaming Session"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input
                          value={service.duration}
                          onChange={(e) => updateService(index, 'duration', e.target.value)}
                          placeholder="e.g., 2 hours"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Price per Guest</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={service.price}
                        onChange={(e) => updateService(index, 'price', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description (Optional)</Label>
                      <Textarea
                        value={service.description}
                        onChange={(e) => updateService(index, 'description', e.target.value)}
                        placeholder="Describe what's included in this service..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addService}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Service
                </Button>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/partner/dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createVenue.isPending || uploading}
                  className="flex-1"
                >
                  {createVenue.isPending || uploading ? "Creating..." : "Create Venue"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddVenue;