import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateVenue } from '@/hooks/usePartnerVenues';
import { useVenueCategories, useAmenities } from '@/hooks/useVenueData';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import PartnerLayout from '@/components/PartnerLayout';
import LocationInput from '@/components/LocationInput';

const AddVenue = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    categoryId: '',
    images: [''],
    uploadedImages: [] as File[],
    amenityIds: [] as string[],
    services: [{ 
      name: '', 
      description: '', 
      price: '', 
      duration: '', 
      images: [] as string[], 
      uploadedImages: [] as File[],
      discount_percentage: 0
    }],
    openingTime: '',
    closingTime: '',
    default_discount_percentage: 0,
  });

  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();
  const createVenue = useCreateVenue();
  const { toast } = useToast();
  const { data: categories, isLoading: categoriesLoading } = useVenueCategories();
  const { data: amenities, isLoading: amenitiesLoading } = useAmenities();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || !formData.categoryId || !formData.openingTime || !formData.closingTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields including working hours.",
        variant: "destructive",
      });
      return;
    }

    // Validate services - at least one required
    const validServices = formData.services.filter(service => 
      service.name.trim() && service.price.trim() && service.duration.trim()
    );

    if (validServices.length === 0) {
      toast({
        title: "Service required",
        description: "Please add at least one service with name, price, and duration.",
        variant: "destructive",
      });
      return;
    }


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

      // Get selected amenity names for the venue
      const selectedAmenities = amenities?.filter(amenity => 
        formData.amenityIds.includes(amenity.id)
      ).map(amenity => amenity.name) || [];

      // Get category name
      const selectedCategory = categories?.find(cat => cat.id === formData.categoryId)?.name || '';

      const venueData = await createVenue.mutateAsync({
        name: formData.name,
        description: formData.description,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        category: selectedCategory,
        price: parseFloat(validServices[0].price), // Use first service price as base venue price
        images: allImages,
        amenities: selectedAmenities,
        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
      });

      // Create services if any are provided
      if (validServices.length > 0) {
        for (const service of validServices) {
          // Upload service images
          const serviceImageUrls = [];
          
          for (const file of service.uploadedImages) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('service-images')
              .upload(`${service.name}/${fileName}`, file);

            if (uploadError) {
              console.warn(`Failed to upload service image ${file.name}:`, uploadError);
            } else {
              const { data: urlData } = supabase.storage
                .from('service-images')
                .getPublicUrl(uploadData.path);
              
              serviceImageUrls.push(urlData.publicUrl);
            }
          }

          // Combine uploaded images with URL images
          const allServiceImages = [
            ...service.images.filter(img => img.trim() !== ''),
            ...serviceImageUrls
          ];

          await supabase.from('venue_services').insert({
            venue_id: venueData.id,
            name: service.name,
            description: service.description,
            price: parseFloat(service.price),
            duration: service.duration,
            images: allServiceImages,
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


  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { 
        name: '', 
        description: '', 
        price: '', 
        duration: '', 
        images: [''], 
        uploadedImages: [],
        discount_percentage: 0
      }]
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

  // Service image upload handlers
  const handleServiceImageUpload = (serviceIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
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
      services: prev.services.map((service, i) => 
        i === serviceIndex 
          ? { ...service, uploadedImages: [...service.uploadedImages, ...validFiles] }
          : service
      )
    }));
  };

  const removeServiceUploadedImage = (serviceIndex: number, imageIndex: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === serviceIndex 
          ? { ...service, uploadedImages: service.uploadedImages.filter((_, imgI) => imgI !== imageIndex) }
          : service
      )
    }));
  };

  const addServiceImageField = (serviceIndex: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === serviceIndex 
          ? { ...service, images: [...service.images, ''] }
          : service
      )
    }));
  };

  const updateServiceImage = (serviceIndex: number, imageIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === serviceIndex 
          ? { ...service, images: service.images.map((img, imgI) => imgI === imageIndex ? value : img) }
          : service
      )
    }));
  };

  const removeServiceImage = (serviceIndex: number, imageIndex: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === serviceIndex 
          ? { ...service, images: service.images.filter((_, imgI) => imgI !== imageIndex) }
          : service
      )
    }));
  };

  // Generate 30-minute time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  // Helper function to format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <PartnerLayout>
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/partner/dashboard')}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Venue</h1>
              <p className="text-gray-600 dark:text-gray-400">Create a new venue listing for your business</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Venue Information</CardTitle>
            </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-900 dark:text-white font-medium">Venue Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-900 dark:text-white font-medium">Description</Label>
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
                  <Label htmlFor="openingTime" className="text-gray-900 dark:text-white font-medium">Opening Time *</Label>
                  <Select 
                    value={formData.openingTime} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, openingTime: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select opening time" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTime(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="closingTime" className="text-gray-900 dark:text-white font-medium">Closing Time *</Label>
                  <Select 
                    value={formData.closingTime} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, closingTime: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select closing time" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTime(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-gray-900 dark:text-white font-medium">Location *</Label>
                <LocationInput
                  value={formData.location}
                  onChange={(location, coordinates) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      location, 
                      latitude: coordinates?.lat || null,
                      longitude: coordinates?.lng || null
                    }));
                  }}
                  placeholder="Search for an address..."
                />
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-muted-foreground">
                    📍 Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-900 dark:text-white font-medium">Category *</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                  disabled={categoriesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              <div className="space-y-4">
                <Label className="text-gray-900 dark:text-white font-medium">Images</Label>
                
                {/* File Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="image-upload" className="text-sm font-medium text-gray-900 dark:text-white">
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
                      <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Uploaded Images:</Label>
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
                  <Label className="text-sm font-medium text-gray-900 dark:text-white">Or Enter Image URLs</Label>
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

              <div className="space-y-4">
                <Label className="text-gray-900 dark:text-white font-medium">Amenities</Label>
                {amenitiesLoading ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading amenities...</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {amenities?.map((amenity) => (
                      <div key={amenity.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`amenity-${amenity.id}`}
                          checked={formData.amenityIds.includes(amenity.id)}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              amenityIds: checked
                                ? [...prev.amenityIds, amenity.id]
                                : prev.amenityIds.filter(id => id !== amenity.id)
                            }));
                          }}
                        />
                        <Label
                          htmlFor={`amenity-${amenity.id}`}
                          className="text-sm font-normal cursor-pointer text-gray-900 dark:text-white"
                        >
                          {amenity.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Display selected amenities */}
                {formData.amenityIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.amenityIds.map((amenityId) => {
                      const amenity = amenities?.find(a => a.id === amenityId);
                      return amenity ? (
                        <Badge key={amenityId} variant="secondary" className="flex items-center gap-1">
                          {amenity.name}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                amenityIds: prev.amenityIds.filter(id => id !== amenityId)
                              }));
                            }}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Services Section */}
              <div className="space-y-4">
                <Label className="text-lg font-medium text-gray-900 dark:text-white">Services</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add services that customers can select when booking your venue.</p>
                
                {formData.services.map((service, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900 dark:text-white">Service {index + 1}</h4>
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
                        <Label className="text-gray-900 dark:text-white font-medium">Service Name</Label>
                        <Input
                          value={service.name}
                          onChange={(e) => updateService(index, 'name', e.target.value)}
                          placeholder="e.g., Basic Gaming Session"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-900 dark:text-white font-medium">Duration</Label>
                        <Input
                          value={service.duration}
                          onChange={(e) => updateService(index, 'duration', e.target.value)}
                          placeholder="e.g., 2 hours"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-900 dark:text-white font-medium">Price per Guest</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={service.price}
                          onChange={(e) => updateService(index, 'price', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-900 dark:text-white font-medium">Service Discount (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={service.discount_percentage}
                          onChange={(e) => updateService(index, 'discount_percentage', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-900 dark:text-white font-medium">Description (Optional)</Label>
                      <Textarea
                        value={service.description}
                        onChange={(e) => updateService(index, 'description', e.target.value)}
                        placeholder="Describe what's included in this service..."
                        rows={2}
                      />
                    </div>

                    {/* Service Images Section */}
                    <div className="space-y-4">
                      <Label className="text-gray-900 dark:text-white font-medium">Service Images (Optional)</Label>
                      
                      {/* File Upload for Service */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Label htmlFor={`service-image-upload-${index}`} className="text-sm font-medium text-gray-900 dark:text-white">
                            Upload Images
                          </Label>
                          <Input
                            id={`service-image-upload-${index}`}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleServiceImageUpload(index, e)}
                            className="flex-1"
                          />
                        </div>
                        
                        {/* Display uploaded service images preview */}
                        {service.uploadedImages.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Uploaded Images:</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {service.uploadedImages.map((file, imgIndex) => (
                                <div key={imgIndex} className="relative group">
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
                                    onClick={() => removeServiceUploadedImage(index, imgIndex)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* URL Input for Service Images */}
                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-gray-900 dark:text-white">Or Enter Image URLs</Label>
                        {service.images.map((image, imgIndex) => (
                          <div key={imgIndex} className="flex gap-2">
                            <Input
                              value={image}
                              onChange={(e) => updateServiceImage(index, imgIndex, e.target.value)}
                              placeholder="Enter image URL"
                            />
                            {service.images.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeServiceImage(index, imgIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addServiceImageField(index)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Image URL
                        </Button>
                      </div>
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
        </div>
      </div>
    </PartnerLayout>
  );
};

export default AddVenue;