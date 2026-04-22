---
read_when:
    - Microsoft Teamsチャンネル機能に取り組んでいます
summary: Microsoft Teamsボットのサポート状況、機能、設定
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-22T04:19:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee9d52fb2cc7801e84249a705e0fa2052d4afbb7ef58cee2d3362b3e7012348c
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> 「ここに入る者は一切の希望を捨てよ。」

ステータス: テキスト + DM添付ファイルはサポートされています。チャンネル/グループでのファイル送信には`sharePointSiteId` + Graph権限が必要です（[グループチャットでのファイル送信](#sending-files-in-group-chats)を参照）。投票はAdaptive Cards経由で送信されます。メッセージアクションでは、ファイル優先送信向けに明示的な`upload-file`が公開されます。

## バンドルされたPlugin

Microsoft Teamsは現在のOpenClawリリースではバンドルされたPluginとして提供されるため、
通常のパッケージ版ビルドでは個別のインストールは不要です。

古いビルド、またはバンドルされたTeamsを含まないカスタムインストールを使用している場合は、
手動でインストールしてください。

```bash
openclaw plugins install @openclaw/msteams
```

ローカルチェックアウト（gitリポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ（初心者向け）

1. Microsoft Teams Pluginが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースにはすでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. **Azure Bot**を作成します（App ID + client secret + tenant ID）。
3. それらの認証情報でOpenClawを設定します。
4. 公開URLまたはトンネル経由で`/api/messages`（デフォルトではポート3978）を公開します。
5. Teamsアプリパッケージをインストールし、Gatewayを起動します。

最小構成（client secret）:

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

本番デプロイでは、client secretの代わりに[フェデレーション認証](#federated-authentication-certificate--managed-identity)（証明書またはmanaged identity）の利用を検討してください。

注: グループチャットはデフォルトでブロックされています（`channels.msteams.groupPolicy: "allowlist"`）。グループ返信を許可するには、`channels.msteams.groupAllowFrom`を設定してください（または`groupPolicy: "open"`を使って任意のメンバーを許可します。メンションゲートは維持されます）。

## 目標

- TeamsのDM、グループチャット、またはチャンネルからOpenClawと会話する。
- ルーティングを決定的に保つ: 返信は常に受信したチャンネルに戻る。
- 安全なチャンネル動作をデフォルトにする（設定しない限りメンション必須）。

## 設定書き込み

デフォルトでは、Microsoft Teamsは`/config set|unset`によってトリガーされる設定更新の書き込みが許可されています（`commands.config: true`が必要です）。

無効にするには:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## アクセス制御（DM + グループ）

**DMアクセス**

- デフォルト: `channels.msteams.dmPolicy = "pairing"`。未承認の送信者は承認されるまで無視されます。
- `channels.msteams.allowFrom`には安定したAADオブジェクトIDを使用してください。
- UPN/表示名は変更可能です。直接一致はデフォルトで無効で、`channels.msteams.dangerouslyAllowNameMatching: true`の場合にのみ有効になります。
- 認証情報で許可されていれば、ウィザードはMicrosoft Graph経由で名前をIDに解決できます。

**グループアクセス**

- デフォルト: `channels.msteams.groupPolicy = "allowlist"`（`groupAllowFrom`を追加しない限りブロックされます）。未設定時のデフォルトを上書きするには`channels.defaults.groupPolicy`を使用します。
- `channels.msteams.groupAllowFrom`は、グループチャット/チャンネルでどの送信者がトリガーできるかを制御します（`channels.msteams.allowFrom`にフォールバックします）。
- `groupPolicy: "open"`を設定すると任意のメンバーを許可できます（デフォルトでは引き続きメンションゲートあり）。
- **チャンネルを一切許可しない**には、`channels.msteams.groupPolicy: "disabled"`を設定します。

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

**Teams + チャンネル許可リスト**

- `channels.msteams.teams`の下にteamsとchannelsを列挙して、グループ/チャンネル返信のスコープを制限します。
- キーには安定したteam IDとchannel conversation IDを使用してください。
- `groupPolicy="allowlist"`でteams許可リストが存在する場合、列挙されたteam/channelのみが受け入れられます（メンションゲートあり）。
- 設定ウィザードでは`Team/Channel`形式の項目を受け付け、それらを保存します。
- 起動時に、OpenClawはteam/channelおよびユーザー許可リスト名をIDに解決し（Graph権限で許可される場合）、
  その対応関係をログに出力します。解決できなかったteam/channel名は入力どおり保持されますが、`channels.msteams.dangerouslyAllowNameMatching: true`が有効でない限り、デフォルトではルーティングで無視されます。

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

1. Microsoft Teams Pluginが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースにはすでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. **Azure Bot**を作成します（App ID + secret + tenant ID）。
3. ボットを参照し、以下のRSC権限を含む**Teams app package**を作成します。
4. Teamsアプリをteam内にアップロード/インストールします（またはDM用にpersonal scopeへインストールします）。
5. `~/.openclaw/openclaw.json`（または環境変数）で`msteams`を設定し、Gatewayを起動します。
6. Gatewayはデフォルトで`/api/messages`上のBot Framework Webhookトラフィックを待ち受けます。

## Azure Botセットアップ（前提条件）

OpenClawを設定する前に、Azure Botリソースを作成する必要があります。

### ステップ1: Azure Botを作成する

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)に移動します
2. **Basics**タブに入力します:

   | フィールド | 値 |
   | ---------- | -------------------------------------------------------- |
   | **Bot handle** | ボット名（例: `openclaw-msteams`、一意である必要があります） |
   | **Subscription** | Azureサブスクリプションを選択 |
   | **Resource group** | 新規作成または既存のものを使用 |
   | **Pricing tier** | 開発/テスト用は**Free** |
   | **Type of App** | **Single Tenant**（推奨 - 以下の注を参照） |
   | **Creation type** | **Create new Microsoft App ID** |

> **非推奨のお知らせ:** 新しいmulti-tenant botの作成は2025-07-31以降非推奨になりました。新しいbotには**Single Tenant**を使用してください。

3. **Review + create** → **Create**をクリックします（約1〜2分待ちます）

### ステップ2: 認証情報を取得する

1. Azure Botリソース → **Configuration**に移動します
2. **Microsoft App ID**をコピーします → これが`appId`です
3. **Manage Password**をクリックします → App Registrationに移動します
4. **Certificates & secrets** → **New client secret**で、**Value**をコピーします → これが`appPassword`です
5. **Overview**に移動し、**Directory (tenant) ID**をコピーします → これが`tenantId`です

### ステップ3: メッセージングエンドポイントを設定する

1. Azure Bot → **Configuration**
2. **Messaging endpoint**をWebhook URLに設定します:
   - 本番: `https://your-domain.com/api/messages`
   - ローカル開発: トンネルを使用します（以下の[ローカル開発](#local-development-tunneling)を参照）

### ステップ4: Teamsチャンネルを有効にする

1. Azure Bot → **Channels**
2. **Microsoft Teams** → Configure → Saveをクリックします
3. 利用規約に同意します

## フェデレーション認証（証明書 + Managed Identity）

> 2026.3.24で追加

本番デプロイでは、OpenClawはclient secretより安全な代替手段として**フェデレーション認証**をサポートしています。利用可能な方法は2つあります。

### オプションA: 証明書ベース認証

Entra IDアプリ登録に登録されたPEM証明書を使用します。

**セットアップ:**

1. 証明書を生成または取得します（秘密鍵を含むPEM形式）。
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates**で公開証明書をアップロードします。

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

### オプションB: Azure Managed Identity

パスワードレス認証のためにAzure Managed Identityを使用します。これは、managed identityが利用可能なAzureインフラストラクチャ（AKS、App Service、Azure VM）上のデプロイに最適です。

**仕組み:**

1. ボットのpod/VMにはmanaged identityが割り当てられています（system-assignedまたはuser-assigned）。
2. **federated identity credential**が、そのmanaged identityをEntra ID app registrationに関連付けます。
3. 実行時に、OpenClawは`@azure/identity`を使ってAzure IMDSエンドポイント（`169.254.169.254`）からトークンを取得します。
4. そのトークンがボット認証のためにTeams SDKへ渡されます。

**前提条件:**

- managed identityが有効なAzureインフラストラクチャ（AKS workload identity、App Service、VM）
- Entra ID app registration上に作成されたfederated identity credential
- pod/VMからIMDS（`169.254.169.254:80`）へのネットワークアクセス

**設定（system-assigned managed identity）:**

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

**設定（user-assigned managed identity）:**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（user-assignedの場合のみ）

### AKS Workload Identityセットアップ

workload identityを使用するAKSデプロイの場合:

1. AKSクラスターで**workload identity**を有効にします。
2. Entra ID app registration上に**federated identity credential**を作成します:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. Kubernetes service accountにapp client IDの**annotation**を追加します:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. workload identity injection用にpodへ**label**を付与します:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS（`169.254.169.254`）への**ネットワークアクセス**を確保します — NetworkPolicyを使用している場合は、`169.254.169.254/32`のポート80へのトラフィックを許可するegress ruleを追加してください。

### 認証タイプ比較

| 方法 | 設定 | 長所 | 短所 |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret** | `appPassword` | セットアップが簡単 | シークレットのローテーションが必要、より安全性が低い |
| **Certificate** | `authType: "federated"` + `certificatePath` | ネットワーク上で共有シークレットが不要 | 証明書管理のオーバーヘッド |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | パスワードレス、管理するシークレット不要 | Azureインフラストラクチャが必要 |

**デフォルト動作:** `authType`が設定されていない場合、OpenClawはclient secret認証をデフォルトで使用します。既存の設定は変更なしで引き続き動作します。

## ローカル開発（トンネリング）

Teamsは`localhost`に到達できません。ローカル開発ではトンネルを使用します。

**オプションA: ngrok**

```bash
ngrok http 3978
# https URL をコピーします（例: https://abc123.ngrok.io）
# messaging endpoint を次に設定します: https://abc123.ngrok.io/api/messages
```

**オプションB: Tailscale Funnel**

```bash
tailscale funnel 3978
# messaging endpoint として Tailscale funnel URL を使用します
```

## Teams Developer Portal（代替手段）

manifest ZIPを手動で作成する代わりに、[Teams Developer Portal](https://dev.teams.microsoft.com/apps)を使うこともできます。

1. **+ New app**をクリックします
2. 基本情報（名前、説明、開発者情報）を入力します
3. **App features** → **Bot**に移動します
4. **Enter a bot ID manually**を選択し、Azure Bot App IDを貼り付けます
5. スコープをチェックします: **Personal**、**Team**、**Group Chat**
6. **Distribute** → **Download app package**をクリックします
7. Teamsで: **Apps** → **Manage your apps** → **Upload a custom app** → ZIPを選択します

これは、JSON manifestを手作業で編集するより簡単なことがよくあります。

## ボットのテスト

**オプションA: Azure Web Chat（まずWebhookを確認）**

1. Azure Portal → Azure Botリソース → **Test in Web Chat**
2. メッセージを送信します - 応答が表示されるはずです
3. これにより、Teamsのセットアップ前にWebhookエンドポイントが機能していることを確認できます

**オプションB: Teams（アプリのインストール後）**

1. Teamsアプリをインストールします（サイドロードまたは組織カタログ）
2. Teamsでボットを見つけてDMを送信します
3. 受信アクティビティについてGatewayログを確認します

## セットアップ（最小のテキスト専用）

1. **Microsoft Teams Pluginが利用可能であることを確認**
   - 現在のパッケージ版OpenClawリリースにはすでにバンドルされています。
   - 古い/カスタムインストールでは手動で追加できます:
     - npmから: `openclaw plugins install @openclaw/msteams`
     - ローカルチェックアウトから: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **ボット登録**
   - Azure Botを作成し（上記を参照）、以下を控えます:
     - App ID
     - Client secret（App password）
     - Tenant ID（single-tenant）

3. **Teamsアプリmanifest**
   - `botId = <App ID>`を持つ`bot`エントリを含めます。
   - スコープ: `personal`、`team`、`groupChat`。
   - `supportsFiles: true`（personal scopeでのファイル処理に必要）。
   - RSC権限を追加します（以下）。
   - アイコンを作成します: `outline.png`（32x32）と`color.png`（192x192）。
   - 3つのファイルをまとめてzip化します: `manifest.json`、`outline.png`、`color.png`。

4. **OpenClawを設定**

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

   設定キーの代わりに環境変数を使用することもできます:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE`（任意: `"secret"`または`"federated"`）
   - `MSTEAMS_CERTIFICATE_PATH`（federated + certificate）
   - `MSTEAMS_CERTIFICATE_THUMBPRINT`（任意、認証には不要）
   - `MSTEAMS_USE_MANAGED_IDENTITY`（federated + managed identity）
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（user-assigned MIのみ）

5. **ボットエンドポイント**
   - Azure Bot Messaging Endpointを次に設定します:
     - `https://<host>:3978/api/messages`（または選択したpath/port）。

6. **Gatewayを実行**
   - Teamsチャンネルは、バンドル済みまたは手動インストールされたPluginが利用可能で、認証情報を含む`msteams`設定が存在する場合に自動で起動します。

## メンバー情報アクション

OpenClawはMicrosoft Teams向けにGraphベースの`member-info`アクションを公開しているため、agentや自動化はMicrosoft Graphから直接チャンネルメンバーの詳細（表示名、メール、ロール）を解決できます。

要件:

- `Member.Read.Group` RSC権限（推奨manifestにはすでに含まれています）
- チームをまたぐ検索用: 管理者同意付きの`User.Read.All` Graph Application権限

このアクションは`channels.msteams.actions.memberInfo`で制御されます（デフォルト: Graph認証情報が利用可能な場合は有効）。

## 履歴コンテキスト

- `channels.msteams.historyLimit`は、最近のチャンネル/グループメッセージをいくつpromptに含めるかを制御します。
- `messages.groupChat.historyLimit`にフォールバックします。無効化するには`0`を設定します（デフォルトは50）。
- 取得されたスレッド履歴は送信者許可リスト（`allowFrom` / `groupAllowFrom`）でフィルタリングされるため、スレッドコンテキストのシードには許可された送信者からのメッセージのみが含まれます。
- 引用された添付コンテキスト（Teamsの返信HTMLから派生する`ReplyTo*`）は、現時点では受信したまま渡されます。
- つまり、許可リストは誰がagentをトリガーできるかを制御します。現在フィルタリングされるのは、特定の補助的なコンテキスト経路のみです。
- DM履歴は`channels.msteams.dmHistoryLimit`（ユーザーターン数）で制限できます。ユーザーごとの上書き: `channels.msteams.dms["<user_id>"].historyLimit`。

## 現在のTeams RSC権限（Manifest）

これらはTeamsアプリmanifest内の**既存のresourceSpecific権限**です。これらはアプリがインストールされているteam/chat内でのみ適用されます。

**チャンネル用（team scope）:**

- `ChannelMessage.Read.Group`（Application）- @mentionなしで全チャンネルメッセージを受信
- `ChannelMessage.Send.Group`（Application）
- `Member.Read.Group`（Application）
- `Owner.Read.Group`（Application）
- `ChannelSettings.Read.Group`（Application）
- `TeamMember.Read.Group`（Application）
- `TeamSettings.Read.Group`（Application）

**グループチャット用:**

- `ChatMessage.Read.Chat`（Application）- @mentionなしで全グループチャットメッセージを受信

## Teams Manifestの例（一部伏字）

必要なフィールドを含む最小限の有効な例です。IDとURLは置き換えてください。

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

### Manifestの注意点（必須フィールド）

- `bots[].botId`はAzure Bot App IDと**一致する必要があります**。
- `webApplicationInfo.id`はAzure Bot App IDと**一致する必要があります**。
- `bots[].scopes`には、使用予定のサーフェス（`personal`、`team`、`groupChat`）を含める必要があります。
- `bots[].supportsFiles: true`はpersonal scopeでのファイル処理に必要です。
- `authorization.permissions.resourceSpecific`には、チャンネルトラフィックが必要な場合はchannel read/sendを含める必要があります。

### 既存アプリの更新

すでにインストール済みのTeamsアプリを更新するには（例: RSC権限を追加する場合）:

1. 新しい設定で`manifest.json`を更新します
2. **`version`フィールドをインクリメント**します（例: `1.0.0` → `1.1.0`）
3. アイコン付きでmanifestを**再度zip化**します（`manifest.json`、`outline.png`、`color.png`）
4. 新しいzipをアップロードします:
   - **オプションA（Teams Admin Center）:** Teams Admin Center → Teams apps → Manage apps → アプリを探す → Upload new version
   - **オプションB（サイドロード）:** Teams → Apps → Manage your apps → Upload a custom app
5. **team channelsの場合:** 新しい権限を有効にするには、各teamにアプリを再インストールします
6. キャッシュされたアプリメタデータをクリアするため、Teamsを**完全に終了して再起動**します（ウィンドウを閉じるだけでは不十分です）

## 機能: RSCのみ vs Graph

### **Teams RSCのみ**の場合（アプリはインストール済み、Graph API権限なし）

動作するもの:

- チャンネルメッセージの**テキスト**内容の読み取り。
- チャンネルメッセージの**テキスト**内容の送信。
- **personal（DM）**ファイル添付の受信。

動作しないもの:

- チャンネル/グループの**画像またはファイル内容**（ペイロードにはHTMLスタブのみが含まれます）。
- SharePoint/OneDriveに保存された添付ファイルのダウンロード。
- メッセージ履歴の読み取り（ライブWebhookイベントを超える分）。

### **Teams RSC + Microsoft Graph Application権限**の場合

追加されるもの:

- hosted contents（メッセージに貼り付けられた画像）のダウンロード。
- SharePoint/OneDriveに保存されたファイル添付のダウンロード。
- Graph経由でのチャンネル/チャットメッセージ履歴の読み取り。

### RSC vs Graph API

| 機能 | RSC権限 | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **リアルタイムメッセージ** | はい（Webhook経由） | いいえ（pollingのみ） |
| **履歴メッセージ** | いいえ | はい（履歴を照会可能） |
| **セットアップの複雑さ** | アプリmanifestのみ | 管理者同意 + token flowが必要 |
| **オフラインで動作** | いいえ（実行中である必要あり） | はい（いつでも照会可能） |

**要点:** RSCはリアルタイム監視用、Graph APIは履歴アクセス用です。オフライン中に見逃したメッセージを追跡するには、`ChannelMessage.Read.All`付きのGraph APIが必要です（管理者同意が必要）。

## Graph有効のメディア + 履歴（チャンネルで必須）

**チャンネル**で画像/ファイルが必要な場合、または**メッセージ履歴**を取得したい場合は、Microsoft Graph権限を有効にして管理者同意を付与する必要があります。

1. Entra ID（Azure AD）の**App Registration**で、Microsoft Graphの**Application権限**を追加します:
   - `ChannelMessage.Read.All`（チャンネル添付 + 履歴）
   - `Chat.Read.All`または`ChatMessage.Read.All`（グループチャット）
2. テナントに対して**管理者同意を付与**します。
3. Teamsアプリの**manifest version**を上げ、再アップロードし、**Teamsでアプリを再インストール**します。
4. キャッシュされたアプリメタデータをクリアするため、Teamsを**完全に終了して再起動**します。

**ユーザーメンション用の追加権限:** ユーザーの@mentionは、会話内のユーザーであればそのまま動作します。ただし、現在の会話に**含まれていない**ユーザーを動的に検索してメンションしたい場合は、`User.Read.All`（Application）権限を追加し、管理者同意を付与してください。

## 既知の制限

### Webhookタイムアウト

TeamsはHTTP Webhook経由でメッセージを配信します。処理に時間がかかりすぎる場合（例: LLMの応答が遅い場合）、次のようなことが起こる可能性があります。

- Gatewayタイムアウト
- Teamsによるメッセージの再試行（重複の原因）
- 返信の欠落

OpenClawはすばやく応答を返し、その後で能動的に返信を送信することでこれに対処していますが、非常に遅い応答では依然として問題が起こる可能性があります。

### 書式設定

TeamsのmarkdownはSlackやDiscordより制限が多いです。

- 基本的な書式は動作します: **bold**、_italic_、`code`、リンク
- 複雑なmarkdown（テーブル、ネストしたリスト）は正しくレンダリングされないことがあります
- Adaptive Cardsは投票およびsemantic presentation送信でサポートされています（以下を参照）

## 設定

主な設定（共通のチャンネルパターンについては`/gateway/configuration`を参照）:

- `channels.msteams.enabled`: チャンネルを有効/無効にします。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`: ボット認証情報。
- `channels.msteams.webhook.port`（デフォルト`3978`）
- `channels.msteams.webhook.path`（デフォルト`/api/messages`）
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）
- `channels.msteams.allowFrom`: DM許可リスト（AADオブジェクトID推奨）。Graphアクセスが利用可能な場合、ウィザードはセットアップ中に名前をIDへ解決します。
- `channels.msteams.dangerouslyAllowNameMatching`: 変更可能なUPN/表示名マッチングと、team/channel名による直接ルーティングを再有効化する緊急用トグル。
- `channels.msteams.textChunkLimit`: 送信テキストのチャンクサイズ。
- `channels.msteams.chunkMode`: 長さで分割する`length`（デフォルト）または、長さ分割の前に空行（段落境界）で分割する`newline`。
- `channels.msteams.mediaAllowHosts`: 受信添付ホストの許可リスト（デフォルトはMicrosoft/Teamsドメイン）。
- `channels.msteams.mediaAuthAllowHosts`: メディア再試行時にAuthorizationヘッダーを付与するホストの許可リスト（デフォルトはGraph + Bot Frameworkホスト）。
- `channels.msteams.requireMention`: チャンネル/グループで@mentionを必須にします（デフォルトtrue）。
- `channels.msteams.replyStyle`: `thread | top-level`（[返信スタイル](#reply-style-threads-vs-posts)を参照）。
- `channels.msteams.teams.<teamId>.replyStyle`: teamごとの上書き。
- `channels.msteams.teams.<teamId>.requireMention`: teamごとの上書き。
- `channels.msteams.teams.<teamId>.tools`: channel上書きがない場合に使用される、teamごとのデフォルトツールポリシー上書き（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.toolsBySender`: teamごとの送信者別デフォルトツールポリシー上書き（`"*"`ワイルドカード対応）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: channelごとの上書き。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: channelごとの上書き。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: channelごとのツールポリシー上書き（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: channelごとの送信者別ツールポリシー上書き（`"*"`ワイルドカード対応）。
- `toolsBySender`キーには明示的なプレフィックスを使用してください:
  `id:`、`e164:`、`username:`、`name:`（従来のプレフィックスなしキーも引き続き`id:`にのみマップされます）。
- `channels.msteams.actions.memberInfo`: Graphベースのメンバー情報アクションを有効または無効にします（デフォルト: Graph認証情報が利用可能な場合は有効）。
- `channels.msteams.authType`: 認証タイプ — `"secret"`（デフォルト）または`"federated"`。
- `channels.msteams.certificatePath`: PEM証明書ファイルへのパス（federated + certificate認証）。
- `channels.msteams.certificateThumbprint`: 証明書サムプリント（任意、認証には不要）。
- `channels.msteams.useManagedIdentity`: managed identity認証を有効にします（federatedモード）。
- `channels.msteams.managedIdentityClientId`: user-assigned managed identity用のclient ID。
- `channels.msteams.sharePointSiteId`: グループチャット/チャンネルでのファイルアップロード用SharePoint site ID（[グループチャットでのファイル送信](#sending-files-in-group-chats)を参照）。

## ルーティングとセッション

- セッションキーは標準のagent形式に従います（[/concepts/session](/ja-JP/concepts/session)を参照）:
  - ダイレクトメッセージはメインセッションを共有します（`agent:<agentId>:<mainKey>`）。
  - チャンネル/グループメッセージはconversation idを使用します:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 返信スタイル: スレッド vs 投稿

Teamsでは最近、同じ基盤データモデル上で2つのチャンネルUIスタイルが導入されました。

| スタイル | 説明 | 推奨`replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts**（クラシック） | メッセージはカードとして表示され、その下にスレッド返信が付きます | `thread`（デフォルト） |
| **Threads**（Slack風） | メッセージはよりSlackのように直線的に流れます | `top-level` |

**問題点:** Teams APIは、チャンネルがどのUIスタイルを使っているかを公開していません。誤った`replyStyle`を使うと次のようになります。

- Threadsスタイルのチャンネルで`thread` → 返信が不自然にネスト表示される
- Postsスタイルのチャンネルで`top-level` → 返信がスレッド内ではなく、独立したトップレベル投稿として表示される

**解決策:** チャンネルの設定方法に応じて、channelごとに`replyStyle`を設定します。

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

- **DM:** 画像とファイル添付はTeamsボットのファイルAPI経由で動作します。
- **チャンネル/グループ:** 添付ファイルはM365ストレージ（SharePoint/OneDrive）に保存されます。Webhookペイロードには実ファイルのバイト列ではなく、HTMLスタブのみが含まれます。チャンネル添付をダウンロードするには**Graph API権限が必要です**。
- 明示的なファイル優先送信には、`media` / `filePath` / `path`とともに`action=upload-file`を使用します。任意の`message`は付随するテキスト/コメントになり、`filename`はアップロード名を上書きします。

Graph権限がない場合、画像付きのチャンネルメッセージはテキストのみとして受信されます（画像内容にはボットからアクセスできません）。
デフォルトでは、OpenClawはMicrosoft/Teamsホスト名からのみメディアをダウンロードします。`channels.msteams.mediaAllowHosts`で上書きしてください（任意のホストを許可するには`["*"]`を使用）。
Authorizationヘッダーは、`channels.msteams.mediaAuthAllowHosts`内のホストに対してのみ付与されます（デフォルトはGraph + Bot Frameworkホスト）。このリストは厳密に保ってください（マルチテナント接尾辞は避けてください）。

## グループチャットでのファイル送信

ボットはDMではFileConsentCardフロー（組み込み）を使ってファイルを送信できます。しかし、**グループチャット/チャンネルでのファイル送信**には追加設定が必要です。

| コンテキスト | ファイル送信方法 | 必要なセットアップ |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM** | FileConsentCard → ユーザーが承認 → ボットがアップロード | そのままで動作 |
| **グループチャット/チャンネル** | SharePointへアップロード → 共有リンク | `sharePointSiteId` + Graph権限が必要 |
| **画像（任意のコンテキスト）** | Base64エンコードのインライン | そのままで動作 |

### グループチャットでSharePointが必要な理由

ボットには個人用OneDriveドライブがありません（`/me/drive` Graph APIエンドポイントはapplication identityでは動作しません）。グループチャット/チャンネルでファイルを送信するには、ボットは**SharePoint site**へアップロードし、共有リンクを作成します。

### セットアップ

1. Entra ID（Azure AD）→ App Registrationで**Graph API権限**を追加します:
   - `Sites.ReadWrite.All`（Application）- SharePointへファイルをアップロード
   - `Chat.Read.All`（Application）- 任意、ユーザー単位の共有リンクを有効化

2. テナントに対して**管理者同意を付与**します。

3. **SharePoint site IDを取得します:**

   ```bash
   # Graph Explorer または有効なトークン付きの curl 経由:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 例: "contoso.sharepoint.com/sites/BotFiles" にあるサイトの場合
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # 応答には次が含まれます: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClawを設定します:**

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

### 共有の動作

| 権限 | 共有の動作 |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All`のみ | 組織全体の共有リンク（組織内の誰でもアクセス可能） |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ユーザー単位の共有リンク（チャットメンバーのみアクセス可能） |

ユーザー単位共有のほうが、チャット参加者のみがファイルへアクセスできるため、より安全です。`Chat.Read.All`権限がない場合、ボットは組織全体共有へフォールバックします。

### フォールバック動作

| シナリオ | 結果 |
| ------------------------------------------------- | -------------------------------------------------- |
| グループチャット + ファイル + `sharePointSiteId`設定済み | SharePointへアップロードし、共有リンクを送信 |
| グループチャット + ファイル + `sharePointSiteId`なし | OneDriveアップロードを試行（失敗する可能性あり）、テキストのみ送信 |
| 個人チャット + ファイル | FileConsentCardフロー（SharePointなしで動作） |
| 任意のコンテキスト + 画像 | Base64エンコードのインライン（SharePointなしで動作） |

### ファイルの保存場所

アップロードされたファイルは、設定されたSharePoint siteの既定ドキュメントライブラリ内の`/OpenClawShared/`フォルダに保存されます。

## 投票（Adaptive Cards）

OpenClawはTeamsの投票をAdaptive Cardsとして送信します（Teamsネイティブの投票APIはありません）。

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票はGatewayによって`~/.openclaw/msteams-polls.json`に記録されます。
- 投票を記録するにはGatewayがオンラインのままである必要があります。
- 投票結果の要約はまだ自動投稿されません（必要に応じて保存ファイルを確認してください）。

## プレゼンテーションカード

`message`ツールまたはCLIを使用して、semantic presentationペイロードをTeamsユーザーまたはconversationへ送信します。OpenClawは、汎用presentation contractからそれらをTeams Adaptive Cardsとしてレンダリングします。

`presentation`パラメーターはsemantic blocksを受け取ります。`presentation`が指定されている場合、メッセージテキストは任意です。

**Agentツール:**

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

ターゲット形式の詳細については、以下の[ターゲット形式](#target-formats)を参照してください。

## ターゲット形式

MSTeamsターゲットでは、ユーザーとconversationを区別するためにプレフィックスを使用します。

| ターゲット種別 | 形式 | 例 |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| ユーザー（ID指定） | `user:<aad-object-id>` | `user:40a1a0ed-4ff2-4164-a219-55518990c197` |
| ユーザー（名前指定） | `user:<display-name>` | `user:John Smith`（Graph APIが必要） |
| グループ/チャンネル | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2` |
| グループ/チャンネル（生値） | `<conversation-id>` | `19:abc123...@thread.tacv2`（`@thread`を含む場合） |

**CLIの例:**

```bash
# ID でユーザーに送信
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# 表示名でユーザーに送信（Graph API 検索を実行）
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# グループチャットまたはチャンネルに送信
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# プレゼンテーションカードを conversation に送信
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Agentツールの例:**

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

注: `user:`プレフィックスがない場合、名前はデフォルトでグループ/team解決になります。表示名で人を対象にする場合は、必ず`user:`を使用してください。

## 能動メッセージ送信

- 能動メッセージは、会話参照をその時点で保存するため、ユーザーがやり取りした**後でのみ**可能です。
- `dmPolicy`と許可リストの制御については`/gateway/configuration`を参照してください。

## Team IDとChannel ID（よくある落とし穴）

Teams URLの`groupId`クエリパラメーターは、設定で使用するteam IDでは**ありません**。代わりにURLパスからIDを抽出してください。

**Team URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID（これをURLデコード）
```

**Channel URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID（これをURLデコード）
```

**設定用:**

- Team ID = `/team/`の後のパスセグメント（URLデコードしたもの。例: `19:Bk4j...@thread.tacv2`）
- Channel ID = `/channel/`の後のパスセグメント（URLデコードしたもの）
- `groupId`クエリパラメーターは**無視**してください

## プライベートチャンネル

ボットのプライベートチャンネルでのサポートは限定的です。

| 機能 | 標準チャンネル | プライベートチャンネル |
| ---------------------------- | ----------------- | ---------------------- |
| ボットのインストール | はい | 制限あり |
| リアルタイムメッセージ（Webhook） | はい | 動作しない可能性あり |
| RSC権限 | はい | 挙動が異なる可能性あり |
| @mentions | はい | ボットにアクセス可能なら可 |
| Graph API履歴 | はい | はい（権限があれば） |

**プライベートチャンネルで動作しない場合の回避策:**

1. ボットとのやり取りには標準チャンネルを使用する
2. DMを使用する - ユーザーは常にボットへ直接メッセージを送れます
3. 履歴アクセスにはGraph APIを使用する（`ChannelMessage.Read.All`が必要）

## トラブルシューティング

### よくある問題

- **チャンネルで画像が表示されない:** Graph権限または管理者同意が不足しています。Teamsアプリを再インストールし、Teamsを完全に終了して再度開いてください。
- **チャンネルで応答がない:** デフォルトではmentionが必要です。`channels.msteams.requireMention=false`を設定するか、team/channelごとに設定してください。
- **バージョン不一致（Teamsに古いmanifestが表示される）:** アプリを削除して再追加し、Teamsを完全に終了して更新してください。
- **Webhookから401 Unauthorized:** Azure JWTなしで手動テストした場合は想定内です。これはエンドポイントには到達しているが認証に失敗したことを意味します。正しくテストするにはAzure Web Chatを使用してください。

### Manifestアップロードエラー

- **「Icon file cannot be empty」:** manifestが0バイトのアイコンファイルを参照しています。有効なPNGアイコンを作成してください（`outline.png`は32x32、`color.png`は192x192）。
- **「webApplicationInfo.Id already in use」:** アプリがまだ別のteam/chatにインストールされています。先にそれを見つけてアンインストールするか、反映まで5〜10分待ってください。
- **アップロード時に「Something went wrong」:** 代わりに[https://admin.teams.microsoft.com](https://admin.teams.microsoft.com)経由でアップロードし、ブラウザーのDevTools（F12）→ Networkタブを開いて、実際のエラーをレスポンス本文で確認してください。
- **サイドロードに失敗する:** 「Upload a custom app」の代わりに「Upload an app to your org's app catalog」を試してください。これでサイドロード制限を回避できることがよくあります。

### RSC権限が機能しない

1. `webApplicationInfo.id`がボットのApp IDと完全に一致していることを確認します
2. アプリを再アップロードし、team/chatに再インストールします
3. 組織の管理者がRSC権限をブロックしていないか確認します
4. 正しいスコープを使っていることを確認します: teamsには`ChannelMessage.Read.Group`、グループチャットには`ChatMessage.Read.Chat`

## 参考資料

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Botセットアップガイド
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teamsアプリの作成/管理
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（channel/groupではGraphが必要）
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャンネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
