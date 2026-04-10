# mcp-proxmox — CLAUDE.md

## Project Overview

**mcp-proxmox** is a slim, read-only MCP server for Proxmox VE cluster monitoring.
It exposes 44 tools across 12 domains via the PVE REST API v2.

**Scope: Read-only monitoring only. No SSH. No write operations. API-only.**
Write operations (VM creation, migration, config changes) belong in the private enterprise repo.

- **Public repo:** [itunified-io/mcp-proxmox](https://github.com/itunified-io/mcp-proxmox)
- **npm package:** `@itunified.io/mcp-proxmox`
- **Versioning:** CalVer — `YYYY.MM.DD.N` (e.g., `v2026.4.10-1`)

## Architecture

```
mcp-proxmox/
  src/
    index.ts              — Entry point: Vault loader + Server + tool dispatch
    client/
      proxmox-client.ts   — Axios-based PVE REST API v2 client (PVEAPIToken auth)
    config/
      vault-loader.ts     — Opportunistic Vault AppRole secret injection
    tools/                — 12 domain tool files (definitions + handlers)
      nodes.ts            — 6 tools: list, status, resources, networks, disks, apt-updates
      vms.ts              — 5 tools: list, status, config, snapshots, rrd
      containers.ts       — 5 tools: list, status, config, snapshots, rrd
      storage.ts          — 4 tools: list, status, content, rrd
      cluster.ts          — 4 tools: status, resources, tasks, log
      backup.ts           — 2 tools: list, detail
      firewall.ts         — 3 tools: cluster-rules, vm-rules, aliases
      diagnostics.ts      — 4 tools: version, subscription, services, syslog
      ceph.ts             — 4 tools: status, osd-list, pool-list, monitor-list
      sdn.ts              — 3 tools: zones, vnets, subnets
      pools.ts            — 2 tools: list, members
      replication.ts      — 2 tools: list, status
    utils/
      errors.ts           — Proxmox error handling + MCP error formatting
      validation.ts       — Zod schema helpers
  tests/                  — Vitest unit tests (119 tests across 14 files)
  .claude/skills/         — 7 Claude Code skills (pve-*)
  dist/                   — Compiled output (gitignored)
```

## Code Conventions

### TypeScript
- Strict TypeScript (`strict: true` in tsconfig.json)
- ES modules with `.js` extensions on all local imports
- Top-level `await` for Vault loading in `index.ts`

### Tool Naming
All tools follow the pattern `proxmox_<domain>_<action>`:
- `proxmox_node_list`, `proxmox_vm_status`, `proxmox_ct_config`, etc.
- Domain prefixes: `node`, `vm`, `ct`, `storage`, `cluster`, `backup`, `fw`, `diag`, `ceph`, `sdn`, `pool`, `replication`

### Zod Validation
- All tool inputs validated with Zod schemas
- Use `z.coerce.number()` for VMID/node params that may arrive as strings
- Error messages returned as MCP text content, never thrown raw

### Error Handling
- All handler functions return `{ content: [{ type: 'text', text: string }] }`
- Proxmox API errors formatted with `formatProxmoxError()` from `utils/errors.ts`
- 404 = "not found", 501 = feature not available (e.g., Ceph not installed)

### Runtime Dependencies (3 only)
- `@modelcontextprotocol/sdk` — MCP server framework
- `axios` — HTTP client for PVE REST API
- `zod` — Input validation

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `PROXMOX_API_URL` | Yes | PVE base URL, e.g. `https://your-proxmox.example.com:8006` |
| `PROXMOX_TOKEN_ID` | Yes | API token ID, e.g. `admin@pam!monitoring` |
| `PROXMOX_TOKEN_SECRET` | Yes | API token UUID secret |
| `PROXMOX_VERIFY_SSL` | No | Set `false` to allow self-signed certs (default: `true`) |
| `PROXMOX_TIMEOUT` | No | Request timeout in ms (default: `30000`) |

### Vault (optional)
| Variable | Description |
|----------|-------------|
| `NAS_VAULT_ADDR` | Vault server address |
| `NAS_VAULT_ROLE_ID` | AppRole role ID |
| `NAS_VAULT_SECRET_ID` | AppRole secret ID |
| `NAS_VAULT_KV_MOUNT` | KV v2 mount path (default: `kv`) |

Vault KV path: `network/hosts/proximo01/services/proxmox-api`
Mapping: `url` → `PROXMOX_API_URL`, `api_token_id` → `PROXMOX_TOKEN_ID`, `api_token_secret` → `PROXMOX_TOKEN_SECRET`

## Security

- **stdio transport only** — no HTTP endpoint, no network exposure
- **PVEAPIToken auth** — API token in `Authorization` header, never logged
- **SSL verification** configurable — set `PROXMOX_VERIFY_SSL=false` for self-signed certs
- **No credential logging** — secrets never written to stderr/stdout
- **Read-only** — all tools are GET requests only; no POST/PUT/DELETE

## Public Repo Documentation Policy (ADR-0004)

This is a **public repository**. All documentation MUST use generic placeholders:
- Hostnames: `your-proxmox.example.com` (not real hostnames)
- IPs: `192.168.1.100` or `10.0.0.1` (not real IPs)
- Token IDs: `admin@pam!monitoring` or `user@pam!token`
- Token secrets: `your-token-secret` or `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

Infrastructure-specific details (real IPs, operational runbooks) belong only in the private infrastructure repo.

## Git Workflow

### Branching — NEVER work on main
- `main` = production state, protected
- All changes via feature branches + PR
- Naming: `feature/<issue-nr>-<description>`, `fix/<issue-nr>-<description>`

### Mandatory per change
- GitHub issue (every code change needs one)
- Commit references issue: `feat: add tool (#42)`
- CHANGELOG.md updated before merge
- CalVer tag + GitHub release after merge

### Commit Style
```
feat: add proxmox_vm_list tool (#5)
fix: handle Ceph 501 not-installed gracefully (#12)
docs: update README tool table (#15)
```

## Skills

Skills live in `.claude/skills/` and follow naming `/pve-<action>`:

| Skill | Command | Description |
|-------|---------|-------------|
| pve-health | `/pve-health` | Traffic-light cluster health dashboard |
| pve-inventory | `/pve-inventory` | Full VM/CT/resource inventory table |
| pve-backup-audit | `/pve-backup-audit` | Backup coverage and freshness audit |
| pve-resources | `/pve-resources` | CPU/RAM overcommit analysis per node |
| pve-network | `/pve-network` | Bridge/VLAN network topology map |
| pve-snapshot-audit | `/pve-snapshot-audit` | Snapshot age audit across all VMs/CTs |
| pve-updates | `/pve-updates` | Available APT updates + subscription status |

See `.claude/skills/README.md` for full skill reference.

## Development Workflow

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Start server (requires env vars)
export PROXMOX_API_URL=https://your-proxmox.example.com:8006
export PROXMOX_TOKEN_ID=admin@pam!monitoring
export PROXMOX_TOKEN_SECRET=your-token-secret
node dist/index.js
```

## Testing

- Framework: Vitest
- 119 unit tests across 14 test files
- Tests use mocked ProxmoxClient (no live API required)
- Run: `npm test`
- All tests must pass before any PR merge

## Pre-Publish Security Scan (ADR-0026)

Before `npm publish`, the `prepublishOnly` hook runs `scripts/prepublish-check.js`.
This blocks publish if forbidden files (`.env`, `.pem`, `.key`, credentials) would be included in the tarball.

Use the `/npm-publish` skill for all publishing — never `npm publish` directly.

## CHANGELOG (mandatory)

Every PR merge gets a CHANGELOG entry. Format:
```markdown
## v2026.04.10.1

- New: proxmox_vm_list tool (#5)
- Fix: handle Ceph 501 gracefully (#12)
```

## Registry Listing (ADR-0018)

This server MUST be listed on:
- [Glama](https://glama.ai) — include security/license/quality badges in README
- [GitHub MCP Servers](https://github.com/modelcontextprotocol/servers)
