---
read_when:
    - Microsoft Teams チャネル機能の開発状況
summary: Microsoft Teams ボットのサポート状況、機能、設定
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-26T11:23:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 497bd2a0216f7de2345a52b178567964884a4bf6801daef3a2529f92b794cb0c
    source_path: channels/msteams.md
    workflow: 15
---

ステータス: テキスト + DM 添付ファイルはサポートされています。チャネル/グループでのファイル送信には `sharePointSiteId` + Graph 権限が必要です（[グループチャットでファイルを送信する](#sending-files-in-group-chats) を参照）。投票は Adaptive Cards 経由で送信されます。メッセージアクションでは、ファイル優先送信向けに明示的な `upload-file` が公開されています。

## バンドル済み Plugin

Microsoft Teams は現在の OpenClaw リリースではバンドル済み Plugin として提供されるため、通常のパッケージ版ビルドでは別途インストールは不要です。

古いビルド、またはバンドル済み Teams を含まないカスタムインストールを使用している場合は、手動でインストールしてください:

```bash
openclaw plugins install @openclaw/msteams
```

ローカルチェックアウト（git リポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) は、ボット登録、マニフェスト作成、認証情報生成を1つのコマンドで処理します。

**1. インストールしてログインする**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # ログイン済みであり、テナント情報が表示されることを確認
```

> **注意:** Teams CLI は現在プレビュー版です。コマンドやフラグはリリース間で変更される場合があります。

**2. トンネルを開始する**（Teams は localhost に到達できません）

まだの場合は devtunnel CLI をインストールして認証してください（[はじめにガイド](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started) を参照）。

```bash
# 初回セットアップ（セッションをまたいで永続する URL）:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 各開発セッション:
devtunnel host my-openclaw-bot
# エンドポイント: https://<tunnel-id>.devtunnels.ms/api/messages
```

> **注意:** Teams は devtunnels で認証できないため、`--allow-anonymous` が必要です。それでも、受信する各ボットリクエストは Teams SDK によって自動的に検証されます。

代替手段: `ngrok http 3978` または `tailscale funnel 3978`（ただし、これらはセッションごとに URL が変わる場合があります）。

**3. アプリを作成する**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

この1つのコマンドで以下を実行します:

- Entra ID（Azure AD）アプリケーションを作成
- クライアントシークレットを生成
- Teams アプリマニフェストをビルドしてアップロード（アイコン付き）
- ボットを登録（デフォルトでは Teams 管理 — Azure サブスクリプション不要）

出力には `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID`、および **Teams App ID** が表示されます。これらは次の手順のために控えておいてください。また、アプリを Teams に直接インストールするオプションも提示されます。

**4. 出力された認証情報を使って OpenClaw を設定する:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

または、環境変数を直接使用します: `MSTEAMS_APP_ID`、`MSTEAMS_APP_PASSWORD`、`MSTEAMS_TENANT_ID`。

**5. Teams にアプリをインストールする**

`teams app create` はアプリのインストールを促します — 「Install in Teams」を選択してください。スキップした場合でも、後からリンクを取得できます:

```bash
teams app get <teamsAppId> --install-link
```

**6. すべてが動作していることを確認する**

```bash
teams app doctor <teamsAppId>
```

これにより、ボット登録、AAD アプリ設定、マニフェストの妥当性、SSO 設定全体にわたる診断が実行されます。

本番デプロイでは、クライアントシークレットの代わりに [フェデレーテッド認証](#federated-authentication-certificate--managed-identity)（証明書またはマネージド ID）の使用を検討してください。

注意: グループチャットはデフォルトでブロックされています（`channels.msteams.groupPolicy: "allowlist"`）。グループでの返信を許可するには、`channels.msteams.groupAllowFrom` を設定してください（または `groupPolicy: "open"` を使って任意のメンバーを許可できます。デフォルトではメンションゲートあり）。

## 目的

- Teams の DM、グループチャット、またはチャネル経由で OpenClaw とやり取りする。
- ルーティングを決定的に保つ: 返信は常に受信したチャネルに戻る。
- 安全なチャネル動作をデフォルトにする（設定しない限りメンション必須）。

## 設定書き込み

デフォルトでは、Microsoft Teams は `/config set|unset` によってトリガーされた設定更新の書き込みを許可されています（`commands.config: true` が必要）。

無効にするには:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## アクセス制御（DM + グループ）

**DM アクセス**

- デフォルト: `channels.msteams.dmPolicy = "pairing"`。未認識の送信者は承認されるまで無視されます。
- `channels.msteams.allowFrom` には安定した AAD オブジェクト ID を使用してください。
- 許可リストに UPN/表示名の一致を頼らないでください — 変更される可能性があります。OpenClaw はデフォルトで直接の名前一致を無効にしています。明示的に `channels.msteams.dangerouslyAllowNameMatching: true` で有効化してください。
- ウィザードは、認証情報に十分な権限がある場合、Microsoft Graph 経由で名前を ID に解決できます。

**グループアクセス**

- デフォルト: `channels.msteams.groupPolicy = "allowlist"`（`groupAllowFrom` を追加しない限りブロック）。未設定時のデフォルトを上書きするには `channels.defaults.groupPolicy` を使います。
- `channels.msteams.groupAllowFrom` は、グループチャット/チャネルでどの送信者がトリガーできるかを制御します（`channels.msteams.allowFrom` にフォールバック）。
- 任意のメンバーを許可するには `groupPolicy: "open"` を設定します（デフォルトでは引き続きメンションゲートあり）。
- **チャネルを一切許可しない** 場合は、`channels.msteams.groupPolicy: "disabled"` を設定します。

例:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + チャネル許可リスト**

- `channels.msteams.teams` の下に teams と channels を列挙して、グループ/チャネル返信の範囲を制限します。
- キーには安定した team ID と channel conversation ID を使用してください。
- `groupPolicy="allowlist"` かつ teams の許可リストが存在する場合、列挙された team/channel のみが受け入れられます（メンションゲートあり）。
- configure ウィザードは `Team/Channel` エントリーを受け付け、それらを保存します。
- 起動時に、OpenClaw は team/channel およびユーザー許可リスト名を ID に解決し（Graph 権限がある場合）、
  その対応をログに出力します。未解決の team/channel 名は入力どおり保持されますが、`channels.msteams.dangerouslyAllowNameMatching: true` が有効でない限り、デフォルトではルーティングに使用されず無視されます。

例:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

<details>
<summary><strong>手動セットアップ（Teams CLI を使わない場合）</strong></summary>

Teams CLI を使用できない場合は、Azure Portal から手動でボットをセットアップできます。

### 仕組み

1. Microsoft Teams Plugin が利用可能であることを確認します（現在のリリースではバンドル済み）。
2. **Azure Bot** を作成します（App ID + secret + tenant ID）。
3. ボットを参照し、以下の RSC 権限を含む **Teams app package** をビルドします。
4. Teams アプリをチームにアップロード/インストールします（または DM 用に personal scope）。
5. `~/.openclaw/openclaw.json`（または環境変数）で `msteams` を設定し、Gateway を起動します。
6. Gateway はデフォルトで `/api/messages` で Bot Framework の Webhook トラフィックを待ち受けます。

### ステップ 1: Azure Bot を作成する

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) にアクセスします
2. **Basics** タブに入力します:

   | Field              | Value                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | ボット名（例: `openclaw-msteams`、一意である必要があります） |
   | **Subscription**   | Azure サブスクリプションを選択                           |
   | **Resource group** | 新規作成または既存を使用                                 |
   | **Pricing tier**   | 開発/テストには **Free**                                 |
   | **Type of App**    | **Single Tenant**（推奨 - 以下の注記を参照）             |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **非推奨のお知らせ:** 新しいマルチテナントボットの作成は 2025-07-31 以降非推奨になりました。新しいボットには **Single Tenant** を使用してください。

3. **Review + create** → **Create** をクリックします（約 1〜2 分待機）

### ステップ 2: 認証情報を取得する

1. Azure Bot リソース → **Configuration** に移動します
2. **Microsoft App ID** をコピー → これが `appId` です
3. **Manage Password** をクリック → App Registration に移動します
4. **Certificates & secrets** → **New client secret** → **Value** をコピー → これが `appPassword` です
5. **Overview** → **Directory (tenant) ID** をコピー → これが `tenantId` です

### ステップ 3: メッセージングエンドポイントを設定する

1. Azure Bot → **Configuration**
2. **Messaging endpoint** に Webhook URL を設定します:
   - 本番: `https://your-domain.com/api/messages`
   - ローカル開発: トンネルを使用（以下の [ローカル開発トンネリング](#local-development-tunneling) を参照）

### ステップ 4: Teams チャネルを有効にする

1. Azure Bot → **Channels**
2. **Microsoft Teams** → Configure → Save をクリック
3. 利用規約に同意します

### ステップ 5: Teams アプリマニフェストをビルドする

- `botId = <App ID>` を持つ `bot` エントリーを含めます。
- スコープ: `personal`、`team`、`groupChat`。
- `supportsFiles: true`（personal scope のファイル処理に必須）。
- RSC 権限を追加します（[現在の Teams RSC 権限マニフェスト](#current-teams-rsc-permissions-manifest) を参照）。
- アイコンを作成します: `outline.png`（32x32）および `color.png`（192x192）。
- 3つのファイルをまとめて zip 化します: `manifest.json`、`outline.png`、`color.png`。

### ステップ 6: OpenClaw を設定する

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

環境変数: `MSTEAMS_APP_ID`、`MSTEAMS_APP_PASSWORD`、`MSTEAMS_TENANT_ID`。

### ステップ 7: Gateway を実行する

Teams チャネルは、Plugin が利用可能で `msteams` 設定に認証情報がある場合、自動的に開始されます。

</details>

## フェデレーテッド認証（証明書 + マネージド ID）

> 2026.3.24 で追加

本番デプロイ向けに、OpenClaw はクライアントシークレットのより安全な代替として **フェデレーテッド認証** をサポートしています。利用できる方法は2つあります。

### オプション A: 証明書ベース認証

Entra ID のアプリ登録に登録された PEM 証明書を使用します。

**セットアップ:**

1. 証明書を生成または取得します（秘密鍵付き PEM 形式）。
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** で公開証明書をアップロードします。

**設定:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**環境変数:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### オプション B: Azure Managed Identity

パスワードレス認証に Azure Managed Identity を使用します。これは、マネージド ID が利用できる Azure インフラストラクチャ（AKS、App Service、Azure VM）上のデプロイに最適です。

**仕組み:**

1. ボットの pod/VM にマネージド ID（システム割り当てまたはユーザー割り当て）が付与されます。
2. **フェデレーテッド ID 資格情報** が、そのマネージド ID を Entra ID のアプリ登録に関連付けます。
3. 実行時に、OpenClaw は `@azure/identity` を使用して Azure IMDS エンドポイント（`169.254.169.254`）からトークンを取得します。
4. そのトークンがボット認証のために Teams SDK に渡されます。

**前提条件:**

- マネージド ID が有効な Azure インフラストラクチャ（AKS workload identity、App Service、VM）
- Entra ID のアプリ登録に作成されたフェデレーテッド ID 資格情報
- pod/VM から IMDS（`169.254.169.254:80`）へのネットワークアクセス

**設定（システム割り当てマネージド ID）:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**設定（ユーザー割り当てマネージド ID）:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**環境変数:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（ユーザー割り当ての場合のみ）

### AKS Workload Identity のセットアップ

workload identity を使用する AKS デプロイの場合:

1. AKS クラスターで **workload identity** を有効化します。
2. Entra ID アプリ登録に **フェデレーテッド ID 資格情報** を作成します:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. Kubernetes の service account にアプリのクライアント ID を **アノテーション** します:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. workload identity 注入のために pod に **ラベル** を付けます:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS（`169.254.169.254`）への **ネットワークアクセス** を確保します — NetworkPolicy を使用している場合は、ポート 80 の `169.254.169.254/32` へのトラフィックを許可する egress ルールを追加してください。

### authType の比較

| Method               | Config                                         | Pros                               | Cons                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | セットアップが簡単                 | シークレットのローテーションが必要で、安全性がやや低い |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | ネットワーク上で共有シークレットが不要 | 証明書管理のオーバーヘッドがある       |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | パスワードレスで、管理すべきシークレットがない | Azure インフラストラクチャが必要         |

**デフォルト動作:** `authType` が設定されていない場合、OpenClaw はデフォルトでクライアントシークレット認証を使用します。既存の設定は変更なしで引き続き動作します。

## ローカル開発（トンネリング）

Teams は `localhost` に到達できません。セッションをまたいで URL が変わらないよう、永続的な dev tunnel を使用してください:

```bash
# 初回セットアップ:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 各開発セッション:
devtunnel host my-openclaw-bot
```

代替手段: `ngrok http 3978` または `tailscale funnel 3978`（URL はセッションごとに変わる場合があります）。

トンネル URL が変わった場合は、エンドポイントを更新します:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## ボットのテスト

**診断を実行する:**

```bash
teams app doctor <teamsAppId>
```

これにより、ボット登録、AAD アプリ、マニフェスト、SSO 設定を一括で確認します。

**テストメッセージを送信する:**

1. Teams アプリをインストールします（`teams app get <id> --install-link` のインストールリンクを使用）
2. Teams でボットを見つけて DM を送信します
3. 受信アクティビティについて Gateway ログを確認します

## 環境変数

すべての設定キーは、代わりに環境変数でも設定できます:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE`（任意: `"secret"` または `"federated"`）
- `MSTEAMS_CERTIFICATE_PATH`（federated + 証明書）
- `MSTEAMS_CERTIFICATE_THUMBPRINT`（任意、認証には不要）
- `MSTEAMS_USE_MANAGED_IDENTITY`（federated + managed identity）
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（ユーザー割り当て MI のみ）

## メンバー情報アクション

OpenClaw は Microsoft Teams 向けに Graph ベースの `member-info` アクションを公開しており、エージェントや自動化が Microsoft Graph からチャネルメンバーの詳細（表示名、メールアドレス、役割）を直接解決できます。

要件:

- `Member.Read.Group` RSC 権限（推奨マニフェストにすでに含まれています）
- チーム横断の検索には: 管理者の同意付き `User.Read.All` Graph Application 権限

このアクションは `channels.msteams.actions.memberInfo` によって制御されます（デフォルト: Graph 認証情報が利用可能な場合に有効）。

## 履歴コンテキスト

- `channels.msteams.historyLimit` は、プロンプトに含める最近のチャネル/グループメッセージ数を制御します。
- `messages.groupChat.historyLimit` にフォールバックします。無効化するには `0` を設定します（デフォルトは 50）。
- 取得されたスレッド履歴は送信者の許可リスト（`allowFrom` / `groupAllowFrom`）でフィルタリングされるため、スレッドコンテキストのシードには許可された送信者からのメッセージのみが含まれます。
- 引用された添付ファイルコンテキスト（Teams の reply HTML から導出される `ReplyTo*`）は、現在は受信したまま渡されます。
- つまり、許可リストは誰がエージェントをトリガーできるかを制御しますが、現時点でフィルタリングされるのは特定の補助的コンテキスト経路のみです。
- DM 履歴は `channels.msteams.dmHistoryLimit`（ユーザーターン）で制限できます。ユーザーごとの上書き: `channels.msteams.dms["<user_id>"].historyLimit`。

## 現在の Teams RSC 権限（マニフェスト）

これらは Teams アプリマニフェスト内の**既存の resourceSpecific permissions**です。これらは、アプリがインストールされている team/chat 内でのみ適用されます。

**チャネル用（team スコープ）:**

- `ChannelMessage.Read.Group`（Application）- `@mention` なしですべてのチャネルメッセージを受信
- `ChannelMessage.Send.Group`（Application）
- `Member.Read.Group`（Application）
- `Owner.Read.Group`（Application）
- `ChannelSettings.Read.Group`（Application）
- `TeamMember.Read.Group`（Application）
- `TeamSettings.Read.Group`（Application）

**グループチャット用:**

- `ChatMessage.Read.Chat`（Application）- `@mention` なしですべてのグループチャットメッセージを受信

Teams CLI 経由で RSC 権限を追加するには:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams マニフェストの例（要素を伏せたもの）

必要なフィールドを含む最小限で有効な例です。ID と URL は置き換えてください。

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### マニフェストの注意点（必須フィールド）

- `bots[].botId` は Azure Bot App ID と**一致している必要があります**。
- `webApplicationInfo.id` は Azure Bot App ID と**一致している必要があります**。
- `bots[].scopes` には、使用予定のサーフェス（`personal`、`team`、`groupChat`）を含める必要があります。
- `bots[].supportsFiles: true` は personal scope でのファイル処理に必要です。
- `authorization.permissions.resourceSpecific` には、チャネルトラフィックが必要な場合にチャネル読み取り/送信を含める必要があります。

### 既存アプリの更新

すでにインストール済みの Teams アプリを更新するには（たとえば RSC 権限を追加する場合）:

```bash
# マニフェストをダウンロードし、編集して再アップロードする
teams app manifest download <teamsAppId> manifest.json
# manifest.json をローカルで編集...
teams app manifest upload manifest.json <teamsAppId>
# コンテンツが変更されていればバージョンは自動で増加
```

更新後は、新しい権限を有効にするために各 team にアプリを再インストールし、キャッシュされたアプリメタデータをクリアするために **Teams を完全に終了して再起動** してください（ウィンドウを閉じるだけでは不十分です）。

<details>
<summary>手動でマニフェストを更新する（CLI なし）</summary>

1. `manifest.json` を新しい設定で更新します
2. **`version` フィールドを増やします**（例: `1.0.0` → `1.1.0`）
3. アイコン付きでマニフェストを**再度 zip 化**します（`manifest.json`、`outline.png`、`color.png`）
4. 新しい zip をアップロードします:
   - **Teams Admin Center:** Teams apps → Manage apps → 対象アプリを見つける → Upload new version
   - **Sideload:** Teams → Apps → Manage your apps → Upload a custom app

</details>

## 機能: RSC のみ vs Graph

### **Teams RSC のみ** の場合（アプリはインストール済み、Graph API 権限なし）

動作するもの:

- チャネルメッセージの**テキスト**内容の読み取り
- チャネルメッセージの**テキスト**内容の送信
- **personal（DM）** のファイル添付の受信

動作しないもの:

- チャネル/グループの**画像またはファイル内容**（ペイロードには HTML スタブしか含まれません）
- SharePoint/OneDrive に保存された添付ファイルのダウンロード
- メッセージ履歴の読み取り（ライブ Webhook イベントを超えるもの）

### **Teams RSC + Microsoft Graph Application permissions** の場合

追加されるもの:

- ホストされたコンテンツ（メッセージに貼り付けられた画像）のダウンロード
- SharePoint/OneDrive に保存されたファイル添付のダウンロード
- Graph 経由でのチャネル/チャットメッセージ履歴の読み取り

### RSC vs Graph API

| Capability              | RSC Permissions      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Real-time messages**  | はい（Webhook 経由） | いいえ（ポーリングのみ）            |
| **Historical messages** | いいえ               | はい（履歴を問い合わせ可能）         |
| **Setup complexity**    | アプリマニフェストのみ | 管理者の同意 + トークンフローが必要   |
| **Works offline**       | いいえ（起動中である必要あり） | はい（いつでも問い合わせ可能）        |

**要点:** RSC はリアルタイムリッスン用、Graph API は履歴アクセス用です。オフライン中に見逃したメッセージを追跡するには、Graph API と `ChannelMessage.Read.All`（管理者の同意が必要）が必要です。

## Graph 対応のメディア + 履歴（チャネルに必須）

**チャネル**で画像/ファイルが必要な場合、または**メッセージ履歴**を取得したい場合は、Microsoft Graph 権限を有効化して管理者の同意を付与する必要があります。

1. Entra ID（Azure AD）の **App Registration** で、Microsoft Graph の **Application permissions** を追加します:
   - `ChannelMessage.Read.All`（チャネル添付 + 履歴）
   - `Chat.Read.All` または `ChatMessage.Read.All`（グループチャット）
2. テナントに対して **Grant admin consent** を行います。
3. Teams アプリの **manifest version** を増やし、再アップロードして、**Teams にアプリを再インストール** します。
4. キャッシュされたアプリメタデータをクリアするために **Teams を完全に終了して再起動** します。

**ユーザーメンション向けの追加権限:** ユーザーの @mention は、会話内のユーザーであればそのまま動作します。ただし、**現在の会話にいない**ユーザーを動的に検索してメンションしたい場合は、`User.Read.All`（Application）権限を追加して管理者の同意を付与してください。

## 既知の制限

### Webhook タイムアウト

Teams は HTTP Webhook 経由でメッセージを配信します。処理に時間がかかりすぎる場合（たとえば LLM の応答が遅い場合）、次のようなことが起こる可能性があります:

- Gateway タイムアウト
- Teams がメッセージを再試行する（重複の原因になる）
- 返信が失われる

OpenClaw はこれに対応するため、すばやく応答を返して返信をプロアクティブに送信しますが、非常に遅い応答では依然として問題が発生する可能性があります。

### 書式設定

Teams の markdown は Slack や Discord よりも制限があります:

- 基本的な書式設定は動作します: **太字**、_斜体_、`code`、リンク
- 複雑な markdown（テーブル、ネストしたリスト）は正しくレンダリングされない場合があります
- 投票やセマンティックなプレゼンテーション送信では Adaptive Cards がサポートされています（以下を参照）

## 設定

主要な設定（共有チャネルパターンについては `/gateway/configuration` を参照）:

- `channels.msteams.enabled`: チャネルを有効化/無効化します。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`: ボット認証情報。
- `channels.msteams.webhook.port`（デフォルト `3978`）
- `channels.msteams.webhook.path`（デフォルト `/api/messages`）
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）
- `channels.msteams.allowFrom`: DM 許可リスト（AAD オブジェクト ID を推奨）。Graph アクセスが利用可能な場合、ウィザードはセットアップ中に名前を ID に解決します。
- `channels.msteams.dangerouslyAllowNameMatching`: 可変の UPN/表示名マッチングおよび team/channel 名への直接ルーティングを再有効化するための緊急用トグル。
- `channels.msteams.textChunkLimit`: 送信テキストのチャンクサイズ。
- `channels.msteams.chunkMode`: `length`（デフォルト）または `newline`。長さによるチャンク化の前に空行（段落境界）で分割します。
- `channels.msteams.mediaAllowHosts`: 受信添付ファイルホストの許可リスト（デフォルトは Microsoft/Teams ドメイン）。
- `channels.msteams.mediaAuthAllowHosts`: メディア再試行時に Authorization ヘッダーを付与するホストの許可リスト（デフォルトは Graph + Bot Framework ホスト）。
- `channels.msteams.requireMention`: チャネル/グループで @mention を必須にします（デフォルト true）。
- `channels.msteams.replyStyle`: `thread | top-level`（[返信スタイル](#reply-style-threads-vs-posts) を参照）。
- `channels.msteams.teams.<teamId>.replyStyle`: team ごとの上書き。
- `channels.msteams.teams.<teamId>.requireMention`: team ごとの上書き。
- `channels.msteams.teams.<teamId>.tools`: channel ごとの上書きがない場合に使われる、team ごとのデフォルトツールポリシー上書き（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.toolsBySender`: team ごとの送信者別デフォルトツールポリシー上書き（`"*"` ワイルドカード対応）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: channel ごとの上書き。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: channel ごとの上書き。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: channel ごとのツールポリシー上書き（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: channel ごとの送信者別ツールポリシー上書き（`"*"` ワイルドカード対応）。
- `toolsBySender` キーには明示的な接頭辞を使用してください:
  `id:`、`e164:`、`username:`、`name:`（従来の接頭辞なしキーも引き続き `id:` のみにマッピングされます）。
- `channels.msteams.actions.memberInfo`: Graph ベースのメンバー情報アクションを有効化または無効化します（デフォルト: Graph 認証情報が利用可能な場合に有効）。
- `channels.msteams.authType`: 認証タイプ — `"secret"`（デフォルト）または `"federated"`。
- `channels.msteams.certificatePath`: PEM 証明書ファイルへのパス（federated + 証明書認証）。
- `channels.msteams.certificateThumbprint`: 証明書のサムプリント（任意、認証には不要）。
- `channels.msteams.useManagedIdentity`: managed identity 認証を有効化します（federated モード）。
- `channels.msteams.managedIdentityClientId`: ユーザー割り当て managed identity のクライアント ID。
- `channels.msteams.sharePointSiteId`: グループチャット/チャネルでのファイルアップロードに使う SharePoint site ID（[グループチャットでファイルを送信する](#sending-files-in-group-chats) を参照）。

## ルーティングとセッション

- セッションキーは標準のエージェント形式に従います（[/concepts/session](/ja-JP/concepts/session) を参照）:
  - ダイレクトメッセージはメインセッションを共有します（`agent:<agentId>:<mainKey>`）。
  - チャネル/グループメッセージでは conversation id を使用します:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 返信スタイル: Threads vs Posts

Teams では最近、同じ基盤データモデル上で2つのチャネル UI スタイルが導入されました:

| Style                    | Description                                               | Recommended `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (classic)      | メッセージはカードとして表示され、その下にスレッド返信が付きます | `thread`（デフォルト）   |
| **Threads** (Slack-like) | メッセージがより Slack のように直線的に流れます            | `top-level`              |

**問題:** Teams API は、チャネルがどの UI スタイルを使っているかを公開しません。誤った `replyStyle` を使うと:

- Threads スタイルのチャネルで `thread` → 返信が不自然にネストされて表示される
- Posts スタイルのチャネルで `top-level` → 返信がスレッド内ではなく別個のトップレベル投稿として表示される

**解決策:** チャネルの設定に応じて、channel ごとに `replyStyle` を設定します:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## 添付ファイルと画像

**現在の制限:**

- **DM:** 画像とファイル添付は Teams ボットのファイル API 経由で動作します。
- **チャネル/グループ:** 添付ファイルは M365 ストレージ（SharePoint/OneDrive）に保存されます。Webhook ペイロードには実際のファイルバイトではなく HTML スタブしか含まれません。チャネル添付をダウンロードするには **Graph API 権限が必要です**。
- 明示的なファイル優先送信には、`media` / `filePath` / `path` とともに `action=upload-file` を使用します。任意の `message` は添えるテキスト/コメントになり、`filename` はアップロード名を上書きします。

Graph 権限がない場合、画像付きチャネルメッセージはテキストのみとして受信されます（画像内容にはボットからアクセスできません）。
デフォルトでは、OpenClaw は Microsoft/Teams ホスト名からのメディアのみをダウンロードします。`channels.msteams.mediaAllowHosts` で上書きしてください（任意のホストを許可するには `["*"]` を使用）。
Authorization ヘッダーは `channels.msteams.mediaAuthAllowHosts` に含まれるホストに対してのみ付与されます（デフォルトは Graph + Bot Framework ホスト）。このリストは厳密に保ってください（マルチテナントのサフィックスは避けてください）。

## グループチャットでファイルを送信する

ボットは FileConsentCard フロー（組み込み）を使って DM でファイルを送信できます。しかし、**グループチャット/チャネルでファイルを送信する** には追加のセットアップが必要です:

| Context                  | How files are sent                           | Setup needed                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → ユーザーが承諾 → ボットがアップロード | そのままで動作                                  |
| **Group chats/channels** | SharePoint にアップロード → 共有リンク        | `sharePointSiteId` + Graph 権限が必要           |
| **Images (any context)** | Base64 エンコードのインライン                 | そのままで動作                                  |

### グループチャットで SharePoint が必要な理由

ボットには個人用の OneDrive ドライブがありません（`/me/drive` Graph API エンドポイントはアプリケーション ID では動作しません）。グループチャット/チャネルでファイルを送信するには、ボットは **SharePoint site** にアップロードして共有リンクを作成します。

### セットアップ

1. Entra ID（Azure AD）→ App Registration で **Graph API 権限** を追加します:
   - `Sites.ReadWrite.All`（Application）- SharePoint にファイルをアップロード
   - `Chat.Read.All`（Application）- 任意、ユーザー別共有リンクを有効化

2. テナントに対して **Grant admin consent** を行います。

3. **SharePoint site ID を取得します:**

   ```bash
   # Graph Explorer または有効なトークン付き curl 経由:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 例: "contoso.sharepoint.com/sites/BotFiles" にある site の場合
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # レスポンスには以下が含まれます: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw を設定します:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### 共有動作

| Permission                              | Sharing behavior                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` のみ              | 組織全体共有リンク（組織内の誰でもアクセス可能）          |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ユーザー別共有リンク（チャットメンバーのみアクセス可能）  |

ユーザー別共有の方が安全で、チャット参加者のみがファイルにアクセスできます。`Chat.Read.All` 権限がない場合、ボットは組織全体共有にフォールバックします。

### フォールバック動作

| Scenario                                          | Result                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| グループチャット + ファイル + `sharePointSiteId` 設定済み | SharePoint にアップロードし、共有リンクを送信      |
| グループチャット + ファイル + `sharePointSiteId` なし     | OneDrive アップロードを試行（失敗する場合あり）、テキストのみ送信 |
| 個人チャット + ファイル                              | FileConsentCard フロー（SharePoint なしで動作）    |
| 任意のコンテキスト + 画像                            | Base64 エンコードのインライン（SharePoint なしで動作） |

### ファイルの保存場所

アップロードされたファイルは、設定された SharePoint site の既定ドキュメントライブラリ内の `/OpenClawShared/` フォルダーに保存されます。

## 投票（Adaptive Cards）

OpenClaw は Teams の投票を Adaptive Cards として送信します（Teams にはネイティブの投票 API はありません）。

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票は Gateway によって `~/.openclaw/msteams-polls.json` に記録されます。
- 投票を記録するには Gateway がオンラインのままである必要があります。
- 投票結果の要約はまだ自動投稿されません（必要に応じて保存ファイルを確認してください）。

## プレゼンテーションカード

`message` ツールまたは CLI を使って、セマンティックなプレゼンテーションペイロードを Teams ユーザーまたは会話に送信します。OpenClaw は汎用プレゼンテーション契約から Teams Adaptive Cards としてレンダリングします。

`presentation` パラメーターはセマンティックブロックを受け取ります。`presentation` が指定されている場合、メッセージテキストは任意です。

**エージェントツール:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

target 形式の詳細については、以下の [ターゲット形式](#target-formats) を参照してください。

## ターゲット形式

MSTeams のターゲットでは、ユーザーと会話を区別するために接頭辞を使用します:

| Target type         | Format                           | Example                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| ユーザー（ID 指定） | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| ユーザー（名前指定） | `user:<display-name>`            | `user:John Smith`（Graph API が必要）               |
| グループ/チャネル   | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| グループ/チャネル（raw） | `<conversation-id>`         | `19:abc123...@thread.tacv2`（`@thread` を含む場合） |

**CLI の例:**

```bash
# ID でユーザーに送信
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# 表示名でユーザーに送信（Graph API ルックアップを実行）
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# グループチャットまたはチャネルに送信
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# プレゼンテーションカードを会話に送信
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**エージェントツールの例:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

注意: `user:` 接頭辞がない場合、名前はデフォルトでグループ/team 解決として扱われます。表示名で人を対象にする場合は、必ず `user:` を使用してください。

## プロアクティブメッセージング

- プロアクティブメッセージは、ユーザーが一度やり取りした**後でのみ**可能です。これは、その時点で会話参照を保存するためです。
- `dmPolicy` と許可リストによる制御については `/gateway/configuration` を参照してください。

## Team ID と Channel ID（よくある落とし穴）

Teams URL の `groupId` クエリパラメーターは、設定で使う team ID では**ありません**。代わりに URL パスから ID を抽出してください:

**Team URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID（これを URL デコードする）
```

**Channel URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID（これを URL デコードする）
```

**設定用:**

- Team ID = `/team/` の後のパスセグメント（URL デコード後。例: `19:Bk4j...@thread.tacv2`）
- Channel ID = `/channel/` の後のパスセグメント（URL デコード後）
- `groupId` クエリパラメーターは**無視**してください

## プライベートチャネル

ボットのプライベートチャネルでのサポートは限定的です:

| Feature                      | Standard Channels | Private Channels       |
| ---------------------------- | ----------------- | ---------------------- |
| ボットのインストール         | あり              | 限定的                 |
| リアルタイムメッセージ（Webhook） | あり          | 動作しない場合がある   |
| RSC 権限                     | あり              | 動作が異なる場合がある |
| @mentions                    | あり              | ボットにアクセスできる場合 |
| Graph API 履歴               | あり              | あり（権限がある場合） |

**プライベートチャネルで動作しない場合の回避策:**

1. ボットとのやり取りには標準チャネルを使用する
2. DM を使用する - ユーザーはいつでもボットに直接メッセージできます
3. 履歴アクセスには Graph API を使用する（`ChannelMessage.Read.All` が必要）

## トラブルシューティング

### よくある問題

- **チャネルで画像が表示されない:** Graph 権限または管理者の同意が不足しています。Teams アプリを再インストールし、Teams を完全に終了して再度開いてください。
- **チャネルで応答がない:** デフォルトではメンションが必要です。`channels.msteams.requireMention=false` を設定するか、team/channel ごとに設定してください。
- **バージョン不一致（Teams に古いマニフェストが表示され続ける）:** アプリを削除して再追加し、Teams を完全に終了して更新してください。
- **Webhook からの 401 Unauthorized:** Azure JWT なしで手動テストした場合は想定内です - これはエンドポイントには到達しているが認証に失敗したことを意味します。正しくテストするには Azure Web Chat を使用してください。

### マニフェストアップロードエラー

- **「Icon file cannot be empty」:** マニフェストが 0 バイトのアイコンファイルを参照しています。有効な PNG アイコンを作成してください（`outline.png` は 32x32、`color.png` は 192x192）。
- **「webApplicationInfo.Id already in use」:** アプリがまだ別の team/chat にインストールされています。まずそれを見つけてアンインストールするか、反映まで 5〜10 分待ってください。
- **アップロード時に「Something went wrong」:** 代わりに [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 経由でアップロードし、ブラウザー DevTools（F12）→ Network タブを開いて、実際のエラーが入っているレスポンスボディを確認してください。
- **Sideload が失敗する:** 「Upload a custom app」ではなく「Upload an app to your org's app catalog」を試してください - これで sideload 制限を回避できることがよくあります。

### RSC 権限が機能しない

1. `webApplicationInfo.id` がボットの App ID と完全に一致していることを確認する
2. アプリを再アップロードし、team/chat に再インストールする
3. 組織の管理者が RSC 権限をブロックしていないか確認する
4. 正しいスコープを使っていることを確認する: teams には `ChannelMessage.Read.Group`、グループチャットには `ChatMessage.Read.Chat`

## 参考資料

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot セットアップガイド
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams アプリの作成/管理
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（channel/group には Graph が必要）
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - ボット管理用 Teams CLI

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとハードニング
