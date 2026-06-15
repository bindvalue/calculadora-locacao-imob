import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CorretorWithRating } from '@/hooks/useCorretores';

export interface Review {
  id: string;
  corretor_id: string;
  rating: number;
  client_name: string;
  comment: string | null;
  review_token: string;
  used: boolean;
  expires_at: string;
  created_at: string;
}

export interface ReviewInput {
  corretor_id: string;
  rating: number;
  client_name: string;
  comment?: string | null;
  review_token: string;
  expires_at: string;
}

export interface ReviewWithCorretor extends Review {
  corretores: CorretorWithRating;
}

export const useReviews = (corretorId?: string) => {
  return useQuery({
    queryKey: ['reviews', corretorId],
    queryFn: async () => {
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
      
      if (corretorId) {
        query = query.eq('corretor_id', corretorId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Review[];
    }
  });
};

export const useReviewByToken = (token: string) => {
  return useQuery<ReviewWithCorretor | null>({
    queryKey: ['review-token', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, corretores(*)')
        .eq('review_token', token)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      if (error) throw error;
      return data as ReviewWithCorretor | null;
    },
    enabled: !!token
  });
};

export const useCreateReviewToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (corretorId: string) => {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity
      
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          corretor_id: corretorId,
          rating: 5, // Default, will be updated by client
          client_name: 'Pendente',
          review_token: token,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return { token, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    }
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      token, 
      rating, 
      client_name, 
      comment 
    }: { 
      token: string; 
      rating: number; 
      client_name: string; 
      comment?: string;
    }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          rating,
          client_name,
          comment,
          used: true
        })
        .eq('review_token', token)
        .eq('used', false)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['corretores'] });
    }
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    }
  });
};
