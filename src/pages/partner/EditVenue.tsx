import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save, Trash2, Plus, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PartnerLayout from '@/components/PartnerLayout';
import { DiscountManager } from '@/components/DiscountManager';
import { ServiceImageUpload } from '@/components/ServiceImageUpload';

interface VenueService {
  id?: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  images: string[];
  discount_percentage: number;
}

interface VenueData {
  name: string;
  description: string;
  location: string;
  category: string;
  price: number;
  opening_time: string;
  closing_time: string;
  amenities: string[];
  images: string[];
  default_discount_percentage: number;
}

const EditVenue = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<VenueService[]>([]);
  const [venue, setVenue] = useState<VenueData>({
    name: '',
    description: '',
    location: '',
    category: '',
    price: 0,
    opening_time: '',
    closing_time: '',
    amenities: [],
    images: [],
    default_discount_percentage: 0
  });

  useEffect(() => {
    fetchVenue();
  }, [venueId]);

  const fetchVenue = async () => {
    try {
      // Fetch venue data
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .single();

      if (venueError) throw venueError;

      if (venueData) {
        setVenue({
          name: venueData.name || '',
          description: venueData.description || '',
          location: venueData.location || '',
          category: venueData.category || '',
          price: venueData.price || 0,
          opening_time: venueData.opening_time || '',
          closing_time: venueData.closing_time || '',
          amenities: venueData.amenities || [],
          images: venueData.images || [],
          default_discount_percentage: venueData.default_discount_percentage || 0
        });
      }

      // Fetch venue services
      const { data: servicesData, error: servicesError } = await supabase
        .from('venue_services')
        .select('*')
        .eq('venue_id', venueId);

      if (servicesError) throw servicesError;

      setServices(servicesData?.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description || '',
        price: service.price,
        duration: service.duration,
        images: service.images || [],
        discount_percentage: 0 // Services don't have discount_percentage in DB yet
      })) || []);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch venue details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update venue
      const { error: venueError } = await supabase
        .from('venues')
        .update({
          name: venue.name,
          description: venue.description,
          location: venue.location,
          category: venue.category,
          price: venue.price,
          opening_time: venue.opening_time,
          closing_time: venue.closing_time,
          amenities: venue.amenities,
          images: venue.images,
          default_discount_percentage: venue.default_discount_percentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', venueId);

      if (venueError) throw venueError;

      // Update services
      for (const service of services) {
        if (service.id) {
          // Update existing service
          const { error: updateError } = await supabase
            .from('venue_services')
            .update({
              name: service.name,
              description: service.description,
              price: service.price,
              duration: service.duration,
              images: service.images
            })
            .eq('id', service.id);

          if (updateError) throw updateError;
        } else {
          // Create new service
          const { error: insertError } = await supabase
            .from('venue_services')
            .insert({
              venue_id: venueId,
              name: service.name,
              description: service.description,
              price: service.price,
              duration: service.duration,
              images: service.images
            });

          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Success",
        description: "Venue updated successfully",
      });
      
      navigate('/partner/dashboard');
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to update venue",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    setServices([...services, {
      name: '',
      description: '',
      price: 0,
      duration: '',
      images: [],
      discount_percentage: 0
    }]);
  };

  const removeService = (index: number) => {
    const newServices = services.filter((_, i) => i !== index);
    setServices(newServices);
  };

  const updateService = (index: number, field: keyof VenueService, value: any) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    setServices(newServices);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this venue? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', venueId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Venue deleted successfully",
      });
      
      navigate('/partner/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete venue",
        variant: "destructive"
      });
    }
  };

  const categories = [
    "Entertainment",
    "Sports",
    "Conference",
    "Wedding",
    "Corporate",
    "Gaming"
  ];

  const commonAmenities = [
    "WiFi",
    "Parking",
    "Air Conditioning",
    "Sound System",
    "Projector",
    "Catering",
    "Security",
    "Restrooms"
  ];

  if (loading) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading venue...</p>
          </div>
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout>
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between">
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Venue</h1>
                <p className="text-gray-600 dark:text-gray-400">Manage your venue details and settings</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Venue
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto grid gap-6">
          {/* Basic Information */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Venue Name *</Label>
                  <Input
                    id="name"
                    value={venue.name}
                    onChange={(e) => setVenue({...venue, name: e.target.value})}
                    placeholder="Enter venue name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={venue.category} onValueChange={(value) => setVenue({...venue, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={venue.location}
                  onChange={(e) => setVenue({...venue, location: e.target.value})}
                  placeholder="Enter venue location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={venue.description}
                  onChange={(e) => setVenue({...venue, description: e.target.value})}
                  placeholder="Describe your venue..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Operating Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price per Hour ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={venue.price}
                  onChange={(e) => setVenue({...venue, price: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="opening">Opening Time</Label>
                  <Input
                    id="opening"
                    type="time"
                    value={venue.opening_time}
                    onChange={(e) => setVenue({...venue, opening_time: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="closing">Closing Time</Label>
                  <Input
                    id="closing"
                    type="time"
                    value={venue.closing_time}
                    onChange={(e) => setVenue({...venue, closing_time: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-2">
                {commonAmenities.map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={venue.amenities.includes(amenity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setVenue({...venue, amenities: [...venue.amenities, amenity]});
                        } else {
                          setVenue({...venue, amenities: venue.amenities.filter(a => a !== amenity)});
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{amenity}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Services Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Services</CardTitle>
                <Button onClick={addService} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {services.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No services added yet. Click "Add Service" to create your first service.</p>
                </div>
              ) : (
                services.map((service, index) => (
                  <Card key={index} className="border-dashed">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Service {index + 1}</h4>
                        <Button
                          onClick={() => removeService(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Service Name *</Label>
                          <Input
                            value={service.name}
                            onChange={(e) => updateService(index, 'name', e.target.value)}
                            placeholder="e.g., VIP Gaming Package"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duration *</Label>
                          <Input
                            value={service.duration}
                            onChange={(e) => updateService(index, 'duration', e.target.value)}
                            placeholder="e.g., 2 hours"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={service.description}
                          onChange={(e) => updateService(index, 'description', e.target.value)}
                          placeholder="Describe what this service includes..."
                          rows={3}
                        />
                      </div>
                      
                      {/* Service Images */}
                      <ServiceImageUpload
                        images={service.images}
                        onImagesChange={(images) => updateService(index, 'images', images)}
                        serviceIndex={index}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Price per Guest ($) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={service.price}
                            onChange={(e) => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Service Discount (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={service.discount_percentage}
                            onChange={(e) => updateService(index, 'discount_percentage', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Image management will be enhanced in a future update. Currently showing: {venue.images.length} image(s)
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Discounts */}
          <div>
            <DiscountManager
              venueId={venueId!}
              defaultDiscount={venue.default_discount_percentage}
              onDefaultDiscountChange={(value) => setVenue({...venue, default_discount_percentage: value})}
            />
          </div>
        </div>
      </div>
    </PartnerLayout>
  );
};

export default EditVenue;