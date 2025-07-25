
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Heart, History, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };


  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Dajavshne
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              to="/search"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Browse Venues
            </Link>
            <Link
              to="/categories"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Categories
            </Link>
          </nav>

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
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/search"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Browse Venues
              </Link>
              <Link
                to="/categories"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </Link>
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
    </header>
  );
};

export default Header;
