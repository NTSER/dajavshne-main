import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Game {
  id: string;
  name: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface VenueGame {
  id: string;
  venue_id: string;
  game_id: string;
  created_at: string;
  game?: Game;
}

// Hook to fetch all available games
export const useGames = () => {
  return useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Game[];
    },
  });
};

// Hook to fetch games for a specific venue
export const useVenueGames = (venueId: string) => {
  return useQuery({
    queryKey: ["venue-games", venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venue_games")
        .select(`
          *,
          game:games(*)
        `)
        .eq("venue_id", venueId);
      
      if (error) throw error;
      return data as VenueGame[];
    },
    enabled: !!venueId,
  });
};

// Hook to manage venue games (add/remove)
export const useVenueGamesMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addVenueGame = useMutation({
    mutationFn: async ({ venueId, gameId }: { venueId: string; gameId: string }) => {
      const { error } = await supabase
        .from("venue_games")
        .insert({ venue_id: venueId, game_id: gameId });
      
      if (error) throw error;
    },
    onSuccess: (_, { venueId }) => {
      queryClient.invalidateQueries({ queryKey: ["venue-games", venueId] });
      toast({
        title: "Success",
        description: "Game added to venue successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add game to venue",
        variant: "destructive",
      });
      console.error("Error adding venue game:", error);
    },
  });

  const removeVenueGame = useMutation({
    mutationFn: async ({ venueId, gameId }: { venueId: string; gameId: string }) => {
      const { error } = await supabase
        .from("venue_games")
        .delete()
        .eq("venue_id", venueId)
        .eq("game_id", gameId);
      
      if (error) throw error;
    },
    onSuccess: (_, { venueId }) => {
      queryClient.invalidateQueries({ queryKey: ["venue-games", venueId] });
      toast({
        title: "Success",
        description: "Game removed from venue successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove game from venue",
        variant: "destructive",
      });
      console.error("Error removing venue game:", error);
    },
  });

  const updateVenueGames = useMutation({
    mutationFn: async ({ venueId, gameIds }: { venueId: string; gameIds: string[] }) => {
      // First, remove all existing venue games
      const { error: deleteError } = await supabase
        .from("venue_games")
        .delete()
        .eq("venue_id", venueId);
      
      if (deleteError) throw deleteError;

      // Then, add the new games
      if (gameIds.length > 0) {
        const venueGames = gameIds.map(gameId => ({
          venue_id: venueId,
          game_id: gameId,
        }));

        const { error: insertError } = await supabase
          .from("venue_games")
          .insert(venueGames);
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, { venueId }) => {
      queryClient.invalidateQueries({ queryKey: ["venue-games", venueId] });
      toast({
        title: "Success",
        description: "Venue games updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update venue games",
        variant: "destructive",
      });
      console.error("Error updating venue games:", error);
    },
  });

  return {
    addVenueGame,
    removeVenueGame,
    updateVenueGames,
  };
};

// Hook for admin game management
export const useGameManagement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createGame = useMutation({
    mutationFn: async (game: Omit<Game, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase
        .from("games")
        .insert(game);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      toast({
        title: "Success",
        description: "Game created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create game",
        variant: "destructive",
      });
      console.error("Error creating game:", error);
    },
  });

  const updateGame = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Game> & { id: string }) => {
      const { error } = await supabase
        .from("games")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      toast({
        title: "Success",
        description: "Game updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update game",
        variant: "destructive",
      });
      console.error("Error updating game:", error);
    },
  });

  const deleteGame = useMutation({
    mutationFn: async (gameId: string) => {
      const { error } = await supabase
        .from("games")
        .delete()
        .eq("id", gameId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      toast({
        title: "Success",
        description: "Game deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete game",
        variant: "destructive",
      });
      console.error("Error deleting game:", error);
    },
  });

  return {
    createGame,
    updateGame,
    deleteGame,
  };
};