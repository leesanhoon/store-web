import axios, { AxiosError, type AxiosRequestConfig, type RawAxiosRequestHeaders } from "axios";

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

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "https://backend-api-dotnet9.onrender.com";

const API_LOGGING_ENABLED = process.env.NEXT_PUBLIC_API_LOGGING === "1";

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
});

function isFormData(body: unknown): body is FormData {
    return typeof FormData !== "undefined" && body instanceof FormData;
}

function isBlob(body: unknown): body is Blob {
    return typeof Blob !== "undefined" && body instanceof Blob;
}

function escapeForSingleQuotes(value: string) {
    return value.replace(/'/g, "'\"'\"'");
}

function previewResponseBody(body: unknown) {
    const text = typeof body === "string" ? body : body === undefined || body === null ? "" : JSON.stringify(body);
    const compact = text.replace(/\s+/g, " ").trim();
    return compact.length > 800 ? `${compact.slice(0, 800)}...` : compact;
}

function curlJoin(lines: string[]) {
    return lines.join(" \\\n");
}

function toHeaderRecord(headers?: HeadersInit): RawAxiosRequestHeaders {
    if (!headers) return {};
    const record: RawAxiosRequestHeaders = {};
    new Headers(headers).forEach((value, key) => {
        record[key] = value;
    });
    return record;
}

function toCurlCommand(method: HttpMethod, url: string, headers: HeadersInit, body: unknown) {
    const headerEntries = new Headers(headers);
    const lines = [`curl -X ${method} '${escapeForSingleQuotes(url)}'`];

    Array.from(headerEntries.entries()).forEach(([key, value]) => {
        lines.push(`  -H '${escapeForSingleQuotes(`${key}: ${value}`)}'`);
    });

    if (body === undefined || body === null) {
        return curlJoin(lines);
    }

    if (typeof body === "string") {
        lines.push(`  --data-raw '${escapeForSingleQuotes(body)}'`);
        return curlJoin(lines);
    }

    if (isBlob(body)) {
        lines.push("  --data-binary '[Binary]'");
        return curlJoin(lines);
    }

    if (isFormData(body)) {
        lines.push("  # multipart/form-data");
        body.forEach((value, key) => {
            if (typeof value === "string") {
                lines.push(`  --form-string '${escapeForSingleQuotes(`${key}=${value}`)}'`);
                return;
            }

            const file = value as File;
            const mimePart = file.type ? `;type=${file.type}` : "";
            lines.push(`  -F '${escapeForSingleQuotes(`${key}=@${file.name}${mimePart}`)}'`);
        });
        return curlJoin(lines);
    }

    lines.push(`  --data-raw '${escapeForSingleQuotes(JSON.stringify(body))}'`);
    return curlJoin(lines);
}

function logCurlRequest(method: HttpMethod, url: string, headers: HeadersInit, body: unknown) {
    if (!API_LOGGING_ENABLED) return;
    console.log(`[API REQUEST] ${method} ${url}`);
    console.log(toCurlCommand(method, url, headers, body));
}

function logCurlResponse(method: HttpMethod, url: string, status: number, statusText: string, body: unknown) {
    if (!API_LOGGING_ENABLED) return;
    console.log(`[API RESPONSE] ${method} ${url} -> ${status} ${statusText}`);
    console.log(previewResponseBody(body) || "[empty response]");
}

function getErrorMessage(data: unknown, fallback: string) {
    if (typeof data === "string") return data || fallback;
    if (data && typeof data === "object") {
        const maybeMessage = data as { message?: unknown; title?: unknown; detail?: unknown; errors?: unknown };
        if (typeof maybeMessage.message === "string") return maybeMessage.message;
        if (typeof maybeMessage.detail === "string") return maybeMessage.detail;
        if (typeof maybeMessage.title === "string") return maybeMessage.title;
        return JSON.stringify(data);
    }
    return fallback;
}

function toApiError(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (error instanceof AxiosError) {
        const status = error.response?.status ?? 0;
        const message = getErrorMessage(error.response?.data, error.message || "Request failed");
        return new ApiError(message, status);
    }

    if (error instanceof Error) {
        return new ApiError(error.message || "Request failed", 0);
    }

    return new ApiError("Request failed", 0);
}

async function request<TResponse, TBody = unknown>(
    method: HttpMethod,
    path: string,
    options: RequestOptions<TBody> = {},
): Promise<TResponse> {
    const { body, headers, signal } = options;
    const hasBody = body !== undefined && body !== null;
    const isMultipart = isFormData(body) || isBlob(body);
    const requestHeaders: HeadersInit = {
        Accept: "application/json, text/plain, */*",
        ...(!isMultipart && hasBody ? { "Content-Type": "application/json" } : {}),
        ...headers,
    };
    const url = `${API_BASE_URL}${path}`;

    logCurlRequest(method, url, requestHeaders, body);

    const config: AxiosRequestConfig = {
        url: path,
        method,
        signal,
        headers: toHeaderRecord(requestHeaders),
        data: hasBody ? body : undefined,
    };

    try {
        const response = await axiosClient.request<TResponse>(config);
        logCurlResponse(method, url, response.status, response.statusText, response.data);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            logCurlResponse(method, url, error.response?.status ?? 0, error.response?.statusText ?? "", error.response?.data);
        }
        throw toApiError(error);
    }
}

export const apiClient = {
    get: <TResponse>(path: string, options?: Omit<RequestOptions, "body">) => request<TResponse>("GET", path, options),
    post: <TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<RequestOptions<TBody>, "body">) =>
        request<TResponse, TBody>("POST", path, { ...options, body }),
    put: <TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<RequestOptions<TBody>, "body">) =>
        request<TResponse, TBody>("PUT", path, { ...options, body }),
    patch: <TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<RequestOptions<TBody>, "body">) =>
        request<TResponse, TBody>("PATCH", path, { ...options, body }),
    delete: <TResponse>(path: string, options?: Omit<RequestOptions, "body">) => request<TResponse>("DELETE", path, options),
};

export { ApiError };
