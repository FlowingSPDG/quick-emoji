import type {
  GetEmojisRequest,
  GetEmojisResponse,
  StartSessionRequest,
  StartSessionResponse,
  AnswerRequest,
  AnswerResponse,
  EndSessionRequest,
  EndSessionResponse,
  LeaderboardResponse
} from '@quick-emoji/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(response.status, errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other errors
    throw new ApiError(0, 'Network error or server unreachable');
  }
}

// Emoji API
export const emojiApi = {
  getEmojis: (params?: GetEmojisRequest): Promise<GetEmojisResponse> => {
    const searchParams = new URLSearchParams();

    if (params?.platforms) {
      searchParams.append('platforms', params.platforms.join(','));
    }
    if (params?.difficulty) {
      searchParams.append('difficulty', params.difficulty);
    }
    if (params?.count) {
      searchParams.append('count', params.count.toString());
    }

    const query = searchParams.toString();
    return apiRequest<GetEmojisResponse>(`/api/emojis${query ? `?${query}` : ''}`);
  },
};

// Session API
export const sessionApi = {
  start: (request: StartSessionRequest): Promise<StartSessionResponse> => {
    return apiRequest<StartSessionResponse>('/api/session/start', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  answer: (request: AnswerRequest): Promise<AnswerResponse> => {
    return apiRequest<AnswerResponse>('/api/session/answer', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  end: (request: EndSessionRequest): Promise<EndSessionResponse> => {
    return apiRequest<EndSessionResponse>('/api/session/end', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },
};

// Leaderboard API
export const leaderboardApi = {
  getLeaderboard: (limit?: number, platform?: string): Promise<LeaderboardResponse> => {
    const searchParams = new URLSearchParams();

    if (limit) {
      searchParams.append('limit', limit.toString());
    }
    if (platform) {
      searchParams.append('platform', platform);
    }

    const query = searchParams.toString();
    return apiRequest<LeaderboardResponse>(`/api/leaderboard${query ? `?${query}` : ''}`);
  },
};

// Utility functions
export const apiClient = {
  emoji: emojiApi,
  session: sessionApi,
  leaderboard: leaderboardApi,
};

// Error handling utilities
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

export const handleApiError = (error: unknown): string => {
  if (isApiError(error)) {
    switch (error.status) {
      case 400:
        return '入力データが無効です。再度お試しください。';
      case 404:
        return 'リソースが見つかりません。';
      case 429:
        return 'リクエストが多すぎます。しばらく待ってから再度お試しください。';
      case 500:
        return 'サーバーエラーが発生しました。しばらく待ってから再度お試しください。';
      case 0:
        return 'ネットワーク接続を確認してください。';
      default:
        return error.message || '予期しないエラーが発生しました。';
    }
  }

  return '予期しないエラーが発生しました。';
};