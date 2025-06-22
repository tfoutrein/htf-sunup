'use client';

import { useState } from 'react';
import { Action } from '@/types/campaigns';
import { Card, Button, Input, Textarea, Select } from '@/components/ui';

const actionTypes = [
  { key: 'vente', label: 'Vente', icon: '💰' },
  { key: 'recrutement', label: 'Recrutement', icon: '🤝' },
  { key: 'reseaux_sociaux', label: 'Réseaux Sociaux', icon: '📱' },
];

interface ActionFormProps {
  action?: Partial<Action>;
  onSave: (action: Partial<Action>) => void;
  onCancel: () => void;
  order: number;
}

export default function ActionForm({
  action,
  onSave,
  onCancel,
  order,
}: ActionFormProps) {
  const [formData, setFormData] = useState({
    type: action?.type || 'vente',
    title: action?.title || '',
    description: action?.description || '',
    pointsValue: action?.pointsValue || 10,
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    if (!formData.title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }

    if (formData.title.trim().length < 3) {
      setError('Le titre doit contenir au moins 3 caractères');
      return;
    }

    onSave({
      ...formData,
      order,
    });
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getTypeInfo = (type: string) => {
    return actionTypes.find((at) => at.key === type) || actionTypes[0];
  };

  const selectedTypeInfo = getTypeInfo(formData.type);

  return (
    <Card className="p-4 border-l-4 border-l-amber-400">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-600">
            Action #{order}
          </span>
          <span className="text-lg">{selectedTypeInfo.icon}</span>
        </div>

        <div>
          <Select
            label="Type d'action *"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            options={actionTypes.map((type) => ({
              value: type.key,
              label: `${type.icon} ${type.label}`,
            }))}
            required
          />
        </div>

        <div>
          <Input
            label="Titre de l'action *"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Ex: Contacter 5 nouveaux prospects (min. 3 caractères)"
            required
          />
        </div>

        <div>
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Décrivez précisément ce que doit faire la FBO..."
            rows={3}
          />
        </div>

        <div>
          <Input
            label="Points attribués"
            type="number"
            min="1"
            max="100"
            value={formData.pointsValue}
            onChange={(e) =>
              handleChange('pointsValue', parseInt(e.target.value) || 10)
            }
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            {action ? 'Modifier' : 'Ajouter'} l'action
          </Button>
        </div>
      </div>
    </Card>
  );
}
