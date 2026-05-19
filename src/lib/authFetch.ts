import { API_BASE } from '../config';

/**
 * Authenticated fetch wrapper.
 * Automatically attaches the Bearer token from localStorage to all requests.
 * Also prepends API_BASE to relative URLs starting with '/api/'.
 */
// Track 401 redirect to prevent multiple simultaneous redirects
let isRedirecting = false;

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('posutto_token');

    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
    };

    // Add auth header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Prepend API_BASE for relative API paths
    const fullUrl = url.startsWith('/api/') ? `${API_BASE}${url}` : url;

    const response = await fetch(fullUrl, {
        ...options,
        headers,
    });

    // Global 401 handling: session expired, force re-login
    // Only redirect once (prevent multiple API calls from triggering multiple redirects)
    if (response.status === 401 && !isRedirecting) {
        isRedirecting = true;
        console.warn('[authFetch] Session expired (401). Redirecting to login.');
        localStorage.removeItem('posutto_token');
        localStorage.removeItem('posutto_user');
        // Use setTimeout to allow the current call stack to complete before redirecting
        setTimeout(() => {
            window.location.href = '/posutto/login';
        }, 100);
    }

    return response;
}

/**
 * Authenticated JSON POST/PUT/DELETE helper.
 */
export async function authJsonFetch(url: string, method: string, body?: unknown): Promise<Response> {
    return authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
}
