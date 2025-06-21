'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Tabs,
  Tab,
} from '@/components/ui';
import {
  Chip,
  Textarea,
  Select,
  SelectItem,
  useDisclosure,
} from '@heroui/react';
import {
  UsersIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  managerId: number;
}

interface Action {
  id: number;
  title: string;
  description: string;
  type: 'vente' | 'recrutement' | 'reseaux_sociaux';
  date: string;
  createdBy: number;
}

interface TeamProgress {
  userId: number;
  userName: string;
  totalActions: number;
  completedActions: number;
  percentage: number;
}

const actionTypes = [
  { key: 'vente', label: 'Vente', icon: '💰' },
  { key: 'recrutement', label: 'Recrutement', icon: '🤝' },
  { key: 'reseaux_sociaux', label: 'Réseaux Sociaux', icon: '📱' },
];

export default function ManagerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [teamProgress, setTeamProgress] = useState<TeamProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('team');

  // Modals
  const {
    isOpen: isAddMemberOpen,
    onOpen: onAddMemberOpen,
    onClose: onAddMemberClose,
  } = useDisclosure();
  const {
    isOpen: isAddActionOpen,
    onOpen: onAddActionOpen,
    onClose: onAddActionClose,
  } = useDisclosure();

  // Forms
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [actionForm, setActionForm] = useState({
    title: '',
    description: '',
    type: 'vente',
    date: new Date().toISOString().split('T')[0],
  });

  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      if (userData.role !== 'manager') {
        router.push('/login');
        return;
      }

      setUser(userData);
      fetchData(userData.id);
    } catch (error) {
      console.error('Invalid user data in localStorage:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  }, [router]);

  const fetchData = async (managerId: number) => {
    try {
      const token = localStorage.getItem('token');

      // Fetch team members
      const teamResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/team/${managerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeamMembers(teamData);
      }

      // Fetch actions created by manager
      const actionsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/actions/manager/${managerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (actionsResponse.ok) {
        const actionsData = await actionsResponse.json();
        setActions(actionsData);
      }

      // Fetch team progress
      const progressResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/actions/team-progress/${managerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setTeamProgress(progressData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...memberForm,
            role: 'fbo',
            managerId: user.id,
          }),
        },
      );

      if (response.ok) {
        onAddMemberClose();
        setMemberForm({ name: '', email: '', password: '' });
        fetchData(user.id);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du membre:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAction = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/actions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...actionForm,
            createdBy: user.id,
          }),
        },
      );

      if (response.ok) {
        onAddActionClose();
        setActionForm({
          title: '',
          description: '',
          type: 'vente',
          date: new Date().toISOString().split('T')[0],
        });
        fetchData(user.id);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'action:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <UsersIcon className="w-12 h-12 text-blue-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre équipe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UsersIcon className="w-8 h-8" />
              Dashboard Manager
            </h1>
            <p className="text-blue-100">Bonjour {user?.name} 👋</p>
          </div>
          <Button
            variant="flat"
            className="bg-white/20 text-white hover:bg-white/30"
            onPress={handleLogout}
          >
            Déconnexion
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Stats Cards - Mobile First */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardBody className="p-4 sm:p-6 text-center">
              <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mx-auto mb-2" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                {teamMembers.length}
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Membres d'équipe
              </p>
            </CardBody>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardBody className="p-4 sm:p-6 text-center">
              <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mx-auto mb-2" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                {actions.length}
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Actions créées
              </p>
            </CardBody>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 sm:col-span-2 lg:col-span-1">
            <CardBody className="p-4 sm:p-6 text-center">
              <ChartBarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mx-auto mb-2" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                {Math.round(
                  teamProgress.reduce((acc, p) => acc + p.percentage, 0) /
                    (teamProgress.length || 1),
                )}
                %
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Progression moyenne
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as string)}
          className="mb-6"
        >
          <Tab key="team" title="Mon Équipe">
            <div className="space-y-4 sm:space-y-6">
              {/* Team Progress */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold">
                    Progression de l'équipe
                  </h3>
                  <Button
                    color="primary"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={onAddMemberOpen}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Ajouter un membre
                  </Button>
                </CardHeader>
                <CardBody className="p-4 sm:p-6 pt-0">
                  {teamProgress.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <UsersIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm sm:text-base">
                        Aucun membre dans votre équipe
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {teamProgress.map((progress) => (
                        <div
                          key={progress.userId}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-800 text-sm sm:text-base mb-2">
                              {progress.userName}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={progress.percentage}
                                className="flex-1"
                                classNames={{
                                  indicator:
                                    progress.percentage === 100
                                      ? 'bg-green-500'
                                      : progress.percentage >= 60
                                        ? 'bg-orange-500'
                                        : 'bg-red-500',
                                }}
                              />
                              <span className="text-xs sm:text-sm font-medium text-gray-600 min-w-[60px]">
                                {progress.completedActions}/
                                {progress.totalActions}
                              </span>
                            </div>
                          </div>
                          <Badge
                            color={
                              progress.percentage === 100
                                ? 'success'
                                : progress.percentage >= 60
                                  ? 'warning'
                                  : 'danger'
                            }
                            variant="flat"
                            className="text-xs sm:text-sm w-fit"
                          >
                            {Math.round(progress.percentage)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="actions" title="Actions">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold">
                  Actions programmées
                </h3>
                <Button
                  color="primary"
                  startContent={<PlusIcon className="w-4 h-4" />}
                  onPress={onAddActionOpen}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Créer une action
                </Button>
              </CardHeader>
              <CardBody className="p-4 sm:p-6 pt-0">
                {actions.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <CalendarIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm sm:text-base">
                      Aucune action programmée
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actions.map((action) => (
                      <div
                        key={action.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-lg sm:text-xl flex-shrink-0">
                            {
                              actionTypes.find((t) => t.key === action.type)
                                ?.icon
                            }
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-gray-800 text-sm sm:text-base truncate">
                              {action.title}
                            </h4>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                              <Chip
                                size="sm"
                                variant="flat"
                                color={
                                  action.type === 'vente'
                                    ? 'success'
                                    : action.type === 'recrutement'
                                      ? 'primary'
                                      : 'secondary'
                                }
                                className="text-xs w-fit"
                              >
                                {
                                  actionTypes.find((t) => t.key === action.type)
                                    ?.label
                                }
                              </Chip>
                              <span className="text-xs sm:text-sm text-gray-500">
                                {action.date}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>

      {/* Add Member Modal */}
      <Modal isOpen={isAddMemberOpen} onClose={onAddMemberClose} size="md">
        <ModalContent>
          <ModalHeader>Ajouter un membre à l'équipe</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Nom complet"
                placeholder="Nom et prénom"
                value={memberForm.name}
                onValueChange={(value) =>
                  setMemberForm((prev) => ({ ...prev, name: value }))
                }
                variant="bordered"
                isRequired
              />
              <Input
                type="email"
                label="Email"
                placeholder="email@exemple.com"
                value={memberForm.email}
                onValueChange={(value) =>
                  setMemberForm((prev) => ({ ...prev, email: value }))
                }
                variant="bordered"
                isRequired
              />
              <Input
                type="password"
                label="Mot de passe temporaire"
                placeholder="Au moins 6 caractères"
                value={memberForm.password}
                onValueChange={(value) =>
                  setMemberForm((prev) => ({ ...prev, password: value }))
                }
                variant="bordered"
                isRequired
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onAddMemberClose}>
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleAddMember}
              isLoading={submitting}
              disabled={
                !memberForm.name || !memberForm.email || !memberForm.password
              }
            >
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Action Modal */}
      <Modal isOpen={isAddActionOpen} onClose={onAddActionClose} size="md">
        <ModalContent>
          <ModalHeader>Créer une nouvelle action</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Titre de l'action"
                placeholder="Ex: Publier un post sur Instagram"
                value={actionForm.title}
                onValueChange={(value) =>
                  setActionForm((prev) => ({ ...prev, title: value }))
                }
                variant="bordered"
                isRequired
              />
              <Textarea
                label="Description"
                placeholder="Décrivez l'action à réaliser..."
                value={actionForm.description}
                onValueChange={(value) =>
                  setActionForm((prev) => ({ ...prev, description: value }))
                }
                variant="bordered"
                rows={3}
              />
              <Select
                label="Type d'action"
                selectedKeys={[actionForm.type]}
                onSelectionChange={(keys) => {
                  const type = Array.from(keys)[0] as string;
                  setActionForm((prev) => ({ ...prev, type: type as any }));
                }}
                variant="bordered"
              >
                {actionTypes.map((type) => (
                  <SelectItem key={type.key}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </Select>
              <Input
                type="date"
                label="Date"
                value={actionForm.date}
                onValueChange={(value) =>
                  setActionForm((prev) => ({ ...prev, date: value }))
                }
                variant="bordered"
                isRequired
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onAddActionClose}>
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleAddAction}
              isLoading={submitting}
              disabled={!actionForm.title || !actionForm.date}
            >
              Créer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
