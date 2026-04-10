# mcp-proxmox Claude Code Skills

Claude Code skills for common Proxmox VE operational workflows.

## Skills Reference

| Skill | Command | Description |
|-------|---------|-------------|
| [pve-health](pve-health/SKILL.md) | `/pve-health` | Traffic-light cluster health dashboard (nodes, storage, Ceph, services, disks) |
| [pve-inventory](pve-inventory/SKILL.md) | `/pve-inventory` | Full VM/CT/resource inventory table with VMID, name, type, status, node, CPU, RAM, pool |
| [pve-backup-audit](pve-backup-audit/SKILL.md) | `/pve-backup-audit` | Backup coverage audit — flags VMs/CTs with no backup or backups older than 7 days |
| [pve-resources](pve-resources/SKILL.md) | `/pve-resources` | CPU/RAM overcommit analysis per node — flags >2x CPU or >1.5x RAM overcommit |
| [pve-network](pve-network/SKILL.md) | `/pve-network` | Network topology — bridges, VLANs, bonds, and VM/CT NIC assignments |
| [pve-snapshot-audit](pve-snapshot-audit/SKILL.md) | `/pve-snapshot-audit` | Snapshot age audit across all VMs and CTs — sorted by age, flags snapshots >7 days |
| [pve-updates](pve-updates/SKILL.md) | `/pve-updates` | Available APT updates, current PVE version, and subscription status across all nodes |

## Usage

Skills are invoked via slash commands in Claude Code:

```
/pve-health
/pve-inventory
/pve-backup-audit
/pve-resources
/pve-network
/pve-snapshot-audit
/pve-updates
```

## Naming Convention

All skills follow the pattern `/pve-<action>` per [ADR-0010](https://github.com/itunified-io/infrastructure/blob/main/docs/adr/0010-skill-slash-command-naming-convention.md).

## Tools Used

Each skill uses MCP-first operations via `mcp-proxmox` tools. No direct CLI, SSH, or API calls are made outside of the MCP server.

| Skill | Primary Tools |
|-------|--------------|
| pve-health | `proxmox_node_list`, `proxmox_cluster_status`, `proxmox_storage_list`, `proxmox_ceph_status`, `proxmox_diag_services`, `proxmox_node_disks` |
| pve-inventory | `proxmox_vm_list`, `proxmox_ct_list`, `proxmox_cluster_resources`, `proxmox_pool_list` |
| pve-backup-audit | `proxmox_vm_list`, `proxmox_ct_list`, `proxmox_storage_list`, `proxmox_backup_list` |
| pve-resources | `proxmox_node_list`, `proxmox_node_resources`, `proxmox_vm_list`, `proxmox_ct_list` |
| pve-network | `proxmox_node_networks`, `proxmox_vm_config`, `proxmox_ct_config` |
| pve-snapshot-audit | `proxmox_vm_list`, `proxmox_ct_list`, `proxmox_vm_snapshots`, `proxmox_ct_snapshots` |
| pve-updates | `proxmox_node_list`, `proxmox_node_apt_updates`, `proxmox_diag_version`, `proxmox_diag_subscription` |
