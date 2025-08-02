import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCreateVenue } from '@/hooks/usePartnerVenues';
import { useGames } from '@/hooks/useGames';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, X, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import PartnerLayout from '@/components/PartnerLayout';
import VenueImageUpload from '@/components/VenueImageUpload';
import { ServiceImageUpload } from '@/components/ServiceImageUpload';
import { GuestPricingRules, GuestPricingRule } from '@/components/GuestPricingRules';

type ServiceType = 'PC Gaming' | 'PlayStation 5' | 'Billiards' | 'Table Tennis';

interface VenueService {
  service_type: ServiceType;
  price: number;
  images: string[];
  discount_percentage: number;
  service_games: string[];
  guest_pricing_rules: Array<{ maxGuests: number; price: number }>;
}

interface VenueData {
  name: string;
  location: string;
  opening_time: string;
  closing_time: string;
  images: string[];
}

const AddVenue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: allGames = [] } = useGames();
  
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<VenueService[]>([{
    service_type: 'PC Gaming',
    price: 0,
    images: [],
    discount_percentage: 0,
    service_games: [],
    guest_pricing_rules: []
  }]);
  const [venue, setVenue] = useState<VenueData>({
    name: '',
    location: '',
    opening_time: '',
    closing_time: '',
    images: []
  });

  const createVenue = useCreateVenue();

  const handleSave = async () => {
    if (!venue.name || !venue.location || !venue.opening_time || !venue.closing_time) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields including working hours.",
        variant: "destructive",
      });
      return;
    }

    // Validate services - at least one required
    const validServices = services.filter(service => 
      service.service_type && service.price > 0
    );

    if (validServices.length === 0) {
      toast({
        title: "Service required",
        description: "Please add at least one service with service type and price.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const venueData = await createVenue.mutateAsync({
        name: venue.name,
        location: venue.location,
        images: venue.images,
        openingTime: venue.opening_time,
        closingTime: venue.closing_time,
      });

      // Create services if any are provided
      if (validServices.length > 0) {
        for (const service of validServices) {
          await supabase.from('venue_services').insert({
            venue_id: venueData.id,
            name: service.service_type, // Use service_type as name for consistency
            service_type: service.service_type,
            price: service.price,
            images: service.images,
            service_games: service.service_games || [],
            guest_pricing_rules: service.guest_pricing_rules || []
          });
        }
      }

      toast({
        title: "Success",
        description: "Venue created successfully",
      });
      
      navigate('/partner/dashboard');
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to create venue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addService = () => {
    setServices([...services, {
      service_type: 'PC Gaming',
      price: 0,
      images: [],
      discount_percentage: 0,
      service_games: [],
      guest_pricing_rules: []
    }]);
  };

  const removeService = (index: number) => {
    const newServices = services.filter((_, i) => i !== index);
    setServices(newServices);
  };

  const updateService = (index: number, field: keyof VenueService, value: any) => {
    const newServices = [...services];
    newServices[index] = { 
      ...newServices[index], 
      [field]: value,
      // Reset service_games when service_type changes
      ...(field === 'service_type' ? { service_games: [] } : {})
    };
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Venue</h1>
                <p className="text-gray-600 dark:text-gray-400">Create a new venue listing for your business</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Creating...' : 'Create Venue'}
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
                venueId="new"
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
                      
                      {/* Guest Count Pricing Rules */}
                      <GuestPricingRules
                        rules={service.guest_pricing_rules}
                        onRulesChange={(rules) => updateService(index, 'guest_pricing_rules', rules)}
                      />
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

export default AddVenue;