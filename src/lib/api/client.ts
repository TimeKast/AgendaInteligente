/**
 * API Client - Type-safe fetch wrapper
 *
 * Provides a clean interface for making API requests with:
 * - Automatic JSON serialization
 * - Error handling
 * - TypeScript generics for response types
 * - Request/response interceptors
 *
 * @example
 * const { data, error } = await api.get<User[]>('/api/users');
 * const { data, error } = await api.post<User>('/api/users', { name: 'John' });
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiClientConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  onRequest?: (config: RequestInit) => RequestInit | Promise<RequestInit>;
  onResponse?: <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;
  onError?: (error: ApiError) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client Implementation
// ─────────────────────────────────────────────────────────────────────────────

class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      ...config,
    };
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;

    let requestInit: RequestInit = {
      method,
      headers: this.config.headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    // Apply request interceptor
    if (this.config.onRequest) {
      requestInit = await this.config.onRequest(requestInit);
    }

    try {
      const response = await fetch(url, requestInit);
      const status = response.status;

      // Handle empty responses
      const text = await response.text();
      let data: T | null = null;

      if (text) {
        try {
          data = JSON.parse(text) as T;
        } catch {
          // Not JSON — treat response body as raw text (intentional, not an error)
          data = text as unknown as T;
        }
      }

      // Handle error responses
      if (!response.ok) {
        const error: ApiError = {
          message: ((data as Record<string, unknown>)?.message as string) || response.statusText,
          code: (data as Record<string, unknown>)?.code as string,
          details: data as Record<string, unknown>,
        };

        if (this.config.onError) {
          this.config.onError(error);
        }

        let result: ApiResponse<T> = { data: null, error, status };

        if (this.config.onResponse) {
          result = await this.config.onResponse(result);
        }

        return result;
      }

      let result: ApiResponse<T> = { data, error: null, status };

      if (this.config.onResponse) {
        result = await this.config.onResponse(result);
      }

      return result;
    } catch (err) {
      const error: ApiError = {
        message: err instanceof Error ? err.message : 'Network error',
        code: 'NETWORK_ERROR',
      };

      if (this.config.onError) {
        this.config.onError(error);
      }

      return { data: null, error, status: 0 };
    }
  }

  // HTTP methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body);
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body);
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, body);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory and Default Instance
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new API client instance with custom configuration
 */
export function createApiClient(config?: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}

/**
 * Default API client for internal API routes
 * Configure baseUrl if calling external APIs
 */
export const api = createApiClient();
