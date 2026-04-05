---
read_when:
    - ペアリング済みノード（camera、screen、canvas）を管理しているとき
    - リクエストを承認したりノードコマンドを呼び出したりする必要があるとき
summary: '`openclaw nodes` の CLI リファレンス（status、pairing、invoke、camera/canvas/screen）'
title: nodes
x-i18n:
    generated_at: "2026-04-05T12:39:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ce3095591c4623ad18e3eca8d8083e5c10266fbf94afea2d025f0ba8093a175
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

ペアリング済みノード（デバイス）を管理し、ノード機能を呼び出します。

関連:

- ノード概要: [Nodes](/nodes)
- Camera: [Camera nodes](/nodes/camera)
- 画像: [Image nodes](/nodes/images)

共通オプション:

- `--url`, `--token`, `--timeout`, `--json`

## よく使うコマンド

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

`nodes list` は pending/paired のテーブルを表示します。paired の行には、直近の接続からの経過時間（Last Connect）が含まれます。
現在接続中のノードだけを表示するには `--connected` を使います。`--last-connected <duration>` を使うと、
指定した期間内に接続したノードに絞り込めます（例: `24h`、`7d`）。

承認に関する注記:

- `openclaw nodes pending` に必要なのは pairing スコープのみです。
- `openclaw nodes approve <requestId>` は、保留中リクエストに応じて追加のスコープ要件を継承します。
  - コマンドなしのリクエスト: pairing のみ
  - exec 以外のノードコマンド: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## 呼び出し

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

呼び出しフラグ:

- `--params <json>`: JSON オブジェクト文字列（デフォルト `{}`）。
- `--invoke-timeout <ms>`: ノード呼び出しタイムアウト（デフォルト `15000`）。
- `--idempotency-key <key>`: 任意の idempotency key。
- `system.run` と `system.run.prepare` はここではブロックされます。シェル実行には `host=node` を指定した `exec` tool を使用してください。

ノード上でシェル実行を行うには、`openclaw nodes run` ではなく `host=node` を指定した `exec` tool を使ってください。
`nodes` CLI は現在、機能中心になっています。直接 RPC を行う `nodes invoke` に加え、pairing、camera、
screen、location、canvas、notification を扱います。
