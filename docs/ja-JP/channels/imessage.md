---
read_when:
    - iMessageサポートのセットアップ
    - iMessageの送受信のデバッグ
summary: imsg経由の旧来のiMessageサポート（stdio上のJSON-RPC）。新しいセットアップではBlueBubblesを使用してください。
title: iMessage
x-i18n:
    generated_at: "2026-04-22T04:19:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb9cc5a0bd4fbc7ff6f792e737bc4302a67f9ab6aa8231ff6f751fe6d732ca5d
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage（旧方式: imsg）

<Warning>
新しいiMessageデプロイでは、<a href="/ja-JP/channels/bluebubbles">BlueBubbles</a>を使用してください。

`imsg`連携は旧方式であり、将来のリリースで削除される可能性があります。
</Warning>

ステータス: 旧方式の外部CLI連携。Gatewayは`imsg rpc`を起動し、stdio上のJSON-RPCで通信します（別個のデーモン/ポートは不要）。

<CardGroup cols={3}>
  <Card title="BlueBubbles（推奨）" icon="message-circle" href="/ja-JP/channels/bluebubbles">
    新しいセットアップ向けの推奨iMessage経路。
  </Card>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    iMessageのDMはデフォルトでペアリングモードです。
  </Card>
  <Card title="設定リファレンス" icon="settings" href="/ja-JP/gateway/configuration-reference#imessage">
    iMessageの全フィールドのリファレンス。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="ローカルMac（最短手順）">
    <Steps>
      <Step title="imsgをインストールして確認する">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="OpenClawを設定する">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Gatewayを起動する">

```bash
openclaw gateway
```

      </Step>

      <Step title="最初のDMペアリングを承認する（デフォルトのdmPolicy）">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        ペアリング要求は1時間後に期限切れになります。
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH経由のリモートMac">
    OpenClawが必要とするのはstdio互換の`cliPath`だけなので、`cliPath`を、リモートMacへSSH接続して`imsg`を実行するラッパースクリプトに向けることができます。

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    添付ファイルを有効にする場合の推奨設定:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // SCPで添付ファイルを取得する際に使用
      includeAttachments: true,
      // 任意: 許可する添付ファイルのルートを上書きします。
      // デフォルトには /Users/*/Library/Messages/Attachments が含まれます
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost`が設定されていない場合、OpenClawはSSHラッパースクリプトを解析して自動検出を試みます。
    `remoteHost`は`host`または`user@host`である必要があります（空白やSSHオプションは不可）。
    OpenClawはSCPに厳格なホスト鍵検証を使用するため、リレーホストの鍵は事前に`~/.ssh/known_hosts`に存在している必要があります。
    添付ファイルのパスは、許可されたルート（`attachmentRoots` / `remoteAttachmentRoots`）に対して検証されます。

  </Tab>
</Tabs>

## 要件と権限（macOS）

- Messagesは、`imsg`を実行するMacでサインイン済みである必要があります。
- OpenClaw/`imsg`を実行するプロセスコンテキストには、フルディスクアクセスが必要です（Messages DBアクセス用）。
- Messages.app経由でメッセージを送信するには、自動操作権限が必要です。

<Tip>
権限はプロセスコンテキストごとに付与されます。gatewayがヘッドレスで実行されている場合（LaunchAgent/SSH）、同じコンテキストで一度だけ対話コマンドを実行して、権限プロンプトを発生させてください:

```bash
imsg chats --limit 1
# または
imsg send <handle> "test"
```

</Tip>

## アクセス制御とルーティング

<Tabs>
  <Tab title="DMポリシー">
    `channels.imessage.dmPolicy`はダイレクトメッセージを制御します:

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom`に`"*"`を含める必要があります）
    - `disabled`

    allowlistフィールド: `channels.imessage.allowFrom`。

    allowlistのエントリには、ハンドルまたはチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用できます。

  </Tab>

  <Tab title="グループポリシー + メンション">
    `channels.imessage.groupPolicy`はグループ処理を制御します:

    - `allowlist`（設定されている場合のデフォルト）
    - `open`
    - `disabled`

    グループ送信者allowlist: `channels.imessage.groupAllowFrom`。

    ランタイムのフォールバック: `groupAllowFrom`が未設定の場合、利用可能であればiMessageグループ送信者チェックは`allowFrom`にフォールバックします。
    ランタイム注記: `channels.imessage`自体が完全に存在しない場合、ランタイムは`groupPolicy="allowlist"`にフォールバックし、警告を記録します（`channels.defaults.groupPolicy`が設定されていても同様です）。

    グループ向けのメンション制御:

    - iMessageにはネイティブのメンションメタデータがありません
    - メンション検出は正規表現パターンを使用します（`agents.list[].groupChat.mentionPatterns`、フォールバックは`messages.groupChat.mentionPatterns`）
    - パターンが設定されていない場合、メンション制御は適用できません

    認可された送信者からの制御コマンドは、グループ内でメンション制御をバイパスできます。

  </Tab>

  <Tab title="セッションと決定的な返信">
    - DMはダイレクトルーティングを使用し、グループはグループルーティングを使用します。
    - デフォルトの`session.dmScope=main`では、iMessageのDMはエージェントのメインセッションに集約されます。
    - グループセッションは分離されます（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 返信は、発信元のチャネル/ターゲットメタデータを使用してiMessageへ戻されます。

    グループ風スレッドの動作:

    一部の複数参加者iMessageスレッドは、`is_group=false`で届くことがあります。
    その`chat_id`が`channels.imessage.groups`で明示的に設定されている場合、OpenClawはそれをグループトラフィックとして扱います（グループ制御 + グループセッション分離）。

  </Tab>
</Tabs>

## ACP会話バインディング

旧方式のiMessageチャットは、ACPセッションにもバインドできます。

オペレーター向けの高速フロー:

- DMまたは許可されたグループチャット内で`/acp spawn codex --bind here`を実行します。
- その後、同じiMessage会話内の今後のメッセージは、起動されたACPセッションにルーティングされます。
- `/new`と`/reset`は、同じバインド済みACPセッションをその場でリセットします。
- `/acp close`はACPセッションを終了し、バインディングを削除します。

設定された永続バインディングは、`type: "acp"`と`match.channel: "imessage"`を持つトップレベルの`bindings[]`エントリでサポートされます。

`match.peer.id`には次を使用できます:

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

共有ACPバインディング動作については、[ACP Agents](/ja-JP/tools/acp-agents)を参照してください。

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用ボットmacOSユーザー（別個のiMessage ID）">
    ボットのトラフィックを個人のMessagesプロファイルから分離するために、専用のApple IDとmacOSユーザーを使用します。

    一般的な流れ:

    1. 専用のmacOSユーザーを作成してサインインします。
    2. そのユーザーで、ボット用Apple IDでMessagesにサインインします。
    3. そのユーザーに`imsg`をインストールします。
    4. OpenClawがそのユーザーコンテキストで`imsg`を実行できるよう、SSHラッパーを作成します。
    5. `channels.imessage.accounts.<id>.cliPath`と`.dbPath`をそのユーザープロファイルに向けます。

    初回実行時には、そのボットユーザーセッションでGUI承認（自動操作 + フルディスクアクセス）が必要になる場合があります。

  </Accordion>

  <Accordion title="Tailscale経由のリモートMac（例）">
    一般的な構成:

    - gatewayはLinux/VM上で実行
    - iMessage + `imsg`はtailnet内のMac上で実行
    - `cliPath`ラッパーはSSHで`imsg`を実行
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

    SSHとSCPの両方が非対話式になるよう、SSHキーを使用してください。
    まずホスト鍵が信頼済みであることを確認してください（例: `ssh bot@mac-mini.tailnet-1234.ts.net`）。これにより`known_hosts`が設定されます。

  </Accordion>

  <Accordion title="マルチアカウントパターン">
    iMessageは`channels.imessage.accounts`配下でアカウントごとの設定をサポートします。

    各アカウントでは、`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルルートallowlistなどのフィールドを上書きできます。

  </Accordion>
</AccordionGroup>

## メディア、チャンク分割、配信ターゲット

<AccordionGroup>
  <Accordion title="添付ファイルとメディア">
    - 受信添付ファイルの取り込みは任意です: `channels.imessage.includeAttachments`
    - `remoteHost`が設定されている場合、リモート添付ファイルのパスはSCP経由で取得できます
    - 添付ファイルのパスは許可されたルートに一致する必要があります:
      - `channels.imessage.attachmentRoots`（ローカル）
      - `channels.imessage.remoteAttachmentRoots`（リモートSCPモード）
      - デフォルトのルートパターン: `/Users/*/Library/Messages/Attachments`
    - SCPは厳格なホスト鍵検証を使用します（`StrictHostKeyChecking=yes`）
    - 送信メディアサイズは`channels.imessage.mediaMaxMb`を使用します（デフォルト16 MB）
  </Accordion>

  <Accordion title="送信時チャンク分割">
    - テキストチャンク上限: `channels.imessage.textChunkLimit`（デフォルト4000）
    - チャンクモード: `channels.imessage.chunkMode`
      - `length`（デフォルト）
      - `newline`（段落優先の分割）
  </Accordion>

  <Accordion title="アドレス形式">
    推奨される明示的ターゲット:

    - `chat_id:123`（安定したルーティングに推奨）
    - `chat_guid:...`
    - `chat_identifier:...`

    ハンドルターゲットもサポートされています:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## 設定の書き込み

iMessageは、デフォルトでチャネル起点の設定書き込みを許可します（`commands.config: true`時の`/config set|unset`向け）。

無効化するには:

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
  <Accordion title="imsgが見つからない、またはRPCが未対応">
    バイナリとRPC対応を確認してください:

```bash
imsg rpc --help
openclaw channels status --probe
```

    probeでRPC未対応と表示された場合は、`imsg`を更新してください。

  </Accordion>

  <Accordion title="DMが無視される">
    次を確認してください:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - ペアリング承認（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="グループメッセージが無視される">
    次を確認してください:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups`のallowlist動作
    - メンションパターン設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="リモート添付ファイルが失敗する">
    次を確認してください:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - gatewayホストからのSSH/SCP鍵認証
    - gatewayホスト上の`~/.ssh/known_hosts`にホスト鍵が存在すること
    - Messagesを実行しているMac上でリモートパスが読み取り可能であること

  </Accordion>

  <Accordion title="macOSの権限プロンプトを見逃した">
    同じユーザー/セッションコンテキスト内の対話型GUIターミナルで再実行し、プロンプトを承認してください:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    OpenClaw/`imsg`を実行するプロセスコンテキストに、フルディスクアクセスと自動操作が付与されていることを確認してください。

  </Accordion>
</AccordionGroup>

## 設定リファレンスへのポインタ

- [設定リファレンス - iMessage](/ja-JP/gateway/configuration-reference#imessage)
- [Gateway設定](/ja-JP/gateway/configuration)
- [ペアリング](/ja-JP/channels/pairing)
- [BlueBubbles](/ja-JP/channels/bluebubbles)

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとハードニング
