import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Lobby {
  id: string;
  creator_id: string;
  name: string;
  venue_id: string | null;
  created_at: string;
  updated_at: string;
  members?: LobbyMember[];
  member_count?: number;
}

export interface LobbyMember {
  id: string;
  lobby_id: string;
  user_id: string;
  status: 'invited' | 'accepted' | 'declined';
  invited_at: string;
  responded_at: string | null;
  profile?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

// Hook to get user's lobbies (created and invited to)
export const useLobbies = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lobbies', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get lobbies where user is creator
      const { data: createdLobbies, error: createdError } = await supabase
        .from('lobbies')
        .select('*')
        .eq('creator_id', user.id)
        .order('updated_at', { ascending: false });

      if (createdError) {
        console.error('Error fetching created lobbies:', createdError);
        throw createdError;
      }

      // Get lobby IDs where user is a member
      const { data: membershipData, error: memberError } = await supabase
        .from('lobby_members')
        .select('lobby_id')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Error fetching member data:', memberError);
        throw memberError;
      }

      let memberLobbies: any[] = [];
      if (membershipData && membershipData.length > 0) {
        const lobbyIds = membershipData.map(m => m.lobby_id);
        
        // Get lobby details for member lobbies
        const { data: lobbyDetails, error: lobbyDetailsError } = await supabase
          .from('lobbies')
          .select('*')
          .in('id', lobbyIds)
          .order('updated_at', { ascending: false });

        if (lobbyDetailsError) {
          console.error('Error fetching lobby details:', lobbyDetailsError);
          throw lobbyDetailsError;
        }

        memberLobbies = lobbyDetails || [];
      }

      // Combine and deduplicate lobbies
      const allLobbies = [
        ...(createdLobbies || []),
        ...memberLobbies
      ];

      // Remove duplicates based on ID
      const uniqueLobbies = allLobbies.filter((lobby, index, arr) => 
        arr.findIndex(l => l.id === lobby.id) === index
      );

      const data = uniqueLobbies.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      if (!data || data.length === 0) {
        return [];
      }

      // Get member counts for each lobby
      const lobbyIds = data.map(lobby => lobby.id);
      const { data: memberCounts, error: memberCountError } = await supabase
        .from('lobby_members')
        .select('lobby_id, status')
        .in('lobby_id', lobbyIds);

      if (memberCountError) {
        console.error('Error fetching member counts:', memberCountError);
        throw memberCountError;
      }

      // Transform data to include member counts
      const lobbies = data.map(lobby => ({
        ...lobby,
        member_count: memberCounts?.filter(m => 
          m.lobby_id === lobby.id && m.status === 'accepted'
        ).length || 0
      }));

      return lobbies as Lobby[];
    },
    enabled: !!user,
  });
};

// Hook to get lobby details with members
export const useLobbyDetails = (lobbyId: string) => {
  return useQuery({
    queryKey: ['lobby-details', lobbyId],
    queryFn: async () => {
      if (!lobbyId) throw new Error('Lobby ID required');

      // Get lobby info
      const { data: lobby, error: lobbyError } = await supabase
        .from('lobbies')
        .select('*')
        .eq('id', lobbyId)
        .single();

      if (lobbyError) {
        console.error('Error fetching lobby:', lobbyError);
        throw lobbyError;
      }

      // Get lobby members
      const { data: members, error: membersError } = await supabase
        .from('lobby_members')
        .select('*')
        .eq('lobby_id', lobbyId)
        .order('invited_at', { ascending: true });

      if (membersError) {
        console.error('Error fetching lobby members:', membersError);
        throw membersError;
      }

      if (!members || members.length === 0) {
        return { ...lobby, members: [] };
      }

      // Get member profiles
      const userIds = members.map(m => m.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      if (profileError) {
        console.error('Error fetching member profiles:', profileError);
        throw profileError;
      }

      // Transform members to include profiles
      const membersWithProfiles = members.map(member => ({
        ...member,
        profile: profiles?.find(p => p.id === member.user_id)
      }));

      return {
        ...lobby,
        members: membersWithProfiles
      } as Lobby;
    },
    enabled: !!lobbyId,
  });
};

// Hook to create lobby
export const useCreateLobby = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, venueId }: { name: string; venueId?: string }) => {
      if (!user) throw new Error('User not authenticated');

      console.log('Creating lobby with:', { name: name.trim(), venueId, creator_id: user.id });

      const { data, error } = await supabase
        .from('lobbies')
        .insert({
          creator_id: user.id,
          name: name.trim(),
          venue_id: venueId || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating lobby:', error);
        throw error;
      }

      console.log('Lobby created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lobbies'] });
      toast({
        title: "Lobby created!",
        description: "Your lobby has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to invite friends to lobby
export const useInviteToLobby = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ lobbyId, friendIds }: { lobbyId: string; friendIds: string[] }) => {
      const invitations = friendIds.map(friendId => ({
        lobby_id: lobbyId,
        user_id: friendId,
      }));

      // Insert lobby invitations
      const { error } = await supabase
        .from('lobby_members')
        .insert(invitations);

      if (error) {
        console.error('Error inviting to lobby:', error);
        throw error;
      }

      // Get lobby details for notifications
      const { data: lobby, error: lobbyError } = await supabase
        .from('lobbies')
        .select('name')
        .eq('id', lobbyId)
        .single();

      if (lobbyError) {
        console.error('Error fetching lobby details:', lobbyError);
        throw lobbyError;
      }

      // Get user profile for sender name
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      const senderName = profile?.full_name || user?.email || 'Someone';

      // Create website notifications
      const notifications = friendIds.map(friendId => ({
        user_id: friendId,
        booking_id: lobbyId, // Using booking_id to store lobby_id for consistency
        type: 'lobby_invitation',
        title: 'Lobby Invitation',
        message: `${senderName} invited you to join "${lobby?.name}" lobby`,
      }));

      await supabase
        .from('notifications')
        .insert(notifications);

      // Send email notifications
      try {
        await supabase.functions.invoke('lobby-invite-email', {
          body: {
            lobbyId,
            invitedUserIds: friendIds,
            inviterName: senderName,
            lobbyName: lobby?.name || 'Gaming Lobby'
          }
        });
      } catch (emailError) {
        console.error('Error sending invitation emails:', emailError);
        // Don't throw here as the main invitation was successful
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lobby-details'] });
      queryClient.invalidateQueries({ queryKey: ['lobbies'] });
      toast({
        title: "Invitations sent!",
        description: "Your friends have been invited to the lobby and will receive email notifications.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to respond to lobby invitation
export const useRespondToLobbyInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      lobbyId, 
      status 
    }: { 
      lobbyId: string; 
      status: 'accepted' | 'declined' 
    }) => {
      const { error } = await supabase
        .from('lobby_members')
        .update({ 
          status,
          responded_at: new Date().toISOString(),
        })
        .eq('lobby_id', lobbyId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        console.error('Error responding to lobby invitation:', error);
        throw error;
      }
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['lobby-details'] });
      queryClient.invalidateQueries({ queryKey: ['lobbies'] });
      
      toast({
        title: status === 'accepted' ? "Invitation accepted!" : "Invitation declined",
        description: status === 'accepted' 
          ? "You've joined the lobby!" 
          : "Invitation has been declined.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to remove member from lobby
export const useRemoveFromLobby = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lobbyId, userId }: { lobbyId: string; userId: string }) => {
      const { error } = await supabase
        .from('lobby_members')
        .delete()
        .eq('lobby_id', lobbyId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing from lobby:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lobby-details'] });
      queryClient.invalidateQueries({ queryKey: ['lobbies'] });
      toast({
        title: "Member removed",
        description: "Member has been removed from the lobby.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to delete lobby
export const useDeleteLobby = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lobbyId: string) => {
      const { error } = await supabase
        .from('lobbies')
        .delete()
        .eq('id', lobbyId);

      if (error) {
        console.error('Error deleting lobby:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lobbies'] });
      queryClient.invalidateQueries({ queryKey: ['lobby-details'] });
      toast({
        title: "Lobby deleted",
        description: "The lobby has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to get current active lobby for user
export const useActiveLobby = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-lobby', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get the most recent lobby where user is creator
      const { data: createdLobbies, error: createdError } = await supabase
        .from('lobbies')
        .select('*')
        .eq('creator_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (createdError) {
        console.error('Error fetching created lobbies:', createdError);
        return null;
      }

      // Get the most recent lobby where user is an accepted member
      const { data: membershipData, error: memberError } = await supabase
        .from('lobby_members')
        .select('lobby_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .order('responded_at', { ascending: false })
        .limit(1);

      if (memberError) {
        console.error('Error fetching member data:', memberError);
        return null;
      }

      let joinedLobby = null;
      if (membershipData && membershipData.length > 0) {
        const { data: lobbyData, error: lobbyError } = await supabase
          .from('lobbies')
          .select('*')
          .eq('id', membershipData[0].lobby_id)
          .single();

        if (!lobbyError && lobbyData) {
          joinedLobby = lobbyData;
        }
      }

      // Return the most recent lobby (either created or joined)
      const createdLobby = createdLobbies?.[0];

      if (!createdLobby && !joinedLobby) return null;
      if (!createdLobby) return joinedLobby;
      if (!joinedLobby) return createdLobby;

      // Return the more recently updated one
      return new Date(createdLobby.updated_at) > new Date(joinedLobby.updated_at) 
        ? createdLobby 
        : joinedLobby;
    },
    enabled: !!user,
  });
};