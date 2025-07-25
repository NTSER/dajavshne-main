import { useAuth } from './useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'customer' | 'partner' | 'admin';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useAdminAuth = () => {
  const { user, session, loading: authLoading, signOut } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['admin-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('Fetching profile for user:', user.id, user.email);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
      
      console.log('Profile data:', data);
      return data as AdminProfile;
    },
    enabled: !!user?.id,
  });

  const isAdmin = profile?.role === 'admin';
  const loading = authLoading || profileLoading;
  
  console.log('Admin auth state:', { user: user?.email, profile: profile?.role, isAdmin, loading });

  return {
    user,
    session,
    profile,
    loading,
    isAdmin,
    signOut,
  };
};