'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import { addToast } from '@heroui/toast';
import {
  CalendarDaysIcon,
  CurrencyEuroIcon,
} from '@heroicons/react/24/outline';
import { useCreateDailyBonus, useBonusConfig } from '@/hooks';
import { CreateDailyBonusDto } from '@/types/daily-bonus';
import { BONUS_TYPE_CONFIG } from '@/types/daily-bonus';

interface DailyBonusFormProps {
  campaignId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DailyBonusForm({
  campaignId,
  onSuccess,
  onCancel,
}: DailyBonusFormProps) {
  const [formData, setFormData] = useState<CreateDailyBonusDto>({
    campaignId,
    bonusDate: new Date().toISOString().split('T')[0], // Today's date
    bonusType: 'basket',
  });

  const { data: bonusConfig, isLoading: configLoading } =
    useBonusConfig(campaignId);
  const createBonus = useCreateDailyBonus();

  const isLoading = createBonus.isPending || configLoading;

  const getDefaultAmount = (type: 'basket' | 'sponsorship') => {
    if (!bonusConfig) return 0;
    return type === 'basket'
      ? bonusConfig.basketBonusAmount
      : bonusConfig.sponsorshipBonusAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        amount: getDefaultAmount(formData.bonusType).toString(),
      };

      await createBonus.mutateAsync(submitData);
      addToast({
        title: 'Succès',
        description: 'Bonus quotidien créé avec succès !',
        color: 'success',
      });
      onSuccess?.();
    } catch (error: any) {
      addToast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la création du bonus',
        color: 'danger',
      });
    }
  };

  const bonusTypeOptions = Object.entries(BONUS_TYPE_CONFIG).map(
    ([key, config]) => ({
      key,
      value: key,
      label: `${config.emoji} ${config.label}`,
      description: config.description,
      amount: getDefaultAmount(key as 'basket' | 'sponsorship'),
    }),
  );

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2">
          <CurrencyEuroIcon className="w-6 h-6 text-amber-600" />
          <h3 className="text-xl font-semibold text-gray-800">
            Nouveau Bonus Quotidien
          </h3>
        </div>
      </CardHeader>

      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Selection */}
          <div>
            <Input
              type="date"
              label="Date du bonus"
              labelPlacement="outside"
              value={formData.bonusDate}
              onChange={(e) =>
                setFormData({ ...formData, bonusDate: e.target.value })
              }
              isRequired
              startContent={
                <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
              }
              classNames={{
                input: 'text-sm',
                label: 'text-sm font-medium text-gray-700',
              }}
            />
          </div>

          {/* Bonus Type Selection */}
          <div>
            <Select
              label="Type de bonus"
              labelPlacement="outside"
              placeholder="Sélectionnez le type de bonus"
              selectedKeys={formData.bonusType ? [formData.bonusType] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setFormData({
                  ...formData,
                  bonusType: selectedKey as 'basket' | 'sponsorship',
                });
              }}
              isRequired
              classNames={{
                label: 'text-sm font-medium text-gray-700',
              }}
            >
              {bonusTypeOptions.map((option) => (
                <SelectItem key={option.key}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-gray-500">
                      {option.description}
                    </span>
                    {Number(option.amount) > 0 && (
                      <span className="text-xs text-amber-600 font-medium">
                        Montant: {option.amount}€
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Amount Preview */}
          {formData.bonusType && bonusConfig && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-800">
                  Montant du bonus:
                </span>
                <span className="text-lg font-semibold text-amber-900">
                  {getDefaultAmount(formData.bonusType)}€
                </span>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                Vous devrez ajouter une preuve photo après la création
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {onCancel && (
              <Button
                variant="light"
                onPress={onCancel}
                className="flex-1"
                isDisabled={isLoading}
              >
                Annuler
              </Button>
            )}
            <Button
              type="submit"
              color="primary"
              className="flex-1"
              isLoading={isLoading}
            >
              Créer le bonus
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
