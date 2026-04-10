import { describe, it, expect } from "vitest";
import axios from "axios";
import { extractError, ProxmoxApiError } from "../../src/utils/errors.js";

function makeAxiosError(opts: {
  code?: string;
  status?: number;
  statusText?: string;
  data?: unknown;
  message?: string;
}) {
  const err = new axios.AxiosError(
    opts.message ?? "Request failed",
    opts.code,
    undefined,
    {},
    opts.status !== undefined
      ? {
          status: opts.status,
          statusText: opts.statusText ?? "",
          data: opts.data,
          headers: {},
          config: {} as never,
        }
      : undefined,
  );
  return err;
}

describe("extractError()", () => {
  it("returns ProxmoxApiError for a generic Error", () => {
    const err = new Error("something went wrong");
    const result = extractError(err, "GET /nodes");

    expect(result).toBeInstanceOf(ProxmoxApiError);
    expect(result.message).toBe("something went wrong");
    expect(result.endpoint).toBe("GET /nodes");
    expect(result.status).toBeUndefined();
  });

  it("returns ProxmoxApiError for unknown non-Error values", () => {
    const result = extractError("some string error", "GET /nodes");

    expect(result).toBeInstanceOf(ProxmoxApiError);
    expect(result.message).toBe("Unknown error occurred");
  });

  it("handles ECONNREFUSED with descriptive message", () => {
    const err = makeAxiosError({ code: "ECONNREFUSED", message: "connect ECONNREFUSED" });
    const result = extractError(err, "GET /nodes");

    expect(result).toBeInstanceOf(ProxmoxApiError);
    expect(result.message).toContain("ECONNREFUSED");
    expect(result.status).toBeUndefined();
  });

  it("handles ENOTFOUND with descriptive message", () => {
    const err = makeAxiosError({ code: "ENOTFOUND", message: "getaddrinfo ENOTFOUND" });
    const result = extractError(err, "GET /nodes");

    expect(result.message).toContain("ENOTFOUND");
  });

  it("handles ETIMEDOUT with descriptive message", () => {
    const err = makeAxiosError({ code: "ETIMEDOUT", message: "timeout" });
    const result = extractError(err, "GET /nodes");

    expect(result.message).toContain("ETIMEDOUT");
  });

  it("handles SSL self-signed cert error with helpful hint", () => {
    const err = makeAxiosError({ code: "DEPTH_ZERO_SELF_SIGNED_CERT", message: "self-signed" });
    const result = extractError(err, "GET /nodes");

    expect(result.message).toContain("PROXMOX_VERIFY_SSL=false");
  });

  it("handles HTTP 401 response error", () => {
    const err = makeAxiosError({
      status: 401,
      statusText: "Unauthorized",
      data: { message: "Invalid credentials" },
    });
    const result = extractError(err, "GET /nodes");

    expect(result).toBeInstanceOf(ProxmoxApiError);
    expect(result.status).toBe(401);
    expect(result.message).toBe("Invalid credentials");
  });

  it("handles HTTP 500 response error without message field", () => {
    const err = makeAxiosError({
      status: 500,
      statusText: "Internal Server Error",
      data: { errors: { field: "validation failed" } },
    });
    const result = extractError(err, "POST /nodes/pve/qemu");

    expect(result).toBeInstanceOf(ProxmoxApiError);
    expect(result.status).toBe(500);
    expect(result.message).toContain("validation failed");
  });

  it("preserves endpoint on all error types", () => {
    const endpoint = "GET /cluster/resources";
    const err = new Error("test");
    const result = extractError(err, endpoint);

    expect(result.endpoint).toBe(endpoint);
  });
});
