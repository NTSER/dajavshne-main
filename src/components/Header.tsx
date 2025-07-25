
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, X, User, LogOut, Heart, History, Building2, Search, Map } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "./NotificationBell";
import ProfileDialog from "./ProfileDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileDialogTab, setProfileDialogTab] = useState("profile");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMap, setShowMap] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      // Check for exact venue match
      try {
        const { data: venues, error } = await supabase
          .from('venues')
          .select('id, name')
          .ilike('name', searchQuery.trim())
          .limit(1);

        if (!error && venues && venues.length > 0) {
          const exactMatch = venues.find(venue => 
            venue.name.toLowerCase() === searchQuery.toLowerCase().trim()
          );
          
          if (exactMatch) {
            window.open(`/venue/${exactMatch.id}`, '_blank');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking for exact venue match:', error);
      }
      
      // If no exact match, proceed with regular search
      navigate(`/search?businessName=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleMapLocationSelect = (location: string) => {
    setSearchQuery(location);
    setShowMap(false);
  };


  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Dajavshne
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex items-center gap-0 bg-gray-50/80 backdrop-blur-sm rounded-full border border-gray-200 p-1.5 max-w-md mx-auto">
            {/* Map Icon */}
            <div className="px-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMap(true)}
                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full"
              >
                <Map className="h-4 w-4" />
              </Button>
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-gray-300" />

            {/* Search Input */}
            <div className="flex-1 px-3">
              <Input
                placeholder="Search venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="border-0 bg-transparent text-sm placeholder:text-gray-500 focus-visible:ring-0 h-8"
              />
            </div>

            {/* Search Button */}
            <div className="px-1">
              <Button 
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-8 h-8 p-0"
                disabled={!searchQuery.trim()}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Desktop Auth & User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/partner/auth">
              <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <Building2 className="h-4 w-4 mr-2" />
                Partner Portal
              </Button>
            </Link>
            {user ? (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <ProfileDialog 
                        defaultTab={profileDialogTab}
                        open={profileDialogOpen}
                        onOpenChange={(open) => {
                          setProfileDialogOpen(open);
                          if (!open) setProfileDialogTab("profile");
                        }}
                      >
                        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm">
                          <User className="h-4 w-4" />
                          Edit Profile
                        </button>
                      </ProfileDialog>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/booking-history" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Booking History
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favorites" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        My Favorites
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Sign In</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {/* Mobile Search */}
            <div className="mb-4">
              <div className="flex items-center gap-2 bg-gray-50 rounded-full border border-gray-200 p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMap(true)}
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full flex-shrink-0"
                >
                  <Map className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Search venues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="border-0 bg-transparent text-sm placeholder:text-gray-500 focus-visible:ring-0"
                />
                <Button 
                  onClick={handleSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-8 h-8 p-0 flex-shrink-0"
                  disabled={!searchQuery.trim()}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <nav className="flex flex-col space-y-4">
              <Link
                to="/partner/auth"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Partner Portal
              </Link>
              <div className="pt-4 border-t border-gray-200">
                {user ? (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Signed in as {user.email}
                      </span>
                      <NotificationBell />
                    </div>
                    <ProfileDialog 
                      defaultTab={profileDialogTab}
                      open={profileDialogOpen}
                      onOpenChange={(open) => {
                        setProfileDialogOpen(open);
                        if (!open) setProfileDialogTab("profile");
                      }}
                    >
                      <Button variant="ghost" className="justify-start">
                        <User className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </ProfileDialog>
                    <Link to="/booking-history">
                      <Button variant="ghost" className="justify-start w-full">
                        <History className="h-4 w-4 mr-2" />
                        Booking History
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="justify-start"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Link to="/auth" className="w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Sign In</Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Map className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Select Location</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowMap(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Select from these popular locations:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {['Downtown District', 'Tech Park', 'Old Town', 'Gaming District'].map((location) => (
                  <Button
                    key={location}
                    variant="outline"
                    onClick={() => handleMapLocationSelect(location)}
                    className="justify-start h-10"
                  >
                    <Map className="h-4 w-4 mr-2" />
                    {location}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
