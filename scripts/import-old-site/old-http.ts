import { Agent, request } from "node:https";
import type { IncomingHttpHeaders } from "node:http";
import { setTimeout as sleep } from "node:timers/promises";

// The old WordPress site's TLS certificate expired on 2025-12-09, so certificate
// verification is disabled here and ONLY here: the agent below is used exclusively
// for OLD_ORIGIN (every request is checked against it first) and the process-wide
// NODE_TLS_REJECT_UNAUTHORIZED is never touched. The site is probably compromised,
// so everything it returns is untrusted data: GET only, no redirects, size-capped.
export const OLD_ORIGIN = "https://inlybinhduong.vn";

const TIMEOUT_MS = 30_000;
const REQUEST_GAP_MS = 300;
const MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 1_000;
const MAX_JSON_BYTES = 16 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const RETRYABLE_CODES = new Set(["ECONNRESET", "ETIMEDOUT", "EPIPE", "EAI_AGAIN"]);

const agent = new Agent({ rejectUnauthorized: false, keepAlive: true });

class OldHttpError extends Error {
    retryable: boolean;

    constructor(message: string, retryable: boolean, cause?: unknown) {
        super(message, { cause });
        this.name = "OldHttpError";
        this.retryable = retryable;
    }
}

type RawResponse = { headers: IncomingHttpHeaders; body: Buffer };

export type JsonResponse = { data: unknown; totalPages: number };
export type BufferResponse = { body: Buffer; contentType: string };

let lastResponseAt = 0;

async function politeDelay() {
    const wait = lastResponseAt + REQUEST_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
}

function resolveOldUrl(target: string): URL {
    let url: URL;
    try {
        url = new URL(target, OLD_ORIGIN);
    } catch {
        throw new OldHttpError(`Invalid URL: ${target}`, false);
    }
    if (url.origin !== OLD_ORIGIN) {
        throw new OldHttpError(`Refusing to contact ${url.origin}: only ${OLD_ORIGIN} is allowed`, false);
    }
    return url;
}

function describeNetworkError(error: unknown, url: URL, signal: AbortSignal): OldHttpError {
    if (error instanceof OldHttpError) return error;
    if (signal.aborted) {
        return new OldHttpError(`GET ${url.href} timed out after ${TIMEOUT_MS / 1000} s`, true, error);
    }
    const code = (error as NodeJS.ErrnoException).code ?? "";
    const reason = error instanceof Error ? error.message : String(error);
    const hint = code === "ENOTFOUND" || code === "EAI_AGAIN" || code === "ECONNREFUSED" ? " (are you offline?)" : "";
    return new OldHttpError(`GET ${url.href} failed: ${reason}${hint}`, RETRYABLE_CODES.has(code), error);
}

function get(url: URL, accept: string, maxBytes: number): Promise<RawResponse> {
    const signal = AbortSignal.timeout(TIMEOUT_MS);
    return new Promise<RawResponse>((resolve, reject) => {
        const req = request(
            url,
            { method: "GET", agent, signal, headers: { accept, "user-agent": "store-web-import-old-site/1.0" } },
            (res) => {
                const status = res.statusCode ?? 0;
                if (status !== 200) {
                    res.resume();
                    const location = res.headers.location ? ` (Location: ${res.headers.location})` : "";
                    const message = `GET ${url.href} returned HTTP ${status}${status >= 300 && status < 400 ? `, redirects are not followed${location}` : ""}`;
                    reject(new OldHttpError(message, status === 429 || status >= 500));
                    return;
                }
                const chunks: Buffer[] = [];
                let size = 0;
                res.on("data", (chunk: Buffer) => {
                    size += chunk.length;
                    if (size > maxBytes) {
                        reject(new OldHttpError(`GET ${url.href} response is larger than ${maxBytes} bytes`, false));
                        req.destroy();
                        return;
                    }
                    chunks.push(chunk);
                });
                res.on("end", () => resolve({ headers: res.headers, body: Buffer.concat(chunks) }));
                res.on("error", (error) => reject(describeNetworkError(error, url, signal)));
            },
        );
        req.on("error", (error) => reject(describeNetworkError(error, url, signal)));
        req.end();
    });
}

async function getWithRetry(target: string, accept: string, maxBytes: number): Promise<RawResponse> {
    const url = resolveOldUrl(target);
    for (let attempt = 1; ; attempt++) {
        await politeDelay();
        try {
            return await get(url, accept, maxBytes);
        } catch (error) {
            if (!(error instanceof OldHttpError) || !error.retryable || attempt === MAX_ATTEMPTS) throw error;
            await sleep(RETRY_BACKOFF_MS * 3 ** (attempt - 1));
        } finally {
            lastResponseAt = Date.now();
        }
    }
}

/** GET a path on the old site and parse the body as JSON. `totalPages` comes from `X-WP-TotalPages` (1 when absent). */
export async function getJson(path: string): Promise<JsonResponse> {
    const { headers, body } = await getWithRetry(path, "application/json", MAX_JSON_BYTES);
    let data: unknown;
    try {
        data = JSON.parse(body.toString("utf8"));
    } catch {
        throw new OldHttpError(
            `GET ${path} did not return JSON (content-type: ${headers["content-type"] ?? "none"}, ${body.length} bytes)`,
            false,
        );
    }
    const totalPages = Number.parseInt(String(headers["x-wp-totalpages"] ?? "1"), 10);
    return { data, totalPages: Number.isInteger(totalPages) && totalPages > 0 ? totalPages : 1 };
}

/** GET an absolute `https://inlybinhduong.vn/...` URL as raw bytes. Callers must validate the content. */
export async function getBuffer(url: string): Promise<BufferResponse> {
    const { headers, body } = await getWithRetry(url, "image/*", MAX_IMAGE_BYTES);
    return { body, contentType: String(headers["content-type"] ?? "") };
}
