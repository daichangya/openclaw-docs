---
read_when:
    - Claude Code / Codex / Gemini CLI 向け acpx ハーネスのインストールまたは設定
    - plugin-tools または OpenClaw-tools MCP ブリッジの有効化
    - ACP 権限モードの設定
summary: 'ACP エージェントのセットアップ: acpx ハーネス設定、Plugin セットアップ、権限'
title: ACP エージェント — セットアップ
x-i18n:
    generated_at: "2026-04-26T11:40:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c7a638dd26b9343ea5a183954dd3ce3822b904bd2f46dd24f13a6785a646ea3
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

概要、運用 runbook、概念については、[ACP agents](/ja-JP/tools/acp-agents) を参照してください。

以下のセクションでは、acpx ハーネス設定、MCP ブリッジ向けの Plugin セットアップ、権限設定を扱います。

このページは、ACP/acpx ルートをセットアップする場合にのみ使用してください。ネイティブ Codex
app-server ランタイム設定については、[Codex harness](/ja-JP/plugins/codex-harness) を使用してください。OpenAI API キーや Codex OAuth モデルプロバイダ設定については、
[OpenAI](/ja-JP/providers/openai) を使用してください。

Codex には 2 つの OpenClaw ルートがあります。

| ルート                      | 設定/コマンド                                         | セットアップページ                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| ネイティブ Codex app-server    | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/ja-JP/plugins/codex-harness) |
| 明示的な Codex ACP アダプター | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | このページ                               |

ACP/acpx の動作が明示的に必要でない限り、ネイティブルートを優先してください。

## acpx ハーネスサポート（現行）

現在の acpx 組み込みハーネス別名:

- `claude`
- `codex`
- `copilot`
- `cursor`（Cursor CLI: `cursor-agent acp`）
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

OpenClaw が acpx バックエンドを使用する場合、acpx 設定でカスタムエージェント別名を定義していない限り、`agentId` にはこれらの値を使用してください。
ローカルの Cursor インストールで ACP がまだ `agent acp` として公開されている場合は、組み込みデフォルトを変更するのではなく、acpx 設定で `cursor` エージェントコマンドを上書きしてください。

acpx CLI を直接使用する場合は `--agent <command>` で任意のアダプターを対象にすることもできますが、この生の escape hatch は acpx CLI の機能であり、通常の OpenClaw `agentId` パスではありません。

モデル制御はアダプターの機能に依存します。Codex ACP のモデル参照は
起動前に OpenClaw によって正規化されます。その他のハーネスでは ACP の `models` と
`session/set_model` サポートが必要です。ハーネスがその ACP 機能も独自の起動時モデルフラグも公開していない場合、OpenClaw/acpx はモデル選択を強制できません。

## 必須設定

コア ACP ベースライン:

```json5
{
  acp: {
    enabled: true,
    // 任意。デフォルトは true。/acp コントロールを維持したまま ACP ディスパッチを一時停止するには false に設定します。
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

スレッドバインディング設定はチャネルアダプター固有です。Discord の例:

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

スレッドバインドされた ACP spawn が動作しない場合は、まずアダプター機能フラグを確認してください。

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

現在の会話へのバインドでは子スレッド作成は不要です。必要なのはアクティブな会話コンテキストと、ACP 会話バインディングを公開するチャネルアダプターです。

[Configuration Reference](/ja-JP/gateway/configuration-reference) を参照してください。

## acpx バックエンド向け Plugin セットアップ

新規インストールでは同梱の `acpx` ランタイム Plugin がデフォルトで有効になっているため、ACP は通常、手動で Plugin をインストールしなくても動作します。

まず次を実行します。

```text
/acp doctor
```

`acpx` を無効化した場合、`plugins.allow` / `plugins.deny` で拒否した場合、または
ローカル開発チェックアウトへ切り替えたい場合は、明示的な Plugin パスを使用してください。

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

### acpx コマンドとバージョン設定

デフォルトでは、同梱の `acpx` Plugin は Gateway 起動時に ACP エージェントを spawn せず、埋め込み ACP バックエンドを登録します。明示的な live probe には `/acp doctor` を実行してください。Gateway に起動時 probe を実行させる必要がある場合にのみ、`OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` を設定してください。

Plugin 設定でコマンドまたはバージョンを上書きします。

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

- `command` には絶対パス、相対パス（OpenClaw ワークスペース基準で解決）、またはコマンド名を指定できます。
- `expectedVersion: "any"` は厳密なバージョン一致を無効にします。
- カスタム `command` パスを使うと、Plugin ローカルの自動インストールは無効になります。

[Plugins](/ja-JP/tools/plugin) を参照してください。

### 依存関係の自動インストール

`npm install -g openclaw` で OpenClaw をグローバルインストールすると、acpx
ランタイム依存関係（プラットフォーム固有バイナリ）は postinstall hook により自動インストールされます。自動インストールに失敗しても、gateway 自体は通常どおり起動し、不足している依存関係は `openclaw acp doctor` を通じて報告されます。

### plugin-tools MCP ブリッジ

デフォルトでは、ACPX セッションは OpenClaw の Plugin 登録ツールを ACP ハーネスに**公開しません**。

Codex や Claude Code などの ACP エージェントから、memory recall/store などのインストール済み
OpenClaw Plugin ツールを呼び出したい場合は、専用ブリッジを有効にしてください。

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

これにより行われること:

- `openclaw-plugin-tools` という名前の組み込み MCP サーバーを ACPX セッションの
  ブートストラップに注入します。
- インストールおよび有効化された OpenClaw Plugin がすでに登録している Plugin ツールを公開します。
- この機能を明示的かつデフォルト無効のままに保ちます。

セキュリティと信頼に関する注記:

- これにより ACP ハーネスのツールサーフェスが拡大します。
- ACP エージェントがアクセスできるのは、gateway 内ですでにアクティブな Plugin ツールのみです。
- これは、それらの Plugin を OpenClaw 自体で実行させるのと同じ信頼境界として扱ってください。
- 有効化前にインストール済み Plugin を確認してください。

カスタム `mcpServers` はこれまでどおり動作します。組み込みの plugin-tools ブリッジは、汎用 MCP サーバー設定の置き換えではなく、追加のオプトイン型利便機能です。

### OpenClaw-tools MCP ブリッジ

デフォルトでは、ACPX セッションは組み込みの OpenClaw ツールも
MCP 経由で公開しません。`cron` などの選択された組み込みツールが ACP エージェントに必要な場合は、別の core-tools ブリッジを有効にしてください。

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

これにより行われること:

- `openclaw-tools` という名前の組み込み MCP サーバーを ACPX セッションの
  ブートストラップに注入します。
- 選択された組み込み OpenClaw ツールを公開します。初期サーバーでは `cron` を公開します。
- コアツールの公開を明示的かつデフォルト無効のままに保ちます。

### ランタイムタイムアウト設定

同梱の `acpx` Plugin は、埋め込みランタイムターンのデフォルトを 120 秒タイムアウトにしています。これにより Gemini CLI のような低速ハーネスにも
ACP 起動と初期化を完了する十分な時間を与えます。ホストに別のランタイム上限が必要な場合は上書きしてください。

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

この値を変更した後は gateway を再起動してください。

### 健全性 probe エージェント設定

`/acp doctor` またはオプトインの起動時 probe がバックエンドを確認するとき、
同梱の `acpx` Plugin は 1 つのハーネスエージェントを probe します。`acp.allowedAgents` が設定されている場合は、デフォルトで最初の許可済みエージェントを使用し、そうでない場合は `codex` を使用します。デプロイメントで健全性チェックに別の ACP エージェントが必要な場合は、probe エージェントを明示的に設定してください。

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

この値を変更した後は gateway を再起動してください。

## 権限設定

ACP セッションは非対話的に実行されます。ファイル書き込みや shell 実行の権限プロンプトを承認または拒否するための TTY はありません。acpx Plugin は、権限の扱い方を制御する 2 つの設定キーを提供します。

これらの ACPX ハーネス権限は、OpenClaw の exec 承認とは別物であり、Claude CLI の `--permission-mode bypassPermissions` のような CLI バックエンドのベンダー固有バイパスフラグとも別物です。ACPX の `approve-all` は、ACP セッション向けのハーネスレベルの非常用スイッチです。

### `permissionMode`

プロンプトなしでハーネスエージェントが実行できる操作を制御します。

| 値           | 動作                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | すべてのファイル書き込みと shell コマンドを自動承認します。          |
| `approve-reads` | 読み取りのみを自動承認します。書き込みと exec にはプロンプトが必要です。 |
| `deny-all`      | すべての権限プロンプトを拒否します。                              |

### `nonInteractivePermissions`

権限プロンプトが表示されるべきだが対話的 TTY が利用できない場合（ACP セッションでは常にこの状態）に何が起きるかを制御します。

| 値  | 動作                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | `AcpRuntimeError` でセッションを中断します。**（デフォルト）**           |
| `deny` | 権限を黙って拒否して続行します（穏当な劣化動作）。 |

### 設定

Plugin 設定で指定します。

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

これらの値を変更した後は gateway を再起動してください。

> **重要:** OpenClaw の現在のデフォルトは `permissionMode=approve-reads` および `nonInteractivePermissions=fail` です。非対話型 ACP セッションでは、権限プロンプトを発生させる書き込みや exec は `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` で失敗する可能性があります。
>
> 権限を制限する必要がある場合は、セッションがクラッシュする代わりに穏当に劣化するよう、`nonInteractivePermissions` を `deny` に設定してください。

## 関連

- [ACP agents](/ja-JP/tools/acp-agents) — 概要、operator runbook、概念
- [Sub-agents](/ja-JP/tools/subagents)
- [Multi-agent routing](/ja-JP/concepts/multi-agent)
