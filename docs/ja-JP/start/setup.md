---
read_when:
    - 新しいマシンのセットアップ
    - 個人のセットアップを壊さずに「最新かつ最高」の状態を使いたい場合
summary: OpenClawの高度なセットアップと開発ワークフロー
title: セットアップ
x-i18n:
    generated_at: "2026-04-20T04:46:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 773cdbef5f38b069303b5e13fca5fcdc28f082746869f17b8b92aab1610b95a8
    source_path: start/setup.md
    workflow: 15
---

# セットアップ

<Note>
初めてセットアップする場合は、[はじめに](/ja-JP/start/getting-started)から始めてください。
オンボーディングの詳細は、[オンボーディング (CLI)](/ja-JP/start/wizard)を参照してください。
</Note>

## 要点

- **カスタマイズはリポジトリの外にあります:** `~/.openclaw/workspace`（workspace）+ `~/.openclaw/openclaw.json`（config）。
- **安定したワークフロー:** macOSアプリをインストールし、同梱のGatewayを実行させます。
- **最先端のワークフロー:** `pnpm gateway:watch` で自分でGatewayを実行し、その後macOSアプリをLocalモードで接続させます。

## 前提条件（ソースから）

- Node 24推奨（Node 22 LTS、現在は `22.14+`、引き続きサポートされています）
- `pnpm` 推奨（または、意図的に[Bun workflow](/ja-JP/install/bun)を使う場合はBun）
- Docker（任意。コンテナ化されたセットアップ/e2eの場合のみ — [Docker](/ja-JP/install/docker)を参照）

## カスタマイズ戦略（アップデートで困らないように）

「自分向けに100%カスタマイズ」しつつ簡単にアップデートしたい場合は、カスタマイズ内容を次に保持してください。

- **Config:** `~/.openclaw/openclaw.json`（JSON/JSON5風）
- **Workspace:** `~/.openclaw/workspace`（skills、prompts、memories。プライベートなgitリポジトリにしてください）

一度だけ初期化します。

```bash
openclaw setup
```

このリポジトリ内からは、ローカルCLIエントリを使います。

```bash
openclaw setup
```

まだグローバルインストールがない場合は、`pnpm openclaw setup` で実行してください（Bun workflowを使っている場合は `bun run openclaw setup`）。

## このリポジトリからGatewayを実行する

`pnpm build` の後、パッケージ化されたCLIを直接実行できます。

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 安定したワークフロー（macOSアプリ優先）

1. **OpenClaw.app**（メニューバー）をインストールして起動します。
2. オンボーディング/権限チェックリスト（TCCプロンプト）を完了します。
3. Gatewayが**Local**で実行中であることを確認します（アプリが管理します）。
4. サーフェスをリンクします（例: WhatsApp）。

```bash
openclaw channels login
```

5. 正常性を確認します。

```bash
openclaw health
```

お使いのビルドでオンボーディングが利用できない場合:

- `openclaw setup` を実行し、次に `openclaw channels login` を実行して、その後Gatewayを手動で起動します（`openclaw gateway`）。

## 最先端のワークフロー（ターミナルでGatewayを実行）

目的: TypeScript Gatewayで作業し、ホットリロードを使い、macOSアプリのUIは接続したままにします。

### 0) （任意）macOSアプリもソースから実行する

macOSアプリも最先端で使いたい場合:

```bash
./scripts/restart-mac.sh
```

### 1) 開発用Gatewayを起動する

```bash
pnpm install
# 初回のみ（またはローカルのOpenClaw config/workspaceをリセットした後）
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` はwatchモードでgatewayを実行し、関連するソース、
config、およびbundled-plugin metadataの変更時に再読み込みします。
`pnpm openclaw setup` は、新しいチェックアウト向けの一度限りのローカルconfig/workspace初期化手順です。
`pnpm gateway:watch` は `dist/control-ui` を再ビルドしないため、`ui/` を変更した後は `pnpm ui:build` を再実行するか、Control UIの開発中は `pnpm ui:dev` を使用してください。

意図的にBun workflowを使っている場合、対応するコマンドは次のとおりです。

```bash
bun install
# 初回のみ（またはローカルのOpenClaw config/workspaceをリセットした後）
bun run openclaw setup
bun run gateway:watch
```

### 2) 実行中のGatewayにmacOSアプリを向ける

**OpenClaw.app** で:

- Connection Mode: **Local**
  アプリは、設定されたポートで実行中のgatewayに接続します。

### 3) 確認する

- アプリ内のGatewayステータスが**「Using existing gateway …」**と表示されるはずです
- またはCLIから:

```bash
openclaw health
```

### よくある落とし穴

- **ポート違い:** Gateway WSのデフォルトは `ws://127.0.0.1:18789` です。アプリとCLIで同じポートを使ってください。
- **状態が保存される場所:**
  - チャンネル/プロバイダーの状態: `~/.openclaw/credentials/`
  - モデル認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - セッション: `~/.openclaw/agents/<agentId>/sessions/`
  - ログ: `/tmp/openclaw/`

## 認証情報ストレージの対応表

認証のデバッグや、何をバックアップすべきかを判断するときに使ってください。

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env または `channels.telegram.tokenFile`（通常のファイルのみ。symlinkは拒否されます）
- **Discord bot token**: config/env または SecretRef（env/file/exec providers）
- **Slack tokens**: config/env（`channels.slack.*`）
- **ペアリング許可リスト**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（デフォルトアカウント）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（デフォルト以外のアカウント）
- **モデル認証プロファイル**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイルベースのシークレットペイロード（任意）**: `~/.openclaw/secrets.json`
- **従来のOAuthインポート**: `~/.openclaw/credentials/oauth.json`
  詳細: [Security](/ja-JP/gateway/security#credential-storage-map)。

## 更新する（セットアップを壊さずに）

- `~/.openclaw/workspace` と `~/.openclaw/` を「自分のもの」として扱ってください。個人用のprompts/configを `openclaw` リポジトリに入れないでください。
- ソースの更新: `git pull` + 選択したパッケージマネージャーのインストール手順（デフォルトは `pnpm install`、Bun workflowでは `bun install`）+ 引き続き対応する `gateway:watch` コマンドを使用します。

## Linux（systemdユーザーサービス）

Linuxインストールではsystemdの**ユーザー**サービスを使います。デフォルトでは、systemdはログアウト/アイドル時にユーザー
サービスを停止するため、Gatewayも停止します。オンボーディングでは
自動的にlingeringを有効にしようとします（sudoを求められる場合があります）。それでも無効な場合は、次を実行してください。

```bash
sudo loginctl enable-linger $USER
```

常時稼働または複数ユーザーのサーバーでは、ユーザーサービスではなく
**システム**サービスを検討してください（lingeringは不要です）。systemdに関する注意は[Gateway runbook](/ja-JP/gateway)を参照してください。

## 関連ドキュメント

- [Gateway runbook](/ja-JP/gateway)（フラグ、監視、ポート）
- [Gateway configuration](/ja-JP/gateway/configuration)（config schema + examples）
- [Discord](/ja-JP/channels/discord) と [Telegram](/ja-JP/channels/telegram)（返信タグ + replyToMode設定）
- [OpenClaw assistant setup](/ja-JP/start/openclaw)
- [macOS app](/ja-JP/platforms/macos)（gatewayライフサイクル）
