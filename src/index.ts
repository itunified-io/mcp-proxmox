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
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { loadFromVault } from "./config/vault-loader.js";
import { ProxmoxClient } from "./client/proxmox-client.js";
import { nodesToolDefinitions, handleNodesTool } from "./tools/nodes.js";
import { vmsToolDefinitions, handleVmsTool } from "./tools/vms.js";
import {
  containersToolDefinitions,
  handleContainersTool,
} from "./tools/containers.js";
import { storageToolDefinitions, handleStorageTool } from "./tools/storage.js";
import { clusterToolDefinitions, handleClusterTool } from "./tools/cluster.js";
import { backupToolDefinitions, handleBackupTool } from "./tools/backup.js";
import {
  firewallToolDefinitions,
  handleFirewallTool,
} from "./tools/firewall.js";
import {
  diagnosticsToolDefinitions,
  handleDiagnosticsTool,
} from "./tools/diagnostics.js";
import { cephToolDefinitions, handleCephTool } from "./tools/ceph.js";
import { sdnToolDefinitions, handleSdnTool } from "./tools/sdn.js";
import { poolsToolDefinitions, handlePoolsTool } from "./tools/pools.js";
import {
  replicationToolDefinitions,
  handleReplicationTool,
} from "./tools/replication.js";

// Load secrets from Vault (opportunistic, silent no-op if not configured)
await loadFromVault({
  kvPath: "network/hosts/proximo01/services/proxmox-api",
  mapping: {
    url: "PROXMOX_API_URL",
    api_token_id: "PROXMOX_TOKEN_ID",
    api_token_secret: "PROXMOX_TOKEN_SECRET",
  },
});

// Collect all tool definitions
const allToolDefinitions = [
  ...nodesToolDefinitions,
  ...vmsToolDefinitions,
  ...containersToolDefinitions,
  ...storageToolDefinitions,
  ...clusterToolDefinitions,
  ...backupToolDefinitions,
  ...firewallToolDefinitions,
  ...diagnosticsToolDefinitions,
  ...cephToolDefinitions,
  ...sdnToolDefinitions,
  ...poolsToolDefinitions,
  ...replicationToolDefinitions,
];

// Build handler dispatch map
const toolHandlers = new Map<
  string,
  (
    name: string,
    args: Record<string, unknown>,
    client: ProxmoxClient,
  ) => Promise<{ content: Array<{ type: "text"; text: string }> }>
>();

for (const def of nodesToolDefinitions) toolHandlers.set(def.name, handleNodesTool);
for (const def of vmsToolDefinitions) toolHandlers.set(def.name, handleVmsTool);
for (const def of containersToolDefinitions) toolHandlers.set(def.name, handleContainersTool);
for (const def of storageToolDefinitions) toolHandlers.set(def.name, handleStorageTool);
for (const def of clusterToolDefinitions) toolHandlers.set(def.name, handleClusterTool);
for (const def of backupToolDefinitions) toolHandlers.set(def.name, handleBackupTool);
for (const def of firewallToolDefinitions) toolHandlers.set(def.name, handleFirewallTool);
for (const def of diagnosticsToolDefinitions) toolHandlers.set(def.name, handleDiagnosticsTool);
for (const def of cephToolDefinitions) toolHandlers.set(def.name, handleCephTool);
for (const def of sdnToolDefinitions) toolHandlers.set(def.name, handleSdnTool);
for (const def of poolsToolDefinitions) toolHandlers.set(def.name, handlePoolsTool);
for (const def of replicationToolDefinitions) toolHandlers.set(def.name, handleReplicationTool);

const server = new Server(
  { name: "mcp-proxmox", version: "2026.4.10-1" },
  { capabilities: { tools: {} } },
);

const client = ProxmoxClient.fromEnv();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allToolDefinitions,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const handler = toolHandlers.get(name);

  if (!handler) {
    return {
      content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }

  return handler(name, (args ?? {}) as Record<string, unknown>, client);
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  process.stderr.write(
    `[mcp-proxmox] Fatal error: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
