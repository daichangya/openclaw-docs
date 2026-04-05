---
read_when:
    - 新しいマシンをセットアップするとき
    - 個人設定を壊さずに「最新かつ最高」の状態を使いたいとき
summary: OpenClaw の高度なセットアップと開発ワークフロー
title: セットアップ
x-i18n:
    generated_at: "2026-04-05T12:57:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: be4e280dde7f3a224345ca557ef2fb35a9c9db8520454ff63794ac6f8d4e71e7
    source_path: start/setup.md
    workflow: 15
---

# セットアップ

<Note>
初めてセットアップする場合は、[はじめに](/ja-JP/start/getting-started) から始めてください。
オンボーディングの詳細は、[Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。
</Note>

## 要点

- **カスタマイズはリポジトリの外に置きます:** `~/.openclaw/workspace`（workspace）+ `~/.openclaw/openclaw.json`（config）。
- **安定したワークフロー:** macOSアプリをインストールし、同梱のGatewayを実行させます。
- **最先端ワークフロー:** `pnpm gateway:watch` で自分でGatewayを実行し、その後macOSアプリをローカルモードで接続させます。

## 前提条件（ソースから実行する場合）

- Node 24を推奨（Node 22 LTS、現在は `22.14+`、も引き続きサポート）
- `pnpm` を推奨（または意図的に [Bun workflow](/ja-JP/install/bun) を使う場合はBun）
- Docker（任意。コンテナ化されたセットアップ/e2e専用。詳細は [Docker](/ja-JP/install/docker) を参照）

## カスタマイズ戦略（アップデートで困らないように）

「自分向けに100%カスタマイズ」 _かつ_ アップデートも簡単にしたい場合は、カスタマイズを次に保存してください。

- **Config:** `~/.openclaw/openclaw.json`（JSON/JSON5風）
- **Workspace:** `~/.openclaw/workspace`（skills、prompts、memories。プライベートなgitリポジトリにしてください）

一度だけブートストラップします:

```bash
openclaw setup
```

このリポジトリ内からは、ローカルCLIエントリを使います:

```bash
openclaw setup
```

まだグローバルインストールがない場合は、`pnpm openclaw setup` で実行してください（Bun workflowを使っている場合は `bun run openclaw setup`）。

## このリポジトリからGatewayを実行する

`pnpm build` の後、パッケージ化されたCLIを直接実行できます:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 安定したワークフロー（macOSアプリ優先）

1. **OpenClaw.app**（メニューバー）をインストールして起動します。
2. オンボーディング/権限チェックリスト（TCCプロンプト）を完了します。
3. Gateway が **Local** で実行中であることを確認します（アプリが管理します）。
4. 接続先をリンクします（例: WhatsApp）:

```bash
openclaw channels login
```

5. 動作確認:

```bash
openclaw health
```

使用中のビルドでオンボーディングが利用できない場合:

- `openclaw setup` を実行し、その後 `openclaw channels login` を実行してから、Gatewayを手動で起動してください（`openclaw gateway`）。

## 最先端ワークフロー（ターミナルでGatewayを実行）

目的: TypeScript Gateway を開発し、ホットリロードを得ながら、macOSアプリUIを接続したままにすることです。

### 0) （任意）macOSアプリもソースから実行する

macOSアプリも最先端版にしたい場合:

```bash
./scripts/restart-mac.sh
```

### 1) 開発用Gatewayを起動する

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` はwatchモードでgatewayを実行し、関連するソース、
config、および同梱pluginメタデータの変更時に再読み込みします。

意図的にBun workflowを使っている場合、対応するコマンドは次のとおりです:

```bash
bun install
bun run gateway:watch
```

### 2) 実行中のGatewayをmacOSアプリに向ける

**OpenClaw.app** で:

- 接続モード: **Local**
  アプリは設定されたポート上の実行中gatewayに接続します。

### 3) 確認

- アプリ内のGatewayステータスは **「Using existing gateway …」** と表示されるはずです
- またはCLI経由で:

```bash
openclaw health
```

### よくある落とし穴

- **ポートが違う:** Gateway WSのデフォルトは `ws://127.0.0.1:18789` です。アプリとCLIで同じポートを使ってください。
- **状態が保存される場所:**
  - チャネル/プロバイダーの状態: `~/.openclaw/credentials/`
  - モデル認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - セッション: `~/.openclaw/agents/<agentId>/sessions/`
  - ログ: `/tmp/openclaw/`

## 認証情報ストレージ対応表

認証のデバッグや、何をバックアップすべきか判断するときに使ってください:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env または `channels.telegram.tokenFile`（通常ファイルのみ。symlinkは拒否）
- **Discord bot token**: config/env または SecretRef（env/file/exec プロバイダー）
- **Slack tokens**: config/env（`channels.slack.*`）
- **ペアリングallowlist**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（デフォルトアカウント）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（デフォルト以外のアカウント）
- **モデル認証プロファイル**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイルベースのシークレットペイロード（任意）**: `~/.openclaw/secrets.json`
- **レガシーOAuthインポート**: `~/.openclaw/credentials/oauth.json`
  詳細: [Security](/ja-JP/gateway/security#credential-storage-map)。

## 更新（セットアップを壊さずに）

- `~/.openclaw/workspace` と `~/.openclaw/` を「自分のもの」として扱ってください。個人的なprompts/configを `openclaw` リポジトリに置かないでください。
- ソースの更新: `git pull` + 選択したパッケージマネージャーのインストール手順（デフォルトは `pnpm install`、Bun workflowでは `bun install`）+ 引き続き対応する `gateway:watch` コマンドを使います。

## Linux（systemdユーザーサービス）

Linuxインストールでは systemd **ユーザー**サービスを使用します。デフォルトでは、systemdはログアウト時やアイドル時にユーザー
サービスを停止するため、Gatewayも停止します。オンボーディングは
自動で lingering を有効にしようとします（sudoを求める場合があります）。まだ無効なら、次を実行してください:

```bash
sudo loginctl enable-linger $USER
```

常時稼働や複数ユーザーのサーバーでは、ユーザーサービスではなく
**system** サービスの利用を検討してください（lingeringは不要です）。systemdの注意点については [Gateway runbook](/ja-JP/gateway) を参照してください。

## 関連ドキュメント

- [Gateway runbook](/ja-JP/gateway)（フラグ、supervision、ポート）
- [Gateway configuration](/ja-JP/gateway/configuration)（configスキーマ + 例）
- [Discord](/ja-JP/channels/discord) と [Telegram](/ja-JP/channels/telegram)（reply tags + replyToMode設定）
- [OpenClaw assistant setup](/start/openclaw)
- [macOS app](/ja-JP/platforms/macos)（gatewayライフサイクル）
