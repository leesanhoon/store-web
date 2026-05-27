export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions<TBody = unknown> = {
    body?: TBody;
    headers?: HeadersInit;
    signal?: AbortSignal;
};

class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

const API_BASE_URL = "https://backend-api-dotnet9.onrender.com";

async function parseResponse<TResponse>(response: Response): Promise<TResponse> {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        return (await response.json()) as TResponse;
    }

    return (await response.text()) as TResponse;
}

async function request<TResponse, TBody = unknown>(
    method: HttpMethod,
    path: string,
    options: RequestOptions<TBody> = {},
): Promise<TResponse> {
    const { body, headers, signal } = options;

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        signal,
        headers: {
            accept: "text/plain",
            ...(body ? { "Content-Type": "application/json" } : {}),
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new ApiError(errorMessage || "Request failed", response.status);
    }

    return parseResponse<TResponse>(response);
}

export const apiClient = {
    get: <TResponse>(path: string, options?: Omit<RequestOptions, "body">) =>
        request<TResponse>("GET", path, options),
    post: <TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<RequestOptions<TBody>, "body">) =>
        request<TResponse, TBody>("POST", path, { ...options, body }),
    put: <TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<RequestOptions<TBody>, "body">) =>
        request<TResponse, TBody>("PUT", path, { ...options, body }),
    patch: <TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<RequestOptions<TBody>, "body">) =>
        request<TResponse, TBody>("PATCH", path, { ...options, body }),
    delete: <TResponse>(path: string, options?: Omit<RequestOptions, "body">) =>
        request<TResponse>("DELETE", path, options),
};

export { ApiError };
