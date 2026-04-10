import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ProxmoxClient } from "../../src/client/proxmox-client.js";

describe("ProxmoxClient.fromEnv()", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clean relevant env vars before each test
    delete process.env["PROXMOX_API_URL"];
    delete process.env["PROXMOX_TOKEN_ID"];
    delete process.env["PROXMOX_TOKEN_SECRET"];
    delete process.env["PROXMOX_VERIFY_SSL"];
    delete process.env["PROXMOX_TIMEOUT"];
  });

  afterEach(() => {
    // Restore original env
    process.env["PROXMOX_API_URL"] = originalEnv["PROXMOX_API_URL"];
    process.env["PROXMOX_TOKEN_ID"] = originalEnv["PROXMOX_TOKEN_ID"];
    process.env["PROXMOX_TOKEN_SECRET"] = originalEnv["PROXMOX_TOKEN_SECRET"];
  });

  it("throws when PROXMOX_API_URL is missing", () => {
    process.env["PROXMOX_TOKEN_ID"] = "user@pam!mytoken";
    process.env["PROXMOX_TOKEN_SECRET"] = "test-secret";

    expect(() => ProxmoxClient.fromEnv()).toThrow(
      "PROXMOX_API_URL environment variable is required",
    );
  });

  it("throws when PROXMOX_TOKEN_ID is missing", () => {
    process.env["PROXMOX_API_URL"] = "https://pve.example.com:8006";
    process.env["PROXMOX_TOKEN_SECRET"] = "test-secret";

    expect(() => ProxmoxClient.fromEnv()).toThrow(
      "PROXMOX_TOKEN_ID environment variable is required",
    );
  });

  it("throws when PROXMOX_TOKEN_SECRET is missing", () => {
    process.env["PROXMOX_API_URL"] = "https://pve.example.com:8006";
    process.env["PROXMOX_TOKEN_ID"] = "user@pam!mytoken";

    expect(() => ProxmoxClient.fromEnv()).toThrow(
      "PROXMOX_TOKEN_SECRET environment variable is required",
    );
  });

  it("creates a client with all required env vars set", () => {
    process.env["PROXMOX_API_URL"] = "https://pve.example.com:8006";
    process.env["PROXMOX_TOKEN_ID"] = "user@pam!mytoken";
    process.env["PROXMOX_TOKEN_SECRET"] = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";

    const client = ProxmoxClient.fromEnv();
    expect(client).toBeInstanceOf(ProxmoxClient);
  });

  it("creates a client with SSL verification disabled when PROXMOX_VERIFY_SSL=false", () => {
    process.env["PROXMOX_API_URL"] = "https://pve.example.com:8006";
    process.env["PROXMOX_TOKEN_ID"] = "user@pam!mytoken";
    process.env["PROXMOX_TOKEN_SECRET"] = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
    process.env["PROXMOX_VERIFY_SSL"] = "false";

    // Should not throw — just creates client with verifySsl=false
    const client = ProxmoxClient.fromEnv();
    expect(client).toBeInstanceOf(ProxmoxClient);
  });

  it("creates a client with custom timeout", () => {
    process.env["PROXMOX_API_URL"] = "https://pve.example.com:8006";
    process.env["PROXMOX_TOKEN_ID"] = "user@pam!mytoken";
    process.env["PROXMOX_TOKEN_SECRET"] = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
    process.env["PROXMOX_TIMEOUT"] = "60000";

    const client = ProxmoxClient.fromEnv();
    expect(client).toBeInstanceOf(ProxmoxClient);
  });
});
