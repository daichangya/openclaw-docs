---
read_when:
    - Microsoft Teams チャネル機能に取り組んでいるとき
summary: Microsoft Teams ボットサポートのステータス、機能、設定
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-05T12:37:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99fc6e136893ec65dc85d3bc0c0d92134069a2f3b8cb4fcf66c14674399b3eaf
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> 「ここに入る者は一切の希望を捨てよ。」

更新日: 2026-01-21

ステータス: テキスト + DM 添付ファイルをサポートしています。チャネル/グループでのファイル送信には `sharePointSiteId` + Graph 権限が必要です（[グループチャットでのファイル送信](#sending-files-in-group-chats)を参照）。投票は Adaptive Cards 経由で送信されます。メッセージアクションでは、ファイル優先送信のための明示的な `upload-file` が公開されています。

## バンドル済みプラグイン

Microsoft Teams は現在の OpenClaw リリースではバンドル済みプラグインとして提供されているため、通常のパッケージビルドでは
別途インストールは不要です。

古いビルドや、バンドル済み Teams を含まないカスタムインストールを使っている場合は、
手動でインストールしてください。

```bash
openclaw plugins install @openclaw/msteams
```

ローカルチェックアウト（git リポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳細: [プラグイン](/tools/plugin)

## クイックセットアップ（初級者向け）

1. Microsoft Teams プラグインが利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースには、すでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. **Azure Bot** を作成します（App ID + client secret + tenant ID）。
3. それらの認証情報で OpenClaw を設定します。
4. 公開 URL またはトンネル経由で `/api/messages`（既定ではポート 3978）を公開します。
5. Teams アプリパッケージをインストールし、Gateway を起動します。

最小設定:

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

注: グループチャットは既定でブロックされます（`channels.msteams.groupPolicy: "allowlist"`）。グループ返信を許可するには、`channels.msteams.groupAllowFrom` を設定してください（または `groupPolicy: "open"` を使って任意のメンバーを許可し、メンションゲート付きにします）。

## 目的

- Teams の DM、グループチャット、またはチャネル経由で OpenClaw とやり取りする。
- ルーティングを決定的に保つ: 返信は常に受信したチャネルに戻る。
- チャネルでの安全な動作を既定にする（設定しない限りメンションが必要）。

## 設定の書き込み

既定では、Microsoft Teams は `/config set|unset` によってトリガーされる設定更新の書き込みを許可されています（`commands.config: true` が必要です）。

無効にするには:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## アクセス制御（DM + グループ）

**DM アクセス**

- 既定値: `channels.msteams.dmPolicy = "pairing"`。未知の送信者は承認されるまで無視されます。
- `channels.msteams.allowFrom` には安定した AAD オブジェクト ID を使うべきです。
- UPN/表示名は変更可能です。直接一致は既定で無効であり、`channels.msteams.dangerouslyAllowNameMatching: true` でのみ有効になります。
- 認証情報に十分な権限があれば、ウィザードは Microsoft Graph 経由で名前を ID に解決できます。

**グループアクセス**

- 既定値: `channels.msteams.groupPolicy = "allowlist"`（`groupAllowFrom` を追加するまでブロック）。未設定時の既定値を上書きするには `channels.defaults.groupPolicy` を使います。
- `channels.msteams.groupAllowFrom` は、グループチャット/チャネルでどの送信者がトリガーできるかを制御します（`channels.msteams.allowFrom` にフォールバックします）。
- `groupPolicy: "open"` を設定すると任意のメンバーを許可します（それでも既定ではメンションゲート付きです）。
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

- `channels.msteams.teams` の下に teams と channels を列挙することで、グループ/チャネル返信の範囲を制限します。
- キーには安定した team ID と channel conversation ID を使うべきです。
- `groupPolicy="allowlist"` で teams 許可リストが存在する場合、列挙された teams/channels のみが受け付けられます（メンションゲート付き）。
- 設定ウィザードは `Team/Channel` エントリを受け付け、それらを保存します。
- 起動時に、OpenClaw は team/channel とユーザーの許可リスト名を ID に解決し（Graph 権限があれば）、
  その対応をログに出力します。未解決の team/channel 名は入力されたまま保持されますが、既定ではルーティングでは無視されます。`channels.msteams.dangerouslyAllowNameMatching: true` が有効な場合を除きます。

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

## 動作の仕組み

1. Microsoft Teams プラグインが利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースには、すでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. **Azure Bot** を作成します（App ID + secret + tenant ID）。
3. ボットを参照し、以下の RSC 権限を含む **Teams app package** を作成します。
4. Teams アプリを team にアップロード/インストールします（または DM 用に personal スコープ）。
5. `~/.openclaw/openclaw.json`（または環境変数）で `msteams` を設定し、Gateway を起動します。
6. Gateway は既定で `/api/messages` 上の Bot Framework webhook トラフィックを待ち受けます。

## Azure Bot セットアップ（前提条件）

OpenClaw を設定する前に、Azure Bot リソースを作成する必要があります。

### ステップ 1: Azure Bot を作成する

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) に移動します
2. **Basics** タブに入力します:

   | フィールド | 値 |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle** | ボット名。例: `openclaw-msteams`（一意である必要があります） |
   | **Subscription** | Azure サブスクリプションを選択 |
   | **Resource group** | 新規作成または既存を使用 |
   | **Pricing tier** | 開発/テスト用は **Free** |
   | **Type of App** | **Single Tenant**（推奨。以下の注を参照） |
   | **Creation type** | **Create new Microsoft App ID** |

> **非推奨に関する通知:** 新しい multi-tenant bot の作成は 2025-07-31 以降非推奨になりました。新しいボットでは **Single Tenant** を使用してください。

3. **Review + create** → **Create** をクリックします（1〜2 分ほど待ちます）

### ステップ 2: 認証情報を取得する

1. Azure Bot リソース → **Configuration** に移動します
2. **Microsoft App ID** をコピーします → これが `appId` です
3. **Manage Password** をクリックします → App Registration に移動します
4. **Certificates & secrets** → **New client secret** → **Value** をコピーします → これが `appPassword` です
5. **Overview** に移動します → **Directory (tenant) ID** をコピーします → これが `tenantId` です

### ステップ 3: Messaging Endpoint を設定する

1. Azure Bot → **Configuration**
2. **Messaging endpoint** に webhook URL を設定します:
   - 本番環境: `https://your-domain.com/api/messages`
   - ローカル開発: トンネルを使用します（以下の[ローカル開発](#local-development-tunneling)を参照）

### ステップ 4: Teams チャネルを有効にする

1. Azure Bot → **Channels**
2. **Microsoft Teams** → Configure → Save をクリックします
3. 利用規約に同意します

## ローカル開発（トンネリング）

Teams は `localhost` に到達できません。ローカル開発ではトンネルを使います。

**オプション A: ngrok**

```bash
ngrok http 3978
# https URL をコピーします。例: https://abc123.ngrok.io
# Messaging endpoint を次に設定します: https://abc123.ngrok.io/api/messages
```

**オプション B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Messaging endpoint として Tailscale funnel URL を使います
```

## Teams Developer Portal（代替手段）

manifest ZIP を手作業で作成する代わりに、[Teams Developer Portal](https://dev.teams.microsoft.com/apps) を使用できます。

1. **+ New app** をクリックします
2. 基本情報（名前、説明、開発者情報）を入力します
3. **App features** → **Bot** に移動します
4. **Enter a bot ID manually** を選択し、Azure Bot App ID を貼り付けます
5. スコープをチェックします: **Personal**、**Team**、**Group Chat**
6. **Distribute** → **Download app package** をクリックします
7. Teams で: **Apps** → **Manage your apps** → **Upload a custom app** → ZIP を選択します

これは JSON manifest を手作業で編集するより簡単なことが多いです。

## ボットのテスト

**オプション A: Azure Web Chat（先に webhook を確認する）**

1. Azure Portal → Azure Bot リソース → **Test in Web Chat**
2. メッセージを送信します。応答が表示されるはずです
3. これにより、Teams セットアップ前に webhook endpoint が機能していることを確認できます

**オプション B: Teams（アプリインストール後）**

1. Teams アプリをインストールします（サイドロードまたは組織カタログ）
2. Teams でボットを見つけ、DM を送信します
3. 受信アクティビティについて Gateway ログを確認します

## セットアップ（最小のテキスト専用）

1. **Microsoft Teams プラグインが利用可能であることを確認する**
   - 現在のパッケージ版 OpenClaw リリースには、すでにバンドルされています。
   - 古い/カスタムインストールでは、手動追加できます:
     - npm から: `openclaw plugins install @openclaw/msteams`
     - ローカルチェックアウトから: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **ボット登録**
   - Azure Bot を作成し（上記参照）、以下を控えます:
     - App ID
     - Client secret（App password）
     - Tenant ID（single-tenant）

3. **Teams app manifest**
   - `bot` エントリに `botId = <App ID>` を含めます。
   - スコープ: `personal`、`team`、`groupChat`。
   - `supportsFiles: true`（personal スコープでのファイル処理に必要）。
   - RSC 権限を追加します（下記）。
   - アイコンを作成します: `outline.png`（32x32）と `color.png`（192x192）。
   - 3 つのファイルを一緒に zip 化します: `manifest.json`、`outline.png`、`color.png`。

4. **OpenClaw を設定する**

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

   設定キーの代わりに環境変数も使えます:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **ボット endpoint**
   - Azure Bot Messaging Endpoint を次のように設定します:
     - `https://<host>:3978/api/messages`（または選択したパス/ポート）。

6. **Gateway を実行する**
   - Teams チャネルは、バンドル済みまたは手動インストールされたプラグインが利用可能で、認証情報を含む `msteams` 設定が存在すれば自動的に起動します。

## メンバー情報アクション

OpenClaw は Microsoft Teams 向けに Graph ベースの `member-info` アクションを公開しており、エージェントやオートメーションが Microsoft Graph から直接チャネルメンバーの詳細（表示名、メールアドレス、ロール）を解決できます。

要件:

- `Member.Read.Group` RSC 権限（推奨 manifest にすでに含まれています）
- team をまたぐ検索の場合: 管理者同意付きの `User.Read.All` Graph Application 権限

このアクションは `channels.msteams.actions.memberInfo` で制御されます（既定: Graph 認証情報が利用可能な場合は有効）。

## 履歴コンテキスト

- `channels.msteams.historyLimit` は、プロンプトに含める最近のチャネル/グループメッセージ数を制御します。
- `messages.groupChat.historyLimit` にフォールバックします。`0` を設定すると無効になります（既定 50）。
- 取得したスレッド履歴は送信者許可リスト（`allowFrom` / `groupAllowFrom`）でフィルタリングされるため、スレッドコンテキストのシードには許可された送信者からのメッセージのみが含まれます。
- 引用された添付ファイルコンテキスト（Teams の返信 HTML 由来の `ReplyTo*`）は、現在は受信したまま渡されます。
- つまり、許可リストは誰がエージェントをトリガーできるかを制御し、現在フィルタリングされるのは特定の補助的なコンテキスト経路のみです。
- DM 履歴は `channels.msteams.dmHistoryLimit`（ユーザーターン）で制限できます。ユーザーごとの上書き: `channels.msteams.dms["<user_id>"].historyLimit`。

## 現在の Teams RSC 権限（Manifest）

これらは Teams app manifest 内の**既存の resourceSpecific permissions** です。これらはアプリがインストールされている team/chat 内でのみ適用されます。

**チャネル用（team スコープ）:**

- `ChannelMessage.Read.Group`（Application）- @メンションなしで全チャネルメッセージを受信
- `ChannelMessage.Send.Group`（Application）
- `Member.Read.Group`（Application）
- `Owner.Read.Group`（Application）
- `ChannelSettings.Read.Group`（Application）
- `TeamMember.Read.Group`（Application）
- `TeamSettings.Read.Group`（Application）

**グループチャット用:**

- `ChatMessage.Read.Chat`（Application）- @メンションなしで全グループチャットメッセージを受信

## Teams Manifest の例（機密情報削除済み）

必要なフィールドを含む最小で有効な例です。ID と URL は置き換えてください。

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

- `bots[].botId` は Azure Bot App ID と**一致している必要があります**。
- `webApplicationInfo.id` は Azure Bot App ID と**一致している必要があります**。
- `bots[].scopes` には、使用する予定のサーフェス（`personal`、`team`、`groupChat`）を含める必要があります。
- `bots[].supportsFiles: true` は personal スコープでのファイル処理に必要です。
- `authorization.permissions.resourceSpecific` には、チャネルトラフィックが必要ならチャネルの読み取り/送信を含める必要があります。

### 既存アプリの更新

すでにインストール済みの Teams アプリを更新するには（たとえば RSC 権限を追加する場合）:

1. `manifest.json` を新しい設定で更新します
2. **`version` フィールドをインクリメント**します（例: `1.0.0` → `1.1.0`）
3. アイコン付きで manifest を**再 zip 化**します（`manifest.json`、`outline.png`、`color.png`）
4. 新しい zip をアップロードします:
   - **オプション A（Teams Admin Center）:** Teams Admin Center → Teams apps → Manage apps → 対象アプリを見つける → Upload new version
   - **オプション B（サイドロード）:** Teams → Apps → Manage your apps → Upload a custom app
5. **team チャネルの場合:** 新しい権限を有効にするには、各 team でアプリを再インストールします
6. キャッシュされたアプリメタデータをクリアするため、**Teams を完全終了して再起動**します（ウィンドウを閉じるだけでは不十分です）

## 機能: RSC のみ vs Graph

### **Teams RSC のみ**の場合（アプリはインストール済み、Graph API 権限なし）

動作するもの:

- チャネルメッセージの**テキスト**内容の読み取り。
- チャネルメッセージの**テキスト**送信。
- **personal（DM）** のファイル添付の受信。

動作しないもの:

- チャネル/グループの**画像またはファイル内容**（ペイロードには HTML スタブしか含まれません）。
- SharePoint/OneDrive に保存された添付ファイルのダウンロード。
- メッセージ履歴の読み取り（ライブ webhook イベントを超えるもの）。

### **Teams RSC + Microsoft Graph Application permissions** の場合

追加されるもの:

- ホストされたコンテンツのダウンロード（メッセージに貼り付けられた画像）。
- SharePoint/OneDrive に保存されたファイル添付のダウンロード。
- Graph 経由のチャネル/チャットメッセージ履歴の読み取り。

### RSC と Graph API の比較

| 機能 | RSC 権限 | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **リアルタイムメッセージ** | はい（webhook 経由） | いいえ（ポーリングのみ） |
| **過去メッセージ** | いいえ | はい（履歴を問い合わせ可能） |
| **セットアップの複雑さ** | アプリ manifest のみ | 管理者同意 + トークンフローが必要 |
| **オフライン動作** | いいえ（実行中である必要あり） | はい（いつでも問い合わせ可能） |

**要点:** RSC はリアルタイムの受信向けであり、Graph API は過去のアクセス向けです。オフライン中に見逃したメッセージを取り込むには、`ChannelMessage.Read.All` を持つ Graph API が必要です（管理者同意が必要）。

## Graph 対応メディア + 履歴（チャネルでは必須）

**チャネル**内で画像/ファイルが必要な場合、または**メッセージ履歴**を取得したい場合は、Microsoft Graph 権限を有効にして管理者同意を与える必要があります。

1. Entra ID（Azure AD）の **App Registration** で、Microsoft Graph の **Application permissions** を追加します:
   - `ChannelMessage.Read.All`（チャネル添付 + 履歴）
   - `Chat.Read.All` または `ChatMessage.Read.All`（グループチャット）
2. テナントに対して**管理者同意を付与**します。
3. Teams アプリの **manifest version** を更新し、再アップロードして、**Teams 内でアプリを再インストール**します。
4. キャッシュされたアプリメタデータをクリアするため、**Teams を完全終了して再起動**します。

**ユーザーメンション向け追加権限:** 会話内のユーザーに対する @mentions は、そのままで動作します。ただし、**現在の会話にいない**ユーザーを動的に検索してメンションしたい場合は、`User.Read.All`（Application）権限を追加し、管理者同意を付与してください。

## 既知の制限

### Webhook タイムアウト

Teams は HTTP webhook 経由でメッセージを配信します。処理に時間がかかりすぎる場合（たとえば LLM 応答が遅い場合）、次のような問題が起こることがあります。

- Gateway のタイムアウト
- Teams によるメッセージの再試行（重複の原因）
- 返信の欠落

OpenClaw は、すばやく応答を返し、その後で proactive に返信を送ることでこれに対処していますが、非常に遅い応答では依然として問題が発生することがあります。

### 書式設定

Teams の markdown は Slack や Discord より制限があります。

- 基本的な書式は動作します: **太字**、_斜体_、`code`、リンク
- 複雑な markdown（表、ネストしたリスト）は正しくレンダリングされないことがあります
- 投票や任意のカード送信には Adaptive Cards をサポートしています（以下参照）

## 設定

主要な設定（共有チャネルパターンについては `/gateway/configuration` を参照）:

- `channels.msteams.enabled`: チャネルの有効/無効。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`: ボット認証情報。
- `channels.msteams.webhook.port`（既定 `3978`）
- `channels.msteams.webhook.path`（既定 `/api/messages`）
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled`（既定: pairing）
- `channels.msteams.allowFrom`: DM 許可リスト（AAD オブジェクト ID 推奨）。Graph アクセスが利用可能な場合、ウィザードはセットアップ中に名前を ID に解決します。
- `channels.msteams.dangerouslyAllowNameMatching`: 変更可能な UPN/表示名一致と、team/channel 名による直接ルーティングを再有効化するための非常用トグル。
- `channels.msteams.textChunkLimit`: 送信テキストのチャンクサイズ。
- `channels.msteams.chunkMode`: `length`（既定）または `newline`。長さでのチャンク化の前に、空行（段落境界）で分割します。
- `channels.msteams.mediaAllowHosts`: 受信添付ファイルホストの許可リスト（既定は Microsoft/Teams ドメイン）。
- `channels.msteams.mediaAuthAllowHosts`: メディア再試行時に Authorization ヘッダーを付けるホストの許可リスト（既定は Graph + Bot Framework ホスト）。
- `channels.msteams.requireMention`: チャネル/グループで @mention を必須にする（既定 true）。
- `channels.msteams.replyStyle`: `thread | top-level`（[返信スタイル](#reply-style-threads-vs-posts)を参照）。
- `channels.msteams.teams.<teamId>.replyStyle`: team ごとの上書き。
- `channels.msteams.teams.<teamId>.requireMention`: team ごとの上書き。
- `channels.msteams.teams.<teamId>.tools`: team ごとの既定ツールポリシー上書き（`allow`/`deny`/`alsoAllow`）。チャネル上書きがない場合に使われます。
- `channels.msteams.teams.<teamId>.toolsBySender`: team ごとの送信者別ツールポリシー上書き（`"*"` ワイルドカード対応）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: チャネルごとの上書き。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: チャネルごとの上書き。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: チャネルごとのツールポリシー上書き（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: チャネルごとの送信者別ツールポリシー上書き（`"*"` ワイルドカード対応）。
- `toolsBySender` のキーには明示的な接頭辞を使うべきです:
  `id:`、`e164:`、`username:`、`name:`（従来の接頭辞なしキーも引き続き `id:` にのみマップされます）。
- `channels.msteams.actions.memberInfo`: Graph ベースの member info アクションを有効または無効にする（既定: Graph 認証情報がある場合は有効）。
- `channels.msteams.sharePointSiteId`: グループチャット/チャネルでのファイルアップロード用 SharePoint site ID（[グループチャットでのファイル送信](#sending-files-in-group-chats)を参照）。

## ルーティングとセッション

- セッションキーは標準のエージェント形式に従います（[/concepts/session](/concepts/session)を参照）:
  - ダイレクトメッセージはメインセッションを共有します（`agent:<agentId>:<mainKey>`）。
  - チャネル/グループメッセージは conversation id を使います:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 返信スタイル: スレッド vs 投稿

Teams は最近、同じ基盤データモデルの上で 2 種類のチャネル UI スタイルを導入しました。

| スタイル | 説明 | 推奨 `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **投稿**（クラシック） | メッセージはカードとして表示され、その下にスレッド返信が並ぶ | `thread`（既定） |
| **スレッド**（Slack 風） | メッセージが Slack のように直線的に流れる | `top-level` |

**問題:** Teams API は、チャネルがどの UI スタイルを使っているかを公開しません。誤った `replyStyle` を使うと:

- Threads スタイルのチャネルで `thread` → 返信が不自然にネストされて表示される
- Posts スタイルのチャネルで `top-level` → 返信がスレッド内ではなく独立したトップレベル投稿として表示される

**解決策:** チャネルの設定に基づいて、チャネルごとに `replyStyle` を設定します。

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
- **チャネル/グループ:** 添付ファイルは M365 ストレージ（SharePoint/OneDrive）に存在します。webhook ペイロードには実際のファイルバイトではなく HTML スタブしか含まれません。チャネル添付をダウンロードするには **Graph API 権限が必要** です。
- 明示的なファイル優先送信には、`media` / `filePath` / `path` とともに `action=upload-file` を使います。任意の `message` は付随するテキスト/コメントになり、`filename` はアップロード名を上書きします。

Graph 権限がない場合、画像付きのチャネルメッセージはテキストのみとして受信されます（画像内容にはボットからアクセスできません）。
既定では、OpenClaw は Microsoft/Teams ホスト名からのみメディアをダウンロードします。`channels.msteams.mediaAllowHosts` で上書きできます（任意のホストを許可するには `["*"]` を使います）。
Authorization ヘッダーは `channels.msteams.mediaAuthAllowHosts` に含まれるホストに対してのみ付与されます（既定は Graph + Bot Framework ホスト）。このリストは厳格に保ってください（multi-tenant サフィックスは避けてください）。

## グループチャットでのファイル送信

ボットは DM では FileConsentCard フロー（組み込み）を使ってファイルを送信できます。しかし、**グループチャット/チャネルでのファイル送信**には追加設定が必要です。

| コンテキスト | ファイル送信方法 | 必要なセットアップ |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM** | FileConsentCard → ユーザーが承認 → ボットがアップロード | そのままで動作 |
| **グループチャット/チャネル** | SharePoint にアップロード → 共有リンク | `sharePointSiteId` + Graph 権限が必要 |
| **画像（任意のコンテキスト）** | Base64 エンコードされたインライン | そのままで動作 |

### グループチャットで SharePoint が必要な理由

ボットには personal OneDrive ドライブがありません（`/me/drive` Graph API endpoint は application identity では動作しません）。グループチャット/チャネルでファイルを送るには、ボットは **SharePoint site** にアップロードし、共有リンクを作成します。

### セットアップ

1. Entra ID（Azure AD）→ App Registration で **Graph API 権限** を追加します:
   - `Sites.ReadWrite.All`（Application）- SharePoint へファイルをアップロード
   - `Chat.Read.All`（Application）- 任意。ユーザーごとの共有リンクを有効化

2. テナントに対して**管理者同意を付与**します。

3. **SharePoint site ID を取得します:**

   ```bash
   # Graph Explorer または有効なトークン付き curl 経由:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 例: "contoso.sharepoint.com/sites/BotFiles" にある site の場合
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # 応答には次が含まれます: "id": "contoso.sharepoint.com,guid1,guid2"
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

| 権限 | 共有動作 |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` のみ | 組織全体の共有リンク（組織内の誰でもアクセス可能） |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ユーザーごとの共有リンク（チャットメンバーのみアクセス可能） |

ユーザーごとの共有の方が、チャット参加者のみがファイルにアクセスできるため、より安全です。`Chat.Read.All` 権限がない場合、ボットは組織全体共有にフォールバックします。

### フォールバック動作

| シナリオ | 結果 |
| ------------------------------------------------- | -------------------------------------------------- |
| グループチャット + ファイル + `sharePointSiteId` 設定済み | SharePoint にアップロードし、共有リンクを送信 |
| グループチャット + ファイル + `sharePointSiteId` なし | OneDrive アップロードを試行（失敗する場合あり）、テキストのみ送信 |
| personal チャット + ファイル | FileConsentCard フロー（SharePoint なしで動作） |
| 任意のコンテキスト + 画像 | Base64 エンコードされたインライン（SharePoint なしで動作） |

### ファイルの保存場所

アップロードされたファイルは、設定された SharePoint site の既定ドキュメントライブラリ内の `/OpenClawShared/` フォルダに保存されます。

## 投票（Adaptive Cards）

OpenClaw は Teams の投票を Adaptive Cards として送信します（Teams ネイティブの poll API はありません）。

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票は Gateway によって `~/.openclaw/msteams-polls.json` に記録されます。
- 投票を記録するには Gateway がオンラインのままである必要があります。
- 投票結果の要約はまだ自動投稿されません（必要に応じてストアファイルを確認してください）。

## Adaptive Cards（任意）

`message` ツールまたは CLI を使って、任意の Adaptive Card JSON を Teams ユーザーまたは会話に送信できます。

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

カードスキーマと例については、[Adaptive Cards documentation](https://adaptivecards.io/) を参照してください。target 形式の詳細については、以下の[ターゲット形式](#target-formats)を参照してください。

## ターゲット形式

MSTeams の target では、ユーザーと会話を区別するために接頭辞を使います。

| ターゲット種別 | 形式 | 例 |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| ユーザー（ID 指定） | `user:<aad-object-id>` | `user:40a1a0ed-4ff2-4164-a219-55518990c197` |
| ユーザー（名前指定） | `user:<display-name>` | `user:John Smith`（Graph API が必要） |
| グループ/チャネル | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2` |
| グループ/チャネル（生値） | `<conversation-id>` | `19:abc123...@thread.tacv2`（`@thread` を含む場合） |

**CLI の例:**

```bash
# ID でユーザーに送信
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# 表示名でユーザーに送信（Graph API 検索をトリガー）
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# グループチャットまたはチャネルに送信
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# 会話に Adaptive Card を送信
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

注: `user:` 接頭辞がない場合、名前は既定でグループ/team 解決になります。表示名で人を指定する場合は、必ず `user:` を使ってください。

## Proactive メッセージング

- Proactive メッセージは、会話参照をその時点で保存するため、ユーザーがやり取りした**後でのみ**可能です。
- `dmPolicy` と許可リストゲートについては `/gateway/configuration` を参照してください。

## Team と Channel ID（よくある落とし穴）

Teams URL の `groupId` クエリパラメータは、設定に使う team ID **ではありません**。代わりに URL パスから ID を抽出してください。

**Team URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID（これを URL デコードします）
```

**Channel URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID（これを URL デコードします）
```

**設定用:**

- Team ID = `/team/` の後のパスセグメント（URL デコードしたもの。例: `19:Bk4j...@thread.tacv2`）
- Channel ID = `/channel/` の後のパスセグメント（URL デコードしたもの）
- `groupId` クエリパラメータは**無視**します

## プライベートチャネル

ボットはプライベートチャネルではサポートが限定的です。

| 機能 | 標準チャネル | プライベートチャネル |
| ---------------------------- | ----------------- | ---------------------- |
| ボットインストール | はい | 限定的 |
| リアルタイムメッセージ（webhook） | はい | 動作しない場合あり |
| RSC 権限 | はい | 動作が異なる場合あり |
| @mentions | はい | ボットにアクセスできる場合 |
| Graph API 履歴 | はい（権限あり） | はい（権限あり） |

**プライベートチャネルで動作しない場合の回避策:**

1. ボットとのやり取りには標準チャネルを使う
2. DM を使う - ユーザーは常にボットへ直接メッセージできます
3. 過去アクセスには Graph API を使う（`ChannelMessage.Read.All` が必要）

## トラブルシューティング

### よくある問題

- **チャネルで画像が表示されない:** Graph 権限または管理者同意が不足しています。Teams アプリを再インストールし、Teams を完全終了して再起動してください。
- **チャネルで応答がない:** 既定ではメンションが必要です。`channels.msteams.requireMention=false` を設定するか、team/channel ごとに設定してください。
- **バージョン不一致（Teams に古い manifest が表示される）:** アプリを削除して再追加し、Teams を完全終了して更新してください。
- **webhook から 401 Unauthorized:** Azure JWT なしで手動テストした場合は想定内です。endpoint には到達しているが認証に失敗したことを意味します。正しくテストするには Azure Web Chat を使ってください。

### Manifest のアップロードエラー

- **「Icon file cannot be empty」:** manifest が 0 バイトのアイコンファイルを参照しています。有効な PNG アイコンを作成してください（`outline.png` は 32x32、`color.png` は 192x192）。
- **「webApplicationInfo.Id already in use」:** アプリが別の team/chat にまだインストールされています。先に見つけてアンインストールするか、反映まで 5〜10 分待ってください。
- **アップロード時に「Something went wrong」:** 代わりに [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 経由でアップロードし、ブラウザ DevTools（F12）→ Network タブを開いて、レスポンス本文の実際のエラーを確認してください。
- **サイドロードに失敗する:** 「Upload a custom app」ではなく、「Upload an app to your org's app catalog」を試してください。こちらの方が sideload 制限を回避できることがよくあります。

### RSC 権限が動作しない

1. `webApplicationInfo.id` がボットの App ID と完全一致していることを確認します
2. アプリを再アップロードし、team/chat に再インストールします
3. 組織管理者が RSC 権限をブロックしていないか確認します
4. 正しいスコープを使っていることを確認します: teams には `ChannelMessage.Read.Group`、グループチャットには `ChatMessage.Read.Chat`

## 参考資料

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot セットアップガイド
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams アプリの作成/管理
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（チャネル/グループでは Graph が必要）
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## 関連

- [チャネル概要](/channels) — サポートされているすべてのチャネル
- [ペアリング](/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/gateway/security) — アクセスモデルとハードニング
