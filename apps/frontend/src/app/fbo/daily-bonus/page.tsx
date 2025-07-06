'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody, Button, Tabs, Tab } from '@heroui/react';
import {
  ArrowLeftIcon,
  CurrencyEuroIcon,
  ChartBarIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useActiveCampaigns } from '@/hooks';
import {
  DailyBonusForm,
  DailyBonusList,
  DailyBonusStats,
} from '@/components/daily-bonus';

export default function DailyBonusPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  const { data: activeCampaigns = [], isLoading: campaignsLoading } =
    useActiveCampaigns();
  const activeCampaign = activeCampaigns[0] || null;

  if (campaignsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeCampaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="light"
              startContent={<ArrowLeftIcon className="w-4 h-4" />}
              onPress={() => router.push('/fbo/dashboard')}
            >
              Retour au dashboard
            </Button>
          </div>

          <Card>
            <CardBody className="text-center p-8">
              <CurrencyEuroIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Aucune campagne active
              </h3>
              <p className="text-gray-500">
                Il n'y a actuellement aucune campagne active pour créer des
                bonus quotidiens.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="light"
              startContent={<ArrowLeftIcon className="w-4 h-4" />}
              onPress={() => router.push('/fbo/dashboard')}
            >
              Retour au dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Bonus Quotidiens
              </h1>
              <p className="text-sm text-gray-600">
                Campagne: {activeCampaign.name}
              </p>
            </div>
          </div>

          {!showForm && (
            <Button
              color="primary"
              variant="solid"
              startContent={<CurrencyEuroIcon className="w-4 h-4" />}
              onPress={() => setShowForm(true)}
            >
              Nouveau bonus
            </Button>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">
                  Créer un nouveau bonus
                </h3>
              </CardHeader>
              <CardBody>
                <DailyBonusForm
                  campaignId={activeCampaign.id}
                  onSuccess={() => setShowForm(false)}
                  onCancel={() => setShowForm(false)}
                />
              </CardBody>
            </Card>
          </div>
        )}

        {/* Main Content */}
        {!showForm && (
          <div className="space-y-6">
            {/* Tabs */}
            <Card>
              <CardBody className="p-0">
                <Tabs
                  selectedKey={activeTab}
                  onSelectionChange={(key) => setActiveTab(key as string)}
                  variant="underlined"
                  classNames={{
                    tabList: 'w-full p-4 pb-0',
                    tab: 'h-12',
                  }}
                >
                  <Tab
                    key="list"
                    title={
                      <div className="flex items-center gap-2">
                        <ListBulletIcon className="w-4 h-4" />
                        <span>Mes Bonus</span>
                      </div>
                    }
                  />
                  <Tab
                    key="stats"
                    title={
                      <div className="flex items-center gap-2">
                        <ChartBarIcon className="w-4 h-4" />
                        <span>Statistiques</span>
                      </div>
                    }
                  />
                </Tabs>
              </CardBody>
            </Card>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'list' && (
                <DailyBonusList onCreateNew={() => setShowForm(true)} />
              )}

              {activeTab === 'stats' && (
                <DailyBonusStats campaignId={activeCampaign.id} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
