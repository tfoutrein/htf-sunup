import { Card, CardBody, Badge } from '@/components/ui';
import { UserBadge } from '@/types/dashboard';

interface BadgesCardProps {
  userBadges: UserBadge[];
}

export const BadgesCard = ({ userBadges }: BadgesCardProps) => {
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 border-0 shadow-lg">
      <CardBody className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl">
            <span className="text-2xl">🏆</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Mon Badge</h3>
            <p className="text-sm text-gray-600">Dernier badge obtenu</p>
          </div>
        </div>

        {userBadges && userBadges.length > 0 ? (
          <div className="text-center">
            <div className="p-4 bg-white/60 rounded-xl">
              <div className="text-4xl mb-2">
                {userBadges[userBadges.length - 1].icon}
              </div>
              <div className="font-semibold text-gray-800 mb-1">
                {userBadges[userBadges.length - 1].name}
              </div>
              <div className="text-xs text-gray-600 mb-2">
                {userBadges[userBadges.length - 1].description}
              </div>
              <Badge
                color={userBadges[userBadges.length - 1].color as any}
                variant="flat"
                size="sm"
              >
                {userBadges.length} badge{userBadges.length > 1 ? 's' : ''}{' '}
                obtenu{userBadges.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 bg-white/60 rounded-xl">
            <div className="text-4xl mb-2 opacity-50">🎯</div>
            <div className="text-sm text-gray-600">
              Continue tes efforts pour
              <br />
              débloquer ton premier badge !
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
