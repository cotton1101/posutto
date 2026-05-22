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

/**
 * Reads a fetch Response body as JSON safely.
 *
 * When the API proxy / Node backend is down (or not deployed), requests to
 * `/api/*` fall back to the SPA's `index.html`. Calling `response.json()` on
 * that HTML throws the cryptic `Unexpected token '<', "<!doctype "... is not
 * valid JSON`. This helper detects non-JSON bodies and throws a clear,
 * actionable message instead, while logging the real response for debugging.
 *
 * Returns the parsed JSON for both successful and error responses; callers
 * still inspect `response.ok` themselves to decide how to use the value.
 */
export async function parseJson(response: Response) {
    const text = await response.text();
    const trimmed = text.trim();

    // Empty body
    if (trimmed.length === 0) {
        if (!response.ok) {
            throw new Error(`サーバーエラー (HTTP ${response.status})。時間をおいて再度お試しください。`);
        }
        return {};
    }

    // HTML / non-JSON body (index.html fallback, 403/404/500 error page, etc.)
    const contentType = response.headers.get('content-type') || '';
    if (trimmed.startsWith('<') || (contentType && !contentType.includes('json'))) {
        console.error('[parseJson] Expected JSON but received non-JSON response:', {
            status: response.status,
            url: response.url,
            contentType,
            preview: trimmed.slice(0, 160),
        });
        throw new Error(
            `サーバーAPIに接続できませんでした (HTTP ${response.status})。` +
            `APIがJSONではなくHTMLを返しています。サーバー（プロキシ/Node）が起動しているかご確認ください。`
        );
    }

    // Looks like JSON — parse it
    try {
        return JSON.parse(text);
    } catch {
        console.error('[parseJson] Failed to parse JSON body:', trimmed.slice(0, 160));
        throw new Error(`サーバーから不正な応答が返されました (HTTP ${response.status})。`);
    }
}
