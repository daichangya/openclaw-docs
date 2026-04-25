---
read_when:
    - /new、/reset、/stop、およびエージェントのライフサイクルイベントに対するイベント駆動型自動化が必要です
    - フックをビルド、インストール、またはデバッグしたい場合
summary: 'Hooks: コマンドとライフサイクルイベントのためのイベント駆動型自動化'
title: Hooks
x-i18n:
    generated_at: "2026-04-25T13:40:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 437b8b8dc37e9ec9c10bbdddc4d63184ccc46e89bc532aea0c5bd176404186f6
    source_path: automation/hooks.md
    workflow: 15
---

フックは、Gateway内で何かが起きたときに実行される小さなスクリプトです。ディレクトリから検出でき、`openclaw hooks`で確認できます。Gatewayは、フックを有効にするか、少なくとも1つのフックエントリ、フックパック、レガシーハンドラー、または追加のフックディレクトリを設定した後にのみ、内部フックを読み込みます。

OpenClawには2種類のフックがあります。

- **内部フック**（このページ）: `/new`、`/reset`、`/stop`、またはライフサイクルイベントなどのエージェントイベントが発生したときにGateway内で実行されます。
- **Webhooks**: 外部HTTPエンドポイントで、ほかのシステムがOpenClawで作業をトリガーできるようにします。[Webhooks](/ja-JP/automation/cron-jobs#webhooks)を参照してください。

フックはPlugin内にバンドルすることもできます。`openclaw hooks list`には、スタンドアロンフックとPlugin管理フックの両方が表示されます。

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

## イベントの種類

| イベント | 発生するタイミング |
| ------------------------ | ------------------------------------------------ |
| `command:new`            | `/new`コマンドが発行されたとき                            |
| `command:reset`          | `/reset`コマンドが発行されたとき                          |
| `command:stop`           | `/stop`コマンドが発行されたとき                           |
| `command`                | 任意のコマンドイベント（汎用リスナー）             |
| `session:compact:before` | Compactionが履歴を要約する前             |
| `session:compact:after`  | Compactionの完了後                       |
| `session:patch`          | セッションのプロパティが変更されたとき             |
| `agent:bootstrap`        | ワークスペースのブートストラップファイルが注入される前    |
| `gateway:startup`        | チャネルが開始され、フックが読み込まれた後        |
| `message:received`       | 任意のチャネルからの受信メッセージ                 |
| `message:transcribed`    | 音声文字起こしの完了後              |
| `message:preprocessed`   | すべてのメディアおよびリンク理解の完了後 |
| `message:sent`           | 送信メッセージが配信されたとき                       |

## フックの作成

### フックの構成

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
description: "このフックが何をするかの短い説明"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

ここに詳細なドキュメントを記載します。
```

**メタデータフィールド**（`metadata.openclaw`）:

| フィールド | 説明 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLIに表示する絵文字                                |
| `events`   | リッスンするイベントの配列                        |
| `export`   | 使用する名前付きエクスポート（デフォルトは`"default"`）        |
| `os`       | 必要なプラットフォーム（例: `["darwin", "linux"]`）     |
| `requires` | 必要な`bins`、`anyBins`、`env`、または`config`パス |
| `always`   | 適格性チェックをバイパスする（boolean）                  |
| `install`  | インストール方法                                 |

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

各イベントには次が含まれます: `type`、`action`、`sessionKey`、`timestamp`、`messages`（ユーザーに送信するにはpush）、および`context`（イベント固有のデータ）。エージェントおよびツールPluginのフックコンテキストには、`trace`が含まれる場合もあります。これは読み取り専用のW3C互換診断トレースコンテキストで、PluginはOTEL相関のために構造化ログへ渡すことができます。

### イベントコンテキストの要点

**コマンドイベント**（`command:new`、`command:reset`）: `context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**メッセージイベント**（`message:received`）: `context.from`、`context.content`、`context.channelId`、`context.metadata`（`senderId`、`senderName`、`guildId`を含むプロバイダー固有データ）。

**メッセージイベント**（`message:sent`）: `context.to`、`context.content`、`context.success`、`context.channelId`。

**メッセージイベント**（`message:transcribed`）: `context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**メッセージイベント**（`message:preprocessed`）: `context.bodyForAgent`（最終的に拡張された本文）、`context.from`、`context.channelId`。

**ブートストラップイベント**（`agent:bootstrap`）: `context.bootstrapFiles`（変更可能な配列）、`context.agentId`。

**セッションパッチイベント**（`session:patch`）: `context.sessionEntry`、`context.patch`（変更されたフィールドのみ）、`context.cfg`。パッチイベントをトリガーできるのは特権クライアントのみです。

**Compactionイベント**: `session:compact:before`には`messageCount`、`tokenCount`が含まれます。`session:compact:after`にはさらに`compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`が追加されます。

## フックの検出

フックは次のディレクトリから検出され、優先度は後になるほど上書き優先度が高くなります。

1. **バンドル済みフック**: OpenClawに同梱
2. **Pluginフック**: インストール済みPlugin内にバンドルされたフック
3. **管理対象フック**: `~/.openclaw/hooks/`（ユーザーがインストールし、ワークスペース間で共有）。`hooks.internal.load.extraDirs`の追加ディレクトリもこの優先度を共有します。
4. **ワークスペースフック**: `<workspace>/hooks/`（エージェントごと。明示的に有効化するまでデフォルトで無効）

ワークスペースフックは新しいフック名を追加できますが、同名のバンドル済み、管理対象、またはPlugin提供フックを上書きすることはできません。

Gatewayは、内部フックが設定されるまで、起動時に内部フックの検出をスキップします。`openclaw hooks enable <name>`でバンドル済みまたは管理対象フックを有効にするか、フックパックをインストールするか、`hooks.internal.enabled=true`を設定してオプトインしてください。1つの名前付きフックを有効にすると、Gatewayはそのフックのハンドラーのみを読み込みます。`hooks.internal.enabled=true`、追加フックディレクトリ、レガシーハンドラーは、広範な検出にオプトインします。

### フックパック

フックパックは、`package.json`の`openclaw.hooks`経由でフックをエクスポートするnpmパッケージです。インストール方法:

```bash
openclaw plugins install <path-or-spec>
```

npm specはレジストリ専用です（パッケージ名 + 任意の厳密なバージョンまたはdist-tag）。Git/URL/file specおよびsemver rangeは拒否されます。

## バンドル済みフック

| フック | イベント | 動作内容 |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | セッションコンテキストを`<workspace>/memory/`に保存        |
| bootstrap-extra-files | `agent:bootstrap`              | globパターンから追加のブートストラップファイルを注入 |
| command-logger        | `command`                      | すべてのコマンドを`~/.openclaw/logs/commands.log`に記録  |
| boot-md               | `gateway:startup`              | Gateway起動時に`BOOT.md`を実行                |

任意のバンドル済みフックを有効にするには:

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

パスはワークスペース相対で解決されます。認識されるブートストラップのベース名のみが読み込まれます（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-loggerの詳細

すべてのスラッシュコマンドを`~/.openclaw/logs/commands.log`に記録します。

<a id="boot-md"></a>

### boot-mdの詳細

Gatewayの起動時に、アクティブなワークスペースの`BOOT.md`を実行します。

## Pluginフック

Pluginは、より深い統合のためにPlugin SDKを通じて型付きフックを登録できます:
ツール呼び出しのインターセプト、プロンプトの変更、メッセージフローの制御などです。
`before_tool_call`、`before_agent_reply`、
`before_install`、またはその他のインプロセスなライフサイクルフックが必要な場合は、Pluginフックを使用してください。

完全なPluginフックのリファレンスについては、[Plugin hooks](/ja-JP/plugins/hooks)を参照してください。

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
レガシーな`hooks.internal.handlers`配列の設定形式も後方互換性のために引き続きサポートされていますが、新しいフックでは検出ベースのシステムを使用してください。
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

- **ハンドラーは高速に保つ。** フックはコマンド処理中に実行されます。重い処理は`void processInBackground(event)`でファイアアンドフォーゲットにしてください。
- **エラーは適切に処理する。** リスクのある処理はtry/catchで囲み、ほかのハンドラーが実行できるよう例外は投げないでください。
- **イベントは早めにフィルタリングする。** イベントのtype/actionが関係ない場合はすぐにreturnしてください。
- **具体的なイベントキーを使う。** オーバーヘッドを減らすため、`"events": ["command"]`より`"events": ["command:new"]`を優先してください。

## トラブルシューティング

### フックが検出されない

```bash
# ディレクトリ構成を確認
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

1. フックが有効か確認します: `openclaw hooks list`
2. フックを再読み込みするため、Gatewayプロセスを再起動します。
3. Gatewayログを確認します: `./scripts/clawlog.sh | grep hook`

## 関連

- [CLI Reference: hooks](/ja-JP/cli/hooks)
- [Webhooks](/ja-JP/automation/cron-jobs#webhooks)
- [Plugin hooks](/ja-JP/plugins/hooks) — インプロセスのPluginライフサイクルフック
- [Configuration](/ja-JP/gateway/configuration-reference#hooks)
