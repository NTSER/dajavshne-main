import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at: string | null;
  sender_profile?: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
  receiver_profile?: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

export interface Friend {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  friend_profile?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

// Hook to get user's friends
export const useFriends = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) {
        console.error('Error fetching friends:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Get friend IDs
      const friendIds = data.map(friendship => 
        friendship.user1_id === user.id ? friendship.user2_id : friendship.user1_id
      );

      // Fetch friend profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', friendIds);

      if (profileError) {
        console.error('Error fetching friend profiles:', profileError);
        throw profileError;
      }

      // Transform data to include friend profile
      const friends = data.map(friendship => ({
        ...friendship,
        friend_profile: profiles?.find(p => 
          p.id === (friendship.user1_id === user.id ? friendship.user2_id : friendship.user1_id)
        )
      }));

      return friends as Friend[];
    },
    enabled: !!user,
  });
};

// Hook to get friend requests (sent and received)
export const useFriendRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friend-requests', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching friend requests:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set([
        ...data.map(req => req.sender_id),
        ...data.map(req => req.receiver_id)
      ])];

      // Fetch profiles for all users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        throw profileError;
      }

      // Transform data to include profiles
      const friendRequests = data.map(request => ({
        ...request,
        sender_profile: profiles?.find(p => p.id === request.sender_id),
        receiver_profile: profiles?.find(p => p.id === request.receiver_id)
      }));

      return friendRequests as FriendRequest[];
    },
    enabled: !!user,
  });
};

// Hook to send friend request
export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (receiverEmail: string) => {
      if (!user) throw new Error('User not authenticated');

      // First, find the user by email
      const { data: receiverProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', receiverEmail.trim().toLowerCase())
        .maybeSingle();

      console.log('Looking for user with email:', receiverEmail.trim().toLowerCase());
      console.log('Profile search result:', receiverProfile, profileError);

      if (profileError) {
        console.error('Database error when searching for profile:', profileError);
        throw new Error('Database error occurred while searching for user');
      }

      if (!receiverProfile) {
        throw new Error('User not found with that email address');
      }

      if (receiverProfile.id === user.id) {
        throw new Error('You cannot send a friend request to yourself');
      }

      // Check if they're already friends
      const { data: existingFriendship } = await supabase
        .from('friends')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${receiverProfile.id}),and(user1_id.eq.${receiverProfile.id},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (existingFriendship) {
        throw new Error('You are already friends with this user');
      }

      // Check if there's already a pending request
      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('id, status')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverProfile.id}),and(sender_id.eq.${receiverProfile.id},receiver_id.eq.${user.id})`)
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          throw new Error('Friend request is already pending');
        } else {
          throw new Error('Friend request already exists');
        }
      }

      // Send the friend request
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverProfile.id,
        });

      if (error) {
        console.error('Error sending friend request:', error);
        throw error;
      }

      // Get sender profile for notification
      const { data: senderProfile, error: senderProfileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (senderProfileError) {
        console.error('Error fetching sender profile:', senderProfileError);
      }

      const senderName = senderProfile?.full_name || user.email || 'Someone';

      // Create website notification for the receiver
      await supabase
        .from('notifications')
        .insert({
          user_id: receiverProfile.id,
          booking_id: receiverProfile.id, // Using booking_id to store friend_id for consistency
          type: 'friend_request',
          title: 'Friend Request',
          message: `${senderName} sent you a friend request`,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      toast({
        title: "Friend request sent!",
        description: "Your friend request has been sent successfully.",
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

// Hook to respond to friend request
export const useRespondToFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: 'accepted' | 'declined' }) => {
      const { error } = await supabase
        .from('friend_requests')
        .update({ 
          status,
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error responding to friend request:', error);
        throw error;
      }
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      
      toast({
        title: status === 'accepted' ? "Friend request accepted!" : "Friend request declined",
        description: status === 'accepted' 
          ? "You are now friends!" 
          : "Friend request has been declined.",
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

// Hook to remove friend
export const useRemoveFriend = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      if (!user) throw new Error('User not authenticated');

      // First, get the friendship details to know which users are involved
      const { data: friendship, error: friendshipError } = await supabase
        .from('friends')
        .select('user1_id, user2_id')
        .eq('id', friendshipId)
        .single();

      if (friendshipError) {
        console.error('Error fetching friendship:', friendshipError);
        throw friendshipError;
      }

      const otherUserId = friendship.user1_id === user.id ? friendship.user2_id : friendship.user1_id;

      // Delete the friendship
      const { error: deleteError } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId);

      if (deleteError) {
        console.error('Error removing friend:', deleteError);
        throw deleteError;
      }

      // Clean up any related friend requests between these users
      const { error: requestError } = await supabase
        .from('friend_requests')
        .delete()
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`);

      if (requestError) {
        console.error('Error cleaning up friend requests:', requestError);
        // Don't throw here as the main friendship deletion succeeded
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      toast({
        title: "Friend removed",
        description: "Friend has been removed from your friends list.",
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