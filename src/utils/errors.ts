import axios from "axios";

export class ProxmoxApiError extends Error {
  readonly status: number | undefined;
  readonly endpoint: string;
  readonly details: string | undefined;

  constructor(
    message: string,
    endpoint: string,
    status?: number,
    details?: string,
  ) {
    super(message);
    this.name = "ProxmoxApiError";
    this.endpoint = endpoint;
    this.status = status;
    this.details = details;
  }
}

function sanitizeDetails(data: unknown): string | undefined {
  if (data == null) return undefined;
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    return JSON.stringify(data);
  }
  return String(data);
}

export function extractError(
  error: unknown,
  endpoint: string,
): ProxmoxApiError {
  if (axios.isAxiosError(error)) {
    const response = error.response;

    if (response) {
      const data = response.data as Record<string, unknown> | undefined;

      const message =
        typeof data?.message === "string"
          ? data.message
          : typeof data?.errors === "object" && data.errors !== null
            ? `Proxmox API error: ${JSON.stringify(data.errors)}`
            : `Proxmox API error: ${response.status} ${response.statusText}`;

      const details = sanitizeDetails(data);

      return new ProxmoxApiError(message, endpoint, response.status, details);
    }

    if (error.code === "ECONNREFUSED") {
      return new ProxmoxApiError(
        `Network error: ECONNREFUSED — unable to reach Proxmox API at ${endpoint}`,
        endpoint,
      );
    }

    if (error.code === "ENOTFOUND") {
      return new ProxmoxApiError(
        `Network error: ENOTFOUND — cannot resolve Proxmox host`,
        endpoint,
      );
    }

    if (error.code === "ETIMEDOUT") {
      return new ProxmoxApiError(
        `Network error: ETIMEDOUT — Proxmox API request timed out`,
        endpoint,
      );
    }

    if (
      error.code === "DEPTH_ZERO_SELF_SIGNED_CERT" ||
      error.code === "SELF_SIGNED_CERT_IN_CHAIN" ||
      error.code === "ERR_TLS_CERT_ALTNAME_INVALID"
    ) {
      return new ProxmoxApiError(
        `SSL certificate error: ${error.code} — set PROXMOX_VERIFY_SSL=false to allow self-signed certificates`,
        endpoint,
      );
    }

    return new ProxmoxApiError(
      error.message || "Unknown network error",
      endpoint,
    );
  }

  if (error instanceof Error) {
    return new ProxmoxApiError(error.message, endpoint);
  }

  return new ProxmoxApiError("Unknown error occurred", endpoint);
}
