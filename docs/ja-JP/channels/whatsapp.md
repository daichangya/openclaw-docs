---
read_when:
    - WhatsApp/Webチャンネルの動作または受信トレイルーティングに取り組む
summary: WhatsAppチャンネルのサポート、アクセス制御、配信動作、および運用
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T08:57:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51305dbf83109edb64d07bcafd5fe738ff97e3d2c779adfaef2e8406d1d93caf
    source_path: channels/whatsapp.md
    workflow: 15
---

ステータス: WhatsApp Web（Baileys）経由で本番運用対応。Gatewayがリンクされたセッションを管理します。

## インストール（必要時）

- オンボーディング（`openclaw onboard`）および `openclaw channels add --channel whatsapp` は、初回選択時にWhatsApp Pluginのインストールを促します。
- `openclaw channels login --channel whatsapp` も、Pluginがまだ存在しない場合はインストールフローを案内します。
- 開発チャンネル + gitチェックアウト: デフォルトでローカルPluginパスを使用します。
- Stable/Beta: デフォルトでnpmパッケージ `@openclaw/whatsapp` を使用します。

手動インストールも引き続き利用できます:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    不明な送信者に対するデフォルトのDMポリシーはペアリングです。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gateway設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャンネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="WhatsAppアクセスポリシーを設定">

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

  <Step title="WhatsAppをリンク（QR）">

```bash
openclaw channels login --channel whatsapp
```

    特定のアカウントの場合:

```bash
openclaw channels login --channel whatsapp --account work
```

    ログイン前に既存またはカスタムのWhatsApp Web認証ディレクトリを接続するには:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Gatewayを起動">

```bash
openclaw gateway
```

  </Step>

  <Step title="最初のペアリングリクエストを承認（ペアリングモード使用時）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    ペアリングリクエストは1時間後に期限切れになります。保留中のリクエストはチャンネルごとに3件までです。

  </Step>
</Steps>

<Note>
OpenClawは、可能であればWhatsAppを別番号で運用することを推奨します。（チャンネルメタデータとセットアップフローはその構成向けに最適化されていますが、個人番号での構成にも対応しています。）
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用番号（推奨）">
    これは最も運用しやすいモードです:

    - OpenClaw用に分離されたWhatsAppアイデンティティ
    - より明確なDM許可リストとルーティング境界
    - セルフチャットの混乱が起きる可能性が低い

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

  <Accordion title="個人番号での代替運用">
    オンボーディングは個人番号モードをサポートしており、セルフチャットしやすいベースラインを書き込みます:

    - `dmPolicy: "allowlist"`
    - `allowFrom` にあなたの個人番号が含まれる
    - `selfChatMode: true`

    実行時には、セルフチャット保護はリンクされた自分の番号と `allowFrom` を基準に動作します。

  </Accordion>

  <Accordion title="WhatsApp Web専用チャンネルスコープ">
    現在のOpenClawチャンネルアーキテクチャでは、メッセージングプラットフォームのチャンネルはWhatsApp Webベース（`Baileys`）です。

    組み込みのチャットチャンネルレジストリには、別個のTwilio WhatsAppメッセージングチャンネルはありません。

  </Accordion>
</AccordionGroup>

## ランタイムモデル

- GatewayがWhatsAppソケットと再接続ループを管理します。
- 送信には、対象アカウントに対してアクティブなWhatsAppリスナーが必要です。
- ステータスおよびブロードキャストチャットは無視されます（`@status`, `@broadcast`）。
- ダイレクトチャットはDMセッションルールを使用します（`session.dmScope`; デフォルトの `main` はDMをエージェントのメインセッションに集約します）。
- グループセッションは分離されます（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Webトランスポートは、Gatewayホスト上の標準プロキシ環境変数（`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / 小文字版）に従います。チャンネル固有のWhatsAppプロキシ設定より、ホストレベルのプロキシ設定を推奨します。

## アクセス制御と有効化

<Tabs>
  <Tab title="DMポリシー">
    `channels.whatsapp.dmPolicy` はダイレクトチャットアクセスを制御します:

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `allowFrom` はE.164形式の番号を受け付けます（内部で正規化されます）。

    複数アカウントでの上書き: `channels.whatsapp.accounts.<id>.dmPolicy`（および `allowFrom`）は、そのアカウントについてチャンネルレベルのデフォルトより優先されます。

    ランタイム動作の詳細:

    - ペアリングはチャンネルのallow-storeに永続化され、設定済みの `allowFrom` とマージされます
    - 許可リストが設定されていない場合、リンクされた自分の番号がデフォルトで許可されます
    - OpenClawは送信した `fromMe` DM（リンク済みデバイスから自分自身に送るメッセージ）を自動ペアリングしません

  </Tab>

  <Tab title="グループポリシー + 許可リスト">
    グループアクセスには2つのレイヤーがあります:

    1. **グループメンバーシップ許可リスト** (`channels.whatsapp.groups`)
       - `groups` が省略されている場合、すべてのグループが対象になります
       - `groups` が存在する場合、グループ許可リストとして機能します（`"*"` 可）

    2. **グループ送信者ポリシー** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: 送信者許可リストをバイパス
       - `allowlist`: 送信者は `groupAllowFrom`（または `*`）に一致する必要があります
       - `disabled`: すべてのグループ受信をブロック

    送信者許可リストのフォールバック:

    - `groupAllowFrom` が未設定の場合、実行時には利用可能なら `allowFrom` にフォールバックします
    - 送信者許可リストは、メンション/返信による有効化より前に評価されます

    注: `channels.whatsapp` ブロック自体がまったく存在しない場合、`channels.defaults.groupPolicy` が設定されていても、実行時のグループポリシーのフォールバックは `allowlist` になります（警告ログあり）。

  </Tab>

  <Tab title="メンション + /activation">
    グループ返信はデフォルトでメンションを必要とします。

    メンション検出には次が含まれます:

    - ボットアイデンティティへの明示的なWhatsAppメンション
    - 設定されたメンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - ボットへの返信の暗黙的検出（返信送信者がボットアイデンティティに一致）

    セキュリティ上の注意:

    - 引用/返信はメンションゲーティングを満たすだけであり、送信者認可は付与しません
    - `groupPolicy: "allowlist"` では、許可リスト外の送信者は、許可リスト内ユーザーのメッセージに返信していてもブロックされます

    セッションレベルの有効化コマンド:

    - `/activation mention`
    - `/activation always`

    `activation` はセッション状態を更新します（グローバル設定ではありません）。これはオーナー限定です。

  </Tab>
</Tabs>

## 個人番号とセルフチャットの動作

リンクされた自分の番号が `allowFrom` にも含まれている場合、WhatsAppのセルフチャット保護が有効になります:

- セルフチャットのターンでは既読通知を送信しない
- そうでなければ自分自身に通知してしまうメンションJID自動トリガー動作を無視する
- `messages.responsePrefix` が未設定の場合、セルフチャット返信のデフォルトは `[{identity.name}]` または `[openclaw]`

## メッセージ正規化とコンテキスト

<AccordionGroup>
  <Accordion title="受信エンベロープ + 返信コンテキスト">
    受信したWhatsAppメッセージは共有の受信エンベロープでラップされます。

    引用返信が存在する場合、コンテキストは次の形式で追加されます:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    返信メタデータフィールドも、利用可能な場合は設定されます（`ReplyToId`, `ReplyToBody`, `ReplyToSender`, 送信者JID/E.164）。

  </Accordion>

  <Accordion title="メディアプレースホルダーと位置情報/連絡先の抽出">
    メディアのみの受信メッセージは、次のようなプレースホルダーで正規化されます:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    位置情報本文は簡潔な座標テキストを使用します。位置ラベル/コメントおよび連絡先/vCard詳細は、インラインのプロンプトテキストではなく、フェンス付きの非信頼メタデータとして描画されます。

  </Accordion>

  <Accordion title="保留中グループ履歴の注入">
    グループでは、未処理メッセージをバッファし、ボットが最終的にトリガーされたときにコンテキストとして注入できます。

    - デフォルト上限: `50`
    - 設定: `channels.whatsapp.historyLimit`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    注入マーカー:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="既読通知">
    既読通知は、受け入れられた受信WhatsAppメッセージに対してデフォルトで有効です。

    グローバルに無効化:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    アカウント単位の上書き:

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

    セルフチャットのターンでは、グローバルに有効でも既読通知をスキップします。

  </Accordion>
</AccordionGroup>

## 配信、チャンク化、メディア

<AccordionGroup>
  <Accordion title="テキストのチャンク化">
    - デフォルトのチャンク上限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` モードは段落境界（空行）を優先し、その後で長さ安全なチャンク化にフォールバックします
  </Accordion>

  <Accordion title="送信メディアの動作">
    - 画像、動画、音声（PTTボイスノート）、およびドキュメントペイロードをサポート
    - `audio/ogg` は、ボイスノート互換性のため `audio/ogg; codecs=opus` に書き換えられます
    - アニメーションGIF再生は、動画送信時の `gifPlayback: true` でサポートされます
    - 複数メディアの返信ペイロード送信時、キャプションは最初のメディア項目に適用されます
    - メディアソースにはHTTP(S)、`file://`、またはローカルパスを使用できます
  </Accordion>

  <Accordion title="メディアサイズ制限とフォールバック動作">
    - 受信メディア保存上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - 送信メディア送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - アカウント単位の上書きには `channels.whatsapp.accounts.<accountId>.mediaMaxMb` を使用
    - 画像は制限に収まるよう自動最適化されます（リサイズ/画質スイープ）
    - メディア送信に失敗した場合、先頭項目のフォールバックとして、応答を無言で破棄する代わりにテキスト警告を送信します
  </Accordion>
</AccordionGroup>

## 返信の引用

WhatsAppはネイティブの返信引用をサポートしており、送信返信で受信メッセージを視覚的に引用できます。`channels.whatsapp.replyToMode` で制御します。

| Value    | 動作                                                                           |
| -------- | ---------------------------------------------------------------------------------- |
| `"auto"` | プロバイダーが対応している場合は受信メッセージを引用し、そうでない場合は引用をスキップ |
| `"on"`   | 常に受信メッセージを引用し、引用が拒否された場合は通常送信にフォールバック             |
| `"off"`  | 引用せず、通常メッセージとして送信                                               |

デフォルトは `"auto"` です。アカウント単位の上書きには `channels.whatsapp.accounts.<id>.replyToMode` を使用します。

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## リアクションレベル

`channels.whatsapp.reactionLevel` は、エージェントがWhatsAppで絵文字リアクションをどの程度広く使うかを制御します:

| Level         | Ack reactions | Agent-initiated reactions | 説明                                        |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | No            | No                        | リアクションを一切行わない                              |
| `"ack"`       | Yes           | No                        | Ackリアクションのみ（返信前の受領通知）           |
| `"minimal"`   | Yes           | Yes (conservative)        | Ack + 控えめなガイダンスでのエージェントリアクション |
| `"extensive"` | Yes           | Yes (encouraged)          | Ack + 推奨ガイダンスでのエージェントリアクション   |

デフォルト: `"minimal"`。

アカウント単位の上書きには `channels.whatsapp.accounts.<id>.reactionLevel` を使用します。

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## 確認リアクション

WhatsAppは、`channels.whatsapp.ackReaction` により、受信時に即時の確認リアクションをサポートします。
確認リアクションは `reactionLevel` によって制御され、`reactionLevel` が `"off"` の場合は抑制されます。

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

動作に関する注意:

- 受信が受理された直後に送信されます（返信前）
- 失敗はログに記録されますが、通常の返信配信は妨げません
- グループモード `mentions` は、メンションでトリガーされたターンでリアクションします。グループ有効化 `always` はこのチェックをバイパスします
- WhatsAppは `channels.whatsapp.ackReaction` を使用します（従来の `messages.ackReaction` はここでは使用されません）

## 複数アカウントと認証情報

<AccordionGroup>
  <Accordion title="アカウント選択とデフォルト">
    - アカウントIDは `channels.whatsapp.accounts` から取得されます
    - デフォルトのアカウント選択: `default` が存在する場合はそれ、なければ最初に設定されたアカウントID（ソート済み）
    - アカウントIDは参照用に内部で正規化されます
  </Accordion>

  <Accordion title="認証情報パスと従来互換性">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - バックアップファイル: `creds.json.bak`
    - `~/.openclaw/credentials/` 内の従来のデフォルト認証も、デフォルトアカウントフロー向けに引き続き認識/移行されます
  </Accordion>

  <Accordion title="ログアウト動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントのWhatsApp認証状態をクリアします。

    従来の認証ディレクトリでは、`oauth.json` は保持され、Baileys認証ファイルは削除されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、設定書き込み

- エージェントツールのサポートには、WhatsAppリアクションアクション（`react`）が含まれます。
- アクションゲート:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- チャンネル起点の設定書き込みはデフォルトで有効です（`channels.whatsapp.configWrites=false` で無効化）。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="未リンク（QRが必要）">
    症状: チャンネルステータスが未リンクと表示されます。

    修正:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="リンク済みだが切断中 / 再接続ループ">
    症状: リンク済みアカウントで切断や再接続試行が繰り返されます。

    修正:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    必要に応じて、`channels login` で再リンクしてください。

  </Accordion>

  <Accordion title="送信時にアクティブなリスナーがない">
    対象アカウントに対するアクティブなGatewayリスナーが存在しない場合、送信は即座に失敗します。

    Gatewayが実行中であり、そのアカウントがリンク済みであることを確認してください。

  </Accordion>

  <Accordion title="グループメッセージが予期せず無視される">
    次の順で確認してください:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 許可リストエントリ
    - メンションゲーティング（`requireMention` + メンションパターン）
    - `openclaw.json`（JSON5）内の重複キー: 後のエントリが前のエントリを上書きするため、スコープごとに `groupPolicy` は1つだけにしてください

  </Accordion>

  <Accordion title="Bunランタイム警告">
    WhatsApp GatewayランタイムにはNodeを使用してください。Bunは、安定したWhatsApp/Telegram Gateway運用とは互換性がないものとして扱われます。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsAppは、`groups` および `direct` マップを通じて、グループとダイレクトチャット向けにTelegramスタイルのシステムプロンプトをサポートします。

グループメッセージの解決階層:

まず、有効な `groups` マップが決定されます。アカウントが独自の `groups` を定義している場合、それはルートの `groups` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト検索は結果として得られた単一のマップに対して実行されます:

1. **グループ固有のシステムプロンプト** (`groups["<groupId>"].systemPrompt`): 特定のグループエントリが `systemPrompt` を定義している場合に使用されます。
2. **グループワイルドカードのシステムプロンプト** (`groups["*"].systemPrompt`): 特定のグループエントリが存在しないか、`systemPrompt` を定義していない場合に使用されます。

ダイレクトメッセージの解決階層:

まず、有効な `direct` マップが決定されます。アカウントが独自の `direct` を定義している場合、それはルートの `direct` マップを完全に置き換えます（ディープマージなし）。その後、プロンプト検索は結果として得られた単一のマップに対して実行されます:

1. **ダイレクト固有のシステムプロンプト** (`direct["<peerId>"].systemPrompt`): 特定の相手エントリが `systemPrompt` を定義している場合に使用されます。
2. **ダイレクトワイルドカードのシステムプロンプト** (`direct["*"].systemPrompt`): 特定の相手エントリが存在しないか、`systemPrompt` を定義していない場合に使用されます。

注: `dms` は引き続き軽量なDM単位の履歴上書きバケットです（`dms.<id>.historyLimit`）。プロンプト上書きは `direct` 配下にあります。

**Telegramの複数アカウント動作との違い:** Telegramでは、複数アカウント構成において、独自の `groups` を定義していないアカウントであっても、ボットが所属していないグループのメッセージを受け取らないようにするため、ルートの `groups` はすべてのアカウントで意図的に抑制されます。WhatsAppではこのガードは適用されません。ルートの `groups` とルートの `direct` は、設定されたアカウント数に関係なく、アカウントレベルの上書きを定義していないアカウントに常に継承されます。複数アカウントのWhatsApp構成でアカウントごとのグループまたはダイレクトのプロンプトを使いたい場合は、ルートレベルのデフォルトに依存せず、各アカウント配下に完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの設定マップであると同時に、チャットレベルのグループ許可リストでもあります。ルートスコープでもアカウントスコープでも、`groups["*"]` はそのスコープで「すべてのグループを許可する」を意味します。
- ワイルドカードのグループ `systemPrompt` を追加するのは、そのスコープで本当にすべてのグループを許可したい場合だけにしてください。引き続き固定されたグループIDの集合だけを対象にしたい場合は、プロンプトのデフォルトに `groups["*"]` を使わないでください。代わりに、明示的に許可リストへ追加した各グループエントリに同じプロンプトを繰り返し設定してください。
- グループ許可と送信者認可は別々のチェックです。`groups["*"]` はグループ処理に到達できるグループ集合を広げますが、それだけでそれらのグループ内のすべての送信者を認可するわけではありません。送信者アクセスは引き続き `channels.whatsapp.groupPolicy` と `channels.whatsapp.groupAllowFrom` によって別途制御されます。
- `channels.whatsapp.direct` には、DMに対して同じ副作用はありません。`direct["*"]` は、DMが `dmPolicy` と `allowFrom` またはペアリングストアのルールによってすでに許可された後に、デフォルトのダイレクトチャット設定を提供するだけです。

例:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // ルートスコープですべてのグループを許可する場合のみ使用します。
        // 独自のgroupsマップを定義していないすべてのアカウントに適用されます。
        "*": { systemPrompt: "すべてのグループ向けのデフォルトプロンプト。" },
      },
      direct: {
        // 独自のdirectマップを定義していないすべてのアカウントに適用されます。
        "*": { systemPrompt: "すべてのダイレクトチャット向けのデフォルトプロンプト。" },
      },
      accounts: {
        work: {
          groups: {
            // このアカウントは独自のgroupsを定義しているため、ルートのgroupsは完全に
            // 置き換えられます。ワイルドカードを維持したい場合は、ここでも明示的に "*" を定義してください。
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "プロジェクト管理に集中すること。",
            },
            // このアカウントですべてのグループを許可する場合のみ使用します。
            "*": { systemPrompt: "業務グループ向けのデフォルトプロンプト。" },
          },
          direct: {
            // このアカウントは独自のdirectマップを定義しているため、ルートのdirectエントリは
            // 完全に置き換えられます。ワイルドカードを維持したい場合は、ここでも明示的に "*" を定義してください。
            "+15551234567": { systemPrompt: "特定の業務用ダイレクトチャット向けのプロンプト。" },
            "*": { systemPrompt: "業務用ダイレクトチャット向けのデフォルトプロンプト。" },
          },
        },
      },
    },
  },
}
```

## 設定リファレンスへのポインタ

主なリファレンス:

- [設定リファレンス - WhatsApp](/ja-JP/gateway/config-channels#whatsapp)

重要度の高いWhatsAppフィールド:

- アクセス: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- 複数アカウント: `accounts.<id>.enabled`, `accounts.<id>.authDir`, アカウントレベルの上書き
- 運用: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- セッション動作: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- プロンプト: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [複数エージェントルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
