import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { usePartnerAuth } from '@/hooks/usePartnerAuth';
import { usePartnerVenues } from '@/hooks/usePartnerVenues';
import { Plus, Building2, Settings, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PartnerDashboard = () => {
  const { profile, signOut } = usePartnerAuth();
  const { data: venues, isLoading } = usePartnerVenues();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/partner/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Partner Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {profile?.full_name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary">Partner</Badge>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Venues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{venues?.length || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Venues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{venues?.length || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>

          {/* Venues Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Venues</CardTitle>
              <Button onClick={() => navigate('/partner/venues/add')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Venue
              </Button>
            </CardHeader>
            <CardContent>
              {venues && venues.length > 0 ? (
                <div className="grid gap-4">
                  {venues.map((venue) => (
                    <div
                      key={venue.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{venue.name}</h3>
                          <p className="text-sm text-muted-foreground">{venue.location}</p>
                          <Badge variant="outline" className="mt-1">
                            {venue.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/partner/venues/${venue.id}/edit`)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No venues yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by adding your first venue to begin accepting bookings.
                  </p>
                  <Button onClick={() => navigate('/partner/venues/add')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Venue
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PartnerDashboard;