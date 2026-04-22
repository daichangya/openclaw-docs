---
read_when:
    - WhatsApp/web チャンネルの動作または受信トレイルーティングの作業
summary: WhatsApp チャンネルのサポート、アクセス制御、配信動作、および運用
title: WhatsApp
x-i18n:
    generated_at: "2026-04-22T04:21:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c527b9f7f58f4bb7272a6d1c0f9a435d7d46a9b99790243594afb5c305606b3
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp（Web チャンネル）

ステータス: WhatsApp Web（Baileys）経由で本番運用可能です。Gateway がリンク済みセッションを管理します。

## インストール（必要時）

- オンボーディング（`openclaw onboard`）と `openclaw channels add --channel whatsapp`
  では、初めて WhatsApp plugin を選択したときにインストールを促します。
- `openclaw channels login --channel whatsapp` でも、plugin がまだ存在しない場合は
  インストールフローが提供されます。
- 開発チャンネル + git checkout: デフォルトでローカル plugin パスを使用します。
- Stable/Beta: デフォルトで npm package `@openclaw/whatsapp` を使用します。

手動インストールも引き続き利用できます:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    不明な送信者に対するデフォルトの DM policy は pairing です。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/ja-JP/gateway/configuration">
    チャンネル設定パターンと例の完全版。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="WhatsApp アクセスポリシーを設定する">

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

    特定のアカウントに対しては:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Gateway を起動する">

```bash
openclaw gateway
```

  </Step>

  <Step title="最初の pairing request を承認する（pairing モードを使用している場合）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Pairing request は 1 時間後に期限切れになります。保留中の request はチャンネルごとに 3 件までです。

  </Step>
</Steps>

<Note>
可能であれば、OpenClaw は WhatsApp を別番号で運用することを推奨します。（チャンネル metadata とセットアップフローはその構成向けに最適化されていますが、個人番号での構成にも対応しています。）
</Note>

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用番号（推奨）">
    これは最もすっきりした運用モードです:

    - OpenClaw 用に分離された WhatsApp identity
    - より明確な DM allowlist とルーティング境界
    - self-chat の混乱が起きる可能性が低い

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

  <Accordion title="個人番号でのフォールバック">
    オンボーディングは個人番号モードをサポートしており、self-chat に適したベースラインを書き込みます:

    - `dmPolicy: "allowlist"`
    - `allowFrom` にあなたの個人番号が含まれる
    - `selfChatMode: true`

    ランタイムでは、self-chat 保護はリンク済みの self 番号と `allowFrom` に基づいて動作します。

  </Accordion>

  <Accordion title="WhatsApp Web 専用のチャンネルスコープ">
    現在の OpenClaw チャンネルアーキテクチャでは、このメッセージングプラットフォームチャンネルは WhatsApp Web ベース（`Baileys`）です。

    組み込みの chat-channel registry には、別個の Twilio WhatsApp メッセージングチャンネルはありません。

  </Accordion>
</AccordionGroup>

## ランタイムモデル

- Gateway が WhatsApp socket と再接続ループを管理します。
- 外向き送信には、対象アカウントに対するアクティブな WhatsApp listener が必要です。
- ステータスチャットとブロードキャストチャットは無視されます（`@status`, `@broadcast`）。
- ダイレクトチャットは DM session ルール（`session.dmScope`）を使用します。デフォルトの `main` では DM は agent の main session に集約されます。
- グループセッションは分離されます（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Web transport は Gateway host 上の標準 proxy 環境変数（`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / 小文字版）を尊重します。チャンネル固有の WhatsApp proxy 設定よりも host レベルの proxy 設定を推奨します。

## アクセス制御と有効化

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` はダイレクトチャットへのアクセスを制御します:

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `allowFrom` は E.164 形式の番号を受け付けます（内部で正規化されます）。

    マルチアカウント上書き: `channels.whatsapp.accounts.<id>.dmPolicy`（および `allowFrom`）は、そのアカウントに対してチャンネルレベルのデフォルトより優先されます。

    ランタイム動作の詳細:

    - pairing はチャンネル allow-store に永続化され、設定済みの `allowFrom` とマージされます
    - allowlist が設定されていない場合、リンク済みの self 番号はデフォルトで許可されます
    - 外向きの `fromMe` DM は自動 pairing されません

  </Tab>

  <Tab title="グループポリシー + allowlist">
    グループアクセスには 2 つの層があります:

    1. **グループ membership allowlist**（`channels.whatsapp.groups`）
       - `groups` を省略した場合、すべてのグループが対象になります
       - `groups` が存在する場合、それはグループ allowlist として機能します（`"*"` を許可可能）

    2. **グループ送信者ポリシー**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`: 送信者 allowlist をバイパスします
       - `allowlist`: 送信者は `groupAllowFrom`（または `*`）に一致する必要があります
       - `disabled`: すべてのグループ受信をブロックします

    送信者 allowlist のフォールバック:

    - `groupAllowFrom` が未設定の場合、ランタイムは利用可能であれば `allowFrom` にフォールバックします
    - 送信者 allowlist は mention/reply による有効化より前に評価されます

    注: `channels.whatsapp` ブロック自体がまったく存在しない場合、ランタイムの group-policy フォールバックは `allowlist` です（警告ログ付き）。`channels.defaults.groupPolicy` が設定されていても同様です。

  </Tab>

  <Tab title="Mention + /activation">
    グループ返信はデフォルトで mention が必要です。

    Mention 検出には次が含まれます:

    - bot identity への明示的な WhatsApp mention
    - 設定済みの mention regex pattern（`agents.list[].groupChat.mentionPatterns`、なければ `messages.groupChat.mentionPatterns`）
    - bot identity に対する暗黙の reply 検出（reply 送信者が bot identity と一致する）

    セキュリティ注記:

    - quote/reply は mention 制御を満たすだけであり、送信者認可は付与しません
    - `groupPolicy: "allowlist"` では、allowlist にない送信者は、allowlist にあるユーザーのメッセージへの返信であっても引き続きブロックされます

    セッションレベルの activation command:

    - `/activation mention`
    - `/activation always`

    `activation` はセッション状態を更新します（グローバル config ではありません）。owner 制御付きです。

  </Tab>
</Tabs>

## 個人番号と self-chat の動作

リンク済み self 番号が `allowFrom` にも存在する場合、WhatsApp の self-chat 保護が有効になります:

- self-chat ターンでは既読通知をスキップします
- 本来なら自分自身を ping してしまう mention-JID 自動トリガー動作を無視します
- `messages.responsePrefix` が未設定の場合、self-chat 返信のデフォルトは `[{identity.name}]` または `[openclaw]` になります

## メッセージ正規化とコンテキスト

<AccordionGroup>
  <Accordion title="受信 envelope + reply コンテキスト">
    受信した WhatsApp メッセージは共有の受信 envelope でラップされます。

    引用 reply が存在する場合、コンテキストは次の形式で追加されます:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Reply metadata フィールドも利用可能な場合は設定されます（`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164）。

  </Accordion>

  <Accordion title="media placeholder と位置情報/連絡先の抽出">
    media のみの受信メッセージは、次のような placeholder で正規化されます:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    位置情報と連絡先の payload は、ルーティング前にテキストコンテキストへ正規化されます。

  </Accordion>

  <Accordion title="保留中のグループ履歴注入">
    グループでは、未処理メッセージをバッファし、bot が最終的にトリガーされたときにコンテキストとして注入できます。

    - デフォルト上限: `50`
    - 設定: `channels.whatsapp.historyLimit`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    注入マーカー:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="既読通知">
    既読通知は、受理された受信 WhatsApp メッセージに対してデフォルトで有効です。

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

    self-chat ターンでは、グローバルに有効でも既読通知はスキップされます。

  </Accordion>
</AccordionGroup>

## 配信、chunking、media

<AccordionGroup>
  <Accordion title="テキスト chunking">
    - デフォルトの chunk 上限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` モードは段落区切り（空行）を優先し、その後、長さ安全な chunking にフォールバックします
  </Accordion>

  <Accordion title="外向き media の動作">
    - image、video、audio（PTT voice-note）、document payload をサポートします
    - `audio/ogg` は voice-note 互換性のため `audio/ogg; codecs=opus` に書き換えられます
    - アニメーション GIF 再生は video 送信時の `gifPlayback: true` でサポートされます
    - 複数 media の reply payload を送信する場合、caption は最初の media item に適用されます
    - media source は HTTP(S)、`file://`、またはローカルパスが使用できます
  </Accordion>

  <Accordion title="media サイズ制限とフォールバック動作">
    - 受信 media 保存上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - 外向き media 送信上限: `channels.whatsapp.mediaMaxMb`（デフォルト `50`）
    - アカウントごとの上書きは `channels.whatsapp.accounts.<accountId>.mediaMaxMb` を使用します
    - image は制限に収まるよう自動最適化されます（リサイズ/品質スイープ）
    - media 送信失敗時、最初の item のフォールバックは、応答を黙って落とす代わりにテキスト警告を送信します
  </Accordion>
</AccordionGroup>

## Reaction level

`channels.whatsapp.reactionLevel` は、agent が WhatsApp で emoji reaction をどの程度広く使うかを制御します:

| Level         | Ack reaction | agent 開始 reaction | 説明 |
| ------------- | ------------ | ------------------- | ---- |
| `"off"`       | いいえ       | いいえ              | reaction をまったく使用しません |
| `"ack"`       | はい         | いいえ              | Ack reaction のみ（返信前受領） |
| `"minimal"`   | はい         | はい（保守的）      | Ack + 保守的ガイダンスでの agent reaction |
| `"extensive"` | はい         | はい（推奨）        | Ack + 推奨ガイダンスでの agent reaction |

デフォルト: `"minimal"`。

アカウントごとの上書きは `channels.whatsapp.accounts.<id>.reactionLevel` を使用します。

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Acknowledgment reaction

WhatsApp は `channels.whatsapp.ackReaction` により、受信時に即時の ack reaction をサポートします。
Ack reaction は `reactionLevel` によって制御され、`reactionLevel` が `"off"` の場合は抑制されます。

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
- 失敗はログに記録されますが、通常の返信配信は妨げません
- グループモード `mentions` は mention によってトリガーされたターンで reaction します。グループ activation の `always` はこのチェックのバイパスとして機能します
- WhatsApp は `channels.whatsapp.ackReaction` を使用します（レガシーの `messages.ackReaction` はここでは使われません）

## マルチアカウントと認証情報

<AccordionGroup>
  <Accordion title="アカウント選択とデフォルト">
    - account id は `channels.whatsapp.accounts` から取得されます
    - デフォルトアカウント選択: `default` が存在すればそれ、なければ最初に設定された account id（ソート済み）
    - account id は参照用に内部で正規化されます
  </Accordion>

  <Accordion title="認証情報パスとレガシー互換性">
    - 現在の auth パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - バックアップファイル: `creds.json.bak`
    - `~/.openclaw/credentials/` 内のレガシーなデフォルト auth も、デフォルトアカウントフロー向けに引き続き認識/移行されます
  </Accordion>

  <Accordion title="ログアウト動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp auth 状態をクリアします。

    レガシー auth ディレクトリでは、`oauth.json` は保持され、Baileys auth ファイルは削除されます。

  </Accordion>
</AccordionGroup>

## Tools、actions、および config 書き込み

- agent tool サポートには WhatsApp reaction action（`react`）が含まれます。
- Action ゲート:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- チャンネル起点の config 書き込みはデフォルトで有効です（`channels.whatsapp.configWrites=false` で無効化）。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="未リンク（QR が必要）">
    症状: チャンネル status が未リンクと表示されます。

    対処:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="リンク済みだが切断される / 再接続ループ">
    症状: アカウントはリンク済みだが、切断または再接続試行が繰り返されます。

    対処:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    必要に応じて、`channels login` で再リンクしてください。

  </Accordion>

  <Accordion title="送信時にアクティブな listener がない">
    対象アカウントに対してアクティブな Gateway listener が存在しない場合、外向き送信は即座に失敗します。

    Gateway が起動していて、アカウントがリンク済みであることを確認してください。

  </Accordion>

  <Accordion title="グループメッセージが想定外に無視される">
    次の順序で確認してください:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` allowlist エントリ
    - mention 制御（`requireMention` + mention pattern）
    - `openclaw.json`（JSON5）内の重複キー: 後のエントリが前のものを上書きするため、各スコープでは `groupPolicy` を 1 つだけにしてください

  </Accordion>

  <Accordion title="Bun ランタイム警告">
    WhatsApp Gateway ランタイムは Node を使用する必要があります。Bun は、安定した WhatsApp/Telegram Gateway 運用とは互換性がないとして扱われます。
  </Accordion>
</AccordionGroup>

## System prompt

WhatsApp は、グループチャットとダイレクトチャット向けに、Telegram スタイルの system prompt を `groups` マップと `direct` マップ経由でサポートしています。

グループメッセージの解決階層:

まず有効な `groups` マップが決まります。アカウントが独自の `groups` を定義している場合、それはルートの `groups` マップを完全に置き換えます（deep merge なし）。その後、prompt の検索は、その結果得られた単一マップに対して行われます:

1. **グループ固有の system prompt**（`groups["<groupId>"].systemPrompt`）: 特定のグループエントリが `systemPrompt` を定義している場合に使用されます。
2. **グループ wildcard system prompt**（`groups["*"].systemPrompt`）: 特定のグループエントリが存在しないか、`systemPrompt` を定義していない場合に使用されます。

ダイレクトメッセージの解決階層:

まず有効な `direct` マップが決まります。アカウントが独自の `direct` を定義している場合、それはルートの `direct` マップを完全に置き換えます（deep merge なし）。その後、prompt の検索は、その結果得られた単一マップに対して行われます:

1. **ダイレクト固有の system prompt**（`direct["<peerId>"].systemPrompt`）: 特定の peer エントリが `systemPrompt` を定義している場合に使用されます。
2. **ダイレクト wildcard system prompt**（`direct["*"].systemPrompt`）: 特定の peer エントリが存在しないか、`systemPrompt` を定義していない場合に使用されます。

注: `dms` は引き続き軽量な DM ごとの履歴上書きバケット（`dms.<id>.historyLimit`）です。prompt の上書きは `direct` の下に置かれます。

**Telegram のマルチアカウント動作との違い:** Telegram では、ある bot が所属していないグループのメッセージを受信するのを防ぐため、マルチアカウント構成では、独自の `groups` を定義していないアカウントも含めて、ルート `groups` はすべてのアカウントで意図的に抑制されます。WhatsApp ではこのガードは適用されません。ルート `groups` とルート `direct` は、設定されているアカウント数にかかわらず、アカウントレベルの上書きを定義していないアカウントに常に継承されます。マルチアカウントの WhatsApp 構成でアカウントごとのグループまたはダイレクト prompt が必要な場合は、ルートレベルのデフォルトに依存せず、各アカウントの下で完全なマップを明示的に定義してください。

重要な動作:

- `channels.whatsapp.groups` は、グループごとの config マップであると同時に、チャットレベルのグループ allowlist でもあります。ルートまたはアカウントスコープのいずれでも、`groups["*"]` はそのスコープに対して「すべてのグループを受け入れる」ことを意味します。
- wildcard グループ `systemPrompt` は、そのスコープですでにすべてのグループを受け入れたい場合にのみ追加してください。引き続き固定のグループ ID のみを対象にしたい場合は、prompt のデフォルトとして `groups["*"]` を使用しないでください。代わりに、明示的に allowlist した各グループエントリに prompt を繰り返し設定してください。
- グループ受け入れと送信者認可は別のチェックです。`groups["*"]` はグループ処理に到達できるグループの集合を広げますが、それ自体でそれらのグループ内のすべての送信者を認可するわけではありません。送信者アクセスは、引き続き `channels.whatsapp.groupPolicy` と `channels.whatsapp.groupAllowFrom` によって個別に制御されます。
- `channels.whatsapp.direct` には DM に対して同じ副作用はありません。`direct["*"]` は、DM が `dmPolicy` と `allowFrom` または pairing-store ルールによってすでに受け入れられた後にのみ、デフォルトのダイレクトチャット config を提供します。

例:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // ルートスコープですべてのグループを受け入れるべき場合にのみ使用します。
        // 独自の groups マップを定義していないすべてのアカウントに適用されます。
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // 独自の direct マップを定義していないすべてのアカウントに適用されます。
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // このアカウントは独自の groups を定義しているため、ルート groups は完全に
            // 置き換えられます。wildcard を維持したい場合は、ここでも明示的に "*" を定義してください。
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // このアカウントですべてのグループを受け入れるべき場合にのみ使用します。
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // このアカウントは独自の direct マップを定義しているため、ルート direct エントリは
            // 完全に置き換えられます。wildcard を維持したい場合は、ここでも明示的に "*" を定義してください。
            "+15551234567": { systemPrompt: "特定の仕事用ダイレクトチャット向けの prompt。" },
            "*": { systemPrompt: "仕事用ダイレクトチャットのデフォルト prompt。" },
          },
        },
      },
    },
  },
}
```

## 設定リファレンスへのポインタ

主なリファレンス:

- [Configuration reference - WhatsApp](/ja-JP/gateway/configuration-reference#whatsapp)

重要度の高い WhatsApp フィールド:

- アクセス: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- マルチアカウント: `accounts.<id>.enabled`, `accounts.<id>.authDir`, アカウントレベルの上書き
- 運用: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- セッション動作: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## 関連

- [Pairing](/ja-JP/channels/pairing)
- [Groups](/ja-JP/channels/groups)
- [Security](/ja-JP/gateway/security)
- [Channel routing](/ja-JP/channels/channel-routing)
- [Multi-agent routing](/ja-JP/concepts/multi-agent)
- [Troubleshooting](/ja-JP/channels/troubleshooting)
