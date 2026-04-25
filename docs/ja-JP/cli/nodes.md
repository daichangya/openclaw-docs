---
read_when:
    - ペアリングされたNode（camera、canvas、screen）を管理している場合
    - リクエストを承認したり、Nodeコマンドを呼び出したりする必要がある場合
summary: '`openclaw nodes`のCLIリファレンス（ステータス、ペアリング、呼び出し、camera/canvas/screen）'
title: Node
x-i18n:
    generated_at: "2026-04-25T13:44:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a5701ce0dcba399d93f6eed864b0b0ae34320501de0176aeaad1712d392834
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

ペアリングされたNode（デバイス）を管理し、Node機能を呼び出します。

関連:

- Node概要: [Nodes](/ja-JP/nodes)
- Camera: [Camera nodes](/ja-JP/nodes/camera)
- 画像: [Image nodes](/ja-JP/nodes/images)

共通オプション:

- `--url`、`--token`、`--timeout`、`--json`

## 共通コマンド

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list`は保留中/ペアリング済みの表を表示します。ペアリング済みの行には、直近の接続経過時間（Last Connect）が含まれます。
現在接続中のNodeだけを表示するには`--connected`を使用します。一定期間内に接続したNodeだけに絞るには`--last-connected <duration>`を使用します（例: `24h`、`7d`）。

承認に関する注記:

- `openclaw nodes pending`に必要なのはpairingスコープのみです。
- `gateway.nodes.pairing.autoApproveCidrs`は、明示的に信頼された初回`role: node`デバイスペアリングに対してのみ、保留ステップをスキップできます。これはデフォルトでは無効で、アップグレードは承認しません。
- `openclaw nodes approve <requestId>`は、保留中リクエストから追加のスコープ要件を引き継ぎます:
  - コマンドなしリクエスト: pairingのみ
  - 非execのNodeコマンド: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## 呼び出し

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

呼び出しフラグ:

- `--params <json>`: JSONオブジェクト文字列（デフォルトは`{}`）。
- `--invoke-timeout <ms>`: Node呼び出しタイムアウト（デフォルトは`15000`）。
- `--idempotency-key <key>`: 任意の冪等性キー。
- `system.run`と`system.run.prepare`はここではブロックされます。シェル実行には`host=node`付きの`exec`ツールを使用してください。

Node上でシェル実行するには、`openclaw nodes run`の代わりに`host=node`付きの`exec`ツールを使用してください。
`nodes` CLIは現在、機能重視です: `nodes invoke`による直接RPCに加え、pairing、camera、
screen、location、canvas、notificationsに対応します。

## 関連

- [CLI reference](/ja-JP/cli)
- [Nodes](/ja-JP/nodes)
