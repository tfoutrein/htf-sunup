/**
 * Centralized API configuration
 * Ensures all API calls use the same base URL and authentication
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiClient {
  private static getAuthHeaders(isFormData = false) {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    // Ne pas définir Content-Type pour FormData - le navigateur le fait automatiquement avec boundary
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  static async get(url: string) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return response;
  }

  static async post(url: string, data: any, isFormData = false) {
    const body = isFormData ? data : JSON.stringify(data);

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: this.getAuthHeaders(isFormData),
      body,
    });
    return response;
  }

  static async patch(url: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response;
  }

  static async put(url: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response;
  }

  static async delete(url: string) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response;
  }

  // Public endpoints (no authentication required)
  static async postPublic(url: string, data?: any) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return response;
  }

  static async getPublic(url: string) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
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
  USERS_TEAM_LIST: (managerId: number) => `/users/team-list/${managerId}`,
  USERS_TEAM_HIERARCHY: (managerId: number) =>
    `/users/team-hierarchy/${managerId}`,
  USERS_MY_TEAM_LIST: '/users/team-list/my-team',
  USERS_MY_TEAM_HIERARCHY: '/users/team-hierarchy/my-team',

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
  USER_ACTIONS_PROOF_URL: (id: number) => `/user-actions/${id}/proof`,

  // Campaigns
  CAMPAIGNS: '/campaigns',
  CAMPAIGNS_ACTIVE: '/campaigns/active',
  CAMPAIGNS_BY_ID: (id: number) => `/campaigns/${id}`,
  CAMPAIGNS_WITH_CHALLENGES: (id: number) => `/campaigns/${id}/challenges`,
  CAMPAIGNS_PRESENTATION_VIDEO: (id: number) =>
    `/campaigns/${id}/presentation-video`,

  // Challenges
  CHALLENGES: '/challenges',
  CHALLENGES_TODAY: '/challenges/today',
  CHALLENGES_NEXT: '/challenges/next',
  CHALLENGES_BY_ID: (id: number) => `/challenges/${id}`,
  CHALLENGES_WITH_ACTIONS: (id: number) => `/challenges/${id}/actions`,

  // Daily Bonus
  DAILY_BONUS: '/daily-bonus',
  DAILY_BONUS_MY_BONUSES: '/daily-bonus/my-bonuses',
  DAILY_BONUS_MY_STATS: (campaignId: number) =>
    `/daily-bonus/my-stats/${campaignId}`,
  DAILY_BONUS_BY_ID: (id: number) => `/daily-bonus/${id}`,
  DAILY_BONUS_PROOF: (id: number) => `/daily-bonus/${id}/proof`,
  DAILY_BONUS_CAMPAIGN_BONUSES: (campaignId: number) =>
    `/daily-bonus/campaign/${campaignId}/bonuses`,
  DAILY_BONUS_USER_CAMPAIGN_BONUSES: (userId: number, campaignId: number) =>
    `/daily-bonus/user/${userId}/campaign/${campaignId}`,
  DAILY_BONUS_CONFIG: '/daily-bonus/config',
  DAILY_BONUS_CONFIG_BY_CAMPAIGN: (campaignId: number) =>
    `/daily-bonus/config?campaignId=${campaignId}`,

  // Campaign Validation
  CAMPAIGN_VALIDATION: '/campaign-validation',
} as const;
