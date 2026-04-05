---
read_when:
    - WhatsApp/webチャンネルの動作や受信トレイルーティングに取り組むとき
summary: WhatsAppチャンネルのサポート、アクセス制御、配信動作、運用
title: WhatsApp
x-i18n:
    generated_at: "2026-04-05T12:37:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: c16a468b3f47fdf7e4fc3fd745b5c49c7ccebb7af0e8c87c632b78b04c583e49
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp（Webチャンネル）

ステータス: WhatsApp Web（Baileys）経由で本番運用対応。Gatewayがリンク済みセッションを管理します。

## インストール（必要時）

- オンボーディング（`openclaw onboard`）および`openclaw channels add --channel whatsapp`では、初めて選択したときにWhatsApp pluginのインストールを促します。
- `openclaw channels login --channel whatsapp`でも、pluginがまだ存在しない場合はインストールフローが提示されます。
- Devチャンネル + gitチェックアウトでは、デフォルトでローカルpluginパスが使用されます。
- Stable/Betaでは、デフォルトでnpmパッケージ`@openclaw/whatsapp`が使用されます。

手動インストールも引き続き利用できます。

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    未知の送信者に対するデフォルトのDMポリシーはpairingです。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブックです。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/gateway/configuration">
    完全なチャンネル設定パターンと例です。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="Configure WhatsApp access policy">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    特定のアカウントの場合:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Pairingリクエストは1時間後に期限切れになります。保留中のリクエストはチャンネルごとに3件までです。

  </Step>
</Steps>

<Note>
OpenClawでは、可能であればWhatsAppを別の番号で運用することを推奨しています。（チャンネルメタデータとセットアップフローはその構成向けに最適化されていますが、個人番号での構成もサポートされています。）
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    これは最も運用しやすいモードです。

    - OpenClaw用に分離されたWhatsApp ID
    - より明確なDM allowlistとルーティング境界
    - 自分とのチャット混乱が起きる可能性が低い

    最小ポリシーパターン:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Personal-number fallback">
    オンボーディングは個人番号モードをサポートしており、自分とのチャットに適したベースラインを書き込みます。

    - `dmPolicy: "allowlist"`
    - `allowFrom`に自分の個人番号を含める
    - `selfChatMode: true`

    ランタイムでは、自分とのチャット保護はリンク済みの自分の番号と`allowFrom`をもとに動作します。

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    現在のOpenClawチャンネルアーキテクチャでは、メッセージングプラットフォームチャンネルはWhatsApp Webベース（`Baileys`）です。

    組み込みのチャットチャンネルレジストリには、別個のTwilio WhatsAppメッセージングチャンネルはありません。

  </Accordion>
</AccordionGroup>

## ランタイムモデル

- GatewayがWhatsAppソケットと再接続ループを管理します。
- 送信には、対象アカウントに対するアクティブなWhatsAppリスナーが必要です。
- ステータスチャットとブロードキャストチャットは無視されます（`@status`、`@broadcast`）。
- ダイレクトチャットではDMセッションルール（`session.dmScope`）が使われます。デフォルトの`main`ではDMはagentのメインセッションに統合されます。
- グループセッションは分離されます（`agent:<agentId>:whatsapp:group:<jid>`）。

## アクセス制御と有効化

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy`はダイレクトチャットアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom`に`"*"`を含める必要があります）
    - `disabled`

    `allowFrom`はE.164形式の番号を受け付けます（内部で正規化されます）。

    マルチアカウント上書き: `channels.whatsapp.accounts.<id>.dmPolicy`（および`allowFrom`）は、そのアカウントに対してチャンネルレベルのデフォルトより優先されます。

    ランタイム動作の詳細:

    - pairingsはチャンネルallow-storeに永続化され、設定済みの`allowFrom`とマージされます
    - allowlistが設定されていない場合、リンク済みの自分の番号はデフォルトで許可されます
    - 送信元が`fromMe`のDMは自動pairingされません

  </Tab>

  <Tab title="Group policy + allowlists">
    グループアクセスには2つのレイヤーがあります。

    1. **グループメンバーシップallowlist**（`channels.whatsapp.groups`）
       - `groups`が省略されている場合、すべてのグループが対象になります
       - `groups`が存在する場合、それはグループallowlistとして動作します（`"*"`可）

    2. **グループ送信者ポリシー**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`: 送信者allowlistをバイパス
       - `allowlist`: 送信者は`groupAllowFrom`（または`*`）に一致する必要があります
       - `disabled`: すべてのグループ受信をブロック

    送信者allowlistのフォールバック:

    - `groupAllowFrom`が未設定の場合、利用可能であればランタイムは`allowFrom`にフォールバックします
    - 送信者allowlistはmention/返信による有効化の前に評価されます

    注記: `channels.whatsapp`ブロック自体がまったく存在しない場合、ランタイムのグループポリシーフォールバックは`allowlist`です（警告ログあり）。`channels.defaults.groupPolicy`が設定されていても同様です。

  </Tab>

  <Tab title="Mentions + /activation">
    グループ返信はデフォルトでmentionを必要とします。

    Mention検出には次が含まれます。

    - bot IDに対する明示的なWhatsApp mention
    - 設定済みmention正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは`messages.groupChat.mentionPatterns`）
    - bot IDに一致する返信送信者による暗黙のreply-to-bot検出

    セキュリティ注記:

    - 引用/返信はmentionゲーティングを満たすだけであり、送信者認可は付与しません
    - `groupPolicy: "allowlist"`では、allowlistにない送信者は、allowlist済みユーザーのメッセージに返信していてもブロックされます

    セッションレベルの有効化コマンド:

    - `/activation mention`
    - `/activation always`

    `activation`はセッション状態を更新します（グローバルconfigではありません）。owner-gatedです。

  </Tab>
</Tabs>

## 個人番号と自分とのチャット動作

リンク済みの自分の番号が`allowFrom`にも含まれている場合、WhatsAppの自分とのチャット保護が有効になります。

- 自分とのチャットターンでは既読通知をスキップ
- 本来なら自分自身にpingするmention-JID自動トリガー動作を無視
- `messages.responsePrefix`が未設定の場合、自分とのチャット返信のデフォルトは`[{identity.name}]`または`[openclaw]`

## メッセージ正規化とコンテキスト

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    受信したWhatsAppメッセージは共有の受信エンベロープでラップされます。

    引用返信が存在する場合、コンテキストは次の形式で追加されます。

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    返信メタデータフィールドも、利用可能な場合は設定されます（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、sender JID/E.164）。

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    メディアのみの受信メッセージは、次のようなプレースホルダーで正規化されます。

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    位置情報および連絡先ペイロードは、ルーティング前にテキストコンテキストへ正規化されます。

  </Accordion>

  <Accordion title="Pending group history injection">
    グループでは、未処理メッセージをバッファリングし、botが最終的にトリガーされたときにコンテキストとして注入できます。

    - デフォルト上限: `50`
    - config: `channels.whatsapp.historyLimit`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0`で無効化

    注入マーカー:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    既読通知は、受け付けられた受信WhatsAppメッセージに対してデフォルトで有効です。

    グローバルに無効化する場合:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    アカウントごとの上書き:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    自分とのチャットターンでは、グローバルに有効でも既読通知はスキップされます。

  </Accordion>
</AccordionGroup>

## 配信、チャンク化、メディア

<AccordionGroup>
  <Accordion title="Text chunking">
    - デフォルトのチャンク上限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline`モードでは段落境界（空行）を優先し、その後で長さ安全なチャンク化にフォールバックします
  </Accordion>

  <Accordion title="Outbound media behavior">
    - 画像、動画、音声（PTTボイスノート）、ドキュメントのペイロードをサポート
    - `audio/ogg`は、ボイスノート互換性のため`audio/ogg; codecs=opus`に書き換えられます
    - アニメーションGIF再生は、動画送信時の`gifPlayback: true`でサポートされます
    - 複数メディア返信ペイロードを送信する際、キャプションは最初のメディア項目に適用されます
    - メディアソースにはHTTP(S)、`file://`、ローカルパスを使用できます
  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - 受信メディア保存上限: `channels.whatsapp.mediaMaxMb`（デフォルト`50`）
    - 送信メディア送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト`50`）
    - アカウントごとの上書きには`channels.whatsapp.accounts.<accountId>.mediaMaxMb`を使用します
    - 画像は制限内に収めるため自動最適化されます（リサイズ/品質スイープ）
    - メディア送信失敗時には、先頭項目フォールバックとしてテキスト警告を送信し、応答が黙って失われることを防ぎます
  </Accordion>
</AccordionGroup>

## リアクションレベル

`channels.whatsapp.reactionLevel`は、agentがWhatsAppで絵文字リアクションをどの程度広く使用するかを制御します。

| レベル        | Ackリアクション | agent起点リアクション     | 説明                                             |
| ------------- | --------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | いいえ          | いいえ                    | リアクションを一切行いません                     |
| `"ack"`       | はい            | いいえ                    | Ackリアクションのみ（返信前の受領）              |
| `"minimal"`   | はい            | はい（保守的）            | Ack + 保守的ガイダンス付きagentリアクション      |
| `"extensive"` | はい            | はい（推奨）              | Ack + 推奨ガイダンス付きagentリアクション        |

デフォルト: `"minimal"`。

アカウントごとの上書きには`channels.whatsapp.accounts.<id>.reactionLevel`を使用します。

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## 確認応答リアクション

WhatsAppは、`channels.whatsapp.ackReaction`を介して受信時の即時ackリアクションをサポートします。
Ackリアクションは`reactionLevel`で制御され、`reactionLevel`が`"off"`のときは抑制されます。

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

動作上の注意:

- 受信が受理された直後に送信されます（返信前）
- 失敗はログに記録されますが、通常の返信配信は妨げません
- グループモード`mentions`では、mentionトリガーのターンにリアクションします。グループ有効化`always`はこのチェックをバイパスします
- WhatsAppでは`channels.whatsapp.ackReaction`を使用します（legacyの`messages.ackReaction`はここでは使用しません）

## マルチアカウントと認証情報

<AccordionGroup>
  <Accordion title="Account selection and defaults">
    - アカウントIDは`channels.whatsapp.accounts`から取得されます
    - デフォルトアカウント選択: `default`があればそれ、なければ最初に設定されたアカウントID（ソート順）
    - アカウントIDは内部でルックアップ用に正規化されます
  </Accordion>

  <Accordion title="Credential paths and legacy compatibility">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - バックアップファイル: `creds.json.bak`
    - `~/.openclaw/credentials/`内のlegacyデフォルト認証も、デフォルトアカウントフローでは引き続き認識/移行されます
  </Accordion>

  <Accordion title="Logout behavior">
    `openclaw channels logout --channel whatsapp [--account <id>]`は、そのアカウントのWhatsApp認証状態を消去します。

    legacy認証ディレクトリでは、Baileys認証ファイルは削除されますが`oauth.json`は保持されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、config書き込み

- AgentツールサポートにはWhatsAppリアクションアクション（`react`）が含まれます。
- アクションゲート:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- チャンネル起点のconfig書き込みはデフォルトで有効です（`channels.whatsapp.configWrites=false`で無効化）。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    症状: チャンネルステータスが未リンクと表示されます。

    修正:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    症状: アカウントはリンク済みだが、切断や再接続試行が繰り返されます。

    修正:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    必要に応じて、`channels login`で再リンクしてください。

  </Accordion>

  <Accordion title="No active listener when sending">
    対象アカウントに対するアクティブなgatewayリスナーが存在しない場合、送信は即座に失敗します。

    Gatewayが動作中で、アカウントがリンク済みであることを確認してください。

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    次の順序で確認してください。

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` allowlistエントリー
    - mentionゲーティング（`requireMention` + mention patterns）
    - `openclaw.json`（JSON5）内の重複キー: 後ろのエントリーが前のものを上書きするため、スコープごとに`groupPolicy`は1つだけにしてください

  </Accordion>

  <Accordion title="Bun runtime warning">
    WhatsApp gatewayランタイムではNodeを使用してください。Bunは、安定したWhatsApp/Telegram gateway運用と互換性がないとして扱われます。
  </Accordion>
</AccordionGroup>

## 設定リファレンスへのポインター

主要リファレンス:

- [Configuration reference - WhatsApp](/gateway/configuration-reference#whatsapp)

重要なWhatsAppフィールド:

- アクセス: `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 配信: `textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`
- マルチアカウント: `accounts.<id>.enabled`、`accounts.<id>.authDir`、アカウントレベル上書き
- 運用: `configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`
- セッション動作: `session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`

## 関連

- [Pairing](/channels/pairing)
- [Groups](/channels/groups)
- [Security](/gateway/security)
- [Channel routing](/channels/channel-routing)
- [Multi-agent routing](/concepts/multi-agent)
- [Troubleshooting](/channels/troubleshooting)
