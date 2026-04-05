---
read_when:
    - iMessageサポートをセットアップするとき
    - iMessageの送受信をデバッグするとき
summary: imsg経由の従来のiMessageサポート（stdio上のJSON-RPC）。新しいセットアップではBlueBubblesを使用してください。
title: iMessage
x-i18n:
    generated_at: "2026-04-05T12:35:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 086d85bead49f75d12ae6b14ac917af52375b6afd28f6af1a0dcbbc7fcb628a0
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage（legacy: imsg）

<Warning>
新しいiMessageデプロイでは、<a href="/channels/bluebubbles">BlueBubbles</a>を使用してください。

`imsg`統合はレガシーであり、将来のリリースで削除される可能性があります。
</Warning>

ステータス: レガシーな外部CLI統合。Gatewayは`imsg rpc`を起動し、stdio上のJSON-RPCで通信します（別個のデーモンやポートはありません）。

<CardGroup cols={3}>
  <Card title="BlueBubbles (recommended)" icon="message-circle" href="/channels/bluebubbles">
    新しいセットアップ向けの推奨iMessage経路です。
  </Card>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    iMessageのDMはデフォルトでpairingモードです。
  </Card>
  <Card title="Configuration reference" icon="settings" href="/gateway/configuration-reference#imessage">
    iMessageフィールドの完全なリファレンスです。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/<you>/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Pairingリクエストは1時間後に期限切れになります。
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClawはstdio互換の`cliPath`だけを必要とするため、`cliPath`をリモートMacにSSHして`imsg`を実行するラッパースクリプトに向けることができます。

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    添付ファイルを有効にする場合の推奨config:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // SCP添付ファイル取得に使用
      includeAttachments: true,
      // 任意: 許可する添付ファイルルートを上書きします。
      // デフォルトには /Users/*/Library/Messages/Attachments が含まれます
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost`が設定されていない場合、OpenClawはSSHラッパースクリプトを解析して自動検出を試みます。
    `remoteHost`は`host`または`user@host`である必要があります（空白やSSHオプションは不可）。
    OpenClawはSCPに厳格なホストキー検証を使用するため、リレーホストのホストキーがすでに`~/.ssh/known_hosts`に存在している必要があります。
    添付ファイルパスは許可されたルート（`attachmentRoots` / `remoteAttachmentRoots`）に対して検証されます。

  </Tab>
</Tabs>

## 要件と権限（macOS）

- `imsg`を実行するMacでMessagesにサインインしている必要があります。
- OpenClaw/`imsg`を実行するプロセスコンテキストにはフルディスクアクセスが必要です（Messages DBアクセス）。
- Messages.app経由でメッセージを送信するにはAutomation権限が必要です。

<Tip>
権限はプロセスコンテキストごとに付与されます。gatewayがヘッドレスで実行される場合（LaunchAgent/SSH）、同じコンテキストで一度だけ対話型コマンドを実行してプロンプトを表示させてください。

```bash
imsg chats --limit 1
# または
imsg send <handle> "test"
```

</Tip>

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy`はダイレクトメッセージを制御します。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom`に`"*"`を含める必要があります）
    - `disabled`

    allowlistフィールド: `channels.imessage.allowFrom`。

    allowlistエントリーには、ハンドルまたはチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用できます。

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy`はグループ処理を制御します。

    - `allowlist`（設定されている場合のデフォルト）
    - `open`
    - `disabled`

    グループ送信者allowlist: `channels.imessage.groupAllowFrom`。

    ランタイムフォールバック: `groupAllowFrom`が未設定の場合、利用可能であればiMessageのグループ送信者チェックは`allowFrom`にフォールバックします。
    ランタイム注記: `channels.imessage`が完全に欠けている場合、ランタイムは`groupPolicy="allowlist"`にフォールバックし、警告を記録します（`channels.defaults.groupPolicy`が設定されていても同様です）。

    グループ向けのmentionゲーティング:

    - iMessageにはネイティブのmentionメタデータがありません
    - mention検出では正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは`messages.groupChat.mentionPatterns`）を使用します
    - パターンが設定されていない場合、mentionゲーティングは適用できません

    認可された送信者からの制御コマンドは、グループでmentionゲーティングをバイパスできます。

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DMはダイレクトルーティングを使用し、グループはグループルーティングを使用します。
    - デフォルトの`session.dmScope=main`では、iMessageのDMはagentのメインセッションに統合されます。
    - グループセッションは分離されます（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 返信は、発信元のチャンネル／ターゲットメタデータを使ってiMessageに戻されます。

    グループ風スレッドの動作:

    一部の複数参加者iMessageスレッドは`is_group=false`で届くことがあります。
    その`chat_id`が`channels.imessage.groups`で明示的に設定されている場合、OpenClawはそれをグループトラフィックとして扱います（グループゲーティング + グループセッション分離）。

  </Tab>
</Tabs>

## ACP会話バインディング

レガシーiMessageチャットはACPセッションにもバインドできます。

高速なオペレーターフロー:

- DMまたは許可されたグループチャット内で`/acp spawn codex --bind here`を実行します。
- 以後、同じiMessage会話内のメッセージは、生成されたACPセッションにルーティングされます。
- `/new`および`/reset`は、同じバインド済みACPセッションをその場でリセットします。
- `/acp close`はACPセッションを閉じ、バインディングを削除します。

設定済みの永続的バインディングは、トップレベルの`bindings[]`エントリーで`type: "acp"`および`match.channel: "imessage"`を使ってサポートされます。

`match.peer.id`には次を使用できます。

- `+15555550123`や`user@example.com`のような正規化済みDMハンドル
- `chat_id:<id>`（安定したグループバインディングに推奨）
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

例:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

共有ACPバインディング動作については[ACP Agents](/tools/acp-agents)を参照してください。

## デプロイパターン

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    専用のApple IDとmacOSユーザーを使い、botトラフィックを個人のMessagesプロフィールから分離します。

    一般的なフロー:

    1. 専用のmacOSユーザーを作成してサインインします。
    2. そのユーザーでbot用Apple IDを使ってMessagesにサインインします。
    3. そのユーザーに`imsg`をインストールします。
    4. OpenClawがそのユーザーコンテキストで`imsg`を実行できるようにSSHラッパーを作成します。
    5. `channels.imessage.accounts.<id>.cliPath`と`.dbPath`をそのユーザープロファイルに向けます。

    初回実行では、そのbotユーザーセッションでGUI承認（Automation + フルディスクアクセス）が必要になる場合があります。

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    一般的なトポロジー:

    - gatewayはLinux/VMで実行
    - iMessage + `imsg`はtailnet内のMacで実行
    - `cliPath`ラッパーはSSHを使用して`imsg`を実行
    - `remoteHost`はSCP添付ファイル取得を有効化

    例:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    SSHキーを使用して、SSHとSCPの両方を非対話型にしてください。
    まずホストキーが信頼されていることを確認してください（例: `ssh bot@mac-mini.tailnet-1234.ts.net`）。これにより`known_hosts`が設定されます。

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessageは`channels.imessage.accounts`配下のアカウント単位configをサポートします。

    各アカウントは、`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルルートallowlistなどのフィールドを上書きできます。

  </Accordion>
</AccordionGroup>

## メディア、チャンク化、配信ターゲット

<AccordionGroup>
  <Accordion title="Attachments and media">
    - 受信添付ファイルの取り込みは任意です: `channels.imessage.includeAttachments`
    - `remoteHost`が設定されている場合、リモート添付ファイルパスはSCP経由で取得できます
    - 添付ファイルパスは許可されたルートに一致する必要があります:
      - `channels.imessage.attachmentRoots`（ローカル）
      - `channels.imessage.remoteAttachmentRoots`（リモートSCPモード）
      - デフォルトのルートパターン: `/Users/*/Library/Messages/Attachments`
    - SCPは厳格なホストキー検証を使用します（`StrictHostKeyChecking=yes`）
    - 送信メディアサイズには`channels.imessage.mediaMaxMb`（デフォルト16 MB）を使用します
  </Accordion>

  <Accordion title="Outbound chunking">
    - テキストチャンク上限: `channels.imessage.textChunkLimit`（デフォルト4000）
    - チャンクモード: `channels.imessage.chunkMode`
      - `length`（デフォルト）
      - `newline`（段落優先分割）
  </Accordion>

  <Accordion title="Addressing formats">
    推奨される明示的ターゲット:

    - `chat_id:123`（安定したルーティングに推奨）
    - `chat_guid:...`
    - `chat_identifier:...`

    ハンドルターゲットもサポートされます:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## config書き込み

iMessageでは、デフォルトでチャンネル起点のconfig書き込みが許可されています（`commands.config: true`のときの`/config set|unset`用）。

無効化する場合:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    バイナリとRPCサポートを検証します。

```bash
imsg rpc --help
openclaw channels status --probe
```

    probeでRPC未対応と表示された場合は、`imsg`を更新してください。

  </Accordion>

  <Accordion title="DMs are ignored">
    次を確認してください。

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - pairing承認（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="Group messages are ignored">
    次を確認してください。

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups`のallowlist動作
    - mentionパターン設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="Remote attachments fail">
    次を確認してください。

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - gatewayホストからのSSH/SCPキー認証
    - gatewayホスト上の`~/.ssh/known_hosts`にホストキーが存在すること
    - Messagesを実行しているMac上でのリモートパスの可読性

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    同じユーザー／セッションコンテキストの対話型GUIターミナルで再実行し、プロンプトを承認してください。

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    OpenClaw/`imsg`を実行するプロセスコンテキストに、フルディスクアクセスとAutomationが付与されていることを確認してください。

  </Accordion>
</AccordionGroup>

## 設定リファレンスへのポインター

- [Configuration reference - iMessage](/gateway/configuration-reference#imessage)
- [Gateway configuration](/gateway/configuration)
- [Pairing](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)

## 関連

- [Channels Overview](/channels) — サポートされているすべてのチャンネル
- [Pairing](/channels/pairing) — DM認証とpairingフロー
- [Groups](/channels/groups) — グループチャットの動作とmentionゲーティング
- [Channel Routing](/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/gateway/security) — アクセスモデルとハードニング
