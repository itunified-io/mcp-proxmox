# mcp-proxmox

<!-- Glama badges will appear here after registry submission -->
<!-- [![Glama](https://glama.ai/mcp/servers/badge)](https://glama.ai/mcp/servers/...) -->

MCP server for **Proxmox VE** — read-only cluster, VM, container, storage, and network monitoring via the PVE REST API v2.

## Features

- **44 read-only tools** across 12 domains: Nodes, VMs, Containers, Storage, Cluster, Backup, Firewall, Diagnostics, Ceph, SDN, Pools, Replication
- **PVEAPIToken authentication** — no username/password, no session cookies
- **Self-signed certificate support** via `PROXMOX_VERIFY_SSL=false`
- **Opportunistic Vault integration** — loads secrets from HashiCorp Vault AppRole if configured
- **7 Claude Code skills** for common operational workflows (`/pve-health`, `/pve-inventory`, etc.)
- **stdio transport** — compatible with Claude Desktop, Claude Code CLI, and any MCP-compliant host

## Installation

### npx (no install required)

```bash
npx @itunified.io/mcp-proxmox
```

### Global install

```bash
npm install -g @itunified.io/mcp-proxmox
mcp-proxmox
```

## Configuration

Set the following environment variables before starting the server:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PROXMOX_API_URL` | Yes | — | PVE base URL, e.g. `https://your-proxmox.example.com:8006` |
| `PROXMOX_TOKEN_ID` | Yes | — | API token ID, e.g. `admin@pam!monitoring` |
| `PROXMOX_TOKEN_SECRET` | Yes | — | API token UUID secret |
| `PROXMOX_VERIFY_SSL` | No | `true` | Set `false` to allow self-signed certificates |
| `PROXMOX_TIMEOUT` | No | `30000` | Request timeout in milliseconds |

### Creating a PVE API Token

In the Proxmox web UI:
1. Go to **Datacenter → Permissions → API Tokens**
2. Create a token for a user with at least **PVEAuditor** role
3. Copy the token secret (shown only once)

## Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "proxmox": {
      "command": "npx",
      "args": ["@itunified.io/mcp-proxmox"],
      "env": {
        "PROXMOX_API_URL": "https://your-proxmox.example.com:8006",
        "PROXMOX_TOKEN_ID": "admin@pam!monitoring",
        "PROXMOX_TOKEN_SECRET": "your-token-secret",
        "PROXMOX_VERIFY_SSL": "false"
      }
    }
  }
}
```

## Claude Code CLI Configuration

```bash
claude mcp add proxmox \
  --env PROXMOX_API_URL=https://your-proxmox.example.com:8006 \
  --env PROXMOX_TOKEN_ID=admin@pam!monitoring \
  --env PROXMOX_TOKEN_SECRET=your-token-secret \
  --env PROXMOX_VERIFY_SSL=false \
  -- npx @itunified.io/mcp-proxmox
```

## Tools

### Nodes (6 tools)

| Tool | Description |
|------|-------------|
| `proxmox_node_list` | List all nodes in the cluster with status, CPU, and memory info |
| `proxmox_node_status` | Get detailed status of a specific node (CPU, memory, swap, rootfs, kernel) |
| `proxmox_node_resources` | Computed resource utilization percentages (CPU%, memory%, disk%) with GB values |
| `proxmox_node_networks` | List network interfaces on a node with optional type filter (bridge, bond, vlan) |
| `proxmox_node_disks` | List physical disks on a node with model, size, serial, and health info |
| `proxmox_node_apt_updates` | List available APT package updates on a node |

### Virtual Machines — QEMU (5 tools)

| Tool | Description |
|------|-------------|
| `proxmox_vm_list` | List all QEMU VMs in the cluster, optionally filtered by node |
| `proxmox_vm_status` | Get current runtime status of a VM (running, stopped, CPU, memory) |
| `proxmox_vm_config` | Get VM configuration (hardware, network, disk, OS settings) |
| `proxmox_vm_snapshots` | List all snapshots for a VM |
| `proxmox_vm_rrd` | Get RRD performance data (CPU, memory, network, disk I/O) for a VM |

### Containers — LXC (5 tools)

| Tool | Description |
|------|-------------|
| `proxmox_ct_list` | List all LXC containers in the cluster, optionally filtered by node |
| `proxmox_ct_status` | Get current runtime status of a container (running, stopped, CPU, memory) |
| `proxmox_ct_config` | Get container configuration (rootfs, network, OS, features) |
| `proxmox_ct_snapshots` | List all snapshots for a container |
| `proxmox_ct_rrd` | Get RRD performance data (CPU, memory, network, disk I/O) for a container |

### Storage (4 tools)

| Tool | Description |
|------|-------------|
| `proxmox_storage_list` | List all storage configurations in the cluster |
| `proxmox_storage_status` | Get status of a specific storage on a node (capacity, usage, availability) |
| `proxmox_storage_content` | List content (volumes, backups, ISOs, templates) in a storage |
| `proxmox_storage_rrd` | Get RRD performance data (read/write throughput, I/O ops) for a storage |

### Cluster (4 tools)

| Tool | Description |
|------|-------------|
| `proxmox_cluster_status` | Get overall cluster status (quorum, nodes, cluster name) |
| `proxmox_cluster_resources` | List all cluster resources (nodes, VMs, containers, storage) |
| `proxmox_cluster_tasks` | List recent cluster-wide tasks with status and timing |
| `proxmox_cluster_log` | Get cluster activity log (configuration changes, task events) |

### Backup (2 tools)

| Tool | Description |
|------|-------------|
| `proxmox_backup_list` | List all backup files in a storage on a node |
| `proxmox_backup_detail` | Get details for a specific backup file by volume ID |

### Firewall (3 tools)

| Tool | Description |
|------|-------------|
| `proxmox_fw_cluster_rules` | List all firewall rules defined at the cluster level |
| `proxmox_fw_vm_rules` | List firewall rules for a specific VM on a given node |
| `proxmox_fw_aliases` | List all firewall aliases defined at the cluster level |

### Diagnostics (4 tools)

| Tool | Description |
|------|-------------|
| `proxmox_diag_version` | Get PVE API version information |
| `proxmox_diag_subscription` | Get subscription status for a node |
| `proxmox_diag_services` | List all system services and their status on a node |
| `proxmox_diag_syslog` | Read recent syslog entries from a node |

### Ceph (4 tools)

| Tool | Description |
|------|-------------|
| `proxmox_ceph_status` | Get Ceph cluster status (returns info message if Ceph not installed) |
| `proxmox_ceph_osd_list` | List all Ceph OSD entries (returns info message if Ceph not installed) |
| `proxmox_ceph_pool_list` | List all Ceph storage pools (returns info message if Ceph not installed) |
| `proxmox_ceph_monitor_list` | List all Ceph MON daemons (returns info message if Ceph not installed) |

### SDN — Software-Defined Networking (3 tools)

| Tool | Description |
|------|-------------|
| `proxmox_sdn_zones` | List all SDN zones configured in the cluster |
| `proxmox_sdn_vnets` | List all SDN virtual networks (VNets) |
| `proxmox_sdn_subnets` | List all subnets within a specific SDN VNet |

### Pools (2 tools)

| Tool | Description |
|------|-------------|
| `proxmox_pool_list` | List all resource pools defined in the cluster |
| `proxmox_pool_members` | Get details and member resources for a specific pool |

### Replication (2 tools)

| Tool | Description |
|------|-------------|
| `proxmox_replication_list` | List all replication jobs configured on a node |
| `proxmox_replication_status` | Get the current status of a specific replication job |

## Skills

Claude Code skills for common operational workflows:

| Skill | Command | Description |
|-------|---------|-------------|
| pve-health | `/pve-health` | Traffic-light cluster health dashboard (nodes, storage, Ceph, services) |
| pve-inventory | `/pve-inventory` | Full VM/CT/resource inventory with VMID, name, type, status, node, CPU, RAM |
| pve-backup-audit | `/pve-backup-audit` | Backup coverage audit — flags VMs with no backup or stale backups (>7 days) |
| pve-resources | `/pve-resources` | CPU/RAM overcommit analysis — flags >2x CPU or >1.5x RAM overcommit |
| pve-network | `/pve-network` | Network topology — bridges, VLANs, and VM/CT assignments |
| pve-snapshot-audit | `/pve-snapshot-audit` | Snapshot age audit — flags snapshots older than 7 days, sorted by age |
| pve-updates | `/pve-updates` | Available APT updates + subscription status + current PVE version |

## License

AGPL-3.0-or-later — see [LICENSE](LICENSE) for details.
