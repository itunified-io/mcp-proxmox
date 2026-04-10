/**
 * Proxmox VE API response type interfaces.
 * All types represent read-only monitoring data from the PVE REST API.
 */

export interface ProxmoxConfig {
  url: string;
  tokenId: string;
  tokenSecret: string;
  verifySsl?: boolean;
  timeout?: number;
}

export interface PveNode {
  node: string;
  status: string;
  cpu: number;
  maxcpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
}

export interface PveNodeStatus {
  node?: string;
  status?: string;
  uptime?: number;
  kversion?: string;
  pveversion?: string;
  cpu?: number;
  wait?: number;
  memory?: {
    free: number;
    total: number;
    used: number;
  };
  swap?: {
    free: number;
    total: number;
    used: number;
  };
  rootfs?: {
    avail: number;
    free: number;
    total: number;
    used: number;
  };
  cpuinfo?: {
    cores: number;
    cpus: number;
    mhz: string;
    model: string;
    sockets: number;
    hvm?: string;
    flags?: string;
  };
  loadavg?: string[];
  ksm?: {
    shared: number;
  };
  boot_info?: {
    mode: string;
    secureboot: number;
  };
}

export interface PveVm {
  vmid: number;
  name: string;
  status: string;
  node: string;
  type: string;
  cpu: number;
  maxcpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
  template?: number;
  tags?: string;
}

export interface PveVmConfig {
  name?: string;
  memory?: number;
  cores?: number;
  sockets?: number;
  cpu?: string;
  ostype?: string;
  boot?: string;
  net0?: string;
  scsi0?: string;
  ide2?: string;
  [key: string]: unknown;
}

export interface PveCt {
  vmid: number;
  name: string;
  status: string;
  node: string;
  type: string;
  cpu: number;
  maxcpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
  template?: number;
  tags?: string;
}

export interface PveStorage {
  storage: string;
  type: string;
  content: string;
  nodes?: string;
  shared?: number;
  enabled?: number;
  active?: number;
  used?: number;
  avail?: number;
  total?: number;
  used_fraction?: number;
}

export interface PveStorageContent {
  volid: string;
  format: string;
  size: number;
  ctime?: number;
  content: string;
  vmid?: number;
  notes?: string;
}

export interface PveClusterStatus {
  type: string;
  id: string;
  name: string;
  ip?: string;
  online?: number;
  nodeid?: number;
  local?: number;
  level?: string;
}

export interface PveClusterResource {
  id: string;
  type: string;
  node?: string;
  status?: string;
  vmid?: number;
  name?: string;
  cpu?: number;
  maxcpu?: number;
  mem?: number;
  maxmem?: number;
  disk?: number;
  maxdisk?: number;
  uptime?: number;
  template?: number;
  tags?: string;
}

export interface PveTask {
  upid: string;
  node: string;
  pid?: number;
  pstart?: number;
  starttime: number;
  endtime?: number;
  type: string;
  id?: string;
  user: string;
  status?: string;
}

export interface PveNetworkInterface {
  iface: string;
  type: string;
  method?: string;
  address?: string;
  netmask?: string;
  gateway?: string;
  cidr?: string;
  bridge_ports?: string;
  bridge_stp?: string;
  bridge_fd?: number;
  autostart?: number;
  active?: number;
}

export interface PveFirewallRule {
  type: string;
  action: string;
  enable?: number;
  comment?: string;
  source?: string;
  dest?: string;
  sport?: string;
  dport?: string;
  proto?: string;
  pos: number;
}

export interface PveCephStatus {
  health?: { status?: string; checks?: Record<string, unknown> };
  pgmap?: Record<string, unknown>;
  osdmap?: Record<string, unknown>;
  monmap?: Record<string, unknown>;
}

export interface PveSnapshot {
  name: string;
  description?: string;
  snaptime?: number;
  parent?: string;
  vmstate?: number;
}

export interface PveService {
  service: string;
  name: string;
  desc: string;
  state: string;
}

export interface PveDisk {
  devpath: string;
  type: string;
  size: number;
  serial?: string;
  model?: string;
  vendor?: string;
  wwn?: string;
  health?: string;
  used?: string;
  gpt?: number;
}

export interface PveReplicationJob {
  id: string;
  type: string;
  source: string;
  target: string;
  guest: number;
  jobnum: number;
  schedule?: string;
  rate?: number;
  comment?: string;
  disable?: number;
  remove_job?: string;
}

export interface PveSdnZone {
  zone: string;
  type: string;
  nodes?: string;
  ipam?: string;
  dns?: string;
}

export interface PveSdnVnet {
  vnet: string;
  zone: string;
  alias?: string;
  tag?: number;
  type?: string;
}

export interface PvePool {
  poolid: string;
  comment?: string;
}

export interface PvePoolDetail {
  poolid: string;
  comment?: string;
  members: PvePoolMember[];
}

export interface PvePoolMember {
  id: string;
  type: string;
  node?: string;
  vmid?: number;
  storage?: string;
}

export interface PveCertificate {
  filename: string;
  fingerprint?: string;
  issuer?: string;
  notafter?: number;
  notbefore?: number;
  san?: string[];
  subject?: string;
}
