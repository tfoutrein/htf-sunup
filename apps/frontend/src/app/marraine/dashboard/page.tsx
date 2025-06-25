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
  StarIcon as CrownIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Manager {
  id: number;
  name: string;
  email: string;
  teamSize: number;
  completionRate: number;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  managerId: number;
  managerName: string;
}

interface Action {
  id: number;
  title: string;
  description: string;
  type: 'vente' | 'recrutement' | 'reseaux_sociaux';
  date: string;
  createdBy: number;
  createdByName: string;
}

interface GlobalProgress {
  totalMembers: number;
  totalActions: number;
  completedActions: number;
  globalCompletionRate: number;
  managerStats: {
    managerId: number;
    managerName: string;
    teamSize: number;
    completedActions: number;
    totalActions: number;
    completionRate: number;
  }[];
}

const actionTypes = [
  { key: 'vente', label: 'Vente', icon: '💰' },
  { key: 'recrutement', label: 'Recrutement', icon: '🤝' },
  { key: 'reseaux_sociaux', label: 'Réseaux Sociaux', icon: '📱' },
];

export default function MarraineDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [globalProgress, setGlobalProgress] = useState<GlobalProgress | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('managers');

  // Modals
  const {
    isOpen: isAddManagerOpen,
    onOpen: onAddManagerOpen,
    onClose: onAddManagerClose,
  } = useDisclosure();
  const {
    isOpen: isAddActionOpen,
    onOpen: onAddActionOpen,
    onClose: onAddActionClose,
  } = useDisclosure();

  // Forms
  const [managerForm, setManagerForm] = useState({
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
      if (userData.role !== 'marraine') {
        router.push('/login');
        return;
      }

      // Validate user ID
      if (!userData.id || isNaN(userData.id)) {
        console.error('Invalid user ID in localStorage:', userData);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      setUser(userData);
      fetchData();
    } catch (error) {
      console.error('Invalid user data in localStorage:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  }, [router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch all managers
      const managersResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/managers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (managersResponse.ok) {
        const managersData = await managersResponse.json();
        setManagers(managersData);
      }

      // Fetch all team members
      const membersResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/all-members`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setAllMembers(membersData);
      }

      // Fetch all actions
      const actionsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/actions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (actionsResponse.ok) {
        const actionsData = await actionsResponse.json();
        setActions(actionsData);
      }

      // Fetch global progress
      const progressResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/actions/global-progress`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setGlobalProgress(progressData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddManager = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...managerForm,
            role: 'manager',
          }),
        },
      );

      if (response.ok) {
        onAddManagerClose();
        setManagerForm({ name: '', email: '', password: '' });
        fetchData();
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du manager:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAction = async () => {
    if (!user || !user.id || isNaN(user.id)) {
      console.error('Invalid user ID:', user?.id);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/actions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...actionForm,
            createdBy: Number(user.id),
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
        fetchData();
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

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <CrownIcon className="w-12 h-12 text-purple-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">
            Chargement de votre tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CrownIcon className="w-8 h-8" />
              Dashboard Marraine
            </h1>
            <p className="text-purple-100">Bonjour {user?.name} 👑</p>
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
        {globalProgress ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardBody className="p-3 sm:p-6 text-center">
                <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="text-lg sm:text-2xl font-bold text-gray-800">
                  {globalProgress.totalMembers}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Total Membres
                </p>
              </CardBody>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardBody className="p-3 sm:p-6 text-center">
                <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg sm:text-2xl font-bold text-gray-800">
                  {globalProgress.completedActions}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Actions Complétées
                </p>
              </CardBody>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardBody className="p-3 sm:p-6 text-center">
                <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mx-auto mb-2" />
                <h3 className="text-lg sm:text-2xl font-bold text-gray-800">
                  {globalProgress.totalActions}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Total Actions
                </p>
              </CardBody>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardBody className="p-3 sm:p-6 text-center">
                <ChartBarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mx-auto mb-2" />
                <h3 className="text-lg sm:text-2xl font-bold text-gray-800">
                  {(globalProgress.globalCompletionRate || 0).toFixed(1)}%
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">Taux Global</p>
              </CardBody>
            </Card>
          </div>
        ) : null}

        {/* Tabs */}
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as string)}
          className="mb-6"
        >
          <Tab key="managers" title="Mes Managers">
            <div className="space-y-4 sm:space-y-6">
              {/* Manager Performance */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold">
                    Performance des Managers
                  </h3>
                </CardHeader>
                <CardBody className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    {globalProgress?.managerStats.map((manager) => (
                      <div
                        key={manager.managerId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0"
                      >
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                            {manager.managerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm sm:text-base">
                              {manager.managerName}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {manager.teamSize} membre
                              {manager.teamSize > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
                          <div className="flex-1 sm:flex-none">
                            <p className="text-xs sm:text-sm text-gray-600 mb-1">
                              {manager.completedActions}/{manager.totalActions}{' '}
                              actions
                            </p>
                            <Progress
                              value={manager.completionRate || 0}
                              color={getCompletionColor(
                                manager.completionRate || 0,
                              )}
                              className="w-full sm:w-32"
                              classNames={{
                                indicator:
                                  (manager.completionRate || 0) === 100
                                    ? 'bg-green-500'
                                    : (manager.completionRate || 0) >= 60
                                      ? 'bg-orange-500'
                                      : 'bg-red-500',
                              }}
                            />
                          </div>
                          <Badge
                            color={getCompletionColor(
                              manager.completionRate || 0,
                            )}
                            variant="flat"
                            className="text-xs sm:text-sm"
                          >
                            {(manager.completionRate || 0).toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="overview" title="Vue d'ensemble">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold">
                  Gestion des Managers
                </h3>
                <Button
                  color="primary"
                  startContent={<PlusIcon className="h-4 w-4" />}
                  onPress={onAddManagerOpen}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Ajouter Manager
                </Button>
              </CardHeader>
              <CardBody className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {managers.map((manager) => (
                    <div
                      key={manager.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                          {manager.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm sm:text-base truncate">
                            {manager.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {manager.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
                        <div className="flex-1 sm:flex-none">
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">
                            {manager.teamSize} membre
                            {manager.teamSize > 1 ? 's' : ''}
                          </p>
                          <Progress
                            value={manager.completionRate || 0}
                            color={getCompletionColor(
                              manager.completionRate || 0,
                            )}
                            className="w-full sm:w-32"
                            classNames={{
                              indicator:
                                (manager.completionRate || 0) === 100
                                  ? 'bg-green-500'
                                  : (manager.completionRate || 0) >= 60
                                    ? 'bg-orange-500'
                                    : 'bg-red-500',
                            }}
                          />
                        </div>
                        <Badge
                          color={getCompletionColor(
                            manager.completionRate || 0,
                          )}
                          variant="flat"
                          className="text-xs sm:text-sm"
                        >
                          {(manager.completionRate || 0).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="members" title="Tous les Membres">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold">
                  Tous les Membres FBO
                </h3>
              </CardHeader>
              <CardBody className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {allMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm sm:text-base truncate">
                            {member.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <Badge
                          variant="flat"
                          color="secondary"
                          className="text-xs"
                        >
                          Manager: {member.managerName}
                        </Badge>
                        <Chip size="sm" variant="flat" className="text-xs">
                          {member.role.toUpperCase()}
                        </Chip>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="actions" title="Actions">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold">
                  Gestion des Actions
                </h3>
                <Button
                  color="primary"
                  startContent={<PlusIcon className="h-4 w-4" />}
                  onPress={onAddActionOpen}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Ajouter Action
                </Button>
              </CardHeader>
              <CardBody className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {actions.map((action) => (
                    <div
                      key={action.id}
                      className="p-3 sm:p-4 border rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg sm:text-xl">
                              {
                                actionTypes.find((t) => t.key === action.type)
                                  ?.icon
                              }
                            </span>
                            <h4 className="font-semibold text-sm sm:text-base truncate">
                              {action.title}
                            </h4>
                            <Badge
                              variant="flat"
                              color="primary"
                              className="text-xs hidden sm:inline-flex"
                            >
                              {
                                actionTypes.find((t) => t.key === action.type)
                                  ?.label
                              }
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2 text-xs sm:text-sm line-clamp-2">
                            {action.description}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                            <p className="text-xs sm:text-sm text-gray-500">
                              Créé par: {action.createdByName}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">
                              Date:{' '}
                              {new Date(action.date).toLocaleDateString(
                                'fr-FR',
                              )}
                            </p>
                            <Badge
                              variant="flat"
                              color="primary"
                              className="text-xs sm:hidden w-fit"
                            >
                              {
                                actionTypes.find((t) => t.key === action.type)
                                  ?.label
                              }
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>

      {/* Add Manager Modal */}
      <Modal isOpen={isAddManagerOpen} onClose={onAddManagerClose} size="lg">
        <ModalContent>
          <ModalHeader>Ajouter un nouveau Manager</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Nom complet"
                placeholder="Nom du manager"
                value={managerForm.name}
                onChange={(e) =>
                  setManagerForm({ ...managerForm, name: e.target.value })
                }
              />
              <Input
                label="Email"
                type="email"
                placeholder="email@example.com"
                value={managerForm.email}
                onChange={(e) =>
                  setManagerForm({ ...managerForm, email: e.target.value })
                }
              />
              <Input
                label="Mot de passe"
                type="password"
                placeholder="Mot de passe"
                value={managerForm.password}
                onChange={(e) =>
                  setManagerForm({ ...managerForm, password: e.target.value })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onAddManagerClose}>
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleAddManager}
              isLoading={submitting}
            >
              Ajouter Manager
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Action Modal */}
      <Modal isOpen={isAddActionOpen} onClose={onAddActionClose} size="lg">
        <ModalContent>
          <ModalHeader>Programmer une nouvelle Action</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Titre de l'action"
                placeholder="Titre de l'action"
                value={actionForm.title}
                onChange={(e) =>
                  setActionForm({ ...actionForm, title: e.target.value })
                }
              />
              <Textarea
                label="Description"
                placeholder="Description détaillée de l'action"
                value={actionForm.description}
                onChange={(e) =>
                  setActionForm({ ...actionForm, description: e.target.value })
                }
              />
              <Select
                label="Type d'action"
                selectedKeys={[actionForm.type]}
                onSelectionChange={(keys) =>
                  setActionForm({
                    ...actionForm,
                    type: Array.from(keys)[0] as string,
                  })
                }
              >
                {actionTypes.map((type) => (
                  <SelectItem key={type.key}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </Select>
              <Input
                label="Date"
                type="date"
                value={actionForm.date}
                onChange={(e) =>
                  setActionForm({ ...actionForm, date: e.target.value })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onAddActionClose}>
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleAddAction}
              isLoading={submitting}
            >
              Programmer Action
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
