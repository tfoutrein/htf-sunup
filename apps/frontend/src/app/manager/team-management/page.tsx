'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  useDisclosure,
  Avatar,
  Chip,
  Divider,
} from '@heroui/react';
import {
  UsersIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  UserPlusIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { ApiClient } from '@/services/api';
import { addToast } from '@heroui/toast';

// Types
interface User {
  id: number;
  name: string;
  email: string;
  role: 'manager' | 'fbo';
  managerId?: number;
  managerName?: string;
  isDirectReport?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TeamMember extends User {
  type: 'manager' | 'fbo';
  teamSize: number;
  subTeam: TeamMember[];
}

interface TeamHierarchy {
  id: number;
  name: string;
  email: string;
  role: string;
  directMembers: TeamMember[];
  totalMembers: number;
}

type ViewMode = 'list' | 'tree';

export default function TeamManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [teamList, setTeamList] = useState<User[]>([]);
  const [teamHierarchy, setTeamHierarchy] = useState<TeamHierarchy | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [availableManagers, setAvailableManagers] = useState<User[]>([]);

  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
    onOpenChange: onEditOpenChange,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();

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
      fetchTeamData();
    } catch (error) {
      console.error('Invalid user data:', error);
      router.push('/login');
    }
  }, [router]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);

      // Fetch team list
      const listResponse = await ApiClient.get('/users/team-list/my-team');
      if (listResponse.ok) {
        const teamData = await listResponse.json();
        setTeamList(teamData);
      }

      // Fetch team hierarchy
      const hierarchyResponse = await ApiClient.get(
        '/users/team-hierarchy/my-team',
      );
      if (hierarchyResponse.ok) {
        const hierarchyData = await hierarchyResponse.json();
        setTeamHierarchy(hierarchyData);
      }

      // Fetch available managers
      const managersResponse = await ApiClient.get('/users/managers');
      if (managersResponse.ok) {
        const managersData = await managersResponse.json();
        setAvailableManagers(managersData);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      addToast({
        title: 'Erreur',
        description: "Erreur lors du chargement de l'équipe",
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member: User) => {
    setEditingMember({ ...member });
    onEditOpen();
  };

  const handleDelete = (member: User) => {
    setSelectedMember(member);
    onDeleteOpen();
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;

    try {
      const response = await ApiClient.patch(
        `/users/team-member/${editingMember.id}`,
        {
          name: editingMember.name,
          email: editingMember.email,
          role: editingMember.role,
          managerId: editingMember.managerId,
        },
      );

      if (response.ok) {
        addToast({
          title: 'Succès',
          description: 'Membre mis à jour avec succès',
          color: 'success',
        });
        await fetchTeamData();
        onEditClose();
      } else {
        const errorData = await response.json();
        addToast({
          title: 'Erreur',
          description: errorData.message || 'Erreur lors de la mise à jour',
          color: 'danger',
        });
      }
    } catch (error) {
      console.error('Error updating member:', error);
      addToast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour',
        color: 'danger',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedMember) return;

    try {
      const response = await ApiClient.delete(
        `/users/team-member/${selectedMember.id}`,
      );

      if (response.ok) {
        addToast({
          title: 'Succès',
          description: 'Membre supprimé avec succès',
          color: 'success',
        });
        await fetchTeamData();
        onDeleteClose();
      } else {
        const errorData = await response.json();
        addToast({
          title: 'Erreur',
          description: errorData.message || 'Erreur lors de la suppression',
          color: 'danger',
        });
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      addToast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression',
        color: 'danger',
      });
    }
  };

  const toggleNodeExpansion = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTreeNode = (member: TeamMember, level: number = 0) => {
    const hasChildren = member.subTeam && member.subTeam.length > 0;
    const isExpanded = expandedNodes.has(member.id);

    return (
      <div key={member.id} className="w-full">
        <div
          className={`flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-gray-50 ${
            level > 0 ? 'ml-' + level * 6 : ''
          }`}
          style={{ marginLeft: level * 24 }}
        >
          <div className="flex items-center gap-3">
            {hasChildren && (
              <button
                onClick={() => toggleNodeExpansion(member.id)}
                className="p-1 rounded hover:bg-gray-200"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6"></div>}

            <Avatar size="sm" name={member.name} className="shrink-0" />

            <div className="flex flex-col">
              <span className="font-medium">{member.name}</span>
              <span className="text-sm text-gray-500">{member.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              color={member.role === 'manager' ? 'primary' : 'secondary'}
              variant="flat"
              size="sm"
            >
              {member.role === 'manager' ? 'Manager' : 'FBO'}
            </Badge>

            {member.role === 'manager' && member.teamSize > 0 && (
              <Badge color="warning" variant="flat" size="sm">
                {member.teamSize} membre{member.teamSize > 1 ? 's' : ''}
              </Badge>
            )}

            <div className="flex gap-1">
              <Button
                size="sm"
                variant="light"
                isIconOnly
                onClick={() => handleEdit(member)}
              >
                <PencilIcon className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="light"
                color="danger"
                isIconOnly
                onClick={() => handleDelete(member)}
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2">
            {member.subTeam.map((subMember) =>
              renderTreeNode(subMember, level + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  const renderListView = () => (
    <div className="space-y-3">
      {teamList.map((member) => (
        <Card key={member.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar size="sm" name={member.name} />
              <div className="flex flex-col">
                <div className="font-medium">{member.name}</div>
                <div className="text-sm text-gray-500">{member.email}</div>
              </div>
              <Badge
                color={member.role === 'manager' ? 'primary' : 'secondary'}
                variant="flat"
                size="sm"
              >
                {member.role === 'manager' ? 'Manager' : 'FBO'}
              </Badge>
              <div className="text-sm text-gray-600">
                Manager: {member.managerName || 'N/A'}
              </div>
              <Chip
                size="sm"
                variant="flat"
                color={member.isDirectReport ? 'success' : 'default'}
              >
                {member.isDirectReport ? 'Direct' : 'Indirect'}
              </Chip>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="light"
                isIconOnly
                onClick={() => handleEdit(member)}
              >
                <PencilIcon className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="light"
                color="danger"
                isIconOnly
                onClick={() => handleDelete(member)}
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderTreeView = () => (
    <div className="space-y-2">
      {teamHierarchy?.directMembers.map((member) => renderTreeNode(member))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UsersIcon className="w-12 h-12 text-blue-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Chargement de l'équipe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Gestion d'équipe
          </h1>
          <p className="text-gray-600">
            Administrez votre équipe et gérez les membres
          </p>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">
                    Vue d'ensemble de l'équipe
                  </h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'solid' : 'light'}
                    color="primary"
                    startContent={<ListBulletIcon className="w-4 h-4" />}
                    onClick={() => setViewMode('list')}
                  >
                    Liste
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'tree' ? 'solid' : 'light'}
                    color="primary"
                    startContent={<Squares2X2Icon className="w-4 h-4" />}
                    onClick={() => setViewMode('tree')}
                  >
                    Arborescence
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <UsersIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {teamHierarchy?.totalMembers || 0}
                      </div>
                      <div className="text-sm text-gray-600">
                        Membres totaux
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <UsersIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {teamHierarchy?.directMembers.filter(
                          (m) => m.role === 'manager',
                        ).length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Managers</div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <UsersIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {teamHierarchy?.directMembers.filter(
                          (m) => m.role === 'fbo',
                        ).length || 0}
                      </div>
                      <div className="text-sm text-gray-600">FBO</div>
                    </div>
                  </div>
                </div>
              </div>

              <Divider className="mb-6" />

              {viewMode === 'list' ? renderListView() : renderTreeView()}
            </CardBody>
          </Card>
        </div>

        {/* Edit Member Modal */}
        <Modal isOpen={isEditOpen} onOpenChange={onEditOpenChange} size="lg">
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-2">
                <PencilIcon className="w-5 h-5" />
                Modifier le membre
              </div>
            </ModalHeader>
            <ModalBody>
              {editingMember && (
                <div className="space-y-4">
                  <Input
                    label="Nom"
                    value={editingMember.name}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        name: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={editingMember.email}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        email: e.target.value,
                      })
                    }
                  />
                  <Select
                    label="Rôle"
                    selectedKeys={[editingMember.role]}
                    onSelectionChange={(keys) => {
                      const role = Array.from(keys)[0] as 'manager' | 'fbo';
                      setEditingMember({
                        ...editingMember,
                        role,
                      });
                    }}
                  >
                    <SelectItem key="fbo">FBO</SelectItem>
                    <SelectItem key="manager">Manager</SelectItem>
                  </Select>
                  <Select
                    label="Manager"
                    selectedKeys={
                      editingMember.managerId
                        ? [editingMember.managerId.toString()]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const managerId = Array.from(keys)[0] as string;
                      setEditingMember({
                        ...editingMember,
                        managerId: managerId ? parseInt(managerId) : undefined,
                      });
                    }}
                  >
                    {availableManagers.map((manager) => (
                      <SelectItem key={manager.id.toString()}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onEditClose}>
                Annuler
              </Button>
              <Button color="primary" onPress={handleSaveEdit}>
                Sauvegarder
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Member Modal */}
        <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-2">
                <TrashIcon className="w-5 h-5 text-red-500" />
                Supprimer le membre
              </div>
            </ModalHeader>
            <ModalBody>
              <p>
                Êtes-vous sûr de vouloir supprimer{' '}
                <strong>{selectedMember?.name}</strong> de l'équipe ?
              </p>
              <p className="text-sm text-gray-600">
                Cette action est irréversible. Si ce membre est un manager, ses
                membres d'équipe seront automatiquement réassignés.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onDeleteClose}>
                Annuler
              </Button>
              <Button color="danger" onPress={handleConfirmDelete}>
                Supprimer
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
