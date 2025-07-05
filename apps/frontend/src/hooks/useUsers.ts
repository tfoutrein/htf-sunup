'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@/services/api';

// Types
interface User {
  id: number;
  name: string;
  email: string;
  role: 'manager' | 'fbo';
  managerId?: number;
  managerName?: string;
  isDirectReport?: boolean;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

interface TeamMember extends User {
  teamSize: number;
  subTeam: TeamMember[];
}

interface TeamHierarchy {
  id: number;
  name: string;
  email: string;
  role: 'manager' | 'fbo';
  directMembers: TeamMember[];
  totalMembers: number;
  totalManagers: number;
  totalFbos: number;
}

interface UpdateUserData {
  name: string;
  email: string;
  role: 'manager' | 'fbo';
  managerId?: number;
}

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  teamList: () => [...userKeys.all, 'team-list'] as const,
  teamHierarchy: () => [...userKeys.all, 'team-hierarchy'] as const,
  managers: () => [...userKeys.all, 'managers'] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const,
};

// Query Functions
const fetchTeamList = async (): Promise<User[]> => {
  const response = await ApiClient.get('/users/team-list/my-team');
  if (!response.ok) {
    throw new Error('Failed to fetch team list');
  }
  return response.json();
};

const fetchTeamHierarchy = async (): Promise<TeamHierarchy> => {
  const response = await ApiClient.get('/users/team-hierarchy/my-team');
  if (!response.ok) {
    throw new Error('Failed to fetch team hierarchy');
  }
  return response.json();
};

const fetchManagers = async (): Promise<User[]> => {
  const response = await ApiClient.get('/users/managers');
  if (!response.ok) {
    throw new Error('Failed to fetch managers');
  }
  return response.json();
};

const updateUser = async (id: number, data: UpdateUserData): Promise<User> => {
  const response = await ApiClient.patch(`/users/team-member/${id}`, data);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update user');
  }
  return response.json();
};

const deleteUser = async (id: number): Promise<void> => {
  const response = await ApiClient.delete(`/users/team-member/${id}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete user');
  }
};

// Queries
export function useTeamList() {
  return useQuery({
    queryKey: userKeys.teamList(),
    queryFn: fetchTeamList,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useTeamHierarchy() {
  return useQuery({
    queryKey: userKeys.teamHierarchy(),
    queryFn: fetchTeamHierarchy,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useManagers() {
  return useQuery({
    queryKey: userKeys.managers(),
    queryFn: fetchManagers,
    staleTime: 5 * 60 * 1000, // 5 minutes (managers change less frequently)
  });
}

// Mutations
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserData }) =>
      updateUser(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.teamList() });
      await queryClient.cancelQueries({ queryKey: userKeys.teamHierarchy() });

      // Snapshot the previous values
      const previousTeamList = queryClient.getQueryData(userKeys.teamList());
      const previousTeamHierarchy = queryClient.getQueryData(
        userKeys.teamHierarchy(),
      );

      // Optimistically update team list
      queryClient.setQueryData(
        userKeys.teamList(),
        (old: User[] | undefined) => {
          if (!old) return old;
          return old.map((user) =>
            user.id === id
              ? { ...user, ...data, updatedAt: new Date().toISOString() }
              : user,
          );
        },
      );

      return { previousTeamList, previousTeamHierarchy };
    },
    onError: (err, variables, context) => {
      // On error, rollback to previous values
      if (context?.previousTeamList) {
        queryClient.setQueryData(userKeys.teamList(), context.previousTeamList);
      }
      if (context?.previousTeamHierarchy) {
        queryClient.setQueryData(
          userKeys.teamHierarchy(),
          context.previousTeamHierarchy,
        );
      }
    },
    onSuccess: (updatedUser) => {
      // Update specific user in team list
      queryClient.setQueryData(
        userKeys.teamList(),
        (old: User[] | undefined) => {
          if (!old) return old;
          return old.map((user) =>
            user.id === updatedUser.id ? updatedUser : user,
          );
        },
      );

      // Invalidate team hierarchy to refresh the tree structure
      queryClient.invalidateQueries({ queryKey: userKeys.teamHierarchy() });
    },
    onSettled: () => {
      // Always refetch after mutation to ensure consistency
      queryClient.invalidateQueries({ queryKey: userKeys.teamList() });
      queryClient.invalidateQueries({ queryKey: userKeys.teamHierarchy() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.teamList() });
      await queryClient.cancelQueries({ queryKey: userKeys.teamHierarchy() });

      // Snapshot previous data
      const previousTeamList = queryClient.getQueryData(userKeys.teamList());
      const previousTeamHierarchy = queryClient.getQueryData(
        userKeys.teamHierarchy(),
      );

      // Optimistically remove user from team list
      queryClient.setQueryData(
        userKeys.teamList(),
        (old: User[] | undefined) => {
          return old ? old.filter((user) => user.id !== deletedId) : [];
        },
      );

      return { previousTeamList, previousTeamHierarchy };
    },
    onError: (err, deletedId, context) => {
      // On error, rollback to previous data
      if (context?.previousTeamList) {
        queryClient.setQueryData(userKeys.teamList(), context.previousTeamList);
      }
      if (context?.previousTeamHierarchy) {
        queryClient.setQueryData(
          userKeys.teamHierarchy(),
          context.previousTeamHierarchy,
        );
      }
    },
    onSuccess: (_, deletedId) => {
      // Remove the user from cache and invalidate related queries
      queryClient.removeQueries({ queryKey: userKeys.detail(deletedId) });
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: userKeys.teamList() });
      queryClient.invalidateQueries({ queryKey: userKeys.teamHierarchy() });
    },
  });
}

// Re-export types for convenience
export type { User, TeamMember, TeamHierarchy, UpdateUserData };
