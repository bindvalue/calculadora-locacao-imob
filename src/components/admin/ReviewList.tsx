import { useState } from 'react';
import { CorretorWithRating } from '@/hooks/useCorretores';
import { useReviews, useDeleteReview } from '@/hooks/useReviews';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Star, Trash2, Clock, CheckCircle, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface ReviewListProps {
  corretores: CorretorWithRating[];
}

const ReviewList = ({ corretores }: ReviewListProps) => {
  const { toast } = useToast();
  const [selectedCorretor, setSelectedCorretor] = useState<string>('all');
  const { data: reviews, isLoading } = useReviews(
    selectedCorretor === 'all' ? undefined : selectedCorretor
  );
  const deleteReview = useDeleteReview();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteReview.mutateAsync(deleteId);
      toast({ title: 'Avaliação excluída com sucesso!' });
    } catch (error) {
      toast({ 
        title: 'Erro ao excluir avaliação',
        variant: 'destructive' 
      });
    } finally {
      setDeleteId(null);
    }
  };

  const getCorretorName = (corretorId: string) => {
    const corretor = corretores.find(c => c.id === corretorId);
    return corretor?.name || 'Corretor desconhecido';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm text-muted-foreground">Filtrar por corretor:</span>
        <Select value={selectedCorretor} onValueChange={setSelectedCorretor}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Todos os corretores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os corretores</SelectItem>
            {corretores.map((corretor) => (
              <SelectItem key={corretor.id} value={corretor.id}>
                {corretor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {!reviews || reviews.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-muted-foreground">
            Nenhuma avaliação encontrada.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      review.used 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {review.used ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Respondida
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          Pendente
                        </>
                      )}
                    </span>
                  </div>

                  {/* Client Name & Corretor */}
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="font-medium">{review.client_name}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      para {getCorretorName(review.corretor_id)}
                    </span>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-muted-foreground italic mb-2">
                      "{review.comment}"
                    </p>
                  )}

                  {/* Date */}
                  <p className="text-xs text-muted-foreground">
                    {formatDate(review.created_at)}
                  </p>
                </div>

                {/* Actions */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteId(review.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir avaliação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A avaliação será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ReviewList;
