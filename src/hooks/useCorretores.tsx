import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Corretor {
  id: string;
  name: string;
  photo_url: string | null;
  highlight: string | null;
  formation: string | null;
  experience: string | null;
  expertise_tags: string[];
  category: string;
  status: string | null;
  whatsapp: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CorretorWithRating extends Corretor {
  averageRating: number;
  reviewCount: number;
}

export interface CorretorInput {
  name: string;
  photo_url?: string | null;
  highlight?: string | null;
  formation?: string | null;
  experience?: string | null;
  expertise_tags?: string[];
  category?: string;
  status?: string | null;
  whatsapp: string;
  active?: boolean;
}

export const useCorretores = (onlyActive = true) => {
  return useQuery({
    queryKey: ['corretores', onlyActive],
    queryFn: async (): Promise<CorretorWithRating[]> => {
      let query = supabase.from('corretores').select('*');
      
      if (onlyActive) {
        query = query.eq('active', true);
      }
      
      const { data: corretores, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (corretores || []).map(corretor => ({
        ...corretor,
        expertise_tags: corretor.expertise_tags || [],
        averageRating: 0,
        reviewCount: 0
      }));
    }
  });
};

export const useCreateCorretor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CorretorInput) => {
      const { data, error } = await supabase
        .from('corretores')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretores'] });
    }
  });
};

export const useUpdateCorretor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CorretorInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('corretores')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretores'] });
    }
  });
};

export const useDeleteCorretor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('corretores')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretores'] });
    }
  });
};

export const uploadCorretorPhoto = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  
  const { error } = await supabase.storage
    .from('corretor-photos')
    .upload(fileName, file);
  
  if (error) throw error;
  
  const { data } = supabase.storage
    .from('corretor-photos')
    .getPublicUrl(fileName);
  
  return data.publicUrl;
};
