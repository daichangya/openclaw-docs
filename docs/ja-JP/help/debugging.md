---
read_when:
    - reasoning 漏洩を調べるために生のモデル出力を確認する必要がある場合
    - 反復作業中に Gateway を watch mode で実行したい場合
    - 再現可能なデバッグワークフローが必要な場合
summary: 'デバッグ用ツール: watch mode、生のモデルストリーム、reasoning 漏洩の追跡'
title: Debugging
x-i18n:
    generated_at: "2026-04-05T12:46:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: f90d944ecc2e846ca0b26a162126ceefb3a3c6cf065c99b731359ec79d4289e3
    source_path: help/debugging.md
    workflow: 15
---

# Debugging

このページでは、特に
プロバイダーが reasoning を通常のテキストに混在させる場合の、ストリーミング出力用デバッグヘルパーを扱います。

## ランタイムデバッグオーバーライド

チャットで `/debug` を使うと、**ランタイム専用** の設定オーバーライド（ディスクではなくメモリ）を設定できます。
`/debug` はデフォルトで無効です。有効にするには `commands.debug: true` を設定してください。
これは、`openclaw.json` を編集せずにわかりにくい設定を切り替える必要があるときに便利です。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` はすべてのオーバーライドをクリアし、ディスク上の設定に戻します。

## Gateway watch mode

高速に反復するには、ファイルウォッチャーの下で Gateway を実行します:

```bash
pnpm gateway:watch
```

これは次にマップされます:

```bash
node scripts/watch-node.mjs gateway --force
```

ウォッチャーは、`src/` 配下のビルド関連ファイル、extension のソースファイル、
extension の `package.json` と `openclaw.plugin.json` メタデータ、`tsconfig.json`、
`package.json`、および `tsdown.config.ts` に対して再起動します。Extension メタデータの変更では
`tsdown` の再ビルドを強制せずに Gateway を再起動しますが、ソースと設定の変更では引き続き
先に `dist` を再ビルドします。

`gateway:watch` の後に Gateway CLI フラグを追加すると、
毎回の再起動時にそれらが渡されます。

## Dev profile + dev gateway（`--dev`）

dev profile を使うと、状態を分離し、
デバッグ用に安全で使い捨て可能なセットアップを起動できます。`--dev` フラグは **2 種類** あります:

- **グローバル `--dev`（profile）:** 状態を `~/.openclaw-dev` の下に分離し、
  Gateway ポートをデフォルトで `19001` にします（派生ポートもそれに合わせてずれます）。
- **`gateway --dev`:** 欠けている場合に、デフォルト設定 + ワークスペースを
  自動作成するよう Gateway に指示します（また、`BOOTSTRAP.md` をスキップします）。

推奨フロー（dev profile + dev bootstrap）:

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

まだグローバルインストールがない場合は、`pnpm openclaw ...` で CLI を実行してください。

これが行うこと:

1. **Profile の分離**（グローバル `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas もそれに応じてずれます）

2. **Dev bootstrap**（`gateway --dev`）
   - 欠けている場合は最小構成を書き込みます（`gateway.mode=local`、bind loopback）。
   - `agent.workspace` を dev workspace に設定します。
   - `agent.skipBootstrap=true` を設定します（`BOOTSTRAP.md` なし）。
   - 欠けている場合はワークスペースファイルをシードします:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`。
   - デフォルト identity: **C3‑PO**（protocol droid）。
   - dev mode では channel provider をスキップします（`OPENCLAW_SKIP_CHANNELS=1`）。

リセットフロー（新規開始）:

```bash
pnpm gateway:dev:reset
```

注意: `--dev` は**グローバル** profile フラグであり、一部のランナーでは吸収されます。
明示的に指定する必要がある場合は、env var 形式を使ってください:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` は設定、認証情報、セッション、および dev workspace を
（`rm` ではなく `trash` を使って）消去し、その後デフォルトの dev セットアップを再作成します。

ヒント: すでに非 dev の Gateway が動作中（launchd/systemd）であれば、先に停止してください:

```bash
openclaw gateway stop
```

## 生ストリームロギング（OpenClaw）

OpenClaw は、フィルタリング/整形前の**生の assistant ストリーム**を記録できます。
これは、reasoning がプレーンテキストの差分として届いているのか
（あるいは別個の thinking ブロックとして届いているのか）を確認する最良の方法です。

CLI から有効化するには:

```bash
pnpm gateway:watch --raw-stream
```

任意のパス上書き:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

同等の env var:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

デフォルトファイル:

`~/.openclaw/logs/raw-stream.jsonl`

## 生チャンクロギング（pi-mono）

ブロックへ解析される前の**生の OpenAI 互換チャンク**を取得するために、
pi-mono は別個のロガーを公開しています:

```bash
PI_RAW_STREAM=1
```

任意のパス:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

デフォルトファイル:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注意: これは、pi-mono の
> `openai-completions` provider を使用するプロセスでのみ出力されます。

## 安全上の注意

- 生ストリームログには、完全なプロンプト、ツール出力、ユーザーデータが含まれる場合があります。
- ログはローカルに保持し、デバッグ後に削除してください。
- ログを共有する場合は、先にシークレットと PII を除去してください。
