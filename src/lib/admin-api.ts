import { auth } from "@/lib/firebase";

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Admin API client that automatically attaches Firebase auth tokens
 */
export async function adminApi<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { skipAuth = false, headers: customHeaders = {}, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  // Attach auth token unless explicitly skipped
  if (!skipAuth) {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const token = await user.getIdToken();
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return { success: false, error: "Failed to get authentication token" };
    }
  }

  try {
    const response = await fetch(endpoint, {
      ...fetchOptions,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `Request failed: ${response.status}`,
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("API request failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

// Convenience methods
export const adminGet = <T = unknown>(endpoint: string, options?: ApiOptions) =>
  adminApi<T>(endpoint, { ...options, method: "GET" });

export const adminPost = <T = unknown>(endpoint: string, body?: unknown, options?: ApiOptions) =>
  adminApi<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(body) });

export const adminPut = <T = unknown>(endpoint: string, body?: unknown, options?: ApiOptions) =>
  adminApi<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) });

export const adminPatch = <T = unknown>(endpoint: string, body?: unknown, options?: ApiOptions) =>
  adminApi<T>(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) });

export const adminDelete = <T = unknown>(endpoint: string, options?: ApiOptions) =>
  adminApi<T>(endpoint, { ...options, method: "DELETE" });
