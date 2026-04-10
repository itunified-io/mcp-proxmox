#!/usr/bin/env node
/**
 * mcp-proxmox — MCP server for Proxmox VE monitoring.
 *
 * Transport: stdio only (no SSE, no HTTP endpoint).
 * Authentication: PVEAPIToken via environment variables.
 *
 * Required environment variables:
 *   PROXMOX_API_URL        — e.g. https://pve.example.com:8006
 *   PROXMOX_TOKEN_ID       — e.g. user@pam!mytoken
 *   PROXMOX_TOKEN_SECRET   — the UUID token secret
 *
 * Optional:
 *   PROXMOX_VERIFY_SSL     — "false" to allow self-signed certs (default: true)
 *   PROXMOX_TIMEOUT        — request timeout in ms (default: 30000)
 *
 * Vault (optional — loaded opportunistically):
 *   NAS_VAULT_ADDR         — Vault address
 *   NAS_VAULT_ROLE_ID      — AppRole role ID
 *   NAS_VAULT_SECRET_ID    — AppRole secret ID
 *   NAS_VAULT_KV_MOUNT     — KV mount path (default: kv)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadFromVault } from "./config/vault-loader.js";
import { ProxmoxClient } from "./client/proxmox-client.js";

async function main(): Promise<void> {
  // Opportunistically load credentials from Vault
  await loadFromVault({
    kvPath: "mcp-proxmox/config",
    mapping: {
      url: "PROXMOX_API_URL",
      token_id: "PROXMOX_TOKEN_ID",
      token_secret: "PROXMOX_TOKEN_SECRET",
    },
  });

  const client = ProxmoxClient.fromEnv();

  const server = new Server(
    {
      name: "mcp-proxmox",
      version: "2026.4.10-1",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Tools will be registered here in subsequent tasks
  void client; // referenced to avoid unused variable error

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  process.stderr.write(
    `[mcp-proxmox] Fatal error: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
