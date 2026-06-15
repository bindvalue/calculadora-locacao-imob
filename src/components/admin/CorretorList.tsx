import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, Edit, Power, Link, Copy, Share2, Star, Search, Phone, GraduationCap, Briefcase, Tag, MapPin } from 'lucide-react';
import { useDeleteCorretor, useUpdateCorretor, CorretorWithRating } from '@/hooks/useCorretores';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CorretorListProps {
  corretores: CorretorWithRating[];
  onEdit: (corretor: CorretorWithRating) => void;
}

const formatPhoneDisplay = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  // Remove country code if present for display
  const localNumbers = numbers.startsWith('55') ? numbers.slice(2) : numbers;
  if (localNumbers.length === 11) {
    return `(${localNumbers.slice(0, 2)}) ${localNumbers.slice(2, 7)}-${localNumbers.slice(7)}`;
  } else if (localNumbers.length === 10) {
    return `(${localNumbers.slice(0, 2)}) ${localNumbers.slice(2, 6)}-${localNumbers.slice(6)}`;
  }
  return phone;
};

const CorretorList = ({ corretores, onEdit }: CorretorListProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reviewLink, setReviewLink] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const deleteCorretor = useDeleteCorretor();
  const updateCorretor = useUpdateCorretor();

  const filteredCorretores = corretores.filter(corretor =>
    corretor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    corretor.highlight?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    corretor.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    corretor.expertise_tags?.some(tag => 
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteCorretor.mutateAsync(deleteId);
      toast.success('Corretor excluído com sucesso!');
      setDeleteId(null);
    } catch (error) {
      toast.error('Erro ao excluir corretor');
    }
  };

  const handleToggleActive = async (corretor: CorretorWithRating) => {
    try {
      await updateCorretor.mutateAsync({
        id: corretor.id,
        active: !corretor.active,
      });
      toast.success(corretor.active ? 'Corretor desativado' : 'Corretor ativado');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleGenerateReviewLink = async (corretorId: string) => {
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase.from('reviews').insert({
        corretor_id: corretorId,
        review_token: token,
        expires_at: expiresAt.toISOString(),
        rating: 1,
        client_name: 'Pendente',
        used: false,
      });

      if (error) throw error;

      const link = `${window.location.origin}/avaliar/${token}`;
      setReviewLink(link);
      toast.success('Link de avaliação gerado com sucesso!');
    } catch (error) {
      console.error('Error generating review link:', error);
      toast.error('Erro ao gerar link de avaliação');
    }
  };

  const copyToClipboard = () => {
    if (reviewLink) {
      navigator.clipboard.writeText(reviewLink);
      toast.success('Link copiado!');
    }
  };

  const shareLink = () => {
    if (reviewLink && navigator.share) {
      navigator.share({
        title: 'Avalie nosso corretor',
        text: 'Por favor, avalie o atendimento do nosso corretor:',
        url: reviewLink,
      });
    } else {
      copyToClipboard();
    }
  };

  if (corretores.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum corretor cadastrado ainda.</p>
        <p className="text-sm mt-2">Clique em "Novo Corretor" para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar corretor por nome, destaque, categoria ou tag..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results count */}
      {searchTerm && (
        <p className="text-sm text-muted-foreground">
          {filteredCorretores.length} corretor(es) encontrado(s)
        </p>
      )}

      {/* Corretor List */}
      <div className="space-y-4">
        {filteredCorretores.map((corretor) => (
          <div
            key={corretor.id}
            className={`border rounded-lg p-4 ${
              corretor.active ? 'bg-card' : 'bg-muted/50 opacity-75'
            }`}
          >
            {/* Header Row */}
            <div className="flex items-start gap-4">
              {/* Photo */}
              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {corretor.photo_url ? (
                  <img
                    src={corretor.photo_url}
                    alt={corretor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl font-bold">
                    {corretor.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">{corretor.name}</h3>
                  <Badge variant={corretor.active ? 'default' : 'secondary'}>
                    {corretor.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge variant="outline">{corretor.category}</Badge>
                </div>

                {corretor.highlight && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {corretor.highlight}
                  </p>
                )}

                {/* Rating */}
                <div className="flex items-center gap-1 mt-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">
                    {corretor.averageRating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({corretor.reviewCount || 0} avaliações)
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateReviewLink(corretor.id)}
                  title="Gerar link de avaliação"
                >
                  <Link className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(corretor)}
                  title={corretor.active ? 'Desativar' : 'Ativar'}
                >
                  <Power className={`h-4 w-4 ${corretor.active ? 'text-green-500' : 'text-muted-foreground'}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(corretor)}
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteId(corretor.id)}
                  title="Excluir"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Details Grid */}
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              {/* WhatsApp */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-foreground">WhatsApp:</span>
                <span>{formatPhoneDisplay(corretor.whatsapp)}</span>
              </div>

              {/* Formation */}
              {corretor.formation && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium text-foreground">Formação:</span>
                  <span className="truncate">{corretor.formation}</span>
                </div>
              )}

              {/* Experience */}
              {corretor.experience && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium text-foreground">Experiência:</span>
                  <span className="truncate">{corretor.experience}</span>
                </div>
              )}

              {/* Status */}
              {corretor.status && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium text-foreground">Status:</span>
                  <span>{corretor.status}</span>
                </div>
              )}

              {/* Expertise Tags */}
              {corretor.expertise_tags && corretor.expertise_tags.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground md:col-span-2 lg:col-span-2">
                  <Tag className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium text-foreground">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {corretor.expertise_tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* No results message */}
      {searchTerm && filteredCorretores.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum corretor encontrado para "{searchTerm}"</p>
          <Button
            variant="link"
            onClick={() => setSearchTerm('')}
            className="mt-2"
          >
            Limpar busca
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este corretor? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Link Dialog */}
      <Dialog open={!!reviewLink} onOpenChange={() => setReviewLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de Avaliação Gerado</DialogTitle>
            <DialogDescription>
              Compartilhe este link com o cliente para que ele possa avaliar o corretor.
              O link expira em 7 dias.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg break-all text-sm">
              {reviewLink}
            </div>
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
              <Button onClick={shareLink} variant="outline" className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CorretorList;
