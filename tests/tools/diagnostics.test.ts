import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProxmoxClient } from "../../src/client/proxmox-client.js";
import {
  diagnosticsToolDefinitions,
  handleDiagnosticsTool,
} from "../../src/tools/diagnostics.js";

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as ProxmoxClient;

describe("diagnosticsToolDefinitions", () => {
  it("exports 4 tool definitions", () => {
    expect(diagnosticsToolDefinitions).toHaveLength(4);
  });

  it("has correct tool names", () => {
    const names = diagnosticsToolDefinitions.map((t) => t.name);
    expect(names).toContain("proxmox_diag_version");
    expect(names).toContain("proxmox_diag_subscription");
    expect(names).toContain("proxmox_diag_services");
    expect(names).toContain("proxmox_diag_syslog");
  });
});

describe("handleDiagnosticsTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("proxmox_diag_version — calls /version and returns data", async () => {
    const mockVersion = { version: "8.2.2", release: "1" };
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockVersion);

    const result = await handleDiagnosticsTool("proxmox_diag_version", {}, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/version");
    expect(result.content[0].text).toBe(JSON.stringify(mockVersion, null, 2));
  });

  it("proxmox_diag_subscription — calls correct endpoint for node", async () => {
    const mockSub = { status: "active", productname: "Proxmox VE" };
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockSub);

    const result = await handleDiagnosticsTool(
      "proxmox_diag_subscription",
      { node: "pve01" },
      mockClient,
    );

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve01/subscription");
    expect(result.content[0].text).toBe(JSON.stringify(mockSub, null, 2));
  });

  it("proxmox_diag_services — calls correct endpoint and returns services", async () => {
    const mockServices = [
      { service: "pvedaemon", name: "PVE Daemon", desc: "PVE worker daemons", state: "running" },
    ];
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockServices);

    const result = await handleDiagnosticsTool(
      "proxmox_diag_services",
      { node: "pve01" },
      mockClient,
    );

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve01/services");
    expect(result.content[0].text).toBe(JSON.stringify(mockServices, null, 2));
  });

  it("proxmox_diag_syslog — appends default limit=50", async () => {
    const mockLogs = [{ t: "some log line", n: 1 }];
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockLogs);

    const result = await handleDiagnosticsTool(
      "proxmox_diag_syslog",
      { node: "pve01" },
      mockClient,
    );

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve01/syslog?limit=50");
    expect(result.content[0].text).toBe(JSON.stringify(mockLogs, null, 2));
  });

  it("proxmox_diag_syslog — uses provided limit", async () => {
    const mockLogs = [{ t: "log", n: 1 }];
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockLogs);

    await handleDiagnosticsTool(
      "proxmox_diag_syslog",
      { node: "pve01", limit: 200 },
      mockClient,
    );

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve01/syslog?limit=200");
  });

  it("proxmox_diag_syslog — throws on limit out of range", async () => {
    await expect(
      handleDiagnosticsTool(
        "proxmox_diag_syslog",
        { node: "pve01", limit: 9999 },
        mockClient,
      ),
    ).rejects.toThrow();
  });

  it("returns unknown tool message for unrecognised tool name", async () => {
    const result = await handleDiagnosticsTool("proxmox_diag_unknown", {}, mockClient);
    expect(result.content[0].text).toBe("Unknown tool: proxmox_diag_unknown");
  });
});
