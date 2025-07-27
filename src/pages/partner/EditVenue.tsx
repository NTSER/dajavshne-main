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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGames } from '@/hooks/useGames';

import { ArrowLeft, Save, Trash2, Plus, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PartnerLayout from '@/components/PartnerLayout';

import VenueImageUpload from '@/components/VenueImageUpload';
import { ServiceImageUpload } from '@/components/ServiceImageUpload';

type ServiceType = 'PC Gaming' | 'PlayStation 5' | 'Billiards' | 'Table Tennis';

interface VenueService {
  id?: string;
  service_type: ServiceType;
  price: number;
  images: string[];
  discount_percentage: number;
  service_games?: string[];
}

interface VenueData {
  name: string;
  location: string;
  opening_time: string;
  closing_time: string;
  images: string[];
}

const EditVenue = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: allGames = [] } = useGames();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<VenueService[]>([]);
  const [venue, setVenue] = useState<VenueData>({
    name: '',
    location: '',
    opening_time: '',
    closing_time: '',
    images: []
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
          location: venueData.location || '',
          opening_time: venueData.opening_time || '',
          closing_time: venueData.closing_time || '',
          images: venueData.images || []
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
        service_type: service.service_type || 'PC Gaming',
        price: service.price,
        images: service.images || [],
        discount_percentage: 0, // Services don't have discount_percentage in DB yet
        service_games: service.service_games || [] // Load service games from database
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
          location: venue.location,
          opening_time: venue.opening_time,
          closing_time: venue.closing_time,
          images: venue.images,
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
              name: service.service_type, // Use service_type as name for now
              service_type: service.service_type,
              price: service.price,
              images: service.images,
              service_games: service.service_games || []
            })
            .eq('id', service.id);

          if (updateError) throw updateError;
        } else {
          // Create new service
          const { error: insertError } = await supabase
            .from('venue_services')
            .insert({
              venue_id: venueId,
              name: service.service_type, // Use service_type as name for now
              service_type: service.service_type,
              price: service.price,
              images: service.images,
              service_games: service.service_games || []
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
      service_type: 'PC Gaming',
      price: 0,
      images: [],
      discount_percentage: 0,
      service_games: []
    }]);
  };

  const removeService = (index: number) => {
    const newServices = services.filter((_, i) => i !== index);
    setServices(newServices);
  };

  const updateService = (index: number, field: keyof VenueService, value: any) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    
    // Reset service_games when service_type changes
    if (field === 'service_type') {
      newServices[index].service_games = [];
    }
    
    setServices(newServices);
  };

  const toggleServiceGame = (serviceIndex: number, game: string) => {
    const newServices = [...services];
    const currentGames = newServices[serviceIndex].service_games || [];
    
    if (currentGames.includes(game)) {
      newServices[serviceIndex].service_games = currentGames.filter(g => g !== game);
    } else {
      newServices[serviceIndex].service_games = [...currentGames, game];
    }
    
    setServices(newServices);
  };

  // Filter games by category for the dropdown
  const getGamesForServiceType = (serviceType: ServiceType) => {
    return allGames.filter(game => game.category === serviceType);
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
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={venue.location}
                  onChange={(e) => setVenue({...venue, location: e.target.value})}
                  placeholder="Enter venue location"
                />
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Operating Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="opening">Opening Time *</Label>
                  <Select 
                    value={venue.opening_time} 
                    onValueChange={(value) => setVenue({...venue, opening_time: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select opening time" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="closing">Closing Time *</Label>
                  <Select 
                    value={venue.closing_time} 
                    onValueChange={(value) => setVenue({...venue, closing_time: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select closing time" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Venue Images */}
          <Card>
            <CardHeader>
              <CardTitle>Venue Images</CardTitle>
            </CardHeader>
            <CardContent>
              <VenueImageUpload
                images={venue.images}
                onImagesChange={(images) => setVenue({...venue, images})}
                venueId={venueId!}
              />
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
                      <div className="space-y-2">
                        <Label>Service Type *</Label>
                        <Select 
                          value={service.service_type} 
                          onValueChange={(value: ServiceType) => updateService(index, 'service_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select service type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PC Gaming">PC Gaming</SelectItem>
                            <SelectItem value="PlayStation 5">PlayStation 5</SelectItem>
                            <SelectItem value="Billiards">Billiards</SelectItem>
                            <SelectItem value="Table Tennis">Table Tennis</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Service Games - Show only for specific service types */}
                      {(service.service_type === 'PC Gaming' || 
                        service.service_type === 'PlayStation 5' || 
                        service.service_type === 'Billiards') && (
                        <div className="space-y-2">
                          <Label>Service Games</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                              >
                                {service.service_games?.length ? 
                                  `${service.service_games.length} game(s) selected` : 
                                  "Select games"
                                }
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search games..." />
                                <CommandEmpty>No games found.</CommandEmpty>
                                <CommandGroup>
                                  <CommandList>
                                    {getGamesForServiceType(service.service_type).map((game) => (
                                      <CommandItem
                                        key={game.id}
                                        onSelect={() => toggleServiceGame(index, game.name)}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            service.service_games?.includes(game.name)
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {game.name}
                                      </CommandItem>
                                    ))}
                                  </CommandList>
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          
                          {/* Display selected games as badges */}
                          {service.service_games && service.service_games.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {service.service_games.map((game) => (
                                <Badge
                                  key={game}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {game}
                                  <button
                                    onClick={() => toggleServiceGame(index, game)}
                                    className="ml-1 text-xs hover:text-red-500"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
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


        </div>
      </div>
    </PartnerLayout>
  );
};

export default EditVenue;