---
read_when:
    - '`/new`、`/reset`、`/stop`、およびエージェントのライフサイクルイベント向けのイベント駆動型自動化が必要な場合'
    - hooksの構築、インストール、またはデバッグを行いたい場合
summary: Hooks：コマンドとライフサイクルイベントのためのイベント駆動型自動化
title: Hooks
x-i18n:
    generated_at: "2026-04-05T12:34:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eb75bb2b3b2ad229bf3da24fdb0fe021ed08f812fd1d13c69b3bd9df0218e5
    source_path: automation/hooks.md
    workflow: 15
---

# Hooks

Hooksは、Gateway内で何かが起きたときに実行される小さなスクリプトです。ディレクトリから自動的に検出され、`openclaw hooks`で確認できます。

OpenClawには2種類のhooksがあります。

- **内部hooks**（このページ）: `/new`、`/reset`、`/stop`、またはライフサイクルイベントのようなエージェントイベントが発生したときにGateway内で実行されます。
- **Webhooks**: 他のシステムがOpenClaw内で処理をトリガーできるようにする外部HTTPエンドポイントです。[Webhooks](/automation/cron-jobs#webhooks)を参照してください。

Hooksはplugins内に同梱することもできます。`openclaw hooks list`には、スタンドアロンhooksとplugin管理hooksの両方が表示されます。

## クイックスタート

```bash
# 利用可能なhooksを一覧表示
openclaw hooks list

# hookを有効化
openclaw hooks enable session-memory

# hookのステータスを確認
openclaw hooks check

# 詳細情報を取得
openclaw hooks info session-memory
```

## イベントの種類

| Event                    | 発火するタイミング                             |
| ------------------------ | -------------------------------------- |
| `command:new`            | `/new`コマンドが実行されたとき              |
| `command:reset`          | `/reset`コマンドが実行されたとき            |
| `command:stop`           | `/stop`コマンドが実行されたとき             |
| `command`                | 任意のコマンドイベント（汎用リスナー）      |
| `session:compact:before` | compactionが履歴を要約する前               |
| `session:compact:after`  | compactionの完了後                        |
| `session:patch`          | セッションのプロパティが変更されたとき     |
| `agent:bootstrap`        | ワークスペースのbootstrapファイルが注入される前 |
| `gateway:startup`        | channelsが起動し、hooksが読み込まれた後    |
| `message:received`       | 任意のchannelから受信した受信メッセージ     |
| `message:transcribed`    | 音声文字起こしの完了後                    |
| `message:preprocessed`   | すべてのメディア処理とリンク理解の完了後   |
| `message:sent`           | 送信メッセージが配信されたとき             |

## hooksの作成

### hookの構成

各hookは、2つのファイルを含むディレクトリです。

```
my-hook/
├── HOOK.md          # メタデータ + ドキュメント
└── handler.ts       # ハンドラー実装
```

### HOOK.md形式

```markdown
---
name: my-hook
description: "このhookが行うことの短い説明"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

詳細なドキュメントをここに記述します。
```

**メタデータフィールド**（`metadata.openclaw`）:

| Field      | 説明                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLIに表示する絵文字                                  |
| `events`   | 監視するイベントの配列                               |
| `export`   | 使用する名前付きexport（デフォルトは`"default"`）    |
| `os`       | 必要なプラットフォーム（例: `["darwin", "linux"]`）  |
| `requires` | 必須の`bins`、`anyBins`、`env`、または`config`パス   |
| `always`   | 適格性チェックをバイパスするかどうか（boolean）      |
| `install`  | インストール方法                                     |

### ハンドラー実装

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

各イベントには次が含まれます: `type`、`action`、`sessionKey`、`timestamp`、`messages`（ユーザーに送信するにはpush）、および`context`（イベント固有のデータ）。

### イベントコンテキストの主な項目

**コマンドイベント**（`command:new`、`command:reset`）: `context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**メッセージイベント**（`message:received`）: `context.from`、`context.content`、`context.channelId`、`context.metadata`（`senderId`、`senderName`、`guildId`を含むプロバイダー固有データ）。

**メッセージイベント**（`message:sent`）: `context.to`、`context.content`、`context.success`、`context.channelId`。

**メッセージイベント**（`message:transcribed`）: `context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**メッセージイベント**（`message:preprocessed`）: `context.bodyForAgent`（最終的に拡張された本文）、`context.from`、`context.channelId`。

**Bootstrapイベント**（`agent:bootstrap`）: `context.bootstrapFiles`（変更可能な配列）、`context.agentId`。

**セッションpatchイベント**（`session:patch`）: `context.sessionEntry`、`context.patch`（変更されたフィールドのみ）、`context.cfg`。patchイベントをトリガーできるのは特権クライアントのみです。

**Compactionイベント**: `session:compact:before`には`messageCount`、`tokenCount`が含まれます。`session:compact:after`にはさらに`compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`が追加されます。

## hookの検出

Hooksは、上書き優先度が低い順から高い順に、次のディレクトリから検出されます。

1. **同梱hooks**: OpenClawに同梱されるもの
2. **Plugin hooks**: インストール済みplugins内に同梱されるhooks
3. **Managed hooks**: `~/.openclaw/hooks/`（ユーザーがインストールし、ワークスペース間で共有されるもの）。`hooks.internal.load.extraDirs`の追加ディレクトリもこの優先度を共有します。
4. **Workspace hooks**: `<workspace>/hooks/`（エージェントごと。明示的に有効化するまでデフォルトでは無効）

Workspace hooksは新しいhook名を追加できますが、同じ名前の同梱、managed、またはplugin提供hookを上書きすることはできません。

### hookパック

hookパックは、`package.json`内の`openclaw.hooks`を通じてhooksを公開するnpmパッケージです。次のようにインストールします。

```bash
openclaw plugins install <path-or-spec>
```

npm specはレジストリ専用です（パッケージ名 + 任意の正確なバージョンまたはdist-tag）。Git/URL/file specおよびsemver rangeは拒否されます。

## 同梱hooks

| Hook                  | Events                         | 動作内容                                              |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | セッションコンテキストを`<workspace>/memory/`に保存   |
| bootstrap-extra-files | `agent:bootstrap`              | globパターンから追加のbootstrapファイルを注入         |
| command-logger        | `command`                      | すべてのコマンドを`~/.openclaw/logs/commands.log`に記録 |
| boot-md               | `gateway:startup`              | gatewayの起動時に`BOOT.md`を実行                      |

任意の同梱hookを有効化するには、次を実行します。

```bash
openclaw hooks enable <hook-name>
```

### session-memoryの詳細

直近15件のユーザー/assistantメッセージを抽出し、LLMで説明的なファイル名スラッグを生成して、`<workspace>/memory/YYYY-MM-DD-slug.md`に保存します。`workspace.dir`が設定されている必要があります。

### bootstrap-extra-filesの設定

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

パスはワークスペースを基準に解決されます。認識されるbootstrap basenameのみが読み込まれます（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

## Plugin hooks

Pluginsは、より深い統合のためにPlugin SDKを通じてhooksを登録できます。これには、ツール呼び出しのインターセプト、プロンプトの変更、メッセージフローの制御などが含まれます。Plugin SDKは、モデル解決、エージェントライフサイクル、メッセージフロー、ツール実行、subagent協調、gatewayライフサイクルをカバーする28個のhooksを公開しています。

`before_tool_call`、`before_agent_reply`、`before_install`、およびその他すべてのplugin hooksを含む完全なplugin hookリファレンスについては、[Plugin Architecture](/plugins/architecture#provider-runtime-hooks)を参照してください。

## 設定

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

hookごとの環境変数:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

追加のhookディレクトリ:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
従来の`hooks.internal.handlers`配列設定形式も後方互換性のため引き続きサポートされていますが、新しいhooksでは検出ベースのシステムを使用してください。
</Note>

## CLIリファレンス

```bash
# すべてのhooksを一覧表示（--eligible、--verbose、または--jsonを追加可能）
openclaw hooks list

# hookの詳細情報を表示
openclaw hooks info <hook-name>

# 適格性の概要を表示
openclaw hooks check

# 有効化/無効化
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## ベストプラクティス

- **ハンドラーは高速に保つ。** Hooksはコマンド処理中に実行されます。重い処理は`void processInBackground(event)`でfire-and-forgetにしてください。
- **エラーは適切に処理する。** 危険な処理はtry/catchで囲み、他のハンドラーが実行できるようにthrowしないでください。
- **早い段階でイベントを絞り込む。** イベントのtype/actionが関係ない場合はすぐにreturnしてください。
- **具体的なイベントキーを使う。** オーバーヘッドを減らすため、`"events": ["command"]`より`"events": ["command:new"]`を優先してください。

## トラブルシューティング

### hookが検出されない

```bash
# ディレクトリ構造を確認
ls -la ~/.openclaw/hooks/my-hook/
# 表示されるべきもの: HOOK.md, handler.ts

# 検出されたすべてのhooksを一覧表示
openclaw hooks list
```

### hookが適格でない

```bash
openclaw hooks info my-hook
```

不足しているバイナリ（PATH）、環境変数、設定値、またはOS互換性を確認してください。

### hookが実行されない

1. hookが有効になっていることを確認します: `openclaw hooks list`
2. hooksが再読み込みされるようにgatewayプロセスを再起動します。
3. gatewayログを確認します: `./scripts/clawlog.sh | grep hook`

## 関連

- [CLI Reference: hooks](/cli/hooks)
- [Webhooks](/automation/cron-jobs#webhooks)
- [Plugin Architecture](/plugins/architecture#provider-runtime-hooks) — 完全なplugin hookリファレンス
- [Configuration](/gateway/configuration-reference#hooks)
