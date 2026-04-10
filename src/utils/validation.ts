import { z } from "zod";

/**
 * Shared Zod validation schemas for Proxmox VE tool parameters.
 */

/** PVE node name — alphanumeric, dashes allowed, 1-64 chars */
export const NodeNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/, "Invalid node name");

/** PVE VM/CT ID — must be 100 or higher */
export const VmidSchema = z.number().int().min(100).max(999999999);

/** Storage identifier */
export const StorageIdSchema = z.string().min(1).max(64);

/** Volume identifier (e.g. local:vm-100-disk-0) */
export const VolidSchema = z.string().min(1);

/** Resource pool identifier */
export const PoolIdSchema = z.string().min(1).max(64);

/** VM/CT snapshot name */
export const SnapshotNameSchema = z.string().min(1).max(64);

/** SDN VNet identifier */
export const VnetIdSchema = z.string().min(1).max(64);

/** Replication job identifier */
export const ReplicationIdSchema = z.string().min(1);

/** RRD timeframe for performance graphs */
export const TimeframeSchema = z.enum(["hour", "day", "week", "month", "year"]);

/** Storage content type */
export const ContentTypeSchema = z.enum([
  "images",
  "rootdir",
  "vztmpl",
  "backup",
  "iso",
  "snippets",
]);

/** Syslog line limit (1-5000, default 50) */
export const SyslogLimitSchema = z
  .number()
  .int()
  .min(1)
  .max(5000)
  .optional()
  .default(50);
