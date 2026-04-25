---
read_when:
    - ブラウザから Gateway を操作したい場合
    - SSH トンネルなしで Tailnet アクセスを使いたい場合
summary: Gateway 向けブラウザベース Control UI（チャット、nodes、設定）
title: Control UI
x-i18n:
    generated_at: "2026-04-25T14:02:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 270ef5de55aa3bd34b8e9dcdea9f8dbe0568539edc268c809d652b838e8f5219
    source_path: web/control-ui.md
    workflow: 15
---

Control UI は、Gateway から配信される小さな **Vite + Lit** のシングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定（例: `/openclaw`）

これは同じポート上の **Gateway WebSocket** と**直接**通信します。

## クイックオープン（ローカル）

Gateway が同じコンピューター上で実行されている場合は、次を開いてください。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

ページが読み込めない場合は、まず Gateway を起動してください: `openclaw gateway`

認証は WebSocket ハンドシェイク中に次のいずれかで渡されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` のときの Tailscale Serve identity headers
- `gateway.auth.mode: "trusted-proxy"` のときの trusted-proxy identity headers

ダッシュボードの設定パネルは、現在のブラウザータブセッションと選択された gateway URL に対するトークンを保持しますが、パスワードは永続化されません。オンボーディングでは通常、最初の接続時に shared-secret auth 用の gateway token が生成されますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスのペアリング（初回接続）

新しいブラウザーまたはデバイスから Control UI に接続すると、Gateway は **一度限りのペアリング承認** を要求します。`gateway.auth.allowTailscale: true` で同じ Tailnet 上にいる場合でも同様です。これは不正アクセスを防ぐためのセキュリティ対策です。

**表示される内容:** 「disconnected (1008): pairing required」

**デバイスを承認するには:**

```bash
# 保留中のリクエストを一覧表示
openclaw devices list

# request ID で承認
openclaw devices approve <requestId>
```

ブラウザーが変更された認証詳細（role/scopes/public
key）でペアリングを再試行した場合、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に `openclaw devices list` を再実行してください。

ブラウザーがすでにペアリング済みで、それを読み取りアクセスから
書き込み/admin アクセスへ変更する場合、これはサイレントな再接続ではなく
承認のアップグレードとして扱われます。OpenClaw は古い承認を有効のまま保持し、
より広い再接続をブロックして、新しいスコープセットを明示的に承認するよう求めます。

一度承認されると、そのデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り再承認は不要です。トークンローテーションと取り消しについては
[Devices CLI](/ja-JP/cli/devices) を参照してください。

**注意:**

- 直接の local loopback ブラウザー接続（`127.0.0.1` / `localhost`）は
  自動承認されます。
- Tailnet と LAN からのブラウザー接続は、同じマシンからの接続であっても、
  依然として明示的な承認が必要です。
- 各ブラウザープロファイルは一意の device ID を生成するため、ブラウザーを切り替えたり
  ブラウザーデータを消去したりすると再ペアリングが必要になります。

## 個人アイデンティティ（ブラウザーローカル）

Control UI は、共有セッション内で送信メッセージの帰属を示すために、
ブラウザーごとの個人アイデンティティ（表示名とアバター）をサポートします。これはブラウザーのストレージ内に保存され、現在のブラウザープロファイルにスコープされ、他のデバイスには同期されず、実際に送信したメッセージの通常の transcript authorship metadata を除いてサーバー側にも永続化されません。サイトデータを消去するかブラウザーを切り替えると空にリセットされます。

## ランタイム設定エンドポイント

Control UI は、ランタイム設定を
`/__openclaw/control-ui-config.json` から取得します。このエンドポイントは HTTP サーフェスの他の部分と同じ
gateway auth で保護されています。未認証のブラウザーは取得できず、取得成功には
すでに有効な gateway token/password、Tailscale Serve identity、または trusted-proxy identity のいずれかが必要です。

## 言語サポート

Control UI は初回ロード時に、ブラウザーのロケールに基づいて自動的にローカライズできます。後で上書きするには、**Overview -> Gateway Access -> Language** を開いてください。ロケールピッカーは Appearance ではなく Gateway Access カード内にあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 英語以外の翻訳はブラウザー内で遅延読み込みされます。
- 選択したロケールはブラウザーストレージに保存され、今後の訪問でも再利用されます。
- 翻訳キーが欠けている場合は英語にフォールバックします。

## 現在できること

- Gateway WS 経由でモデルとチャット（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）
- ブラウザーから WebRTC 経由で OpenAI Realtime と直接通信。Gateway は `talk.realtime.session` で短命な Realtime client secret を発行し、ブラウザーはマイク音声を直接 OpenAI に送信し、`openclaw_agent_consult` tool call をより大きく設定された OpenClaw モデル向けに `chat.send` 経由で中継します。
- Chat で tool call と live tool output カードをストリーミング表示（agent events）
- Channels: 組み込みおよび bundled/external plugin channels のステータス、QR ログイン、チャネルごとの設定（`channels.status`, `web.login.*`, `config.patch`）
- Instances: プレゼンス一覧 + 更新（`system-presence`）
- Sessions: 一覧 + セッションごとの model/thinking/fast/verbose/trace/reasoning 上書き（`sessions.list`, `sessions.patch`）
- Dreams: Dreaming ステータス、有効/無効トグル、Dream Diary リーダー（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）
- Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化 + 実行履歴（`cron.*`）
- Skills: ステータス、有効/無効、インストール、API キー更新（`skills.*`）
- Nodes: 一覧 + 機能（`node.list`）
- Exec approvals: `exec host=gateway/node` 用の gateway または node の allowlists + ask policy を編集（`exec.approvals.*`）
- Config: `~/.openclaw/openclaw.json` を表示/編集（`config.get`, `config.set`）
- Config: 検証付きで適用 + 再起動（`config.apply`）し、最後にアクティブだったセッションを起こす
- Config 書き込みには、同時編集の上書きを防ぐための base-hash guard が含まれます
- Config 書き込み（`config.set`/`config.apply`/`config.patch`）では、送信された config payload 内の ref に対してアクティブな SecretRef 解決の事前確認も行います。未解決のアクティブ submitted ref は書き込み前に拒否されます
- Config スキーマ + フォーム描画（`config.schema` / `config.schema.lookup`、
  フィールド `title` / `description`、一致する UI ヒント、直下の子要約、
  ネストされた object/wildcard/array/composition ノードの docs metadata、
  および利用可能な場合は plugin + channel スキーマを含む）。Raw JSON エディターは、
  スナップショットが安全な raw round-trip を持つ場合にのみ利用可能です
- スナップショットを raw text として安全に round-trip できない場合、Control UI は Form モードを強制し、そのスナップショットでは Raw モードを無効にします
- Raw JSON エディターの「Reset to saved」は、フラット化されたスナップショットを再描画するのではなく、raw 作成時の形状（フォーマット、コメント、`$include` レイアウト）を保持するため、スナップショットが安全に round-trip できる場合は外部編集がリセット後も残ります
- structured SecretRef object 値は、誤って object から string へ壊れるのを防ぐため、フォームのテキスト入力では読み取り専用として表示されます
- Debug: ステータス/健全性/models スナップショット + イベントログ + 手動 RPC 呼び出し（`status`, `health`, `models.list`）
- Logs: gateway ファイルログの live tail とフィルター/エクスポート（`logs.tail`）
- Update: package/git 更新 + 再起動（`update.run`）と再起動レポート

Cron jobs パネルの注意:

- isolated jobs では、配信のデフォルトは announce summary です。内部専用実行にしたい場合は none に切り替えられます。
- announce が選択されると Channel/target フィールドが表示されます。
- Webhook モードでは `delivery.mode = "webhook"` を使用し、`delivery.to` を有効な HTTP(S) webhook URL に設定します。
- main-session jobs では、webhook と none の配信モードが利用できます。
- 高度な編集コントロールには、delete-after-run、agent override のクリア、cron の exact/stagger オプション、
  agent model/thinking 上書き、および best-effort 配信トグルが含まれます。
- フォーム検証はフィールド単位のエラー付きインラインで行われ、無効な値があると修正されるまで保存ボタンは無効になります。
- 専用 bearer token を送るには `cron.webhookToken` を設定してください。省略した場合、webhook は auth ヘッダーなしで送信されます。
- 非推奨のフォールバック: `notify: true` を持つ保存済みレガシージョブは、移行されるまで `cron.webhook` を引き続き使用できます。

## チャットの動作

- `chat.send` は **non-blocking** です。即座に `{ runId, status: "started" }` で ack し、応答は `chat` events 経由でストリーミングされます。
- 同じ `idempotencyKey` で再送すると、実行中は `{ status: "in_flight" }`、完了後は `{ status: "ok" }` を返します。
- `chat.history` の応答は UI 安全性のためサイズ制限されています。transcript エントリが大きすぎる場合、Gateway は長い text フィールドを切り詰め、重い metadata block を省略し、大きすぎるメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
- assistant/生成画像は managed media reference として永続化され、認証付き Gateway media URL 経由で返されるため、再読み込み時に chat history 応答内の raw base64 image payload に依存しません。
- `chat.history` は、表示専用の inline directive tag（たとえば `[[reply_to_*]]` や `[[audio_as_voice]]`）、プレーンテキストの tool-call XML payload（`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`、および切り詰められた tool-call block を含む）、漏れた ASCII/全角の model control token も可視 assistant text から除去し、可視テキスト全体が正確な silent token `NO_REPLY` / `no_reply` のみである assistant エントリは省略します。
- アクティブな送信中および最終履歴更新中、`chat.history` が一時的に古い
  スナップショットを返しても、chat ビューはローカルの optimistic user/assistant メッセージを表示し続けます。Gateway 履歴が追いつくと、正規の transcript がそれらのローカルメッセージを置き換えます。
- `chat.inject` は assistant note をセッション transcript に追加し、UI 専用更新のために `chat` event をブロードキャストします（agent 実行なし、channel 配信なし）。
- chat ヘッダーの model および thinking picker は、`sessions.patch` を通じてアクティブセッションを即座に patch します。これらは 1 ターン限定の送信オプションではなく、永続的なセッション上書きです。
- 新しい Gateway セッション使用量レポートで高いコンテキスト圧力が示された場合、chat
  composer 領域にはコンテキスト通知が表示され、推奨される Compaction レベルでは、
  通常のセッション Compaction パスを実行する compact ボタンが表示されます。古い token
  スナップショットは、Gateway が再び新しい使用量を報告するまで非表示になります。
- Talk モードでは、ブラウザー WebRTC セッションをサポートする登録済み realtime voice provider を使用します。`talk.provider: "openai"` と
  `talk.providers.openai.apiKey` を設定するか、Voice Call realtime provider
  設定を再利用してください。ブラウザーは通常の OpenAI API key を受け取りません。受け取るのは一時的な Realtime client secret のみです。Google Live realtime voice は
  バックエンド Voice Call と Google Meet ブリッジではサポートされていますが、このブラウザー
  WebRTC パスではまだサポートされていません。Realtime セッションプロンプトは Gateway によって組み立てられます。
  `talk.realtime.session` は呼び出し元提供の instruction 上書きを受け付けません。
- Chat composer では、Talk コントロールは
  マイク音声入力ボタンの横にある waves ボタンです。Talk が開始すると、composer のステータス行には
  `Connecting Talk...` が表示され、その後オーディオ接続中は `Talk live`、realtime tool call が
  `chat.send` を通じて設定済みのより大きなモデルへ問い合わせている間は
  `Asking OpenClaw...` が表示されます。
- 停止:
  - **Stop** をクリック（`chat.abort` を呼び出す）
  - 実行中は、通常の follow-up はキューされます。キューされたメッセージの **Steer** をクリックすると、その follow-up を実行中ターンに注入します。
  - `/stop`（または `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` のような単独の abort フレーズ）を入力して帯域外で中止する
  - `chat.abort` は `{ sessionKey }`（`runId` なし）をサポートし、そのセッションのすべてのアクティブ実行を中止します
- 中止時の partial 保持:
  - 実行が中止されると、partial な assistant text が引き続き UI に表示されることがあります
  - バッファ済み出力が存在する場合、Gateway は中止された partial assistant text を transcript history に永続化します
  - 永続化されたエントリには中止 metadata が含まれるため、transcript 利用側は中止 partial と通常完了出力を区別できます

## PWA インストールと web push

Control UI には `manifest.webmanifest` と service worker が含まれているため、
最新のブラウザーではスタンドアロン PWA としてインストールできます。Web Push を使うと、
タブやブラウザーウィンドウが開いていなくても、Gateway が通知で
インストール済み PWA を起こせます。

| サーフェス | 役割 |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーは「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理する service worker。 |
| `push/vapid-keys.json`（OpenClaw の state dir 配下） | Web Push payload の署名に使う自動生成 VAPID キーペア。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザー subscription endpoint。 |

キーを固定したい場合（マルチホスト構成、secret ローテーション、または
テスト）には、Gateway プロセス上の env var で VAPID キーペアを上書きできます。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `mailto:openclaw@localhost`）

Control UI は、これらの scope 付き Gateway メソッドを使って、ブラウザー subscription を登録およびテストします。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済み endpoint を削除します。
- `push.web.test` — 呼び出し元の subscription にテスト通知を送信します。

Web Push は iOS APNS relay path
（relay ベースの push については [Configuration](/ja-JP/gateway/configuration) を参照）や、
既存の `push.test` メソッドとは独立しています。これらはネイティブ mobile pairing を対象にします。

## Hosted embeds

assistant メッセージは `[embed ...]`
ショートコードで hosted web content をインライン表示できます。iframe sandbox policy は
`gateway.controlUi.embedSandbox` によって制御されます。

- `strict`: hosted embed 内での script 実行を無効化します
- `scripts`: origin isolation を維持したまま interactive embed を許可します。これが
  デフォルトで、通常は自己完結型のブラウザーゲーム/ウィジェットにはこれで十分です
- `trusted`: 同一サイト文書で意図的により強い権限が必要な場合に、
  `allow-scripts` に加えて `allow-same-origin` を追加します

例:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

埋め込み文書が本当に same-origin
動作を必要とする場合にのみ `trusted` を使用してください。ほとんどの agent 生成ゲームや interactive canvas では、`scripts` の方がより安全な選択です。

絶対外部 `http(s)` embed URL はデフォルトで引き続きブロックされます。意図的に
`[embed url="https://..."]` でサードパーティページを読み込みたい場合は、
`gateway.controlUi.allowExternalEmbedUrls: true` を設定してください。

## Tailnet アクセス（推奨）

### 統合 Tailscale Serve（推奨）

Gateway は loopback に保持し、Tailscale Serve に HTTPS でプロキシさせます。

```bash
openclaw gateway --tailscale serve
```

次を開きます。

- `https://<magicdns>/`（または設定した `gateway.controlUi.basePath`）

デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、
Control UI/WebSocket Serve リクエストは Tailscale identity headers
（`tailscale-user-login`）で認証できます。OpenClaw は
`x-forwarded-for` アドレスを `tailscale whois` で解決し、
それをヘッダーと照合して identity を検証します。また、これらを受け入れるのは、
Tailscale の `x-forwarded-*` headers とともに loopback に到達した
リクエストのみです。Serve トラフィックでも明示的な shared-secret
認証を必須にしたい場合は、`gateway.auth.allowTailscale: false` を設定してください。
その場合は `gateway.auth.mode: "token"` または
`"password"` を使用します。
この非同期 Serve identity path では、同じ client IP
および auth scope に対する認証失敗は、rate-limit 書き込み前に直列化されます。
そのため、同じブラウザーからの並行した不正リトライでは、
2 つの単純な不一致が並列に競合する代わりに、2 回目のリクエストで `retry later` が表示されることがあります。
token なしの Serve auth は gateway host が信頼されている前提です。そのホスト上で
信頼できないローカルコードが実行される可能性がある場合は、token/password auth を必須にしてください。

### tailnet に bind + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

次に開きます。

- `http://<tailscale-ip>:18789/`（または設定した `gateway.controlUi.basePath`）

一致する shared secret を UI 設定に貼り付けてください（
`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

## 安全でない HTTP

ダッシュボードを平文 HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）で開くと、
ブラウザーは **non-secure context** で動作し、WebCrypto をブロックします。デフォルトでは、
OpenClaw はデバイス identity のない Control UI 接続を**ブロック**します。

文書化された例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 専用の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` による operator Control UI 認証の成功
- 緊急用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使うか、UI をローカルで開いてください。

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（gateway host 上）

**安全でない認証トグルの動作:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` はローカル互換性用トグルにすぎません。

- これにより、non-secure HTTP context で localhost の Control UI セッションが
  デバイス identity なしで続行できるようになります。
- これは pairing チェックを回避しません。
- これはリモート（非 localhost）のデバイス identity 要件を緩和しません。

**緊急時専用:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` は Control UI の device identity チェックを無効化し、
重大なセキュリティ低下を招きます。緊急利用後は速やかに元に戻してください。

trusted-proxy に関する注意:

- trusted-proxy 認証に成功すると、device identity なしで **operator** の Control UI セッションを受け入れられる
- これは node-role の Control UI セッションには**拡張されない**
- 同一ホストの loopback reverse proxy でも trusted-proxy auth は満たされない。詳しくは
  [Trusted proxy auth](/ja-JP/gateway/trusted-proxy-auth) を参照

HTTPS 設定ガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## Content Security Policy

Control UI には厳格な `img-src` ポリシーが含まれています。許可されるのは **same-origin** のアセット、`data:` URL、およびローカル生成の `blob:` URL のみです。リモートの `http(s)` およびプロトコル相対 image URL はブラウザーによって拒否され、ネットワーク fetch は発行されません。

実際には次の意味になります。

- 相対パス配下で配信されるアバターと画像（たとえば `/avatars/<id>`）は引き続き表示されます。これには、UI が取得してローカル `blob:` URL に変換する認証付き avatar ルートも含まれます。
- インラインの `data:image/...` URL も引き続き表示されます（プロトコル内 payload に便利です）。
- Control UI が作成したローカル `blob:` URL も引き続き表示されます。
- channel metadata が出力するリモート avatar URL は、Control UI の avatar helper で除去され、組み込み logo/badge に置き換えられます。そのため、侵害された、または悪意のある channel が operator のブラウザーから任意のリモート image fetch を強制することはできません。

この動作を得るために変更する必要はありません。これは常に有効で、設定はできません。

## Avatar ルート認証

gateway auth が設定されている場合、Control UI の avatar endpoint は API の他の部分と同じ gateway token を必要とします。

- `GET /avatar/<agentId>` は認証済み呼び出し元にのみ avatar image を返します。`GET /avatar/<agentId>?meta=1` は同じルールで avatar metadata を返します。
- いずれのルートへの未認証リクエストも拒否されます（隣接する assistant-media ルートと同様）。これにより、他が保護されているホストで avatar ルートから agent identity が漏れるのを防ぎます。
- Control UI 自体は avatar 取得時に gateway token を bearer header として転送し、認証付き blob URL を使うため、ダッシュボードでも画像は正しく表示されます。

gateway auth を無効化した場合（共有ホストでは非推奨）、avatar ルートも gateway の他の部分に合わせて未認証になります。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを配信します。次でビルドします。

```bash
pnpm ui:build
```

任意の絶対ベース（固定アセット URL が必要な場合）:

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発用（別の dev server）:

```bash
pnpm ui:dev
```

その後、UI を Gateway WS URL（例: `ws://127.0.0.1:18789`）に向けてください。

## デバッグ/テスト: dev server + リモート Gateway

Control UI は静的ファイルであり、WebSocket の接続先は設定可能で、
HTTP origin と異なっていても構いません。これは、Vite dev server はローカルで使いたいが、
Gateway は別の場所で動いている場合に便利です。

1. UI dev server を起動します: `pnpm ui:dev`
2. 次のような URL を開きます:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

任意の 1 回限り認証（必要な場合）:

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

注意:

- `gatewayUrl` は読み込み後に localStorage に保存され、URL から削除されます。
- `token` は可能な限り URL フラグメント（`#token=...`）経由で渡してください。フラグメントはサーバーへ送信されないため、リクエストログや Referer への漏えいを防げます。レガシーな `?token=` query param も互換性のため 1 回だけ取り込まれますが、フォールバックにすぎず、bootstrap 後すぐに削除されます。
- `password` はメモリ内のみに保持されます。
- `gatewayUrl` が設定されている場合、UI は config または環境認証情報にフォールバックしません。
  `token`（または `password`）を明示的に指定してください。明示的な認証情報が欠けているのはエラーです。
- Gateway が TLS の背後にある場合（Tailscale Serve、HTTPS proxy など）は `wss://` を使用してください。
- `gatewayUrl` はクリックジャッキング防止のため、トップレベルウィンドウでのみ受け付けられます（埋め込みでは不可）。
- non-loopback の Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を
  明示的に設定する必要があります（完全な origin）。これにはリモート dev 構成も含まれます。
- `gateway.controlUi.allowedOrigins: ["*"]` は、厳密に制御された
  ローカルテスト以外では使用しないでください。これは「今使っているホストに一致する」ではなく、
  「任意のブラウザー origin を許可する」を意味します。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は
  Host ヘッダー origin fallback モードを有効にしますが、危険なセキュリティモードです。

例:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

リモートアクセス設定の詳細: [Remote access](/ja-JP/gateway/remote)

## 関連

- [Dashboard](/ja-JP/web/dashboard) — gateway ダッシュボード
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェース
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェース
- [Health Checks](/ja-JP/gateway/health) — gateway 健全性監視
