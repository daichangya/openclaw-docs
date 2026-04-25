---
read_when:
    - WhatsApp/Web チャネル動作または受信トイルーティングの作業
summary: WhatsApp チャネルのサポート、アクセス制御、配信動作、運用
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T13:42:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf31e099230c65d9a97b976b11218b0c0bd4559e7917cdcf9b393633443528b4
    source_path: channels/whatsapp.md
    workflow: 15
---

ステータス: WhatsApp Web（Baileys）経由で本番利用可能。Gateway がリンクされたセッションを管理します。

## インストール（必要時）

- オンボーディング（`openclaw onboard`）および `openclaw channels add --channel whatsapp` は、
  初回選択時に WhatsApp Plugin のインストールを案内します。
- `openclaw channels login --channel whatsapp` でも、
  Plugin がまだ存在しない場合はインストールフローが提示されます。
- Dev channel + git checkout: デフォルトでローカル Plugin パスを使用します。
- Stable/Beta: デフォルトで npm パッケージ `@openclaw/whatsapp` を使用します。

手動インストールも引き続き利用できます:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    不明な送信者に対するデフォルトの DM ポリシーはペアリングです。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="WhatsApp のアクセスポリシーを設定する">

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

  <Step title="WhatsApp をリンクする（QR）">

```bash
openclaw channels login --channel whatsapp
```

    特定のアカウントの場合:

```bash
openclaw channels login --channel whatsapp --account work
```

    ログイン前に既存またはカスタムの WhatsApp Web 認証ディレクトリをアタッチするには:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Gateway を起動する">

```bash
openclaw gateway
```

  </Step>

  <Step title="最初のペアリング要求を承認する（ペアリングモード使用時）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    ペアリング要求は1時間後に期限切れになります。保留中の要求はチャネルごとに3件までです。

  </Step>
</Steps>

<Note>
OpenClaw は、可能であれば WhatsApp を別番号で運用することを推奨します。（チャネルメタデータとセットアップフローはその構成向けに最適化されていますが、個人番号での構成もサポートされています。）
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用番号（推奨）">
    これは最もクリーンな運用モードです:

    - OpenClaw 用に分離された WhatsApp ID
    - より明確な DM Allowlist とルーティング境界
    - 自分とのチャットの混乱が起きる可能性が低い

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

  <Accordion title="個人番号フォールバック">
    オンボーディングは個人番号モードをサポートしており、自分とのチャットに適したベースラインを書き込みます:

    - `dmPolicy: "allowlist"`
    - `allowFrom` に個人番号を含める
    - `selfChatMode: true`

    実行時には、自分とのチャット保護はリンクされた自分の番号と `allowFrom` に基づいて動作します。

  </Accordion>

  <Accordion title="WhatsApp Web のみのチャネルスコープ">
    メッセージングプラットフォームのチャネルは、現在の OpenClaw チャネルアーキテクチャでは WhatsApp Web ベース（`Baileys`）です。

    組み込みチャットチャネルレジストリには、別個の Twilio WhatsApp メッセージングチャネルはありません。

  </Accordion>
</AccordionGroup>

## 実行時モデル

- Gateway が WhatsApp ソケットと再接続ループを管理します。
- 送信には、対象アカウントに対してアクティブな WhatsApp リスナーが必要です。
- ステータスチャットとブロードキャストチャットは無視されます（`@status`、`@broadcast`）。
- ダイレクトチャットは DM セッションルール（`session.dmScope`。デフォルトの `main` では DM はエージェントのメインセッションに集約されます）を使用します。
- グループセッションは分離されます（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Web トランスポートは、Gateway ホスト上の標準プロキシ環境変数（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小文字バリアント）に従います。チャネル固有の WhatsApp プロキシ設定より、ホストレベルのプロキシ設定を推奨します。

## Plugin hooks とプライバシー

WhatsApp の受信メッセージには、個人のメッセージ内容、電話番号、
グループ識別子、送信者名、セッション相関フィールドが含まれる場合があります。そのため、
WhatsApp は、明示的にオプトインしない限り、受信 `message_received` フックペイロードを Plugin
にブロードキャストしません:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

オプトインを1つのアカウントに限定することもできます:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

受信 WhatsApp メッセージの内容と識別子を受け取ることを信頼できる Plugin
に対してのみ、これを有効にしてください。

## アクセス制御とアクティベーション

<Tabs>
  <Tab title="DM ポリシー">
    `channels.whatsapp.dmPolicy` はダイレクトチャットアクセスを制御します:

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `allowFrom` は E.164 形式の番号を受け付けます（内部で正規化されます）。

    マルチアカウント上書き: `channels.whatsapp.accounts.<id>.dmPolicy`（および `allowFrom`）は、そのアカウントではチャネルレベルのデフォルトより優先されます。

    実行時動作の詳細:

    - ペアリングはチャネル Allow store に永続化され、設定済み `allowFrom` とマージされます
    - Allowlist が設定されていない場合、リンクされた自分の番号がデフォルトで許可されます
    - OpenClaw は送信 `fromMe` DM（リンクされたデバイスから自分自身に送るメッセージ）を自動ペアリングしません

  </Tab>

  <Tab title="グループポリシー + Allowlist">
    グループアクセスには2つのレイヤーがあります:

    1. **グループメンバーシップ Allowlist** (`channels.whatsapp.groups`)
       - `groups` が省略されている場合、すべてのグループが対象です
       - `groups` が存在する場合、グループ Allowlist として機能します（`"*"` 可）

    2. **グループ送信者ポリシー** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: 送信者 Allowlist をバイパス
       - `allowlist`: 送信者は `groupAllowFrom`（または `*`）に一致する必要があります
       - `disabled`: すべてのグループ受信をブロック

    送信者 Allowlist フォールバック:

    - `groupAllowFrom` が未設定の場合、利用可能であれば実行時に `allowFrom` にフォールバックします
    - 送信者 Allowlist は、メンション/返信アクティベーションの前に評価されます

    注: `channels.whatsapp` ブロックがまったく存在しない場合、`channels.defaults.groupPolicy` が設定されていても、実行時のグループポリシーフォールバックは `allowlist` です（警告ログ付き）。

  </Tab>

  <Tab title="メンション + /activation">
    グループ返信には、デフォルトでメンションが必要です。

    メンション検出には以下が含まれます:

    - ボットIDへの明示的な WhatsApp メンション
    - 設定済みメンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバック `messages.groupChat.mentionPatterns`）
    - 暗黙のボットへの返信検出（返信送信者がボットIDと一致）

    セキュリティに関する注記:

    - 引用/返信はメンションゲーティングを満たすだけであり、送信者認可は付与しません
    - `groupPolicy: "allowlist"` では、Allowlist にない送信者は、Allowlist にあるユーザーのメッセージに返信しても引き続きブロックされます

    セッションレベルのアクティベーションコマンド:

    - `/activation mention`
    - `/activation always`

    `activation` はセッション状態を更新します（グローバル設定ではありません）。オーナーゲート付きです。

  </Tab>
</Tabs>

## 個人番号と自分とのチャット動作

リンクされた自分の番号が `allowFrom` にも存在する場合、WhatsApp の自分とのチャット保護が有効になります:

- 自分とのチャットターンでは既読通知をスキップ
- そうでなければ自分を ping してしまう、mention-JID の自動トリガー動作を無視
- `messages.responsePrefix` が未設定の場合、自分とのチャット返信はデフォルトで `[{identity.name}]` または `[openclaw]` になります

## メッセージ正規化とコンテキスト

<AccordionGroup>
  <Accordion title="受信エンベロープ + 返信コンテキスト">
    受信する WhatsApp メッセージは、共通の受信エンベロープにラップされます。

    引用返信が存在する場合、コンテキストは次の形式で追加されます:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    利用可能な場合は、返信メタデータフィールド（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、送信者 JID/E.164）も設定されます。

  </Accordion>

  <Accordion title="メディアプレースホルダーと位置情報/連絡先抽出">
    メディアのみの受信メッセージは、次のようなプレースホルダーで正規化されます:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    位置情報本文では簡潔な座標テキストを使用します。位置ラベル/コメントおよび連絡先/vCard の詳細は、インラインのプロンプトテキストではなく、フェンス付きの untrusted metadata として描画されます。

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
    既読通知は、受け入れられた受信 WhatsApp メッセージに対してデフォルトで有効です。

    グローバルに無効化するには:

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

    自分とのチャットターンでは、グローバルに有効でも既読通知をスキップします。

  </Accordion>
</AccordionGroup>

## 配信、チャンク化、メディア

<AccordionGroup>
  <Accordion title="テキストチャンク化">
    - デフォルトチャンク上限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` モードは段落境界（空行）を優先し、その後で長さ安全なチャンク化にフォールバックします
  </Accordion>

  <Accordion title="送信メディア動作">
    - 画像、動画、音声（PTT ボイスノート）、ドキュメントのペイロードをサポート
    - 返信ペイロードは `audioAsVoice` を保持し、WhatsApp は音声メディアを Baileys PTT ボイスノートとして送信します
    - Microsoft Edge TTS の MP3/WebM 出力を含む非 Ogg 音声は、PTT 配信前に Ogg/Opus にトランスコードされます
    - ネイティブ Ogg/Opus 音声は、ボイスノート互換性のため `audio/ogg; codecs=opus` で送信されます
    - アニメーション GIF 再生は、動画送信時の `gifPlayback: true` でサポートされます
    - 複数メディア返信ペイロード送信時、キャプションは最初のメディア項目に適用されます
    - メディアソースには HTTP(S)、`file://`、またはローカルパスを使用できます
  </Accordion>

  <Accordion title="メディアサイズ制限とフォールバック動作">
    - 受信メディア保存上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - 送信メディア送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - アカウントごとの上書きには `channels.whatsapp.accounts.<accountId>.mediaMaxMb` を使用
    - 画像は制限に収まるよう自動最適化されます（リサイズ/画質スイープ）
    - メディア送信失敗時、最初の項目のフォールバックはレスポンスを黙って落とすのではなく警告テキストを送信します
  </Accordion>
</AccordionGroup>

## 返信引用

WhatsApp はネイティブな返信引用をサポートしており、送信返信で受信メッセージを見える形で引用できます。これは `channels.whatsapp.replyToMode` で制御します。

| Value | 動作 |
| ----------- | --------------------------------------------------------------------- |
| `"off"` | 引用しない。プレーンメッセージとして送信 |
| `"first"` | 最初の送信返信チャンクのみ引用 |
| `"all"` | すべての送信返信チャンクを引用 |
| `"batched"` | キューされたバッチ返信を引用し、即時返信は引用しない |

デフォルトは `"off"` です。アカウントごとの上書きには `channels.whatsapp.accounts.<id>.replyToMode` を使用します。

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## リアクションレベル

`channels.whatsapp.reactionLevel` は、エージェントが WhatsApp で絵文字リアクションをどの程度広く使用するかを制御します:

| Level | Ack reactions | Agent-initiated reactions | 説明 |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"` | いいえ | いいえ | リアクションを一切行わない |
| `"ack"` | はい | いいえ | Ack リアクションのみ（返信前受領） |
| `"minimal"` | はい | はい（控えめ） | Ack + 控えめなガイダンスによるエージェントリアクション |
| `"extensive"` | はい | はい（推奨） | Ack + 推奨ガイダンスによるエージェントリアクション |

デフォルト: `"minimal"`。

アカウントごとの上書きには `channels.whatsapp.accounts.<id>.reactionLevel` を使用します。

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

WhatsApp は、`channels.whatsapp.ackReaction` によって受信時の即時 Ack リアクションをサポートします。
Ack リアクションは `reactionLevel` によってゲートされ、`reactionLevel` が `"off"` の場合は抑制されます。

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

動作に関する注記:

- 受信が受理された直後に送信されます（返信前）
- 失敗はログに記録されますが、通常の返信配信はブロックしません
- グループモード `mentions` は、メンショントリガーのターンでリアクションします。グループアクティベーション `always` はこのチェックをバイパスするものとして動作します
- WhatsApp は `channels.whatsapp.ackReaction` を使用します（レガシーの `messages.ackReaction` はここでは使用されません）

## マルチアカウントと認証情報

<AccordionGroup>
  <Accordion title="アカウント選択とデフォルト">
    - アカウント ID は `channels.whatsapp.accounts` から取得されます
    - デフォルトアカウント選択: `default` が存在すればそれ、それ以外は最初に設定されたアカウント ID（ソート順）
    - アカウント ID は検索用に内部で正規化されます
  </Accordion>

  <Accordion title="認証情報パスとレガシー互換性">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - バックアップファイル: `creds.json.bak`
    - `~/.openclaw/credentials/` 内のレガシーデフォルト認証も、デフォルトアカウントフロー用として引き続き認識/移行されます
  </Accordion>

  <Accordion title="ログアウト動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp 認証状態をクリアします。

    レガシー認証ディレクトリでは、Baileys 認証ファイルが削除されても `oauth.json` は保持されます。

  </Accordion>
</AccordionGroup>

## Tools、アクション、設定書き込み

- エージェント Tool サポートには WhatsApp リアクションアクション（`react`）が含まれます。
- アクションゲート:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- チャネル起点の設定書き込みはデフォルトで有効です（`channels.whatsapp.configWrites=false` で無効化）。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="リンクされていない（QR が必要）">
    症状: チャネルステータスが未リンクと報告する。

    修正:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="リンク済みだが切断される / 再接続ループ">
    症状: リンク済みアカウントで切断や再接続試行が繰り返される。

    修正:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    必要に応じて、`channels login` で再リンクしてください。

  </Accordion>

  <Accordion title="送信時にアクティブなリスナーがない">
    送信は、対象アカウントにアクティブな Gateway リスナーが存在しない場合、即座に失敗します。

    Gateway が実行中で、アカウントがリンクされていることを確認してください。

  </Accordion>

  <Accordion title="グループメッセージが予期せず無視される">
    次の順序で確認してください:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` Allowlist エントリ
    - メンションゲーティング（`requireMention` + メンションパターン）
    - `openclaw.json` 内の重複キー（JSON5）: 後のエントリが前のエントリを上書きするため、スコープごとに `groupPolicy` は1つだけにしてください

  </Accordion>

  <Accordion title="Bun ランタイム警告">
    WhatsApp Gateway ランタイムは Node を使用する必要があります。Bun は、安定した WhatsApp/Telegram Gateway 運用とは互換性がないものとして扱われます。
  </Accordion>
</AccordionGroup>

## システムプロンプト

WhatsApp は、`groups` および `direct` マップを通じて、グループとダイレクトチャット向けに Telegram スタイルのシステムプロンプトをサポートします。

グループメッセージの解決階層:

有効な `groups` マップが最初に決定されます。アカウントが独自の `groups` を定義している場合、それはルートの `groups` マップを完全に置き換えます（深いマージは行いません）。その後、得られた単一マップに対してプロンプト検索が実行されます:

1. **グループ固有のシステムプロンプト**（`groups["<groupId>"].systemPrompt`）: 特定のグループエントリがマップ内に存在し、かつその `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **グループワイルドカードのシステムプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

ダイレクトメッセージの解決階層:

有効な `direct` マップが最初に決定されます。アカウントが独自の `direct` を定義している場合、それはルートの `direct` マップを完全に置き換えます（深いマージは行いません）。その後、得られた単一マップに対してプロンプト検索が実行されます:

1. **ダイレクト固有のシステムプロンプト**（`direct["<peerId>"].systemPrompt`）: 特定のピアエントリがマップ内に存在し、かつその `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、システムプロンプトは適用されません。
2. **ダイレクトワイルドカードのシステムプロンプト**（`direct["*"].systemPrompt`）: 特定のピアエントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

注: `dms` は引き続き軽量な DM ごとの履歴上書きバケット（`dms.<id>.historyLimit`）であり、プロンプト上書きは `direct` の下に置かれます。

**Telegram のマルチアカウント動作との違い:** Telegram では、マルチアカウント構成で、独自の `groups` を定義していないアカウントも含め、すべてのアカウントに対してルートの `groups` が意図的に抑制されます。これは、ボットが所属していないグループからメッセージを受信するのを防ぐためです。WhatsApp ではこのガードは適用されません。ルートの `groups` とルートの `direct` は、設定されたアカウント数に関係なく、アカウントレベルの上書きを定義していないアカウントに常に継承されます。マルチアカウントの WhatsApp セットアップでアカウントごとのグループまたはダイレクトプロンプトが必要な場合は、ルートレベルのデフォルトに頼るのではなく、各アカウントの下に完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの設定マップであると同時に、チャットレベルのグループ Allowlist でもあります。ルートスコープでもアカウントスコープでも、`groups["*"]` はそのスコープで「すべてのグループを許可する」ことを意味します。
- ワイルドカードのグループ `systemPrompt` は、そのスコープですでにすべてのグループを許可したい場合にのみ追加してください。引き続き固定されたグループ ID のみを対象にしたい場合は、プロンプトデフォルトに `groups["*"]` を使用しないでください。代わりに、明示的に Allowlist に入れた各グループエントリに同じプロンプトを繰り返し設定してください。
- グループ受け入れと送信者認可は別々のチェックです。`groups["*"]` は、グループ処理に到達できるグループの集合を広げますが、それ自体でそのグループ内のすべての送信者を認可するわけではありません。送信者アクセスは依然として `channels.whatsapp.groupPolicy` と `channels.whatsapp.groupAllowFrom` によって別途制御されます。
- `channels.whatsapp.direct` は DM に対して同じ副作用を持ちません。`direct["*"]` は、DM が `dmPolicy` と `allowFrom` または pairing-store ルールによってすでに受け入れられた後にのみ、デフォルトのダイレクトチャット設定を提供します。

例:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // ルートスコープですべてのグループを許可する場合のみ使用してください。
        // 独自の groups マップを定義していないすべてのアカウントに適用されます。
        "*": { systemPrompt: "すべてのグループ向けのデフォルトプロンプト。" },
      },
      direct: {
        // 独自の direct マップを定義していないすべてのアカウントに適用されます。
        "*": { systemPrompt: "すべてのダイレクトチャット向けのデフォルトプロンプト。" },
      },
      accounts: {
        work: {
          groups: {
            // このアカウントは独自の groups を定義しているため、ルート groups は完全に
            // 置き換えられます。ワイルドカードも維持したい場合は、ここでも明示的に "*" を定義してください。
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "プロジェクト管理に集中してください。",
            },
            // このアカウントですべてのグループを許可する場合のみ使用してください。
            "*": { systemPrompt: "work グループ向けのデフォルトプロンプト。" },
          },
          direct: {
            // このアカウントは独自の direct マップを定義しているため、ルート direct エントリは
            // 完全に置き換えられます。ワイルドカードも維持したい場合は、ここでも明示的に "*" を定義してください。
            "+15551234567": { systemPrompt: "特定の work ダイレクトチャット向けプロンプト。" },
            "*": { systemPrompt: "work ダイレクトチャット向けのデフォルトプロンプト。" },
          },
        },
      },
    },
  },
}
```

## 設定リファレンスへのポインタ

主要リファレンス:

- [Configuration reference - WhatsApp](/ja-JP/gateway/config-channels#whatsapp)

重要な WhatsApp フィールド:

- アクセス: `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 配信: `textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`
- マルチアカウント: `accounts.<id>.enabled`、`accounts.<id>.authDir`、アカウントレベル上書き
- 運用: `configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`
- セッション動作: `session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`
- プロンプト: `groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt`

## 関連

- [Pairing](/ja-JP/channels/pairing)
- [Groups](/ja-JP/channels/groups)
- [Security](/ja-JP/gateway/security)
- [Channel routing](/ja-JP/channels/channel-routing)
- [Multi-agent routing](/ja-JP/concepts/multi-agent)
- [Troubleshooting](/ja-JP/channels/troubleshooting)
