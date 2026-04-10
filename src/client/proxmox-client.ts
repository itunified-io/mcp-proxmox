import axios, { type AxiosInstance } from "axios";
import https from "node:https";
import type { ProxmoxConfig } from "./types.js";
import { extractError } from "../utils/errors.js";

/**
 * PVE REST API client.
 *
 * Authentication: PVEAPIToken header (tokenId=tokenSecret).
 * PVE wraps all responses in { data: <actual_data> } — this client unwraps automatically.
 * SSL verification is configurable to support self-signed certificates common on PVE hosts.
 */
export class ProxmoxClient {
  private readonly http: AxiosInstance;

  constructor(private readonly config: ProxmoxConfig) {
    const baseURL = config.url.replace(/\/+$/, "") + "/api2/json";

    this.http = axios.create({
      baseURL,
      timeout: config.timeout ?? 30000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: config.verifySsl ?? true,
      }),
      headers: {
        Authorization: `PVEAPIToken=${config.tokenId}=${config.tokenSecret}`,
        Accept: "application/json",
      },
    });
  }

  /**
   * GET request that unwraps PVE's { data: T } response wrapper.
   */
  async get<T>(path: string): Promise<T> {
    try {
      const response = await this.http.get<{ data: T }>(path);
      return response.data.data;
    } catch (error: unknown) {
      throw extractError(error, `GET ${path}`);
    }
  }

  /**
   * POST request that unwraps PVE's { data: T } response wrapper.
   */
  async post<T>(path: string, data?: unknown): Promise<T> {
    try {
      const response = await this.http.post<{ data: T }>(path, data ?? {}, {
        headers: { "Content-Type": "application/json" },
      });
      return response.data.data;
    } catch (error: unknown) {
      throw extractError(error, `POST ${path}`);
    }
  }

  /**
   * Create a ProxmoxClient from environment variables.
   *
   * Required:
   *   PROXMOX_API_URL        — e.g. https://pve.example.com:8006
   *   PROXMOX_TOKEN_ID       — e.g. user@pam!mytoken
   *   PROXMOX_TOKEN_SECRET   — the UUID secret
   *
   * Optional:
   *   PROXMOX_VERIFY_SSL     — "false" to disable SSL verification (default: true)
   *   PROXMOX_TIMEOUT        — request timeout in ms (default: 30000)
   */
  static fromEnv(): ProxmoxClient {
    const url = process.env["PROXMOX_API_URL"];
    const tokenId = process.env["PROXMOX_TOKEN_ID"];
    const tokenSecret = process.env["PROXMOX_TOKEN_SECRET"];

    if (!url) throw new Error("PROXMOX_API_URL environment variable is required");
    if (!tokenId) throw new Error("PROXMOX_TOKEN_ID environment variable is required");
    if (!tokenSecret) throw new Error("PROXMOX_TOKEN_SECRET environment variable is required");

    const verifySsl = process.env["PROXMOX_VERIFY_SSL"] !== "false";
    const timeout = parseInt(process.env["PROXMOX_TIMEOUT"] ?? "30000", 10);

    return new ProxmoxClient({ url, tokenId, tokenSecret, verifySsl, timeout });
  }
}
