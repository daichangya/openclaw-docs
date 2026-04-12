---
read_when:
    - Microsoft Teams チャネル機能に取り組んでいます
summary: Microsoft Teams ボットのサポート状況、機能、設定
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-12T00:18:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e6841a618fb030e4c2029b3652d45dedd516392e2ae17309ff46b93648ffb79
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> 「ここに足を踏み入れる者は、一切の希望を捨てよ。」

更新日: 2026-03-25

ステータス: テキスト + DM 添付ファイルをサポートしています。チャネル/グループでのファイル送信には `sharePointSiteId` + Graph 権限が必要です（[グループチャットでのファイル送信](#sending-files-in-group-chats) を参照）。Polls は Adaptive Cards 経由で送信されます。メッセージアクションでは、ファイル優先送信向けに明示的な `upload-file` が公開されています。

## バンドル済みプラグイン

Microsoft Teams は現在の OpenClaw リリースではバンドル済みプラグインとして提供されるため、
通常のパッケージ版ビルドでは別途インストールは不要です。

古いビルドを使用している場合、またはバンドル済み Teams を含まないカスタムインストールの場合は、
手動でインストールしてください:

```bash
openclaw plugins install @openclaw/msteams
```

ローカルチェックアウト（git リポジトリから実行する場合）:

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳細: [プラグイン](/ja-JP/tools/plugin)

## クイックセットアップ（初心者向け）

1. Microsoft Teams プラグインが利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースにはすでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. **Azure Bot** を作成します（App ID + クライアントシークレット + テナント ID）。
3. その認証情報で OpenClaw を設定します。
4. 公開 URL またはトンネル経由で `/api/messages`（デフォルトはポート 3978）を公開します。
5. Teams アプリパッケージをインストールして Gateway を起動します。

最小構成（クライアントシークレット）:

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

本番デプロイでは、クライアントシークレットの代わりに [フェデレーション認証](#federated-authentication-certificate--managed-identity)（証明書またはマネージド ID）の使用を検討してください。

注意: グループチャットはデフォルトでブロックされています（`channels.msteams.groupPolicy: "allowlist"`）。グループ返信を許可するには、`channels.msteams.groupAllowFrom` を設定してください（または、メンション制御付きで任意のメンバーを許可するには `groupPolicy: "open"` を使用してください）。

## 目標

- Teams の DM、グループチャット、またはチャネル経由で OpenClaw とやり取りする。
- ルーティングを決定的に保つ: 返信は常に受信したチャネルに戻る。
- 安全なチャネル動作をデフォルトにする（設定しない限りメンション必須）。

## 設定の書き込み

デフォルトでは、Microsoft Teams は `/config set|unset` によってトリガーされる設定更新の書き込みを許可されています（`commands.config: true` が必要です）。

無効にするには:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## アクセス制御（DM + グループ）

**DM アクセス**

- デフォルト: `channels.msteams.dmPolicy = "pairing"`。未承認の送信者は承認されるまで無視されます。
- `channels.msteams.allowFrom` には安定した AAD オブジェクト ID を使用してください。
- UPN/表示名は変更可能です。直接一致はデフォルトで無効で、`channels.msteams.dangerouslyAllowNameMatching: true` を指定した場合のみ有効になります。
- 認証情報が許可していれば、ウィザードは Microsoft Graph 経由で名前を ID に解決できます。

**グループアクセス**

- デフォルト: `channels.msteams.groupPolicy = "allowlist"`（`groupAllowFrom` を追加しない限りブロックされます）。未設定時のデフォルトを上書きするには `channels.defaults.groupPolicy` を使います。
- `channels.msteams.groupAllowFrom` は、グループチャット/チャネルでどの送信者がトリガーできるかを制御します（`channels.msteams.allowFrom` にフォールバックします）。
- 任意のメンバーを許可するには `groupPolicy: "open"` を設定します（それでもデフォルトではメンション制御されます）。
- **チャネルを一切許可しない**場合は、`channels.msteams.groupPolicy: "disabled"` を設定します。

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
- `groupPolicy="allowlist"` で teams の許可リストが存在する場合、列挙された teams/channels のみが受け付けられます（メンション制御あり）。
- 設定ウィザードでは `Team/Channel` エントリを受け付け、それらを保存します。
- 起動時に、OpenClaw は team/channel およびユーザー許可リストの名前を ID に解決し（Graph 権限が許可している場合）、
  マッピングをログ出力します。解決できない team/channel 名は入力されたまま保持されますが、デフォルトではルーティングで無視されます。`channels.msteams.dangerouslyAllowNameMatching: true` が有効な場合を除きます。

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

## 仕組み

1. Microsoft Teams プラグインが利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースにはすでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. **Azure Bot** を作成します（App ID + シークレット + テナント ID）。
3. ボットを参照し、以下の RSC 権限を含む **Teams アプリパッケージ** を作成します。
4. Teams アプリを team にアップロード/インストールします（または DM 用に個人スコープにインストールします）。
5. `~/.openclaw/openclaw.json`（または環境変数）で `msteams` を設定し、Gateway を起動します。
6. Gateway はデフォルトで `/api/messages` 上の Bot Framework webhook トラフィックを待ち受けます。

## Azure Bot セットアップ（前提条件）

OpenClaw を設定する前に、Azure Bot リソースを作成する必要があります。

### ステップ 1: Azure Bot を作成する

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) に移動します
2. **Basics** タブに入力します:

   | フィールド         | 値                                                       |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | ボット名。例: `openclaw-msteams`（一意である必要があります） |
   | **Subscription**   | Azure サブスクリプションを選択                          |
   | **Resource group** | 新規作成するか既存のものを使用                          |
   | **Pricing tier**   | 開発/テスト用は **Free**                                |
   | **Type of App**    | **Single Tenant**（推奨 - 下記の注記を参照）            |
   | **Creation type**  | **Create new Microsoft App ID**                         |

> **非推奨に関する通知:** 新しいマルチテナントボットの作成は 2025-07-31 以降非推奨になりました。新しいボットには **Single Tenant** を使用してください。

3. **Review + create** → **Create** をクリックします（約 1〜2 分待ちます）

### ステップ 2: 認証情報を取得する

1. Azure Bot リソース → **Configuration** に移動します
2. **Microsoft App ID** をコピーします → これが `appId` です
3. **Manage Password** をクリックします → App Registration に移動します
4. **Certificates & secrets** → **New client secret** → **Value** をコピーします → これが `appPassword` です
5. **Overview** に移動します → **Directory (tenant) ID** をコピーします → これが `tenantId` です

### ステップ 3: メッセージングエンドポイントを設定する

1. Azure Bot → **Configuration**
2. **Messaging endpoint** を webhook URL に設定します:
   - 本番: `https://your-domain.com/api/messages`
   - ローカル開発: トンネルを使用します（下記の [ローカル開発](#local-development-tunneling) を参照）

### ステップ 4: Teams チャネルを有効にする

1. Azure Bot → **Channels**
2. **Microsoft Teams** → Configure → Save をクリックします
3. 利用規約に同意します

## フェデレーション認証（証明書 + マネージド ID）

> 2026.3.24 で追加

本番デプロイ向けに、OpenClaw はクライアントシークレットより安全な代替手段として **フェデレーション認証** をサポートしています。利用可能な方法は 2 つあります:

### オプション A: 証明書ベース認証

Entra ID アプリ登録に登録された PEM 証明書を使用します。

**セットアップ:**

1. 証明書を生成または取得します（秘密鍵を含む PEM 形式）。
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → 公開証明書をアップロードします。

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

パスワードレス認証に Azure Managed Identity を使用します。これは、マネージド ID が利用可能な Azure インフラストラクチャ（AKS、App Service、Azure VM）上のデプロイに最適です。

**仕組み:**

1. ボットの pod/VM にはマネージド ID（システム割り当てまたはユーザー割り当て）があります。
2. **フェデレーション ID 資格情報** が、そのマネージド ID を Entra ID アプリ登録に関連付けます。
3. 実行時に、OpenClaw は `@azure/identity` を使用して Azure IMDS エンドポイント（`169.254.169.254`）からトークンを取得します。
4. そのトークンがボット認証のために Teams SDK に渡されます。

**前提条件:**

- マネージド ID が有効な Azure インフラストラクチャ（AKS workload identity、App Service、VM）
- Entra ID アプリ登録上に作成されたフェデレーション ID 資格情報
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

1. AKS クラスターで **workload identity** を有効にします。
2. Entra ID アプリ登録上に **フェデレーション ID 資格情報** を作成します:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Kubernetes service account** にアプリ client ID のアノテーションを付けます:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. workload identity を注入するために **pod** にラベルを付けます:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS（`169.254.169.254`）への **ネットワークアクセス** を確保します — NetworkPolicy を使用している場合は、`169.254.169.254/32` のポート 80 へのトラフィックを許可する egress ルールを追加してください。

### 認証タイプの比較

| 方法                 | 設定                                           | 長所                               | 短所                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **クライアントシークレット** | `appPassword`                                  | セットアップが簡単                     | シークレットのローテーションが必要、より安全性が低い |
| **証明書**           | `authType: "federated"` + `certificatePath`    | ネットワーク上で共有シークレットが不要 | 証明書管理のオーバーヘッドがある             |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | パスワードレス、管理するシークレット不要 | Azure インフラストラクチャが必要         |

**デフォルトの動作:** `authType` が設定されていない場合、OpenClaw はクライアントシークレット認証をデフォルトで使用します。既存の設定は変更なしで引き続き動作します。

## ローカル開発（トンネリング）

Teams は `localhost` に到達できません。ローカル開発にはトンネルを使用してください:

**オプション A: ngrok**

```bash
ngrok http 3978
# https URL をコピーします。例: https://abc123.ngrok.io
# メッセージングエンドポイントを次に設定します: https://abc123.ngrok.io/api/messages
```

**オプション B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Tailscale funnel URL をメッセージングエンドポイントとして使用します
```

## Teams Developer Portal（代替手段）

manifest ZIP を手動で作成する代わりに、[Teams Developer Portal](https://dev.teams.microsoft.com/apps) を使用できます:

1. **+ New app** をクリックします
2. 基本情報（名前、説明、開発者情報）を入力します
3. **App features** → **Bot** に移動します
4. **Enter a bot ID manually** を選択し、Azure Bot App ID を貼り付けます
5. スコープをチェックします: **Personal**、**Team**、**Group Chat**
6. **Distribute** → **Download app package** をクリックします
7. Teams で: **Apps** → **Manage your apps** → **Upload a custom app** → ZIP を選択します

これは JSON manifest を手動編集するより簡単なことが多いです。

## ボットのテスト

**オプション A: Azure Web Chat（最初に webhook を検証）**

1. Azure Portal → 対象の Azure Bot リソース → **Test in Web Chat**
2. メッセージを送信します - 応答が表示されるはずです
3. これにより、Teams の設定前に webhook エンドポイントが動作していることを確認できます

**オプション B: Teams（アプリインストール後）**

1. Teams アプリをインストールします（サイドロードまたは組織カタログ）
2. Teams でボットを見つけて DM を送信します
3. 受信アクティビティについて Gateway ログを確認します

## セットアップ（最小のテキスト専用）

1. **Microsoft Teams プラグインが利用可能であることを確認**
   - 現在のパッケージ版 OpenClaw リリースにはすでにバンドルされています。
   - 古い/カスタムインストールでは、手動で追加できます:
     - npm から: `openclaw plugins install @openclaw/msteams`
     - ローカルチェックアウトから: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **ボット登録**
   - Azure Bot を作成し（上記参照）、以下を控えます:
     - App ID
     - クライアントシークレット（App password）
     - テナント ID（シングルテナント）

3. **Teams アプリ manifest**
   - `botId = <App ID>` を持つ `bot` エントリを含めます。
   - スコープ: `personal`、`team`、`groupChat`。
   - `supportsFiles: true`（個人スコープでのファイル処理に必要）。
   - RSC 権限を追加します（下記）。
   - アイコンを作成します: `outline.png`（32x32）および `color.png`（192x192）。
   - 3 つのファイル `manifest.json`、`outline.png`、`color.png` をまとめて zip 化します。

4. **OpenClaw を設定**

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

   設定キーの代わりに環境変数も使用できます:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE`（任意: `"secret"` または `"federated"`）
   - `MSTEAMS_CERTIFICATE_PATH`（federated + 証明書）
   - `MSTEAMS_CERTIFICATE_THUMBPRINT`（任意、認証には必須ではありません）
   - `MSTEAMS_USE_MANAGED_IDENTITY`（federated + managed identity）
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（ユーザー割り当て MI のみ）

5. **ボットエンドポイント**
   - Azure Bot Messaging Endpoint を次に設定します:
     - `https://<host>:3978/api/messages`（または選択したパス/ポート）。

6. **Gateway を実行**
   - バンドル済みまたは手動インストール済みのプラグインが利用可能で、認証情報付きの `msteams` 設定が存在する場合、Teams チャネルは自動的に起動します。

## メンバー情報アクション

OpenClaw は Microsoft Teams 向けに Graph をバックエンドとする `member-info` アクションを公開しているため、エージェントや自動化で Microsoft Graph からチャネルメンバーの詳細（表示名、メールアドレス、ロール）を直接解決できます。

要件:

- `Member.Read.Group` RSC 権限（推奨 manifest にすでに含まれています）
- team をまたぐ検索の場合: 管理者同意付きの `User.Read.All` Graph Application 権限

このアクションは `channels.msteams.actions.memberInfo` によって制御されます（デフォルト: Graph 認証情報が利用可能な場合に有効）。

## 履歴コンテキスト

- `channels.msteams.historyLimit` は、直近のチャネル/グループメッセージをいくつ prompt に含めるかを制御します。
- `messages.groupChat.historyLimit` にフォールバックします。無効化するには `0` を設定します（デフォルトは 50）。
- 取得されたスレッド履歴は送信者の許可リスト（`allowFrom` / `groupAllowFrom`）によってフィルタリングされるため、スレッドコンテキストのシードには許可された送信者のメッセージのみが含まれます。
- 引用された添付ファイルコンテキスト（Teams の返信 HTML に由来する `ReplyTo*`）は、現時点では受信したまま渡されます。
- 言い換えると、許可リストは誰がエージェントをトリガーできるかを制御しますが、現時点でフィルタリングされるのは特定の補助コンテキスト経路のみです。
- DM 履歴は `channels.msteams.dmHistoryLimit`（ユーザーターン数）で制限できます。ユーザーごとの上書き: `channels.msteams.dms["<user_id>"].historyLimit`。

## 現在の Teams RSC 権限（Manifest）

これらは Teams アプリ manifest にある**既存の resourceSpecific 権限**です。これらはアプリがインストールされている team/chat 内でのみ適用されます。

**チャネル用（team スコープ）:**

- `ChannelMessage.Read.Group` (Application) - @mention なしで全チャネルメッセージを受信
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**グループチャット用:**

- `ChatMessage.Read.Chat` (Application) - @mention なしで全グループチャットメッセージを受信

## Teams Manifest の例（機微情報を削除済み）

必須フィールドを備えた最小限の有効な例です。ID と URL を置き換えてください。

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

### Manifest の注意点（必須フィールド）

- `bots[].botId` は Azure Bot App ID と**必ず**一致している必要があります。
- `webApplicationInfo.id` は Azure Bot App ID と**必ず**一致している必要があります。
- `bots[].scopes` には使用予定のサーフェス（`personal`、`team`、`groupChat`）を含める必要があります。
- `bots[].supportsFiles: true` は個人スコープでのファイル処理に必要です。
- チャネルトラフィックを利用したい場合、`authorization.permissions.resourceSpecific` にはチャネルの読み取り/送信を含める必要があります。

### 既存アプリの更新

すでにインストール済みの Teams アプリを更新するには（例: RSC 権限を追加する場合）:

1. 新しい設定で `manifest.json` を更新します
2. **`version` フィールドをインクリメント**します（例: `1.0.0` → `1.1.0`）
3. アイコン付きで manifest を**再度 zip 化**します（`manifest.json`、`outline.png`、`color.png`）
4. 新しい zip をアップロードします:
   - **オプション A（Teams Admin Center）:** Teams Admin Center → Teams apps → Manage apps → 対象アプリを見つける → Upload new version
   - **オプション B（サイドロード）:** Teams → Apps → Manage your apps → Upload a custom app
5. **team チャネルの場合:** 新しい権限を有効にするため、各 team でアプリを再インストールします
6. キャッシュされたアプリメタデータを消去するため、Teams を**完全に終了して再起動**します（ウィンドウを閉じるだけでは不十分です）

## 機能: RSC のみ vs Graph

### **Teams RSC のみ**の場合（アプリインストール済み、Graph API 権限なし）

動作するもの:

- チャネルメッセージの**テキスト**内容の読み取り。
- チャネルメッセージの**テキスト**内容の送信。
- **個人（DM）** のファイル添付の受信。

動作しないもの:

- チャネル/グループの**画像またはファイル内容**（ペイロードには HTML スタブのみが含まれます）。
- SharePoint/OneDrive に保存された添付ファイルのダウンロード。
- メッセージ履歴の読み取り（ライブ webhook イベントを超える分）。

### **Teams RSC + Microsoft Graph Application 権限**の場合

追加されるもの:

- ホストされたコンテンツのダウンロード（メッセージに貼り付けられた画像）。
- SharePoint/OneDrive に保存されたファイル添付のダウンロード。
- Graph 経由でのチャネル/チャットのメッセージ履歴の読み取り。

### RSC vs Graph API

| 機能                    | RSC 権限             | Graph API                            |
| ----------------------- | -------------------- | ------------------------------------ |
| **リアルタイムメッセージ** | Yes (via webhook)    | No (polling only)                    |
| **履歴メッセージ**       | No                   | Yes (can query history)              |
| **セットアップの複雑さ** | App manifest only    | Requires admin consent + token flow  |
| **オフライン動作**       | No (must be running) | Yes (query anytime)                  |

**要点:** RSC はリアルタイム監視用、Graph API は履歴アクセス用です。オフライン中に見逃したメッセージを追いつくには、`ChannelMessage.Read.All` を備えた Graph API が必要です（管理者同意が必要）。

## Graph 対応のメディア + 履歴（チャネルで必須）

**チャネル**で画像/ファイルが必要な場合、または**メッセージ履歴**を取得したい場合は、Microsoft Graph 権限を有効化し、管理者同意を付与する必要があります。

1. Entra ID (Azure AD) の **App Registration** で、Microsoft Graph の **Application 権限**を追加します:
   - `ChannelMessage.Read.All`（チャネル添付 + 履歴）
   - `Chat.Read.All` または `ChatMessage.Read.All`（グループチャット）
2. テナントに対して**管理者同意を付与**します。
3. Teams アプリの **manifest version** を上げて、再アップロードし、**Teams でアプリを再インストール**します。
4. キャッシュされたアプリメタデータを消去するため、**Teams を完全に終了して再起動**します。

**ユーザーメンション用の追加権限:** ユーザーの @mention は、その会話内のユーザーであればそのまま動作します。ただし、**現在の会話に含まれていない**ユーザーを動的に検索してメンションしたい場合は、`User.Read.All` (Application) 権限を追加し、管理者同意を付与してください。

## 既知の制限

### Webhook タイムアウト

Teams は HTTP webhook 経由でメッセージを配信します。処理に時間がかかりすぎる場合（例: LLM の応答が遅い場合）、次のようなことが起こる可能性があります:

- Gateway タイムアウト
- Teams がメッセージを再試行する（重複の原因）
- 返信が失われる

OpenClaw は、すばやく応答を返してから積極的に返信を送信することでこれに対処していますが、非常に遅い応答では依然として問題が発生する可能性があります。

### 書式設定

Teams の markdown は Slack や Discord より制限があります:

- 基本的な書式は動作します: **太字**、_斜体_、`code`、リンク
- 複雑な markdown（表、ネストしたリスト）は正しく表示されない場合があります
- Polls および任意のカード送信用に Adaptive Cards がサポートされています（下記参照）

## 設定

主な設定（共有チャネルパターンについては `/gateway/configuration` を参照）:

- `channels.msteams.enabled`: チャネルを有効/無効にします。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`: ボット認証情報。
- `channels.msteams.webhook.port`（デフォルト `3978`）
- `channels.msteams.webhook.path`（デフォルト `/api/messages`）
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）
- `channels.msteams.allowFrom`: DM 許可リスト（AAD オブジェクト ID を推奨）。Graph アクセスが利用可能な場合、ウィザードはセットアップ時に名前を ID に解決します。
- `channels.msteams.dangerouslyAllowNameMatching`: 変更可能な UPN/表示名マッチングと、team/channel 名による直接ルーティングを再有効化するための非常用トグル。
- `channels.msteams.textChunkLimit`: 送信テキストのチャンクサイズ。
- `channels.msteams.chunkMode`: `length`（デフォルト）または `newline`。長さによる分割の前に空行（段落境界）で分割します。
- `channels.msteams.mediaAllowHosts`: 受信添付ファイルホストの許可リスト（デフォルトは Microsoft/Teams ドメイン）。
- `channels.msteams.mediaAuthAllowHosts`: メディア再試行時に Authorization ヘッダーを付与するホストの許可リスト（デフォルトは Graph + Bot Framework ホスト）。
- `channels.msteams.requireMention`: チャネル/グループで @mention を必須にします（デフォルト true）。
- `channels.msteams.replyStyle`: `thread | top-level`（[返信スタイル](#reply-style-threads-vs-posts) を参照）。
- `channels.msteams.teams.<teamId>.replyStyle`: team ごとの上書き設定。
- `channels.msteams.teams.<teamId>.requireMention`: team ごとの上書き設定。
- `channels.msteams.teams.<teamId>.tools`: team ごとのデフォルトツールポリシー上書き（`allow`/`deny`/`alsoAllow`）。チャネル上書きがない場合に使用されます。
- `channels.msteams.teams.<teamId>.toolsBySender`: team ごとの送信者別デフォルトツールポリシー上書き（`"*"` ワイルドカード対応）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: チャネルごとの上書き設定。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: チャネルごとの上書き設定。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: チャネルごとのツールポリシー上書き（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: チャネルごとの送信者別ツールポリシー上書き（`"*"` ワイルドカード対応）。
- `toolsBySender` のキーには明示的なプレフィックスを使用してください:
  `id:`、`e164:`、`username:`、`name:`（従来のプレフィックスなしキーも引き続き `id:` のみにマップされます）。
- `channels.msteams.actions.memberInfo`: Graph をバックエンドとする member info アクションを有効または無効にします（デフォルト: Graph 認証情報が利用可能な場合に有効）。
- `channels.msteams.authType`: 認証タイプ — `"secret"`（デフォルト）または `"federated"`。
- `channels.msteams.certificatePath`: PEM 証明書ファイルへのパス（federated + 証明書認証）。
- `channels.msteams.certificateThumbprint`: 証明書サムプリント（任意、認証には必須ではありません）。
- `channels.msteams.useManagedIdentity`: managed identity 認証を有効にします（federated モード）。
- `channels.msteams.managedIdentityClientId`: ユーザー割り当て managed identity 用の client ID。
- `channels.msteams.sharePointSiteId`: グループチャット/チャネルでのファイルアップロード用 SharePoint site ID（[グループチャットでのファイル送信](#sending-files-in-group-chats) を参照）。

## ルーティングとセッション

- セッションキーは標準のエージェント形式に従います（[/concepts/session](/ja-JP/concepts/session) を参照）:
  - ダイレクトメッセージはメインセッションを共有します（`agent:<agentId>:<mainKey>`）。
  - チャネル/グループメッセージは conversation id を使用します:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 返信スタイル: スレッド vs 投稿

Teams は最近、同じ基盤データモデル上で 2 つのチャネル UI スタイルを導入しました:

| スタイル                 | 説明                                                      | 推奨 `replyStyle`     |
| ------------------------ | --------------------------------------------------------- | --------------------- |
| **Posts**（クラシック）  | メッセージはカードとして表示され、その下にスレッド返信が表示される | `thread`（デフォルト） |
| **Threads**（Slack 風）  | メッセージはより Slack のように直線的に流れる            | `top-level`           |

**問題点:** Teams API は、チャネルがどの UI スタイルを使っているかを公開しません。誤った `replyStyle` を使うと:

- Threads スタイルのチャネルで `thread` → 返信が不自然にネストされて表示される
- Posts スタイルのチャネルで `top-level` → 返信がスレッド内ではなく別のトップレベル投稿として表示される

**解決策:** チャネルの設定方法に基づいて、チャネルごとに `replyStyle` を設定します:

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
- **チャネル/グループ:** 添付ファイルは M365 ストレージ（SharePoint/OneDrive）に保存されます。webhook ペイロードには実際のファイルバイトではなく HTML スタブのみが含まれます。チャネル添付をダウンロードするには **Graph API 権限が必要です**。
- 明示的なファイル優先送信には、`media` / `filePath` / `path` とともに `action=upload-file` を使用します。任意の `message` は添付テキスト/コメントになり、`filename` はアップロード名を上書きします。

Graph 権限がない場合、画像を含むチャネルメッセージはテキストのみとして受信されます（画像内容にはボットからアクセスできません）。
デフォルトでは、OpenClaw は Microsoft/Teams ホスト名からのみメディアをダウンロードします。`channels.msteams.mediaAllowHosts` で上書きできます（任意のホストを許可するには `["*"]` を使用）。
Authorization ヘッダーは `channels.msteams.mediaAuthAllowHosts` に含まれるホストに対してのみ付与されます（デフォルトは Graph + Bot Framework ホスト）。このリストは厳密に保ってください（マルチテナントのサフィックスは避けてください）。

## グループチャットでのファイル送信

ボットは DMs では FileConsentCard フロー（組み込み）を使ってファイルを送信できます。ただし、**グループチャット/チャネルでのファイル送信**には追加設定が必要です:

| コンテキスト             | ファイル送信方法                             | 必要なセットアップ                                |
| ------------------------ | -------------------------------------------- | ------------------------------------------------- |
| **DMs**                  | FileConsentCard → ユーザーが承認 → ボットがアップロード | そのままで動作                                    |
| **グループチャット/チャネル** | SharePoint にアップロード → 共有リンク        | `sharePointSiteId` + Graph 権限が必要             |
| **画像（任意のコンテキスト）** | Base64 エンコードのインライン                | そのままで動作                                    |

### グループチャットで SharePoint が必要な理由

ボットには個人用 OneDrive ドライブがありません（Graph API の `/me/drive` エンドポイントはアプリケーション ID では動作しません）。グループチャット/チャネルでファイルを送信するには、ボットは **SharePoint site** にアップロードし、共有リンクを作成します。

### セットアップ

1. Entra ID (Azure AD) → App Registration で **Graph API 権限**を追加します:
   - `Sites.ReadWrite.All` (Application) - SharePoint にファイルをアップロード
   - `Chat.Read.All` (Application) - 任意、ユーザーごとの共有リンクを有効化

2. テナントに対して**管理者同意を付与**します。

3. **SharePoint site ID を取得します:**

   ```bash
   # Graph Explorer または有効なトークン付き curl 経由:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 例: "contoso.sharepoint.com/sites/BotFiles" にある site の場合
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # レスポンスには次が含まれます: "id": "contoso.sharepoint.com,guid1,guid2"
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

| 権限                                    | 共有動作                                                   |
| --------------------------------------- | ---------------------------------------------------------- |
| `Sites.ReadWrite.All` のみ              | 組織全体共有リンク（組織内の全員がアクセス可能）           |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ユーザーごとの共有リンク（チャットメンバーのみアクセス可能） |

ユーザーごとの共有のほうが、チャット参加者のみがファイルにアクセスできるため、より安全です。`Chat.Read.All` 権限がない場合、ボットは組織全体共有にフォールバックします。

### フォールバック動作

| シナリオ                                          | 結果                                               |
| ------------------------------------------------- | -------------------------------------------------- |
| グループチャット + ファイル + `sharePointSiteId` 設定済み | SharePoint にアップロードし、共有リンクを送信      |
| グループチャット + ファイル + `sharePointSiteId` なし     | OneDrive アップロードを試行（失敗する場合あり）、テキストのみ送信 |
| 個人チャット + ファイル                            | FileConsentCard フロー（SharePoint なしで動作）    |
| 任意のコンテキスト + 画像                          | Base64 エンコードのインライン（SharePoint なしで動作） |

### ファイル保存場所

アップロードされたファイルは、設定された SharePoint site の既定ドキュメントライブラリ内の `/OpenClawShared/` フォルダーに保存されます。

## Polls（Adaptive Cards）

OpenClaw は Teams の Polls を Adaptive Cards として送信します（Teams のネイティブな poll API はありません）。

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票は Gateway により `~/.openclaw/msteams-polls.json` に記録されます。
- 投票を記録するには Gateway がオンラインのままである必要があります。
- Polls はまだ結果サマリーを自動投稿しません（必要に応じて保存ファイルを確認してください）。

## Adaptive Cards（任意）

`message` ツールまたは CLI を使って、任意の Adaptive Card JSON を Teams ユーザーまたは conversation に送信できます。

`card` パラメータは Adaptive Card JSON オブジェクトを受け取ります。`card` が指定されている場合、メッセージテキストは任意です。

**エージェントツール:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

カードスキーマと例については [Adaptive Cards documentation](https://adaptivecards.io/) を参照してください。target 形式の詳細については、下記の [Target formats](#target-formats) を参照してください。

## Target formats

MSTeams の target は、ユーザーと conversation を区別するためにプレフィックスを使用します:

| target タイプ          | 形式                             | 例                                                  |
| ---------------------- | -------------------------------- | --------------------------------------------------- |
| ユーザー（ID 指定）    | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| ユーザー（名前指定）   | `user:<display-name>`            | `user:John Smith`（Graph API が必要）               |
| グループ/チャネル      | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| グループ/チャネル（生） | `<conversation-id>`              | `19:abc123...@thread.tacv2`（`@thread` を含む場合） |

**CLI の例:**

```bash
# ID でユーザーに送信
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# 表示名でユーザーに送信（Graph API 参照をトリガー）
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# グループチャットまたはチャネルに送信
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# conversation に Adaptive Card を送信
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
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
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello" }],
  },
}
```

注意: `user:` プレフィックスがない場合、名前はデフォルトで group/team 解決として扱われます。表示名で人を指定する場合は、必ず `user:` を使用してください。

## プロアクティブメッセージング

- プロアクティブメッセージは、会話参照をその時点で保存するため、ユーザーが一度やり取りした**後でのみ**可能です。
- `dmPolicy` と許可リストによる制御については `/gateway/configuration` を参照してください。

## Team ID と Channel ID（よくある落とし穴）

Teams URL の `groupId` クエリパラメータは、設定で使用する team ID **ではありません**。代わりに URL パスから ID を抽出してください:

**Team URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID（これを URL デコード）
```

**Channel URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID（これを URL デコード）
```

**設定で使う値:**

- Team ID = `/team/` の後のパスセグメント（URL デコード済み。例: `19:Bk4j...@thread.tacv2`）
- Channel ID = `/channel/` の後のパスセグメント（URL デコード済み）
- `groupId` クエリパラメータは**無視**してください

## プライベートチャネル

ボットのプライベートチャネル対応は限定的です:

| 機能                         | 標準チャネル      | プライベートチャネル   |
| ---------------------------- | ----------------- | ---------------------- |
| ボットのインストール         | Yes               | Limited                |
| リアルタイムメッセージ（webhook） | Yes               | May not work           |
| RSC 権限                     | Yes               | May behave differently |
| @mentions                    | Yes               | If bot is accessible   |
| Graph API 履歴               | Yes               | Yes (with permissions) |

**プライベートチャネルで動作しない場合の回避策:**

1. ボットとのやり取りには標準チャネルを使用する
2. DM を使用する - ユーザーは常にボットに直接メッセージできます
3. 履歴アクセスには Graph API を使用する（`ChannelMessage.Read.All` が必要）

## トラブルシューティング

### よくある問題

- **チャネルで画像が表示されない:** Graph 権限または管理者同意が不足しています。Teams アプリを再インストールし、Teams を完全に終了して再度開いてください。
- **チャネルで応答がない:** デフォルトではメンションが必要です。`channels.msteams.requireMention=false` を設定するか、team/channel ごとに設定してください。
- **バージョン不一致（Teams に古い manifest が表示される）:** アプリを削除して再追加し、更新のために Teams を完全に終了してください。
- **webhook からの 401 Unauthorized:** Azure JWT なしで手動テストした場合は想定内です。エンドポイントには到達していますが認証に失敗しています。適切にテストするには Azure Web Chat を使用してください。

### Manifest のアップロードエラー

- **「Icon file cannot be empty」:** manifest が参照しているアイコンファイルが 0 バイトです。有効な PNG アイコンを作成してください（`outline.png` は 32x32、`color.png` は 192x192）。
- **「webApplicationInfo.Id already in use」:** アプリが別の team/chat にまだインストールされています。先に見つけてアンインストールするか、反映まで 5〜10 分待ってください。
- **アップロード時の「Something went wrong」:** 代わりに [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 経由でアップロードし、ブラウザの DevTools（F12）→ Network タブを開いて、実際のエラーについてレスポンス本文を確認してください。
- **サイドロードに失敗する:** 「Upload a custom app」の代わりに「Upload an app to your org's app catalog」を試してください。これにより sideload 制限を回避できることがよくあります。

### RSC 権限が動作しない

1. `webApplicationInfo.id` がボットの App ID と完全に一致していることを確認します
2. アプリを再アップロードし、team/chat に再インストールします
3. 組織の管理者が RSC 権限をブロックしていないか確認します
4. 正しいスコープを使用していることを確認します: teams には `ChannelMessage.Read.Group`、グループチャットには `ChatMessage.Read.Chat`

## 参考資料

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot セットアップガイド
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams アプリの作成/管理
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（channel/group には Graph が必要）
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャット動作とメンション制御
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとハードニング
