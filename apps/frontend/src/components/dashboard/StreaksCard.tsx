import { Card, CardBody } from '@/components/ui';
import { UserStreaks } from '@/types/dashboard';

interface StreaksCardProps {
  userStreaks: UserStreaks | null;
}

export const StreaksCard = ({ userStreaks }: StreaksCardProps) => {
  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-0 shadow-lg">
      <CardBody className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
            <span className="text-2xl">🔥</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Séries de défis
            </h3>
            <p className="text-sm text-gray-600">
              Jours consécutifs d'activité
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white/60 rounded-lg">
            <div className="text-2xl font-bold text-orange-700 mb-1">
              {userStreaks?.currentStreak || 0}
            </div>
            <div className="text-xs text-orange-600 font-medium">
              Série actuelle
            </div>
          </div>
          <div className="text-center p-3 bg-white/60 rounded-lg">
            <div className="text-2xl font-bold text-red-700 mb-1">
              {userStreaks?.longestStreak || 0}
            </div>
            <div className="text-xs text-red-600 font-medium">
              Record personnel
            </div>
          </div>
        </div>

        {userStreaks?.totalActiveDays && (
          <div className="mt-3 text-center text-xs text-gray-600">
            Total: {userStreaks.totalActiveDays} jours actifs
          </div>
        )}
      </CardBody>
    </Card>
  );
};
