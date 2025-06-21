'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Badge,
  Spinner,
  Avatar,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Progress,
  Switch,
} from '@/components/ui';
import { Tabs, Tab } from '@heroui/react';

export default function ComponentsDemo() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [switchValue, setSwitchValue] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [progress, setProgress] = useState(65);

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-4">
            Démonstration des Composants UI
          </h1>
          <div className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Showcase complet du design system Hero UI utilisé dans HTF SunUp
          </div>
          <div className="flex justify-center">
            <Badge color="secondary" variant="flat" size="lg">
              Basé sur Hero UI v2.7
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs aria-label="Components Demo" className="mb-8">
          <Tab key="buttons" title="Boutons & Actions">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
              {/* Buttons */}
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Boutons</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button color="primary">Primary</Button>
                    <Button color="secondary">Secondary</Button>
                    <Button color="success">Success</Button>
                    <Button color="warning">Warning</Button>
                    <Button color="danger">Danger</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="flat" color="primary">
                      Flat
                    </Button>
                    <Button variant="bordered" color="secondary">
                      Bordered
                    </Button>
                    <Button variant="light" color="success">
                      Light
                    </Button>
                    <Button variant="ghost" color="warning">
                      Ghost
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button isLoading color="primary">
                      Loading
                    </Button>
                    <Button isDisabled>Disabled</Button>
                  </div>
                </CardBody>
              </Card>

              {/* Modal */}
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Modal</h3>
                </CardHeader>
                <CardBody>
                  <Button onPress={onOpen} color="warning">
                    Ouvrir Modal
                  </Button>
                  <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                    <ModalContent>
                      {(onClose) => (
                        <>
                          <ModalHeader className="flex flex-col gap-1">
                            Exemple de Modal
                          </ModalHeader>
                          <ModalBody>
                            <p>
                              Ceci est un exemple de modal utilisant Hero UI.
                              Les modals sont parfaites pour les confirmations,
                              formulaires ou affichage d'informations
                              détaillées.
                            </p>
                          </ModalBody>
                          <ModalFooter>
                            <Button
                              color="danger"
                              variant="light"
                              onPress={onClose}
                            >
                              Fermer
                            </Button>
                            <Button color="primary" onPress={onClose}>
                              Action
                            </Button>
                          </ModalFooter>
                        </>
                      )}
                    </ModalContent>
                  </Modal>
                </CardBody>
              </Card>

              {/* Switch */}
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Switch</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <Switch
                    isSelected={switchValue}
                    onValueChange={setSwitchValue}
                    color="warning"
                  >
                    Mode sombre
                  </Switch>
                  <Switch size="sm" color="primary">
                    Small
                  </Switch>
                  <Switch size="lg" color="success">
                    Large
                  </Switch>
                  <Switch isDisabled>Disabled</Switch>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="data" title="Données & Feedback">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
              {/* Badges */}
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Badges</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge color="primary">Primary</Badge>
                    <Badge color="secondary">Secondary</Badge>
                    <Badge color="success">Success</Badge>
                    <Badge color="warning">Warning</Badge>
                    <Badge color="danger">Danger</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="flat" color="primary">
                      Flat
                    </Badge>
                    <Badge variant="bordered" color="secondary">
                      Bordered
                    </Badge>
                    <Badge variant="dot" color="success">
                      Dot
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge size="sm">Small</Badge>
                    <Badge size="md">Medium</Badge>
                    <Badge size="lg">Large</Badge>
                  </div>
                </CardBody>
              </Card>

              {/* Progress */}
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Progress</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="space-y-3">
                    <Progress
                      value={progress}
                      color="warning"
                      className="max-w-md"
                    />
                    <Progress
                      value={30}
                      color="primary"
                      size="sm"
                      className="max-w-md"
                    />
                    <Progress
                      value={70}
                      color="success"
                      size="md"
                      className="max-w-md"
                    />
                    <Progress
                      value={90}
                      color="danger"
                      size="lg"
                      className="max-w-md"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onPress={() => setProgress(Math.max(0, progress - 10))}
                    >
                      -10%
                    </Button>
                    <Button
                      size="sm"
                      onPress={() => setProgress(Math.min(100, progress + 10))}
                    >
                      +10%
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Spinners */}
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Spinners</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Spinner size="sm" color="primary" />
                    <Spinner size="md" color="warning" />
                    <Spinner size="lg" color="success" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Spinner color="danger" />
                    <Spinner color="secondary" />
                    <Spinner color="default" />
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="forms" title="Formulaires & Inputs">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
              {/* Inputs */}
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Inputs</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <Input
                    label="Email"
                    placeholder="Entrez votre email"
                    value={inputValue}
                    onValueChange={setInputValue}
                  />
                  <Input
                    label="Mot de passe"
                    placeholder="Entrez votre mot de passe"
                    type="password"
                    variant="bordered"
                  />
                  <Input
                    label="Recherche"
                    placeholder="Rechercher..."
                    startContent="🔍"
                    variant="flat"
                  />
                  <Input
                    label="Montant"
                    placeholder="0.00"
                    endContent="€"
                    type="number"
                    variant="faded"
                  />
                  <Input
                    label="Disabled"
                    placeholder="Champ désactivé"
                    isDisabled
                  />
                </CardBody>
              </Card>

              {/* Avatars */}
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Avatars</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar size="sm" name="John" />
                    <Avatar size="md" name="Jane" />
                    <Avatar size="lg" name="Bob" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Avatar src="https://i.pravatar.cc/150?u=user1" size="md" />
                    <Avatar src="https://i.pravatar.cc/150?u=user2" size="md" />
                    <Avatar src="https://i.pravatar.cc/150?u=user3" size="md" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Avatar name="A" color="primary" />
                    <Avatar name="B" color="secondary" />
                    <Avatar name="C" color="success" />
                    <Avatar name="D" color="warning" />
                    <Avatar name="E" color="danger" />
                  </div>
                </CardBody>
              </Card>

              {/* Cards */}
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Cards</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <Card className="max-w-[300px]" shadow="sm">
                    <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                      <p className="text-tiny uppercase font-bold">Daily Mix</p>
                      <small className="text-default-500">12 Tracks</small>
                      <h4 className="font-bold text-large">Frontend Radio</h4>
                    </CardHeader>
                    <CardBody className="overflow-visible py-2">
                      <div className="w-full h-[140px] bg-gradient-to-r from-orange-300 to-amber-300 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">🎵</span>
                      </div>
                    </CardBody>
                  </Card>
                </CardBody>
              </Card>
            </div>
          </Tab>
        </Tabs>

        {/* Footer */}
        <div className="text-center mt-12 p-6 bg-white/50 rounded-xl">
          <div className="text-gray-600">
            Ces composants font partie du design system HTF SunUp basé sur{' '}
            <Badge color="primary" variant="flat">
              Hero UI
            </Badge>
          </div>
        </div>
      </div>
    </main>
  );
}
