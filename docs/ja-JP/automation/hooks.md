---
read_when:
    - /new、/reset、/stop、およびエージェントのライフサイクルイベントに対するイベント駆動型自動化が必要です
    - フックを構築、インストール、またはデバッグしたい場合
summary: 'フック: コマンドとライフサイクルイベント向けのイベント駆動型自動化'
title: フック
x-i18n:
    generated_at: "2026-04-24T08:57:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6246f25272208d9a9ff2f186bcd3a463c78ea24b833f0259174d0f7f0cbea6
    source_path: automation/hooks.md
    workflow: 15
---

フックは、Gateway内で何かが起こったときに実行される小さなスクリプトです。これらはディレクトリから検出でき、`openclaw hooks`で確認できます。Gatewayは、フックを有効にするか、少なくとも1つのフックエントリ、フックパック、レガシーハンドラー、または追加のフックディレクトリを設定した後にのみ、内部フックを読み込みます。

OpenClawには2種類のフックがあります。

- **内部フック**（このページ）: `/new`、`/reset`、`/stop`、またはライフサイクルイベントなどのエージェントイベントが発生したときに、Gateway内で実行されます。
- **Webhooks**: 他のシステムがOpenClawで処理をトリガーできるようにする外部HTTPエンドポイントです。[Webhooks](/ja-JP/automation/cron-jobs#webhooks)を参照してください。

フックはPlugin内に同梱することもできます。`openclaw hooks list`には、スタンドアロンフックとPlugin管理フックの両方が表示されます。

## クイックスタート

```bash
# 利用可能なフックを一覧表示
openclaw hooks list

# フックを有効化
openclaw hooks enable session-memory

# フックのステータスを確認
openclaw hooks check

# 詳細情報を取得
openclaw hooks info session-memory
```

## イベントタイプ

| イベント                 | 発火タイミング                                   |
| ------------------------ | ------------------------------------------------ |
| `command:new`            | `/new`コマンドが実行されたとき                   |
| `command:reset`          | `/reset`コマンドが実行されたとき                 |
| `command:stop`           | `/stop`コマンドが実行されたとき                  |
| `command`                | 任意のコマンドイベント（汎用リスナー）           |
| `session:compact:before` | Compactionが履歴を要約する前                     |
| `session:compact:after`  | Compactionの完了後                               |
| `session:patch`          | セッションプロパティが変更されたとき             |
| `agent:bootstrap`        | ワークスペースのブートストラップファイルが注入される前 |
| `gateway:startup`        | チャネルが起動し、フックが読み込まれた後         |
| `message:received`       | 任意のチャネルからの受信メッセージ               |
| `message:transcribed`    | 音声文字起こしの完了後                           |
| `message:preprocessed`   | すべてのメディア処理とリンク理解の完了後         |
| `message:sent`           | 送信メッセージが配信されたとき                   |

## フックの作成

### フック構造

各フックは、2つのファイルを含むディレクトリです。

```
my-hook/
├── HOOK.md          # メタデータ + ドキュメント
└── handler.ts       # ハンドラー実装
```

### HOOK.md形式

```markdown
---
name: my-hook
description: "このフックが行うことの短い説明"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

詳細なドキュメントをここに記述します。
```

**メタデータフィールド**（`metadata.openclaw`）:

| フィールド | 説明                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLIに表示する絵文字                                  |
| `events`   | リッスンするイベントの配列                           |
| `export`   | 使用する名前付きエクスポート（デフォルトは`"default"`） |
| `os`       | 必要なプラットフォーム（例: `["darwin", "linux"]`）  |
| `requires` | 必要な`bins`、`anyBins`、`env`、または`config`パス   |
| `always`   | 適格性チェックをバイパスする（真偽値）               |
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

各イベントには、`type`、`action`、`sessionKey`、`timestamp`、`messages`（ユーザーに送信するにはpush）、および`context`（イベント固有のデータ）が含まれます。エージェントおよびツールPluginフックのコンテキストには、`trace`が含まれることもあります。これは読み取り専用のW3C互換診断トレースコンテキストで、PluginがOTEL相関のために構造化ログへ渡すことができます。

### イベントコンテキストの主な項目

**コマンドイベント**（`command:new`、`command:reset`）: `context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**メッセージイベント**（`message:received`）: `context.from`、`context.content`、`context.channelId`、`context.metadata`（`senderId`、`senderName`、`guildId`を含むプロバイダー固有データ）。

**メッセージイベント**（`message:sent`）: `context.to`、`context.content`、`context.success`、`context.channelId`。

**メッセージイベント**（`message:transcribed`）: `context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**メッセージイベント**（`message:preprocessed`）: `context.bodyForAgent`（最終的に拡張された本文）、`context.from`、`context.channelId`。

**ブートストラップイベント**（`agent:bootstrap`）: `context.bootstrapFiles`（変更可能な配列）、`context.agentId`。

**セッションパッチイベント**（`session:patch`）: `context.sessionEntry`、`context.patch`（変更されたフィールドのみ）、`context.cfg`。パッチイベントをトリガーできるのは特権クライアントのみです。

**Compactionイベント**: `session:compact:before`には`messageCount`、`tokenCount`が含まれます。`session:compact:after`にはさらに`compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`が追加されます。

## フックの検出

フックは、上書き優先順位が低い順から高い順に、次のディレクトリから検出されます。

1. **同梱フック**: OpenClawに同梱されているもの
2. **Pluginフック**: インストール済みPlugin内に同梱されているフック
3. **管理フック**: `~/.openclaw/hooks/`（ユーザーがインストールし、ワークスペース間で共有されるもの）。`hooks.internal.load.extraDirs`の追加ディレクトリもこの優先順位を共有します。
4. **ワークスペースフック**: `<workspace>/hooks/`（エージェントごと、明示的に有効化されるまでデフォルトでは無効）

ワークスペースフックは新しいフック名を追加できますが、同じ名前の同梱フック、管理フック、またはPlugin提供フックを上書きすることはできません。

Gatewayは、内部フックが設定されるまで、起動時に内部フックの検出をスキップします。`openclaw hooks enable <name>`で同梱フックまたは管理フックを有効にするか、フックパックをインストールするか、`hooks.internal.enabled=true`を設定してオプトインしてください。1つの名前付きフックを有効にすると、Gatewayはそのフックのハンドラーのみを読み込みます。`hooks.internal.enabled=true`、追加のフックディレクトリ、レガシーハンドラーは、広範な検出にオプトインします。

### フックパック

フックパックは、`package.json`の`openclaw.hooks`を通じてフックをエクスポートするnpmパッケージです。インストール方法:

```bash
openclaw plugins install <path-or-spec>
```

npm specはレジストリのみ対応です（パッケージ名 + 任意の正確なバージョンまたはdist-tag）。Git/URL/file specおよびsemver rangeは拒否されます。

## 同梱フック

| フック                | イベント                       | 動作内容                                              |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | セッションコンテキストを`<workspace>/memory/`に保存   |
| bootstrap-extra-files | `agent:bootstrap`              | globパターンから追加のブートストラップファイルを注入  |
| command-logger        | `command`                      | すべてのコマンドを`~/.openclaw/logs/commands.log`に記録 |
| boot-md               | `gateway:startup`              | Gateway起動時に`BOOT.md`を実行                        |

任意の同梱フックを有効にするには:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memoryの詳細

直近15件のユーザー/アシスタントメッセージを抽出し、LLMで説明的なファイル名スラッグを生成して、`<workspace>/memory/YYYY-MM-DD-slug.md`に保存します。`workspace.dir`の設定が必要です。

<a id="bootstrap-extra-files"></a>

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

パスはワークスペース相対で解決されます。認識されるブートストラップbasenameのみが読み込まれます（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-loggerの詳細

すべてのスラッシュコマンドを`~/.openclaw/logs/commands.log`に記録します。

<a id="boot-md"></a>

### boot-mdの詳細

Gateway起動時に、アクティブなワークスペースの`BOOT.md`を実行します。

## Pluginフック

Pluginは、より深い統合のためにPlugin SDKを通じてフックを登録できます。たとえば、ツール呼び出しのインターセプト、プロンプトの変更、メッセージフローの制御などです。Plugin SDKは、モデル解決、エージェントライフサイクル、メッセージフロー、ツール実行、サブエージェント連携、Gatewayライフサイクルをカバーする28個のフックを公開しています。

`before_tool_call`、`before_agent_reply`、`before_install`、およびそのほかすべてのPluginフックを含む完全なPluginフックリファレンスについては、[Plugin Architecture](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。

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

フックごとの環境変数:

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

追加のフックディレクトリ:

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
レガシーの`hooks.internal.handlers`配列設定形式も後方互換性のために引き続きサポートされていますが、新しいフックでは検出ベースのシステムを使用してください。
</Note>

## CLIリファレンス

```bash
# すべてのフックを一覧表示（--eligible、--verbose、または--jsonを追加可能）
openclaw hooks list

# フックの詳細情報を表示
openclaw hooks info <hook-name>

# 適格性の概要を表示
openclaw hooks check

# 有効化/無効化
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## ベストプラクティス

- **ハンドラーは高速に保つ。** フックはコマンド処理中に実行されます。重い処理は`void processInBackground(event)`でfire-and-forgetにしてください。
- **エラーは適切に処理する。** リスクのある操作はtry/catchで囲み、他のハンドラーが実行できるようにthrowしないでください。
- **イベントは早めにフィルタする。** イベントタイプやactionが無関係なら、すぐにreturnしてください。
- **具体的なイベントキーを使う。** オーバーヘッドを減らすため、`"events": ["command"]`より`"events": ["command:new"]`を優先してください。

## トラブルシューティング

### フックが検出されない

```bash
# ディレクトリ構造を確認
ls -la ~/.openclaw/hooks/my-hook/
# 表示されるべきもの: HOOK.md, handler.ts

# 検出されたすべてのフックを一覧表示
openclaw hooks list
```

### フックが適格でない

```bash
openclaw hooks info my-hook
```

不足しているバイナリ（PATH）、環境変数、設定値、またはOS互換性を確認してください。

### フックが実行されない

1. フックが有効か確認する: `openclaw hooks list`
2. フックが再読み込みされるようにGatewayプロセスを再起動する。
3. Gatewayログを確認する: `./scripts/clawlog.sh | grep hook`

## 関連

- [CLI Reference: hooks](/ja-JP/cli/hooks)
- [Webhooks](/ja-JP/automation/cron-jobs#webhooks)
- [Plugin Architecture](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) — 完全なPluginフックリファレンス
- [Configuration](/ja-JP/gateway/configuration-reference#hooks)
