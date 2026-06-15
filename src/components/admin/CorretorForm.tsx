import { useState, useRef } from 'react';
import { CorretorWithRating, useCreateCorretor, useUpdateCorretor, uploadCorretorPhoto } from '@/hooks/useCorretores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { X, Upload, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CorretorFormProps {
  corretor: CorretorWithRating | null;
  onClose: () => void;
}

const categories = ['Investimento', 'Luxo', 'Moradia', 'Litoral', 'Comercial', 'Locação', 'Venda'];

const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  const limited = numbers.slice(0, 11);
  
  if (limited.length <= 2) {
    return limited.length ? `(${limited}` : '';
  } else if (limited.length <= 7) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  }
};

const extractNumbers = (value: string): string => value.replace(/\D/g, '');

const CorretorForm = ({ corretor, onClose }: CorretorFormProps) => {
  const { toast } = useToast();
  const createCorretor = useCreateCorretor();
  const updateCorretor = useUpdateCorretor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: corretor?.name || '',
    photo_url: corretor?.photo_url || '',
    highlight: corretor?.highlight || '',
    formation: corretor?.formation || '',
    experience: corretor?.experience || '',
    expertise_tags: corretor?.expertise_tags?.join(', ') || '',
    category: corretor?.category || 'Moradia',
    status: corretor?.status || 'Disponível',
    whatsapp: corretor?.whatsapp ? formatPhoneNumber(corretor.whatsapp) : '',
    active: corretor?.active ?? true
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadCorretorPhoto(file);
      setFormData(prev => ({ ...prev, photo_url: url }));
      toast({ title: 'Foto enviada com sucesso!' });
    } catch (error) {
      toast({ 
        title: 'Erro ao enviar foto',
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneNumbers = extractNumbers(formData.whatsapp);

    if (!formData.name.trim() || !phoneNumbers) {
      toast({
        title: 'Erro',
        description: 'Nome e WhatsApp são obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      toast({
        title: 'Erro',
        description: 'WhatsApp deve ter entre 10 e 11 dígitos.',
        variant: 'destructive'
      });
      return;
    }

    const data = {
      name: formData.name,
      photo_url: formData.photo_url || null,
      highlight: formData.highlight || null,
      formation: formData.formation || null,
      experience: formData.experience || null,
      expertise_tags: formData.expertise_tags
        ? formData.expertise_tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [],
      category: formData.category,
      status: formData.status || null,
      whatsapp: phoneNumbers,
      active: formData.active
    };

    try {
      if (corretor) {
        await updateCorretor.mutateAsync({ id: corretor.id, ...data });
        toast({ title: 'Corretor atualizado com sucesso!' });
      } else {
        await createCorretor.mutateAsync(data);
        toast({ title: 'Corretor cadastrado com sucesso!' });
      }
      onClose();
    } catch (error) {
      toast({ 
        title: 'Erro ao salvar corretor',
        variant: 'destructive' 
      });
    }
  };

  const isLoading = createCorretor.isPending || updateCorretor.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-display text-xl font-bold">
            {corretor ? 'Editar Corretor' : 'Novo Corretor'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Foto do Corretor</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {formData.photo_url ? (
                  <img 
                    src={formData.photo_url} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Upload className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Enviar Foto
                </Button>
              </div>
            </div>
          </div>

          {/* Name & WhatsApp */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: formatPhoneNumber(e.target.value) })}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
          </div>

          {/* Highlight & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="highlight">Destaque</Label>
              <Input
                id="highlight"
                value={formData.highlight}
                onChange={(e) => setFormData({ ...formData, highlight: e.target.value })}
                placeholder="Ex: Especialista em Investimentos"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Formation */}
          <div className="space-y-2">
            <Label htmlFor="formation">Formação</Label>
            <Input
              id="formation"
              value={formData.formation}
              onChange={(e) => setFormData({ ...formData, formation: e.target.value })}
              placeholder="Ex: Economista (USP) com MBA em Mercado Imobiliário"
            />
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience">Experiência</Label>
            <Textarea
              id="experience"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              placeholder="Descreva a experiência do corretor..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags de Expertise</Label>
            <Input
              id="tags"
              value={formData.expertise_tags}
              onChange={(e) => setFormData({ ...formData, expertise_tags: e.target.value })}
              placeholder="Lançamentos, Centro Histórico, Retrofit (separadas por vírgula)"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Input
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              placeholder="Ex: Disponível agora"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <Label>Corretor Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Corretores inativos não aparecem na página pública
              </p>
            </div>
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 btn-primary-gradient" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                corretor ? 'Atualizar' : 'Cadastrar'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CorretorForm;
