/**
 * Centralized API configuration
 * Ensures all API calls use the same base URL and authentication
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiClient {
  private static getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  static async get(endpoint: string): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  static async post(endpoint: string, body?: any): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async put(endpoint: string, body?: any): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async patch(endpoint: string, body?: any): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async delete(endpoint: string): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  static async postPublic(endpoint: string, body?: any): Promise<Response> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('🚀 DEBUG API CALL:', url);
    console.log('🚀 DEBUG API_BASE_URL:', API_BASE_URL);
    console.log('🚀 DEBUG endpoint:', endpoint);
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async getPublic(endpoint: string): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',

  // Users
  USERS: '/users',
  USERS_MANAGERS: '/users/managers',
  USERS_ALL_MEMBERS: '/users/all-members',
  USERS_TEAM: (managerId: number) => `/users/team/${managerId}`,

  // Public Users
  PUBLIC_USERS_MANAGERS: '/public/users/managers',

  // Actions
  ACTIONS: '/actions',
  ACTIONS_MANAGER: (managerId: number) => `/actions/manager/${managerId}`,
  ACTIONS_TEAM_PROGRESS: (managerId: number) =>
    `/actions/team-progress/${managerId}`,
  ACTIONS_TEAM_CAMPAIGN_PROGRESS: (managerId: number, campaignId: number) =>
    `/actions/team-campaign-progress/${managerId}/${campaignId}`,
  ACTIONS_USER_CAMPAIGN_DETAILS: (userId: number, campaignId: number) =>
    `/actions/user/${userId}/campaign-details/${campaignId}`,
  ACTIONS_USER_CHALLENGE: (userId: number, challengeId: number) =>
    `/actions/user/${userId}/challenge/${challengeId}`,
  ACTIONS_USER_CAMPAIGN_STATS: (userId: number, campaignId: number) =>
    `/actions/user/${userId}/campaign-stats/${campaignId}`,
  ACTIONS_USER_STREAKS: (userId: number) => `/actions/user/${userId}/streaks`,
  ACTIONS_USER_BADGES: (userId: number) => `/actions/user/${userId}/badges`,
  ACTIONS_GLOBAL_PROGRESS: '/actions/global-progress',

  // User Actions
  USER_ACTIONS: '/user-actions',
  USER_ACTIONS_BY_ID: (id: number) => `/user-actions/${id}`,
  USER_ACTIONS_PROOF: (id: number) => `/user-actions/${id}/proof`,

  // Campaigns
  CAMPAIGNS: '/campaigns',
  CAMPAIGNS_ACTIVE: '/campaigns/active',
  CAMPAIGNS_BY_ID: (id: number) => `/campaigns/${id}`,
  CAMPAIGNS_WITH_CHALLENGES: (id: number) => `/campaigns/${id}/challenges`,

  // Challenges
  CHALLENGES: '/challenges',
  CHALLENGES_TODAY: '/challenges/today',
  CHALLENGES_BY_ID: (id: number) => `/challenges/${id}`,
  CHALLENGES_WITH_ACTIONS: (id: number) => `/challenges/${id}/actions`,
} as const;
