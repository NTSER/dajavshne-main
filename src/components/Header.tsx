
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, User, LogOut, Heart, History, Home, Sparkles, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthDialog from "./AuthDialog";
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-primary">
            Dajavshne
          </Link>

          {/* Main Navigation - Airbnb Style */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors group"
            >
              <Home className="h-5 w-5" />
              <span>Venues</span>
            </Link>
            <Link
              to="/experiences"
              className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors group relative"
            >
              <Sparkles className="h-5 w-5" />
              <span>Experiences</span>
              <Badge variant="secondary" className="ml-1 text-xs px-2 py-0 bg-destructive text-destructive-foreground">
                NEW
              </Badge>
            </Link>
            <Link
              to="/services"
              className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors group relative"
            >
              <Bell className="h-5 w-5" />
              <span>Services</span>
              <Badge variant="secondary" className="ml-1 text-xs px-2 py-0 bg-destructive text-destructive-foreground">
                NEW
              </Badge>
            </Link>
          </nav>

          {/* Desktop Auth & User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
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
              <AuthDialog>
                <Button>Sign In</Button>
              </AuthDialog>
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
                className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="h-5 w-5" />
                <span>Venues</span>
              </Link>
              <Link
                to="/experiences"
                className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Sparkles className="h-5 w-5" />
                <span>Experiences</span>
                <Badge variant="secondary" className="ml-1 text-xs px-2 py-0 bg-destructive text-destructive-foreground">
                  NEW
                </Badge>
              </Link>
              <Link
                to="/services"
                className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Bell className="h-5 w-5" />
                <span>Services</span>
                <Badge variant="secondary" className="ml-1 text-xs px-2 py-0 bg-destructive text-destructive-foreground">
                  NEW
                </Badge>
              </Link>
              <div className="pt-4 border-t border-border">
                {user ? (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
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
                  <AuthDialog>
                    <Button className="w-full">Sign In</Button>
                  </AuthDialog>
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
