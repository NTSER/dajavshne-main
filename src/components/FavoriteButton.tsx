
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsFavorite, useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface FavoriteButtonProps {
  venueId: string;
  size?: "sm" | "default" | "lg";
}

const FavoriteButton = ({ venueId, size = "default" }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const { data: isFavorite = false } = useIsFavorite(venueId);
  const toggleFavorite = useToggleFavorite();
  const { toast } = useToast();

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add venues to your favorites.",
        variant: "destructive",
      });
      return;
    }

    toggleFavorite.mutate(
      { venueId, isFavorite },
      {
        onSuccess: () => {
          toast({
            title: isFavorite ? "Removed from favorites" : "Added to favorites",
            description: isFavorite 
              ? "Venue removed from your favorites list." 
              : "Venue added to your favorites list.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update favorites. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Button
      variant="ghost"
      size={size === "sm" ? "sm" : "icon"}
      onClick={handleToggleFavorite}
      disabled={toggleFavorite.isPending}
      className={`${isFavorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"}`}
    >
      <Heart 
        className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} 
      />
    </Button>
  );
};

export default FavoriteButton;
