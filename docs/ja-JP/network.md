---
read_when:
    - ネットワークアーキテクチャと security の概要が必要
    - local と tailnet アクセス、または pairing をデバッグしている
    - ネットワーク関連ドキュメントの正規一覧が欲しい
summary: 'ネットワークハブ: gateway のサーフェス、pairing、discovery、security'
title: Network
x-i18n:
    generated_at: "2026-04-05T12:49:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a5f39d4f40ad19646d372000c85b663770eae412af91e1c175eb27b22208118
    source_path: network.md
    workflow: 15
---

# ネットワークハブ

このハブは、OpenClaw が localhost、LAN、tailnet をまたいでデバイスをどのように接続し、pairing し、保護するかに関する主要ドキュメントへリンクします。

## コアモデル

ほとんどの操作は Gateway（`openclaw gateway`）を経由します。これは、チャンネル接続と WebSocket コントロールプレーンを管理する単一の長時間実行プロセスです。

- **まず loopback**: Gateway WS のデフォルトは `ws://127.0.0.1:18789` です。
  loopback 以外への bind には、有効な gateway auth パスが必要です。shared-secret の
  token / password auth、または正しく設定された loopback 以外の
  `trusted-proxy` デプロイです。
- **ホストごとに 1 つの Gateway** を推奨します。分離が必要な場合は、分離された profile と port を使って複数の gateway を実行してください（[Multiple Gateways](/gateway/multiple-gateways)）。
- **Canvas host** は Gateway と同じ port（`/__openclaw__/canvas/`、`/__openclaw__/a2ui/`）で提供され、loopback の外に bind される場合は Gateway auth によって保護されます。
- **Remote access** は通常、SSH トンネルまたは Tailscale VPN です（[Remote Access](/gateway/remote)）。

主要な参照先:

- [Gateway architecture](/concepts/architecture)
- [Gateway protocol](/gateway/protocol)
- [Gateway runbook](/gateway)
- [Web surfaces + bind modes](/web)

## Pairing とアイデンティティ

- [Pairing overview (DM + nodes)](/ja-JP/channels/pairing)
- [Gateway-owned node pairing](/gateway/pairing)
- [Devices CLI (pairing + token rotation)](/cli/devices)
- [Pairing CLI (DM approvals)](/cli/pairing)

ローカル信頼:

- 同一ホスト UX を滑らかに保つため、直接の local loopback 接続は pairing で自動承認されることがあります。
- OpenClaw には、信頼された shared-secret ヘルパーフロー向けの、限定的な backend / container-local self-connect パスもあります。
- 同一ホストの tailnet bind を含む tailnet および LAN クライアントでは、依然として明示的な pairing 承認が必要です。

## Discovery と転送

- [Discovery & transports](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [Remote access (SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## Nodes と転送

- [Nodes overview](/nodes)
- [Bridge protocol (legacy nodes, historical)](/gateway/bridge-protocol)
- [Node runbook: iOS](/platforms/ios)
- [Node runbook: Android](/platforms/android)

## Security

- [Security overview](/gateway/security)
- [Gateway config reference](/gateway/configuration)
- [Troubleshooting](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
