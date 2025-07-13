
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Menu, X, Search, Bell, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthDialog from "@/components/AuthDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  const handleAuthClick = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthDialogOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <>
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10"
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Enhanced Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.05 }}
                className="relative w-12 h-12 bg-gradient-to-br from-primary via-secondary to-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30"
              >
                <span className="text-white font-bold text-xl">D</span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold gradient-text">
                  Dajavshne
                </span>
                <span className="text-xs text-muted-foreground -mt-1">
                  Gaming Hub
                </span>
              </div>
            </Link>

            {/* Enhanced Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              <Link 
                to="/" 
                className={`nav-link ${isActivePath('/') ? 'active' : ''}`}
              >
                Home
              </Link>
              <Link 
                to="/search" 
                className={`nav-link ${isActivePath('/search') ? 'active' : ''}`}
              >
                Browse Venues
              </Link>
              <Link 
                to="/categories" 
                className={`nav-link ${isActivePath('/categories') ? 'active' : ''}`}
              >
                Categories
              </Link>
              <Link 
                to="/about" 
                className={`nav-link ${isActivePath('/about') ? 'active' : ''}`}
              >
                About
              </Link>
              
              {/* Search Button */}
              <Button variant="ghost" size="icon-sm" className="ml-4">
                <Search className="w-4 h-4" />
              </Button>
            </nav>

            {/* Enhanced Auth Section */}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  {/* User Actions */}
                  <div className="hidden md:flex items-center space-x-2">
                    <Button variant="ghost" size="icon-sm">
                      <Bell className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* User Profile */}
                  <div className="flex items-center space-x-3 bg-muted/30 rounded-xl px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="hidden md:block">
                        <span className="text-sm font-medium text-foreground">
                          {user.email?.split('@')[0]}
                        </span>
                        <p className="text-xs text-muted-foreground">Premium</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="text-xs"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    onClick={() => handleAuthClick('signin')}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleAuthClick('signup')}
                    className="pulse-glow"
                  >
                    Join Now
                  </Button>
                </div>
              )}

              {/* Enhanced Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isMobileMenuOpen ? 'close' : 'menu'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </motion.div>
                </AnimatePresence>
              </Button>
            </div>
          </div>

          {/* Enhanced Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden border-t border-white/10 bg-gaming-mesh"
              >
                <nav className="flex flex-col space-y-2 py-6">
                  <Link 
                    to="/" 
                    className={`nav-link ${isActivePath('/') ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    to="/search" 
                    className={`nav-link ${isActivePath('/search') ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Browse Venues
                  </Link>
                  <Link 
                    to="/categories" 
                    className={`nav-link ${isActivePath('/categories') ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Categories
                  </Link>
                  <Link 
                    to="/about" 
                    className={`nav-link ${isActivePath('/about') ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                  
                  {!user && (
                    <div className="flex flex-col space-y-3 pt-6 border-t border-white/10">
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleAuthClick('signin');
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full"
                      >
                        Sign In
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => {
                          handleAuthClick('signup');
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full"
                      >
                        Join Now
                      </Button>
                    </div>
                  )}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      <AuthDialog
        open={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
        defaultMode={authMode}
      />
    </>
  );
};

export default Header;
