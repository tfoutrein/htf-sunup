'use client';

import { useState } from 'react';
import { Button, Textarea } from '@/components/ui';
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';

export interface UnlockConditionInput {
  id?: number; // Pour les conditions existantes
  description: string;
  displayOrder: number;
}

interface UnlockConditionsManagerProps {
  conditions: UnlockConditionInput[];
  onChange: (conditions: UnlockConditionInput[]) => void;
  minConditions?: number;
  maxConditions?: number;
}

export default function UnlockConditionsManager({
  conditions,
  onChange,
  minConditions = 1,
  maxConditions = 10,
}: UnlockConditionsManagerProps) {
  const [newCondition, setNewCondition] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAddCondition = () => {
    if (!newCondition.trim()) return;

    if (conditions.length >= maxConditions) {
      alert(`Maximum ${maxConditions} conditions autorisées`);
      return;
    }

    const newCond: UnlockConditionInput = {
      description: newCondition.trim(),
      displayOrder: conditions.length + 1,
    };

    onChange([...conditions, newCond]);
    setNewCondition('');
  };

  const handleRemoveCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index);
    // Réordonner les displayOrder
    const reordered = updated.map((cond, idx) => ({
      ...cond,
      displayOrder: idx + 1,
    }));
    onChange(reordered);
  };

  const handleUpdateCondition = (index: number, newDescription: string) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], description: newDescription };
    onChange(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...conditions];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    // Réordonner les displayOrder
    const reordered = updated.map((cond, idx) => ({
      ...cond,
      displayOrder: idx + 1,
    }));
    onChange(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === conditions.length - 1) return;
    const updated = [...conditions];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    // Réordonner les displayOrder
    const reordered = updated.map((cond, idx) => ({
      ...cond,
      displayOrder: idx + 1,
    }));
    onChange(reordered);
  };

  return (
    <div className="space-y-3 px-2">
      {/* En-tête de l'accordéon */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg border-2 border-gray-300 transition-all"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔐</span>
          <div className="text-left">
            <div className="text-sm font-semibold text-gray-700">
              Conditions de déblocage
              <span className="ml-2 text-xs font-normal text-gray-500">
                (optionnel)
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {conditions.length > 0
                ? `${conditions.length} condition${conditions.length > 1 ? 's' : ''} définie${conditions.length > 1 ? 's' : ''}`
                : 'Cliquez pour ajouter des conditions'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conditions.length > 0 && (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
              {conditions.length}
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </button>

      {/* Contenu de l'accordéon */}
      {isOpen && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
            💡 <strong>Info</strong> : Si vous définissez des conditions, elles
            devront être remplies et cochées par le manager avant de pouvoir
            valider la cagnotte.
          </div>

          {/* Formulaire d'ajout - EN PREMIER */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-dashed border-green-300">
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-medium text-gray-700">
                ➕ Ajouter une nouvelle condition
              </label>
              <div className="flex gap-2 items-start">
                <div className="flex-1 min-w-0">
                  <Textarea
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    placeholder="Ex: Présence confirmée à toutes les formations du mois (minimum 3)"
                    rows={2}
                    className="w-full bg-white"
                    maxLength={500}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        handleAddCondition();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCondition}
                  disabled={
                    !newCondition.trim() || conditions.length >= maxConditions
                  }
                  className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                  title="Ajouter la condition"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="text-xs text-gray-500">
                💡 <strong>Astuce</strong> : Utilisez Ctrl+Entrée pour ajouter
                rapidement
              </div>
            </div>
          </div>

          {/* Liste des conditions ajoutées - APRÈS */}
          {conditions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px bg-gray-300 flex-1"></div>
                <span className="text-sm font-medium text-gray-600">
                  Conditions définies ({conditions.length})
                </span>
                <div className="h-px bg-gray-300 flex-1"></div>
              </div>

              <div className="space-y-2">
                {conditions.map((condition, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Numéro + Boutons déplacement */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xs"
                        title="Monter"
                      >
                        ▲
                      </button>
                      <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                        {index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === conditions.length - 1}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xs"
                        title="Descendre"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Description */}
                    <div className="flex-1">
                      <Textarea
                        value={condition.description}
                        onChange={(e) =>
                          handleUpdateCondition(index, e.target.value)
                        }
                        placeholder="Description de la condition..."
                        rows={2}
                        className="w-full"
                        maxLength={500}
                      />
                      <div className="text-xs text-gray-400 mt-1">
                        {condition.description.length}/500 caractères
                      </div>
                    </div>

                    {/* Bouton supprimer - centré verticalement */}
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(index)}
                      className="flex-shrink-0 self-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer cette condition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {conditions.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm italic">
              Aucune condition définie. Ajoutez-en une ci-dessus si nécessaire.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
