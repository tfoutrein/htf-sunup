'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Select,
  SelectItem,
  useDisclosure,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/app/providers';

interface AccessRequest {
  id: number;
  name: string;
  email: string;
  requestedRole: string;
  requestedManagerId?: number;
  status: string;
  message?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

interface AccessRequestWithManager extends AccessRequest {
  requestedManager?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export default function ManageAccessRequestsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [directRequests, setDirectRequests] = useState<
    AccessRequestWithManager[]
  >([]);
  const [teamRequests, setTeamRequests] = useState<AccessRequestWithManager[]>(
    [],
  );
  const [selectedRequest, setSelectedRequest] =
    useState<AccessRequestWithManager | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [managers, setManagers] = useState<
    { id: number; name: string; email: string; role: string }[]
  >([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [actionType, setActionType] = useState<
    'approve' | 'reject' | 'reassign'
  >('approve');
  const [currentRequestName, setCurrentRequestName] = useState<string>('');
  const [currentRequestId, setCurrentRequestId] = useState<number | null>(null);

  useEffect(() => {
    // Récupérer le token côté client uniquement
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (user && token) {
      fetchAccessRequests();
      if (user.role === 'marraine') {
        fetchManagers();
      }
    }
  }, [user, token]);

  const fetchAccessRequests = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/access-requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();

        // Transformer les données pour correspondre à l'interface
        const transformData = (items: any[]) =>
          items.map((item: any) => ({
            ...item.accessRequest,
            requestedManager: item.requestedManager,
          }));

        setDirectRequests(transformData(data.direct || []));
        setTeamRequests(transformData(data.team || []));
      } else {
        toast.error('Erreur lors du chargement des demandes');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des demandes');
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/access-requests/managers/list`,
      );
      if (response.ok) {
        const data = await response.json();
        setManagers(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des managers:', error);
    }
  };

  const fetchRequestDetails = async (requestId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/access-requests/${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedRequest(data);
      } else {
        toast.error('Erreur lors du chargement des détails');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const handleAction = async (
    requestId: number,
    action: 'approve' | 'reject' | 'reassign',
  ) => {
    setIsLoading(true);
    try {
      let response;

      if (action === 'reassign') {
        if (!selectedManagerId) {
          toast.error('Veuillez sélectionner un manager');
          setIsLoading(false);
          return;
        }

        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/access-requests/${requestId}/reassign`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              newManagerId: parseInt(selectedManagerId),
              reviewComment,
            }),
          },
        );
      } else {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/access-requests/${requestId}/${action}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ reviewComment }),
          },
        );
      }

      if (response.ok) {
        const actionText =
          action === 'approve'
            ? 'approuvée'
            : action === 'reject'
              ? 'rejetée'
              : 'réassignée';
        toast.success(`Demande ${actionText} avec succès`);
        fetchAccessRequests();
        onClose();
        setReviewComment('');
        setSelectedManagerId('');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erreur lors du traitement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du traitement');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = async (
    request: AccessRequest,
    action: 'approve' | 'reject' | 'reassign',
  ) => {
    setCurrentRequestName(request.name);
    setCurrentRequestId(request.id);
    setActionType(action);
    setSelectedManagerId('');
    onOpen();
    await fetchRequestDetails(request.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'approved':
        return 'Approuvée';
      case 'rejected':
        return 'Rejetée';
      default:
        return status;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'fbo':
        return "FBO - Membre d'équipe";
      case 'manager':
        return "Manager - Chef d'équipe";
      case 'marraine':
        return 'Manager - Superviseur';
      default:
        return role;
    }
  };

  // Afficher un spinner pendant le chargement de l'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardBody className="text-center p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="ml-3 text-gray-600">Chargement...</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  // Vérifier les permissions après le chargement
  if (!user || (user.role !== 'marraine' && user.role !== 'manager')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardBody className="text-center p-8">
              <p className="text-gray-600">
                Accès non autorisé. Seuls les managers peuvent accéder à cette
                page.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Gestion des demandes d'accès
          </h1>
          <p className="text-gray-600">
            {user.role === 'marraine'
              ? "Gérez les demandes d'accès pour vous et votre équipe"
              : "Gérez les demandes d'accès pour vous et votre équipe"}
          </p>
        </div>

        {/* Demandes directes */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Demandes qui me sont adressées ({directRequests.length})
          </h2>

          {directRequests.length === 0 ? (
            <Card>
              <CardBody className="text-center p-6">
                <p className="text-gray-600">
                  Aucune demande d'accès directe en attente
                </p>
              </CardBody>
            </Card>
          ) : (
            directRequests.map((request) => (
              <Card
                key={`direct-${request.id}`}
                className="w-full border-l-4 border-l-blue-500"
              >
                <CardHeader className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold">{request.name}</h3>
                      <p className="text-sm text-gray-600">{request.email}</p>
                      {request.requestedManager && (
                        <p className="text-xs text-blue-600 font-medium">
                          → Demande pour: {request.requestedManager.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Chip color={getStatusColor(request.status)} variant="flat">
                    {getStatusText(request.status)}
                  </Chip>
                </CardHeader>

                <CardBody className="pt-0">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Rôle demandé:</span>{' '}
                        {getRoleText(request.requestedRole)}
                      </div>
                      <div>
                        <span className="font-medium">Date de demande:</span>{' '}
                        {new Date(request.createdAt).toLocaleDateString(
                          'fr-FR',
                        )}
                      </div>
                    </div>

                    {request.message && (
                      <div>
                        <span className="font-medium text-sm">Message:</span>
                        <p className="text-sm text-gray-600 mt-1">
                          {request.message}
                        </p>
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <>
                        <Divider />
                        <div className="flex gap-3 justify-end">
                          <Button
                            color="danger"
                            variant="light"
                            onPress={() => openModal(request, 'reject')}
                          >
                            Rejeter
                          </Button>
                          {user?.role === 'marraine' && (
                            <Button
                              color="warning"
                              variant="light"
                              onPress={() => openModal(request, 'reassign')}
                            >
                              Réassigner
                            </Button>
                          )}
                          <Button
                            color="success"
                            onPress={() => openModal(request, 'approve')}
                          >
                            Approuver
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>

        {/* Demandes pour l'équipe */}
        {teamRequests.length > 0 && (
          <div className="space-y-4 mt-8">
            <h2 className="text-xl font-semibold text-gray-800">
              Demandes pour mon équipe ({teamRequests.length})
            </h2>

            {teamRequests.map((request) => (
              <Card
                key={`team-${request.id}`}
                className="w-full border-l-4 border-l-green-500"
              >
                <CardHeader className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold">{request.name}</h3>
                      <p className="text-sm text-gray-600">{request.email}</p>
                      {request.requestedManager && (
                        <p className="text-xs text-green-600 font-medium">
                          → Demande pour: {request.requestedManager.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Chip color={getStatusColor(request.status)} variant="flat">
                    {getStatusText(request.status)}
                  </Chip>
                </CardHeader>

                <CardBody className="pt-0">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Rôle demandé:</span>{' '}
                        {getRoleText(request.requestedRole)}
                      </div>
                      <div>
                        <span className="font-medium">Date de demande:</span>{' '}
                        {new Date(request.createdAt).toLocaleDateString(
                          'fr-FR',
                        )}
                      </div>
                    </div>

                    {request.message && (
                      <div>
                        <span className="font-medium text-sm">Message:</span>
                        <p className="text-sm text-gray-600 mt-1">
                          {request.message}
                        </p>
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <>
                        <Divider />
                        <div className="flex gap-3 justify-end">
                          <Button
                            color="danger"
                            variant="light"
                            onPress={() => openModal(request, 'reject')}
                          >
                            Rejeter
                          </Button>
                          {user?.role === 'marraine' && (
                            <Button
                              color="warning"
                              variant="light"
                              onPress={() => openModal(request, 'reassign')}
                            >
                              Réassigner
                            </Button>
                          )}
                          <Button
                            color="success"
                            onPress={() => openModal(request, 'approve')}
                          >
                            Approuver
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Message si aucune demande */}
        {directRequests.length === 0 && teamRequests.length === 0 && (
          <Card className="mt-6">
            <CardBody className="text-center p-8">
              <p className="text-gray-600">Aucune demande d'accès en attente</p>
            </CardBody>
          </Card>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader className="text-gray-900">
            {actionType === 'approve'
              ? 'Approuver la demande'
              : actionType === 'reject'
                ? 'Rejeter la demande'
                : `Réassigner la demande de ${currentRequestName}`}
          </ModalHeader>
          <ModalBody>
            {selectedRequest && (
              <div className="space-y-4">
                {(actionType === 'approve' || actionType === 'reject') && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-gray-900">
                      Détails de la demande
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-900">
                        <span className="font-medium text-gray-900">Nom:</span>{' '}
                        {selectedRequest.name}
                      </p>
                      <p className="text-gray-900">
                        <span className="font-medium text-gray-900">
                          Email:
                        </span>{' '}
                        {selectedRequest.email}
                      </p>
                      <p className="text-gray-900">
                        <span className="font-medium text-gray-900">
                          Rôle demandé:
                        </span>{' '}
                        {getRoleText(selectedRequest.requestedRole)}
                      </p>
                      {selectedRequest.requestedManager && (
                        <p className="text-gray-900">
                          <span className="font-medium text-gray-900">
                            Manager demandé:
                          </span>{' '}
                          {selectedRequest.requestedManager.name}
                        </p>
                      )}
                      {selectedRequest.message && (
                        <div>
                          <span className="font-medium text-gray-900">
                            Message:
                          </span>
                          <p className="text-gray-700 mt-1 font-medium">
                            {selectedRequest.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {actionType === 'reassign' && (
                  <div>
                    <Select
                      label="Nouveau manager"
                      placeholder="Sélectionnez un manager"
                      selectedKeys={
                        selectedManagerId ? [selectedManagerId] : []
                      }
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0];
                        setSelectedManagerId(
                          selectedKey ? selectedKey.toString() : '',
                        );
                      }}
                      variant="bordered"
                      isRequired
                      classNames={{
                        label: '!text-gray-900 font-medium',
                        value: '!text-gray-900 font-medium',
                        trigger: '!text-gray-900',
                        listbox: '!text-gray-900',
                        popoverContent: '!text-gray-900',
                        description: '!text-gray-700 font-medium',
                      }}
                      renderValue={(items) => {
                        return items.map((item) => {
                          const manager = managers.find(
                            (m) => m.id.toString() === item.key,
                          );
                          return (
                            <div
                              key={item.key}
                              className="text-gray-900 font-medium"
                            >
                              {manager ? manager.name : ''}
                            </div>
                          );
                        });
                      }}
                    >
                      {managers.map((manager) => (
                        <SelectItem
                          key={manager.id.toString()}
                          className="!text-gray-900"
                          textValue={manager.name}
                        >
                          <span className="text-gray-900 font-medium">
                            {manager.name}
                          </span>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                )}

                <Textarea
                  label="Commentaire (optionnel)"
                  placeholder={`Ajoutez un commentaire pour ${actionType === 'approve' ? "l'approbation" : actionType === 'reject' ? 'le rejet' : 'la réassignation'}...`}
                  value={reviewComment}
                  onValueChange={setReviewComment}
                  variant="bordered"
                  maxRows={3}
                  classNames={{
                    label: '!text-gray-900 font-medium',
                    input: '!text-gray-900',
                    inputWrapper: '!text-gray-900',
                  }}
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onClose}>
              Annuler
            </Button>
            <Button
              color={
                actionType === 'approve'
                  ? 'success'
                  : actionType === 'reject'
                    ? 'danger'
                    : 'warning'
              }
              onPress={() => {
                if (currentRequestId) {
                  handleAction(currentRequestId, actionType);
                }
              }}
              isLoading={isLoading}
            >
              {actionType === 'approve'
                ? 'Approuver'
                : actionType === 'reject'
                  ? 'Rejeter'
                  : 'Réassigner'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
