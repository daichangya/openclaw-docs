---
read_when:
    - Claude Code / Codex / Gemini CLI 用の acpx harness のインストールまたは設定
    - plugin-tools または OpenClaw-tools MCP ブリッジの有効化
    - ACP 権限モードの設定
summary: 'ACP エージェントのセットアップ: acpx harness 設定、プラグイン設定、権限'
title: ACP エージェント — セットアップ
x-i18n:
    generated_at: "2026-04-25T13:59:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6c23d8245c4893c48666096a296820e003685252cedee7df41ea7a2be1f4bf0
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

概要、運用ランブック、および概念については、[ACP agents](/ja-JP/tools/acp-agents) を参照してください。

以下のセクションでは、acpx harness 設定、MCP ブリッジ向けプラグイン設定、および権限設定を扱います。

## acpx harness サポート（現在）

現在の acpx 組み込み harness エイリアス:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

OpenClaw が acpx バックエンドを使用する場合は、acpx 設定でカスタム agent エイリアスを定義していない限り、`agentId` にはこれらの値を優先して使用してください。
ローカルの Cursor インストールで ACP がまだ `agent acp` として公開されている場合は、組み込みデフォルトを変更するのではなく、acpx 設定内で `cursor` agent コマンドを上書きしてください。

直接の acpx CLI 使用では、`--agent <command>` を使って任意のアダプターを対象にすることもできますが、この生のエスケープハッチは acpx CLI の機能であり（通常の OpenClaw `agentId` パスではありません）。

## 必須設定

コア ACP ベースライン:

```json5
{
  acp: {
    enabled: true,
    // 任意。デフォルトは true。/acp controls を維持したまま ACP dispatch を一時停止するには false に設定します。
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

スレッドバインディング設定は channel-adapter ごとに異なります。Discord の例:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

スレッドにバインドされた ACP 起動が動作しない場合は、まずアダプター機能フラグを確認してください。

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

現在の会話へのバインドでは、子スレッドの作成は不要です。必要なのは、アクティブな会話コンテキストと、ACP 会話バインディングを公開する channel adapter です。

[Configuration Reference](/ja-JP/gateway/configuration-reference) を参照してください。

## acpx バックエンド向けプラグイン設定

新規インストールでは bundled `acpx` ランタイムプラグインがデフォルトで有効になっているため、通常は ACP は手動のプラグインインストール手順なしで動作します。

まず以下を実行します。

```text
/acp doctor
```

`acpx` を無効にした場合、`plugins.allow` / `plugins.deny` で拒否した場合、またはローカル開発チェックアウトに切り替えたい場合は、明示的なプラグインパスを使用してください。

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

開発中のローカルワークスペースインストール:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

その後、バックエンドの健全性を確認します。

```text
/acp doctor
```

### acpx コマンドおよびバージョン設定

デフォルトでは、bundled `acpx` プラグインはそのプラグインローカルに固定されたバイナリ（プラグインパッケージ内の `node_modules/.bin/acpx`）を使用します。起動時にバックエンドは not-ready として登録され、バックグラウンドジョブが `acpx --version` を確認します。バイナリが欠けているか不一致の場合は、`npm install --omit=dev --no-save acpx@<pinned>` を実行して再検証します。gateway はその間も非ブロッキングのままです。

プラグイン設定でコマンドまたはバージョンを上書きできます。

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` は絶対パス、相対パス（OpenClaw ワークスペースから解決）、またはコマンド名を受け付けます。
- `expectedVersion: "any"` は厳密なバージョン一致を無効にします。
- カスタム `command` パスはプラグインローカルの自動インストールを無効にします。

[Plugins](/ja-JP/tools/plugin) を参照してください。

### 自動依存関係インストール

`npm install -g openclaw` で OpenClaw をグローバルインストールすると、acpx ランタイム依存関係（プラットフォーム固有バイナリ）は postinstall hook によって自動的にインストールされます。自動インストールに失敗しても、gateway は通常どおり起動し、欠落した依存関係は `openclaw acp doctor` を通じて報告されます。

### Plugin tools MCP ブリッジ

デフォルトでは、ACPX セッションは OpenClaw のプラグイン登録済みツールを ACP harness に**公開しません**。

Codex や Claude Code などの ACP エージェントから、memory recall/store のようなインストール済み OpenClaw plugin tools を呼び出したい場合は、専用ブリッジを有効にしてください。

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

これによって行われること:

- `openclaw-plugin-tools` という名前の組み込み MCP サーバーを ACPX セッションの bootstrap に注入します。
- インストール済みかつ有効な OpenClaw プラグインによってすでに登録されている plugin tools を公開します。
- この機能を明示的かつデフォルト無効のまま維持します。

セキュリティと trust に関する注意:

- これにより ACP harness のツールサーフェスが拡張されます。
- ACP エージェントがアクセスできるのは、gateway ですでにアクティブな plugin tools のみです。
- これは、それらのプラグインを OpenClaw 自体で実行させるのと同じ trust boundary として扱ってください。
- 有効化する前にインストール済みプラグインを確認してください。

カスタム `mcpServers` は従来どおり動作します。組み込み plugin-tools ブリッジは、汎用 MCP サーバー設定の代替ではなく、追加のオプトイン利便機能です。

### OpenClaw tools MCP ブリッジ

デフォルトでは、ACPX セッションは組み込み OpenClaw tools も MCP 経由で**公開しません**。`cron` のような選択された組み込みツールが ACP エージェントに必要な場合は、別の core-tools ブリッジを有効にしてください。

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

これによって行われること:

- `openclaw-tools` という名前の組み込み MCP サーバーを ACPX セッションの bootstrap に注入します。
- 選択された組み込み OpenClaw tools を公開します。初期サーバーでは `cron` を公開します。
- コアツールの公開を明示的かつデフォルト無効のまま維持します。

### ランタイムタイムアウト設定

bundled `acpx` プラグインは、埋め込みランタイムターンのデフォルトタイムアウトを 120 秒に設定しています。これにより、Gemini CLI のような遅い harness にも ACP の起動と初期化を完了する十分な時間が与えられます。ホストで異なるランタイム制限が必要な場合は上書きしてください。

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

この値を変更した後は gateway を再起動してください。

### 健全性プローブ agent 設定

bundled `acpx` プラグインは、埋め込みランタイムバックエンドが ready かどうかを判断する際に 1 つの harness agent をプローブします。`acp.allowedAgents` が設定されている場合は、デフォルトで最初の許可済み agent が使われます。そうでない場合は `codex` がデフォルトです。デプロイで健全性チェックに別の ACP agent が必要な場合は、プローブ agent を明示的に設定してください。

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

この値を変更した後は gateway を再起動してください。

## 権限設定

ACP セッションは非対話的に実行されます。ファイル書き込みや shell-exec の権限プロンプトを承認または拒否するための TTY はありません。acpx プラグインは、権限の扱い方を制御する 2 つの設定キーを提供します。

これらの ACPX harness 権限は、OpenClaw の exec 承認や、Claude CLI `--permission-mode bypassPermissions` のような CLI バックエンドの vendor bypass フラグとは別物です。ACPX の `approve-all` は ACP セッション向けの harness レベルの緊急用スイッチです。

### `permissionMode`

プロンプトなしで harness agent が実行できる操作を制御します。

| 値 | 動作 |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | すべてのファイル書き込みとシェルコマンドを自動承認します。 |
| `approve-reads` | 読み取りのみ自動承認します。書き込みと exec にはプロンプトが必要です。 |
| `deny-all`      | すべての権限プロンプトを拒否します。 |

### `nonInteractivePermissions`

権限プロンプトが表示されるはずだが対話的 TTY が使えない場合（ACP セッションでは常にこの状態）に何が起きるかを制御します。

| 値 | 動作 |
| ------ | ----------------------------------------------------------------- |
| `fail` | `AcpRuntimeError` でセッションを中止します。**（デフォルト）** |
| `deny` | 権限を黙って拒否して続行します（graceful degradation）。 |

### 設定

プラグイン設定経由で設定します。

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

これらの値を変更した後は gateway を再起動してください。

> **重要:** OpenClaw は現在、デフォルトで `permissionMode=approve-reads` および `nonInteractivePermissions=fail` を使用します。非対話的 ACP セッションでは、権限プロンプトを発生させる書き込みまたは exec は `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` で失敗することがあります。
>
> 権限を制限する必要がある場合は、セッションがクラッシュする代わりに段階的に機能低下するよう、`nonInteractivePermissions` を `deny` に設定してください。

## 関連

- [ACP agents](/ja-JP/tools/acp-agents) — 概要、運用ランブック、概念
- [Sub-agents](/ja-JP/tools/subagents)
- [Multi-agent routing](/ja-JP/concepts/multi-agent)
