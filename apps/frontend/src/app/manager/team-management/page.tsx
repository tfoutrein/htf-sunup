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
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { addToast } from '@heroui/toast';
import {
  useTeamList,
  useTeamHierarchy,
  useManagers,
  useUpdateUser,
  useDeleteUser,
  type User,
  type TeamMember,
  type TeamHierarchy,
  type UpdateUserData,
} from '@/hooks';

type ViewMode = 'list' | 'tree';
type RoleFilter = 'all' | 'manager' | 'fbo';

export default function TeamManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  // TanStack Query hooks
  const {
    data: teamList = [],
    isLoading: isTeamListLoading,
    error: teamListError,
  } = useTeamList();

  const {
    data: teamHierarchy,
    isLoading: isTeamHierarchyLoading,
    error: teamHierarchyError,
  } = useTeamHierarchy();

  const {
    data: availableManagers = [],
    isLoading: isManagersLoading,
    error: managersError,
  } = useManagers();

  // Mutations
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Combined loading state
  const loading =
    isTeamListLoading || isTeamHierarchyLoading || isManagersLoading;

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
    } catch (error) {
      console.error('Invalid user data:', error);
      router.push('/login');
    }
  }, [router]);

  // Handle errors from queries
  useEffect(() => {
    if (teamListError) {
      console.error('Team list error:', teamListError);
      addToast({
        title: 'Erreur',
        description: "Erreur lors du chargement de l'équipe",
        color: 'danger',
      });
    }

    if (teamHierarchyError) {
      console.error('Team hierarchy error:', teamHierarchyError);
      addToast({
        title: 'Erreur',
        description: 'Erreur lors du chargement de la hiérarchie',
        color: 'danger',
      });
    }

    if (managersError) {
      console.error('Managers error:', managersError);
      addToast({
        title: 'Erreur',
        description: 'Erreur lors du chargement des managers',
        color: 'danger',
      });
    }
  }, [teamListError, teamHierarchyError, managersError]);

  const handleEdit = (member: User) => {
    setEditingMember({ ...member });
    onEditOpen();
  };

  const handleDelete = (member: User) => {
    setSelectedMember(member);
    onDeleteOpen();
  };

  const handleSaveEdit = () => {
    if (!editingMember) return;

    const updateData: UpdateUserData = {
      name: editingMember.name,
      email: editingMember.email,
      role: editingMember.role,
      managerId: editingMember.managerId,
    };

    updateUserMutation.mutate(
      { id: editingMember.id, data: updateData },
      {
        onSuccess: () => {
          addToast({
            title: 'Succès',
            description: 'Membre mis à jour avec succès',
            color: 'success',
          });
          onEditClose();
        },
        onError: (error) => {
          console.error('Error updating member:', error);
          addToast({
            title: 'Erreur',
            description: error.message || 'Erreur lors de la mise à jour',
            color: 'danger',
          });
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!selectedMember) return;

    deleteUserMutation.mutate(selectedMember.id, {
      onSuccess: () => {
        addToast({
          title: 'Succès',
          description: 'Membre supprimé avec succès',
          color: 'success',
        });
        onDeleteClose();
      },
      onError: (error) => {
        console.error('Error deleting member:', error);
        addToast({
          title: 'Erreur',
          description: error.message || 'Erreur lors de la suppression',
          color: 'danger',
        });
      },
    });
  };

  const handleRoleFilterClick = (filter: RoleFilter) => {
    setRoleFilter(filter);
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

  // Fonction pour filtrer les membres d'équipe
  const filterTeamList = (
    members: User[],
    term: string,
    roleFilter: RoleFilter,
  ): User[] => {
    let filteredMembers = members;

    // Filtrer par rôle
    if (roleFilter !== 'all') {
      filteredMembers = filteredMembers.filter(
        (member) => member.role === roleFilter,
      );
    }

    // Filtrer par terme de recherche
    if (term.trim()) {
      const searchTerm = term.toLowerCase();
      filteredMembers = filteredMembers.filter(
        (member) =>
          member.name.toLowerCase().includes(searchTerm) ||
          member.email.toLowerCase().includes(searchTerm),
      );
    }

    return filteredMembers;
  };

  // Fonction pour filtrer l'arborescence
  const filterTeamHierarchy = (
    hierarchy: TeamHierarchy | null,
    term: string,
    roleFilter: RoleFilter,
  ): TeamHierarchy | null => {
    if (!hierarchy || (!term.trim() && roleFilter === 'all')) return hierarchy;

    const searchTerm = term.toLowerCase();

    const filterMembers = (members: TeamMember[]): TeamMember[] => {
      return members.reduce<TeamMember[]>((acc, member) => {
        const roleMatches = roleFilter === 'all' || member.role === roleFilter;
        const memberMatches =
          member.name.toLowerCase().includes(searchTerm) ||
          member.email.toLowerCase().includes(searchTerm);

        const subTeamMatches = member.subTeam && member.subTeam.length > 0;
        const filteredSubTeam = subTeamMatches
          ? filterMembers(member.subTeam)
          : [];

        // Le membre est inclus si :
        // - Il correspond au filtre de rôle ET (correspond au terme de recherche OU n'a pas de terme de recherche)
        // - Ou s'il a des sous-équipes filtrées
        const includeByRole = roleMatches && (memberMatches || !term.trim());

        if (includeByRole || filteredSubTeam.length > 0) {
          acc.push({
            ...member,
            subTeam: filteredSubTeam,
          });
        }

        return acc;
      }, []);
    };

    const filteredDirectMembers = filterMembers(hierarchy.directMembers);

    return {
      ...hierarchy,
      directMembers: filteredDirectMembers,
    };
  };

  // Obtenir les données filtrées
  const filteredTeamList = filterTeamList(teamList, searchTerm, roleFilter);
  const filteredTeamHierarchy = filterTeamHierarchy(
    teamHierarchy,
    searchTerm,
    roleFilter,
  );

  const renderTreeNode = (member: TeamMember, level: number = 0) => {
    const hasChildren = member.subTeam && member.subTeam.length > 0;
    const isExpanded = expandedNodes.has(member.id);

    return (
      <div key={member.id} className="w-full">
        <div
          className="p-3 rounded-lg border transition-colors hover:bg-gray-50"
          style={{ marginLeft: Math.min(level * 16, 48) }} // Limite l'indentation sur mobile
        >
          {/* Desktop layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {hasChildren && (
                <button
                  onClick={() => toggleNodeExpansion(member.id)}
                  className="p-1 rounded hover:bg-gray-200 flex-shrink-0"
                  aria-label={
                    isExpanded
                      ? `Réduire l'équipe de ${member.name}`
                      : `Développer l'équipe de ${member.name}`
                  }
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-6 flex-shrink-0"></div>}

              <Avatar size="sm" name={member.name} className="shrink-0" />

              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-medium truncate">{member.name}</span>
                <span className="text-sm text-gray-500 truncate">
                  {member.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
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
                  aria-label={`Modifier ${member.name}`}
                >
                  <PencilIcon className="w-4 h-4" aria-hidden="true" />
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  isIconOnly
                  onClick={() => handleDelete(member)}
                  aria-label={`Supprimer ${member.name}`}
                >
                  <TrashIcon className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="sm:hidden space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {hasChildren && (
                  <button
                    onClick={() => toggleNodeExpansion(member.id)}
                    className="p-1 rounded hover:bg-gray-200 flex-shrink-0"
                    aria-label={
                      isExpanded
                        ? `Réduire l'équipe de ${member.name}`
                        : `Développer l'équipe de ${member.name}`
                    }
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <ChevronRightIcon
                        className="w-4 h-4"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )}
                {!hasChildren && <div className="w-6 flex-shrink-0"></div>}

                <Avatar size="sm" name={member.name} className="shrink-0" />

                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium truncate">{member.name}</span>
                  <span className="text-sm text-gray-500 truncate">
                    {member.email}
                  </span>
                </div>
              </div>

              <div className="flex gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onClick={() => handleEdit(member)}
                  aria-label={`Modifier ${member.name}`}
                >
                  <PencilIcon className="w-4 h-4" aria-hidden="true" />
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  isIconOnly
                  onClick={() => handleDelete(member)}
                  aria-label={`Supprimer ${member.name}`}
                >
                  <TrashIcon className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
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

  const renderListView = () => {
    if (filteredTeamList.length === 0) {
      return (
        <div className="text-center py-8">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">
            {searchTerm.trim()
              ? 'Aucun membre trouvé'
              : "Aucun membre dans l'équipe"}
          </p>
          {searchTerm.trim() && (
            <p className="text-sm text-gray-400">
              Essayez de modifier votre recherche ou de vider le filtre
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredTeamList.map((member) => (
          <Card key={member.id} className="p-3 sm:p-4">
            {/* Desktop layout */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar size="sm" name={member.name} />
                <div className="flex flex-col min-w-0">
                  <div className="font-medium truncate">{member.name}</div>
                  <div className="text-sm text-gray-500 truncate">
                    {member.email}
                  </div>
                </div>
                <Badge
                  color={member.role === 'manager' ? 'primary' : 'secondary'}
                  variant="flat"
                  size="sm"
                >
                  {member.role === 'manager' ? 'Manager' : 'FBO'}
                </Badge>
                <div className="text-sm text-gray-600 min-w-0">
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
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onClick={() => handleEdit(member)}
                  aria-label={`Modifier ${member.name}`}
                >
                  <PencilIcon className="w-4 h-4" aria-hidden="true" />
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  isIconOnly
                  onClick={() => handleDelete(member)}
                  aria-label={`Supprimer ${member.name}`}
                >
                  <TrashIcon className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            {/* Mobile layout */}
            <div className="md:hidden space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar size="sm" name={member.name} />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="font-medium truncate">{member.name}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {member.email}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    onClick={() => handleEdit(member)}
                    aria-label={`Modifier ${member.name}`}
                  >
                    <PencilIcon className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    isIconOnly
                    onClick={() => handleDelete(member)}
                    aria-label={`Supprimer ${member.name}`}
                  >
                    <TrashIcon className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  color={member.role === 'manager' ? 'primary' : 'secondary'}
                  variant="flat"
                  size="sm"
                >
                  {member.role === 'manager' ? 'Manager' : 'FBO'}
                </Badge>
                <Chip
                  size="sm"
                  variant="flat"
                  color={member.isDirectReport ? 'success' : 'default'}
                >
                  {member.isDirectReport ? 'Direct' : 'Indirect'}
                </Chip>
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-medium">Manager:</span>{' '}
                {member.managerName || 'N/A'}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderTreeView = () => {
    if (
      !filteredTeamHierarchy ||
      filteredTeamHierarchy.directMembers.length === 0
    ) {
      return (
        <div className="text-center py-8">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">
            {searchTerm.trim()
              ? 'Aucun membre trouvé'
              : "Aucun membre dans l'équipe"}
          </p>
          {searchTerm.trim() && (
            <p className="text-sm text-gray-400">
              Essayez de modifier votre recherche ou de vider le filtre
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filteredTeamHierarchy.directMembers.map((member) =>
          renderTreeNode(member),
        )}
      </div>
    );
  };

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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Gestion d'équipe
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Administrez votre équipe et gérez les membres
          </p>
        </div>

        <div className="mb-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-primary" />
                  <h2 className="text-lg sm:text-xl font-semibold">
                    Vue d'ensemble de l'équipe
                  </h2>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'solid' : 'light'}
                    color="primary"
                    startContent={<ListBulletIcon className="w-4 h-4" />}
                    onClick={() => setViewMode('list')}
                    className="flex-1 sm:flex-none"
                  >
                    <span className="hidden xs:inline">Liste</span>
                    <span className="xs:hidden">Liste</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'tree' ? 'solid' : 'light'}
                    color="primary"
                    startContent={<Squares2X2Icon className="w-4 h-4" />}
                    onClick={() => setViewMode('tree')}
                    className="flex-1 sm:flex-none"
                  >
                    <span className="hidden xs:inline">Arborescence</span>
                    <span className="xs:hidden">Arbre</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-0 px-3 sm:px-6">
              {/* Champ de recherche */}
              <div className="mb-6">
                <Input
                  placeholder="Rechercher un membre par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  startContent={
                    <MagnifyingGlassIcon
                      className="w-4 h-4 text-gray-400"
                      aria-hidden="true"
                    />
                  }
                  variant="bordered"
                  className="w-full"
                  isClearable
                  onClear={() => setSearchTerm('')}
                  aria-label="Rechercher un membre par nom ou email"
                  aria-describedby="search-help"
                />
                <div id="search-help" className="sr-only">
                  Tapez le nom ou l'email d'un membre pour filtrer la liste
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <button
                  onClick={() => handleRoleFilterClick('all')}
                  className={`bg-blue-50 p-3 sm:p-4 rounded-lg transition-all hover:bg-blue-100 hover:scale-105 cursor-pointer ${
                    roleFilter === 'all' ? 'ring-2 ring-blue-500 shadow-lg' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <UsersIcon className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xl sm:text-2xl font-bold text-blue-600">
                        {teamHierarchy?.totalMembers || 0}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        Membres totaux
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleFilterClick('manager')}
                  className={`bg-green-50 p-3 sm:p-4 rounded-lg transition-all hover:bg-green-100 hover:scale-105 cursor-pointer ${
                    roleFilter === 'manager'
                      ? 'ring-2 ring-green-500 shadow-lg'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <UsersIcon className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xl sm:text-2xl font-bold text-green-600">
                        {teamHierarchy?.totalManagers || 0}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        Managers
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleFilterClick('fbo')}
                  className={`bg-purple-50 p-3 sm:p-4 rounded-lg transition-all hover:bg-purple-100 hover:scale-105 cursor-pointer ${
                    roleFilter === 'fbo'
                      ? 'ring-2 ring-purple-500 shadow-lg'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <UsersIcon className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xl sm:text-2xl font-bold text-purple-600">
                        {teamHierarchy?.totalFbos || 0}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        FBO
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <Divider className="mb-6" />

              {/* Indicateur de résultats de recherche et filtres */}
              {(searchTerm.trim() || roleFilter !== 'all') && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <MagnifyingGlassIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      {viewMode === 'list' ? (
                        <>
                          <strong>{filteredTeamList.length}</strong> résultat
                          {filteredTeamList.length > 1 ? 's' : ''} trouvé
                          {filteredTeamList.length > 1 ? 's' : ''}
                          {searchTerm.trim() && <> pour "{searchTerm}"</>}
                          {roleFilter !== 'all' && (
                            <>
                              {' '}
                              • Filtre:{' '}
                              {roleFilter === 'manager' ? 'Managers' : 'FBO'}
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          Filtres actifs:
                          {searchTerm.trim() && <> recherche "{searchTerm}"</>}
                          {roleFilter !== 'all' && (
                            <>
                              {' '}
                              • rôle:{' '}
                              {roleFilter === 'manager' ? 'Managers' : 'FBO'}
                            </>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {viewMode === 'list' ? renderListView() : renderTreeView()}
            </CardBody>
          </Card>
        </div>

        {/* Edit Member Modal */}
        <Modal
          isOpen={isEditOpen}
          onOpenChange={onEditOpenChange}
          size="lg"
          classNames={{
            base: 'mx-4',
            backdrop:
              'bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20',
          }}
          aria-labelledby="edit-member-modal-title"
          aria-describedby="edit-member-modal-description"
        >
          <ModalContent className="bg-white">
            <ModalHeader className="flex flex-col gap-1 border-b border-gray-200 pb-4">
              <div className="flex items-center gap-2">
                <PencilIcon
                  className="w-5 h-5 text-blue-600"
                  aria-hidden="true"
                />
                <span
                  id="edit-member-modal-title"
                  className="text-lg font-semibold text-gray-800"
                >
                  Modifier le membre
                </span>
              </div>
              <div id="edit-member-modal-description" className="sr-only">
                Modifiez les informations du membre de l'équipe sélectionné
              </div>
            </ModalHeader>
            <ModalBody className="py-6 px-6">
              {editingMember && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="edit-member-name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Nom complet
                    </label>
                    <Input
                      id="edit-member-name"
                      label="Nom complet"
                      placeholder="Entrez le nom complet"
                      value={editingMember.name}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          name: e.target.value,
                        })
                      }
                      variant="bordered"
                      aria-label="Nom complet du membre"
                      aria-describedby="edit-member-name-desc"
                      classNames={{
                        base: 'w-full',
                        input: 'text-gray-900 placeholder:text-gray-500',
                        inputWrapper:
                          'bg-gray-50 border-gray-300 hover:border-blue-400 focus-within:border-blue-500',
                        label: 'sr-only',
                      }}
                    />
                    <div id="edit-member-name-desc" className="sr-only">
                      Saisissez le nom complet du membre de l'équipe
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="edit-member-email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Adresse email
                    </label>
                    <Input
                      id="edit-member-email"
                      label="Adresse email"
                      type="email"
                      placeholder="exemple@email.com"
                      value={editingMember.email}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          email: e.target.value,
                        })
                      }
                      variant="bordered"
                      aria-label="Adresse email du membre"
                      aria-describedby="edit-member-email-desc"
                      classNames={{
                        base: 'w-full',
                        input: 'text-gray-900 placeholder:text-gray-500',
                        inputWrapper:
                          'bg-gray-50 border-gray-300 hover:border-blue-400 focus-within:border-blue-500',
                        label: 'sr-only',
                      }}
                    />
                    <div id="edit-member-email-desc" className="sr-only">
                      Saisissez l'adresse email du membre de l'équipe
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="edit-member-role"
                      className="text-sm font-medium text-gray-700"
                    >
                      Rôle
                    </label>
                    <Select
                      id="edit-member-role"
                      label="Rôle"
                      placeholder="Sélectionnez un rôle"
                      selectedKeys={[editingMember.role]}
                      onSelectionChange={(keys) => {
                        const role = Array.from(keys)[0] as 'manager' | 'fbo';
                        setEditingMember({
                          ...editingMember,
                          role,
                        });
                      }}
                      variant="bordered"
                      aria-label="Rôle du membre"
                      aria-describedby="edit-member-role-desc"
                      classNames={{
                        base: 'w-full',
                        trigger:
                          'bg-gray-50 border-gray-300 hover:border-blue-400 data-[focus=true]:border-blue-500',
                        value: 'text-gray-900',
                        popoverContent:
                          'bg-white border border-gray-200 shadow-lg',
                        label: 'sr-only',
                      }}
                    >
                      <SelectItem key="fbo" className="text-gray-900">
                        FBO
                      </SelectItem>
                      <SelectItem key="manager" className="text-gray-900">
                        Manager
                      </SelectItem>
                    </Select>
                    <div id="edit-member-role-desc" className="sr-only">
                      Sélectionnez le rôle du membre : FBO ou Manager
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="edit-member-manager"
                      className="text-sm font-medium text-gray-700"
                    >
                      Manager assigné
                    </label>
                    <Select
                      id="edit-member-manager"
                      label="Manager assigné"
                      placeholder="Sélectionnez un manager"
                      selectedKeys={
                        editingMember.managerId
                          ? [editingMember.managerId.toString()]
                          : []
                      }
                      onSelectionChange={(keys) => {
                        const managerId = Array.from(keys)[0] as string;
                        setEditingMember({
                          ...editingMember,
                          managerId: managerId
                            ? parseInt(managerId)
                            : undefined,
                        });
                      }}
                      variant="bordered"
                      aria-label="Manager assigné au membre"
                      aria-describedby="edit-member-manager-desc"
                      classNames={{
                        base: 'w-full',
                        trigger:
                          'bg-gray-50 border-gray-300 hover:border-blue-400 data-[focus=true]:border-blue-500',
                        value: 'text-gray-900',
                        popoverContent:
                          'bg-white border border-gray-200 shadow-lg',
                        label: 'sr-only',
                      }}
                    >
                      {availableManagers.map((manager) => (
                        <SelectItem
                          key={manager.id.toString()}
                          className="text-gray-900"
                        >
                          {manager.name}
                        </SelectItem>
                      ))}
                    </Select>
                    <div id="edit-member-manager-desc" className="sr-only">
                      Sélectionnez le manager qui supervisera ce membre
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter className="flex flex-col-reverse sm:flex-row gap-3 border-t border-gray-200 pt-4">
              <Button
                variant="light"
                onPress={onEditClose}
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                aria-label="Annuler la modification du membre"
              >
                Annuler
              </Button>
              <Button
                color="primary"
                onPress={handleSaveEdit}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium"
                aria-label="Sauvegarder les modifications du membre"
                isLoading={updateUserMutation.isPending}
                disabled={updateUserMutation.isPending}
              >
                Sauvegarder
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Member Modal */}
        <Modal
          isOpen={isDeleteOpen}
          onOpenChange={onDeleteOpenChange}
          classNames={{
            base: 'mx-4',
            backdrop:
              'bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20',
          }}
          aria-labelledby="delete-member-modal-title"
          aria-describedby="delete-member-modal-description"
        >
          <ModalContent className="bg-white">
            <ModalHeader className="flex flex-col gap-1 border-b border-gray-200 pb-4">
              <div className="flex items-center gap-2">
                <TrashIcon
                  className="w-5 h-5 text-red-500"
                  aria-hidden="true"
                />
                <span
                  id="delete-member-modal-title"
                  className="text-lg font-semibold text-gray-800"
                >
                  Supprimer le membre
                </span>
              </div>
              <div id="delete-member-modal-description" className="sr-only">
                Confirmez la suppression du membre de l'équipe sélectionné
              </div>
            </ModalHeader>
            <ModalBody className="py-6 px-6">
              <div className="space-y-4">
                <p className="text-base text-gray-700">
                  Êtes-vous sûr de vouloir supprimer{' '}
                  <strong className="text-gray-900">
                    {selectedMember?.name}
                  </strong>{' '}
                  de l'équipe ?
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800">
                    <strong>Attention :</strong> Cette action est irréversible.
                    Si ce membre est un manager, ses membres d'équipe seront
                    automatiquement réassignés.
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="flex flex-col-reverse sm:flex-row gap-3 border-t border-gray-200 pt-4">
              <Button
                variant="light"
                onPress={onDeleteClose}
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                aria-label="Annuler la suppression du membre"
              >
                Annuler
              </Button>
              <Button
                color="danger"
                onPress={handleConfirmDelete}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-medium"
                aria-label="Confirmer la suppression du membre"
                isLoading={deleteUserMutation.isPending}
                disabled={deleteUserMutation.isPending}
              >
                Supprimer
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
