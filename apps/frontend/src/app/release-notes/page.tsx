'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  Divider,
  Button,
  Accordion,
  AccordionItem,
} from '@nextui-org/react';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { mockReleaseNotes } from '../../data/release-notes';
import type { AppVersion } from '../../types/app-versions';

export default function ReleaseNotesPage() {
  const router = useRouter();
  const [selectedVersion, setSelectedVersion] = useState<AppVersion | null>(
    null,
  );

  const formatReleaseNotes = (notes: string) => {
    return notes
      .replace(
        /## (.*)/g,
        '<h3 class="text-lg font-semibold mt-4 mb-2 text-primary">$1</h3>',
      )
      .replace(
        /- \*\*(.*?)\*\* :/g,
        '<div class="flex items-start gap-2 mb-1"><span class="text-primary">•</span><span><strong>$1</strong>:</div>',
      )
      .replace(
        /- (.*)/g,
        '<div class="flex items-start gap-2 mb-1"><span class="text-primary">•</span><span>$1</span></div>',
      )
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getVersionIcon = (version: AppVersion) => {
    if (version.isMajor) return '🎉';
    return '✨';
  };

  if (selectedVersion) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            startContent={<ArrowLeft size={16} />}
            onPress={() => setSelectedVersion(null)}
            className="mb-4"
          >
            Retour à la liste
          </Button>

          <Card className="bg-background/60 backdrop-blur-md border border-default-200">
            <CardHeader>
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    {getVersionIcon(selectedVersion)} Version{' '}
                    {selectedVersion.version}
                  </h1>
                  {selectedVersion.isMajor && (
                    <Chip color="primary" variant="flat">
                      Mise à jour majeure
                    </Chip>
                  )}
                </div>
                <h2 className="text-xl text-default-600">
                  {selectedVersion.title}
                </h2>
                <div className="flex items-center gap-4 text-small text-default-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(selectedVersion.releaseDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag size={14} />
                    {selectedVersion.isActive ? 'Active' : 'Archivée'}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardBody>
              <div className="space-y-6">
                {/* Description courte */}
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-default-700 leading-relaxed">
                    {selectedVersion.shortDescription}
                  </p>
                </div>

                <Divider />

                {/* Release notes complètes */}
                {selectedVersion.fullReleaseNotes && (
                  <div
                    className="prose prose-sm max-w-none text-default-600"
                    dangerouslySetInnerHTML={{
                      __html: formatReleaseNotes(
                        selectedVersion.fullReleaseNotes,
                      ),
                    }}
                  />
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📝 Notes de version</h1>
        <p className="text-default-600">
          Découvrez toutes les nouveautés et améliorations de HTF SunUp
        </p>
      </div>

      <div className="space-y-4">
        {mockReleaseNotes.map((version) => (
          <Card
            key={version.id}
            className="bg-background/60 backdrop-blur-md border border-default-200 hover:border-primary/30 transition-colors cursor-pointer"
            isPressable
            onPress={() => setSelectedVersion(version)}
          >
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getVersionIcon(version)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        Version {version.version}
                      </h3>
                      {version.isMajor && (
                        <Chip color="primary" variant="flat" size="sm">
                          Majeure
                        </Chip>
                      )}
                      {!version.isActive && (
                        <Chip color="default" variant="flat" size="sm">
                          Archivée
                        </Chip>
                      )}
                    </div>
                    <p className="text-sm text-default-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(version.releaseDate)}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardBody className="pt-0">
              <h4 className="font-medium mb-2">{version.title}</h4>
              <p className="text-sm text-default-600 line-clamp-2">
                {version.shortDescription}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Message si pas de versions */}
      {mockReleaseNotes.length === 0 && (
        <Card className="bg-background/60 backdrop-blur-md border border-default-200">
          <CardBody className="text-center py-12">
            <p className="text-default-500">
              Aucune note de version disponible pour le moment.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
