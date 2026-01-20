import { apiClient, handleApiError, ApiError } from '../api';

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('apiClient', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('emojiApi', () => {
    it('should call getEmojis with correct parameters', async () => {
      const mockResponse = { emojis: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.emoji.getEmojis({
        platforms: ['github'],
        difficulty: 'easy',
        count: 10
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8787/api/emojis?platforms=github&difficulty=easy&count=10',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sessionApi', () => {
    it('should call start with correct data', async () => {
      const mockResponse = { sessionId: 'test-session' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.session.start({
        settings: {
          platforms: ['github'],
          difficulty: 'easy',
          timeLimit: 30,
          questionCount: 10
        }
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8787/api/session/start',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            settings: {
              platforms: ['github'],
              difficulty: 'easy',
              timeLimit: 30,
              questionCount: 10
            }
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });
});

describe('handleApiError', () => {
  it('should handle 400 error', () => {
    const error = new ApiError(400, 'Bad Request');

    expect(handleApiError(error)).toBe('入力データが無効です。再度お試しください。');
  });

  it('should handle 429 error', () => {
    const error = new ApiError(429, 'Rate Limited');

    expect(handleApiError(error)).toContain('リクエストが多すぎます');
  });

  it('should handle network error', () => {
    const error = new ApiError(0, 'Network Error');

    expect(handleApiError(error)).toContain('ネットワーク接続');
  });

  it('should handle unknown error', () => {
    const error = new ApiError(500, 'Unknown');

    expect(handleApiError(error)).toBe('サーバーエラーが発生しました。しばらく待ってから再度お試しください。');
  });
});