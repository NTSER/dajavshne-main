import React, { useState } from 'react';
import { useAdminVenues, useToggleVenueVisibility } from '@/hooks/useAdminVenues';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  Edit, 
  MoreHorizontal,
  Star,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

const VenueManagement: React.FC = () => {
  const { data: venues, isLoading } = useAdminVenues();
  const toggleVisibility = useToggleVenueVisibility();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredVenues = venues?.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'visible' && venue.is_visible) ||
                         (statusFilter === 'hidden' && !venue.is_visible) ||
                         (statusFilter === 'approved' && venue.approval_status === 'approved') ||
                         (statusFilter === 'pending' && venue.approval_status === 'pending') ||
                         (statusFilter === 'rejected' && venue.approval_status === 'rejected');
    
    return matchesSearch && matchesStatus;
  });

  const handleToggleVisibility = (venueId: string, currentVisibility: boolean) => {
    toggleVisibility.mutate({ venueId, isVisible: !currentVisibility });
  };

  const getStatusBadge = (venue: any) => {
    if (venue.approval_status === 'pending') {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-400">Pending</Badge>;
    }
    if (venue.approval_status === 'rejected') {
      return <Badge variant="outline" className="border-red-500 text-red-400">Rejected</Badge>;
    }
    if (venue.is_visible) {
      return <Badge variant="outline" className="border-green-500 text-green-400">Live</Badge>;
    }
    return <Badge variant="outline" className="border-gray-500 text-gray-400">Hidden</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Venue Management</h1>
          <p className="text-gray-400">Manage all venues on your platform</p>
        </div>
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
          {venues?.length || 0} Total Venues
        </Badge>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search venues by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Venues Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Venue Name</TableHead>
                <TableHead className="text-gray-300">Location</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Bookings</TableHead>
                <TableHead className="text-gray-300">Rating</TableHead>
                <TableHead className="text-gray-300">Visible</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVenues?.map((venue) => (
                <TableRow key={venue.id} className="border-gray-700">
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-white">{venue.name}</p>
                      <p className="text-sm text-gray-400">${venue.price}</p>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-gray-300">
                    {venue.location}
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(venue)}
                  </TableCell>
                  
                  <TableCell className="text-gray-300">
                    0 {/* This would come from booking analytics */}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1 text-gray-300">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span>{venue.rating?.toFixed(1) || 'N/A'}</span>
                      <span className="text-gray-500">({venue.review_count || 0})</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Switch
                      checked={venue.is_visible}
                      onCheckedChange={() => handleToggleVisibility(venue.id, venue.is_visible)}
                      disabled={venue.approval_status !== 'approved' || toggleVisibility.isPending}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        {venue.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {!filteredVenues?.length && (
            <div className="text-center py-12">
              <p className="text-gray-400">No venues found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VenueManagement;