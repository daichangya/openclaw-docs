---
read_when:
    - Google Chat チャネル機能に取り組むとき
summary: Google Chat アプリのサポート状況、機能、および設定
title: Google Chat
x-i18n:
    generated_at: "2026-04-05T12:35:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 570894ed798dd0b9ba42806b050927216379a1228fcd2f96de565bc8a4ac7c2c
    source_path: channels/googlechat.md
    workflow: 15
---

# Google Chat (Chat API)

ステータス: Google Chat API webhook 経由の DM とスペースに対応済み（HTTP のみ）。

## クイックセットアップ（初級者向け）

1. Google Cloud プロジェクトを作成し、**Google Chat API** を有効にします。
   - 移動先: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - まだ有効になっていない場合は API を有効にします。
2. **Service Account** を作成します。
   - **Create Credentials** > **Service Account** を押します。
   - 任意の名前を付けます（例: `openclaw-chat`）。
   - 権限は空欄のままにします（**Continue** を押します）。
   - アクセス権を持つ principal も空欄のままにします（**Done** を押します）。
3. **JSON Key** を作成してダウンロードします。
   - Service Account の一覧で、先ほど作成したものをクリックします。
   - **Keys** タブに移動します。
   - **Add Key** > **Create new key** をクリックします。
   - **JSON** を選択して **Create** を押します。
4. ダウンロードした JSON ファイルを gateway host に保存します（例: `~/.openclaw/googlechat-service-account.json`）。
5. [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) で Google Chat アプリを作成します。
   - **Application info** を入力します。
     - **App name**: （例: `OpenClaw`）
     - **Avatar URL**: （例: `https://openclaw.ai/logo.png`）
     - **Description**: （例: `Personal AI Assistant`）
   - **Interactive features** を有効にします。
   - **Functionality** で **Join spaces and group conversations** にチェックを入れます。
   - **Connection settings** で **HTTP endpoint URL** を選択します。
   - **Triggers** で **Use a common HTTP endpoint URL for all triggers** を選択し、gateway の公開 URL の末尾に `/googlechat` を付けて設定します。
     - _ヒント: `openclaw status` を実行すると gateway の公開 URL を確認できます。_
   - **Visibility** で **Make this Chat app available to specific people and groups in &lt;Your Domain&gt;** にチェックを入れます。
   - テキストボックスに自分のメールアドレス（例: `user@example.com`）を入力します。
   - 下部の **Save** をクリックします。
6. **アプリのステータスを有効化**します。
   - 保存後、**ページを更新**します。
   - **App status** セクションを探します（通常は保存後に上部または下部に表示されます）。
   - ステータスを **Live - available to users** に変更します。
   - もう一度 **Save** をクリックします。
7. Service Account のパスと webhook audience を使って OpenClaw を設定します。
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - または config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`。
8. webhook audience のタイプと値を設定します（Chat アプリ設定と一致させます）。
9. gateway を起動します。Google Chat が webhook パスに POST します。

## Google Chat に追加する

gateway が実行中で、あなたのメールアドレスが visibility list に追加されていれば、次の手順を行います。

1. [Google Chat](https://chat.google.com/) にアクセスします。
2. **Direct Messages** の横にある **+**（プラス）アイコンをクリックします。
3. 検索バー（通常は人を追加する場所）に、Google Cloud Console で設定した **App name** を入力します。
   - **注**: この bot はプライベートアプリのため、「Marketplace」の参照一覧には _表示されません_。名前で検索する必要があります。
4. 結果から bot を選択します。
5. **Add** または **Chat** をクリックして 1 対 1 の会話を開始します。
6. 「Hello」を送ってアシスタントを起動します。

## 公開 URL（webhook のみ）

Google Chat webhook には公開 HTTPS エンドポイントが必要です。セキュリティのため、**`/googlechat` パスのみを**インターネットに公開してください。OpenClaw ダッシュボードやその他の機密エンドポイントはプライベートネットワーク内に維持してください。

### オプション A: Tailscale Funnel（推奨）

プライベートなダッシュボードには Tailscale Serve を使い、公開 webhook パスには Funnel を使います。これにより、`/` は非公開のまま、`/googlechat` のみを公開できます。

1. **gateway がどのアドレスに bind されているか確認します。**

   ```bash
   ss -tlnp | grep 18789
   ```

   IP アドレス（例: `127.0.0.1`、`0.0.0.0`、または `100.x.x.x` のような Tailscale IP）を確認してください。

2. **ダッシュボードを tailnet のみに公開します（ポート 8443）。**

   ```bash
   # localhost に bind されている場合（127.0.0.1 または 0.0.0.0）:
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Tailscale IP のみに bind されている場合（例: 100.106.161.80）:
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **webhook パスのみを公開します。**

   ```bash
   # localhost に bind されている場合（127.0.0.1 または 0.0.0.0）:
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Tailscale IP のみに bind されている場合（例: 100.106.161.80）:
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Funnel アクセス用にノードを認可します。**
   求められた場合は、出力に表示される認可 URL にアクセスして、tailnet policy でこのノードの Funnel を有効にしてください。

5. **設定を確認します。**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

公開 webhook URL は次のようになります。
`https://<node-name>.<tailnet>.ts.net/googlechat`

プライベートダッシュボードは tailnet 専用のままです。
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat アプリ設定では、公開 URL（`:8443` なし）を使用してください。

> 注: この設定は再起動後も保持されます。後で削除するには、`tailscale funnel reset` と `tailscale serve reset` を実行してください。

### オプション B: リバースプロキシ（Caddy）

Caddy のようなリバースプロキシを使う場合は、特定のパスのみをプロキシしてください。

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

この設定では、`your-domain.com/` へのリクエストは無視されるか 404 を返し、`your-domain.com/googlechat` は安全に OpenClaw にルーティングされます。

### オプション C: Cloudflare Tunnel

tunnel の ingress ルールで、webhook パスのみをルーティングするよう設定します。

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404（Not Found）

## 仕組み

1. Google Chat が gateway に webhook POST を送信します。各リクエストには `Authorization: Bearer <token>` ヘッダーが含まれます。
   - OpenClaw は、そのヘッダーが存在する場合、webhook body 全体を読み取り・解析する前に bearer 認証を検証します。
   - body 内に `authorizationEventObject.systemIdToken` を含む Google Workspace Add-on リクエストは、より厳格な事前認証 body 予算を通じてサポートされます。
2. OpenClaw は、設定された `audienceType` + `audience` に対して token を検証します。
   - `audienceType: "app-url"` → audience は HTTPS webhook URL です。
   - `audienceType: "project-number"` → audience は Cloud project number です。
3. メッセージはスペースごとにルーティングされます。
   - DM はセッションキー `agent:<agentId>:googlechat:direct:<spaceId>` を使います。
   - スペースはセッションキー `agent:<agentId>:googlechat:group:<spaceId>` を使います。
4. DM アクセスはデフォルトで pairing です。未知の送信者には pairing code が送られ、次で承認します。
   - `openclaw pairing approve googlechat <code>`
5. グループスペースでは、デフォルトで @-mention が必要です。mention 検出にアプリの user 名が必要な場合は `botUser` を使用してください。

## ターゲット

配信と allowlist には、次の識別子を使用します。

- ダイレクトメッセージ: `users/<userId>`（推奨）。
- 生のメールアドレス `name@example.com` は変更可能であり、`channels.googlechat.dangerouslyAllowNameMatching: true` の場合にのみ、ダイレクト allowlist 一致に使われます。
- 非推奨: `users/<email>` はメール allowlist ではなく user id として扱われます。
- スペース: `spaces/<spaceId>`。

## 主な設定

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

注:

- Service Account 認証情報は `serviceAccount`（JSON 文字列）としてインラインで渡すこともできます。
- `serviceAccountRef` もサポートされています（env/file SecretRef）。`channels.googlechat.accounts.<id>.serviceAccountRef` 配下のアカウント単位の ref も含みます。
- `webhookPath` が設定されていない場合、デフォルトの webhook path は `/googlechat` です。
- `dangerouslyAllowNameMatching` は、allowlist 用の変更可能なメール principal 一致を再有効化します（緊急時の互換モード）。
- `actions.reactions` が有効な場合、リアクションは `reactions` tool と `channels action` から利用できます。
- メッセージアクションでは、テキスト用の `send` と、明示的な添付送信用の `upload-file` が提供されます。`upload-file` は `media` / `filePath` / `path` と、任意の `message`、`filename`、スレッド指定を受け取ります。
- `typingIndicator` は `none`、`message`（デフォルト）、`reaction` をサポートします（reaction には user OAuth が必要です）。
- 添付ファイルは Chat API 経由でダウンロードされ、media pipeline に保存されます（サイズ上限は `mediaMaxMb`）。

シークレット参照の詳細: [Secrets Management](/gateway/secrets)。

## トラブルシューティング

### 405 Method Not Allowed

Google Cloud Logs Explorer に次のようなエラーが表示される場合:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

これは webhook handler が登録されていないことを意味します。一般的な原因は次のとおりです。

1. **チャネルが設定されていない**: config に `channels.googlechat` セクションがありません。次で確認します。

   ```bash
   openclaw config get channels.googlechat
   ```

   これが「Config path not found」を返す場合は、設定を追加してください（[主な設定](#主な設定) を参照）。

2. **プラグインが有効になっていない**: plugin の状態を確認します。

   ```bash
   openclaw plugins list | grep googlechat
   ```

   「disabled」と表示される場合は、config に `plugins.entries.googlechat.enabled: true` を追加してください。

3. **gateway が再起動されていない**: config を追加した後、gateway を再起動します。

   ```bash
   openclaw gateway restart
   ```

チャネルが実行中であることを確認します。

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### その他の問題

- 認証エラーや audience 設定不足については `openclaw channels status --probe` を確認してください。
- メッセージが届かない場合は、Chat アプリの webhook URL とイベント購読を確認してください。
- mention ゲートによって返信がブロックされる場合は、`botUser` をアプリの user resource name に設定し、`requireMention` を確認してください。
- テストメッセージ送信中に `openclaw logs --follow` を使うと、リクエストが gateway に到達しているか確認できます。

関連ドキュメント:

- [Gateway configuration](/gateway/configuration)
- [Security](/gateway/security)
- [Reactions](/tools/reactions)

## 関連

- [Channels Overview](/channels) — サポートされているすべてのチャネル
- [Pairing](/channels/pairing) — DM 認証と pairing フロー
- [Groups](/channels/groups) — グループチャットの動作と mention ゲート
- [Channel Routing](/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/gateway/security) — アクセスモデルとハードニング
