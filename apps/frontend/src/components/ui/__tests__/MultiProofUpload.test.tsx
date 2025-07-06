import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MultiProofUpload } from '../MultiProofUpload';
import type { ProofFile } from '@/types/proofs';

// Mock de file pour les tests
const createMockFile = (name: string, type: string = 'image/jpeg'): File => {
  const file = new File(['dummy content'], name, { type });
  return file;
};

const createMockProofFile = (
  name: string,
  type: string = 'image/jpeg',
): ProofFile => {
  return {
    id: Math.random().toString(),
    file: createMockFile(name, type),
    preview:
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  };
};

describe('MultiProofUpload', () => {
  const mockOnFilesChange = vi.fn();

  beforeEach(() => {
    mockOnFilesChange.mockClear();
  });

  it('renders correctly with empty files', () => {
    render(
      <MultiProofUpload
        files={[]}
        onFilesChange={mockOnFilesChange}
        maxFiles={5}
      />,
    );

    expect(
      screen.getByText(/glissez-déposez jusqu'à 5 fichiers/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/parcourir les fichiers/i)).toBeInTheDocument();
  });

  it('displays file count correctly', () => {
    const files = [
      createMockProofFile('test1.jpg'),
      createMockProofFile('test2.jpg'),
    ];

    render(
      <MultiProofUpload
        files={files}
        onFilesChange={mockOnFilesChange}
        maxFiles={5}
      />,
    );

    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('shows files when they are provided', () => {
    const files = [
      createMockProofFile('test1.jpg'),
      createMockProofFile('test2.mp4', 'video/mp4'),
    ];

    render(
      <MultiProofUpload
        files={files}
        onFilesChange={mockOnFilesChange}
        maxFiles={5}
      />,
    );

    expect(screen.getByText('test1.jpg')).toBeInTheDocument();
    expect(screen.getByText('test2.mp4')).toBeInTheDocument();
  });

  it('calls onFilesChange when removing a file', () => {
    const files = [
      createMockProofFile('test1.jpg'),
      createMockProofFile('test2.jpg'),
    ];

    render(
      <MultiProofUpload
        files={files}
        onFilesChange={mockOnFilesChange}
        maxFiles={5}
      />,
    );

    const removeButtons = screen.getAllByRole('button', { name: /supprimer/i });
    fireEvent.click(removeButtons[0]);

    expect(mockOnFilesChange).toHaveBeenCalledWith([files[1]]);
  });

  it('shows max files reached message when at limit', () => {
    const files = Array(5)
      .fill(null)
      .map((_, i) => createMockProofFile(`test${i + 1}.jpg`));

    render(
      <MultiProofUpload
        files={files}
        onFilesChange={mockOnFilesChange}
        maxFiles={5}
      />,
    );

    expect(screen.getByText('5/5')).toBeInTheDocument();
    expect(
      screen.getByText(/limite de fichiers atteinte/i),
    ).toBeInTheDocument();
  });

  it('disables input when disabled prop is true', () => {
    render(
      <MultiProofUpload
        files={[]}
        onFilesChange={mockOnFilesChange}
        maxFiles={5}
        disabled={true}
      />,
    );

    const input = screen.getByRole('button', {
      name: /parcourir les fichiers/i,
    });
    expect(input).toBeDisabled();
  });

  it('validates file types correctly', async () => {
    const invalidFile = createMockFile('test.txt', 'text/plain');

    // Mock FileReader for validation
    Object.defineProperty(window, 'FileReader', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        readAsDataURL: vi.fn(),
        addEventListener: vi.fn(),
        result: 'data:text/plain;base64,test',
      })),
    });

    render(
      <MultiProofUpload
        files={[]}
        onFilesChange={mockOnFilesChange}
        maxFiles={5}
      />,
    );

    // Simuler un drop avec un fichier invalide
    const dropZone = screen.getByRole('button', { name: /glissez-déposez/i });

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [invalidFile],
      },
    });

    // Le composant devrait rejeter le fichier invalide
    expect(mockOnFilesChange).not.toHaveBeenCalled();
  });
});
