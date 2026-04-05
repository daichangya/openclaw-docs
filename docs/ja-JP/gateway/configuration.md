---
read_when:
    - 初めて OpenClaw をセットアップする場合
    - 一般的な設定パターンを探している場合
    - 特定の config セクションに移動したい場合
summary: '設定の概要: よくある作業、クイックセットアップ、完全なリファレンスへのリンク'
title: Configuration
x-i18n:
    generated_at: "2026-04-05T12:44:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: a39a7de09c5f9540785ec67f37d435a7a86201f0f5f640dae663054f35976712
    source_path: gateway/configuration.md
    workflow: 15
---

# Configuration

OpenClaw は `~/.openclaw/openclaw.json` から任意の <Tooltip tip="JSON5 はコメントと末尾カンマをサポートします">**JSON5**</Tooltip> config を読み込みます。

このファイルが存在しない場合、OpenClaw は安全なデフォルトを使用します。config を追加する一般的な理由:

- チャネルを接続し、誰がボットにメッセージを送れるかを制御する
- モデル、ツール、sandboxing、または自動化（cron、hooks）を設定する
- セッション、メディア、ネットワーク、または UI を調整する

利用可能なすべてのフィールドについては、[完全なリファレンス](/gateway/configuration-reference) を参照してください。

<Tip>
**設定は初めてですか?** 対話型セットアップには `openclaw onboard` から始めるか、完全なコピー&ペースト用 config を掲載した [Configuration Examples](/gateway/configuration-examples) ガイドを確認してください。
</Tip>

## 最小構成

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## config を編集する

<Tabs>
  <Tab title="対話型ウィザード">
    ```bash
    openclaw onboard       # 完全なオンボーディングフロー
    openclaw configure     # config ウィザード
    ```
  </Tab>
  <Tab title="CLI（ワンライナー）">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) を開き、**Config** タブを使用します。
    Control UI は、ライブ config スキーマからフォームをレンダリングします。これにはフィールドの
    `title` / `description` のドキュメントメタデータに加え、利用可能な場合は plugin と channel のスキーマも含まれ、
    さらにエスケープハッチとして **Raw JSON** エディターも用意されています。ドリルダウン UI や
    その他のツール向けに、Gateway は `config.schema.lookup` も公開しており、
    1 つの path スコープ付きスキーマノードと直下の子要約を取得できます。
  </Tab>
  <Tab title="直接編集">
    `~/.openclaw/openclaw.json` を直接編集します。Gateway はこのファイルを監視し、自動的に変更を適用します（[hot reload](#config-hot-reload) を参照）。
  </Tab>
</Tabs>

## 厳格な検証

<Warning>
OpenClaw は、スキーマに完全に一致する設定のみを受け付けます。不明なキー、不正な型、または無効な値があると、Gateway は **起動を拒否** します。唯一のルートレベル例外は `$schema`（文字列）で、エディターが JSON Schema メタデータを付与できるようにするためのものです。
</Warning>

スキーマツールに関する注意:

- `openclaw config schema` は、Control UI と
  config 検証で使用されるものと同じ JSON Schema ファミリーを出力します。
- フィールドの `title` と `description` の値は、エディターおよびフォームツール向けに
  スキーマ出力へ引き継がれます。
- ネストしたオブジェクト、ワイルドカード（`*`）、および配列アイテム（`[]`）のエントリーは、
  一致するフィールドドキュメントが存在する場所では、同じドキュメントメタデータを継承します。
- `anyOf` / `oneOf` / `allOf` の合成ブランチも同じドキュメントメタデータを
  継承するため、union / intersection のバリアントでも同じフィールドヘルプを維持します。
- `config.schema.lookup` は、1 つの正規化された config path と、浅い
  スキーマノード（`title`、`description`、`type`、`enum`、`const`、共通の境界値、
  および同様の検証フィールド）、一致した UI ヒントメタデータ、さらにドリルダウンツール向けの
  直下の子要約を返します。
- 実行時の plugin / channel スキーマは、gateway が現在の
  manifest registry を読み込める場合にマージされます。

検証に失敗した場合:

- Gateway は起動しません
- 診断コマンドだけが動作します（`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`）
- 正確な問題を確認するには `openclaw doctor` を実行します
- 修復を適用するには `openclaw doctor --fix`（または `--yes`）を実行します

## よくある作業

<AccordionGroup>
  <Accordion title="チャネルをセットアップする（WhatsApp、Telegram、Discord など）">
    各チャネルには `channels.<provider>` 配下に独自の config セクションがあります。セットアップ手順は各チャネル専用ページを参照してください:

    - [WhatsApp](/ja-JP/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/ja-JP/channels/telegram) — `channels.telegram`
    - [Discord](/ja-JP/channels/discord) — `channels.discord`
    - [Feishu](/ja-JP/channels/feishu) — `channels.feishu`
    - [Google Chat](/ja-JP/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/ja-JP/channels/msteams) — `channels.msteams`
    - [Slack](/ja-JP/channels/slack) — `channels.slack`
    - [Signal](/ja-JP/channels/signal) — `channels.signal`
    - [iMessage](/ja-JP/channels/imessage) — `channels.imessage`
    - [Mattermost](/ja-JP/channels/mattermost) — `channels.mattermost`

    すべてのチャネルは同じ DM ポリシーパターンを共有します:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // allowlist/open の場合のみ
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="モデルを選択して設定する">
    プライマリモデルと任意のフォールバックを設定します:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` はモデルカタログを定義し、`/model` の allowlist として機能します。
    - モデル参照は `provider/model` 形式を使用します（例: `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` は transcript / tool 画像のダウンスケーリングを制御します（デフォルト `1200`）。値を下げると、通常はスクリーンショットの多い実行で vision token 使用量を減らせます。
    - チャット内でのモデル切り替えについては [Models CLI](/concepts/models)、auth ローテーションとフォールバック動作については [Model Failover](/concepts/model-failover) を参照してください。
    - カスタム / セルフホスト型プロバイダーについては、リファレンスの [Custom providers](/gateway/configuration-reference#custom-providers-and-base-urls) を参照してください。

  </Accordion>

  <Accordion title="誰がボットにメッセージを送れるかを制御する">
    DM アクセスは、チャネルごとに `dmPolicy` で制御されます:

    - `"pairing"`（デフォルト）: 未知の送信者には承認用の 1 回限りの pairing コードが送られます
    - `"allowlist"`: `allowFrom` 内の送信者のみ（または paired allow store）
    - `"open"`: すべての受信 DM を許可します（`allowFrom: ["*"]` が必要）
    - `"disabled"`: すべての DM を無視します

    グループでは、`groupPolicy` + `groupAllowFrom` またはチャネル固有の allowlist を使用します。

    チャネルごとの詳細については、[完全なリファレンス](/gateway/configuration-reference#dm-and-group-access) を参照してください。

  </Accordion>

  <Accordion title="グループチャットのメンションゲーティングを設定する">
    グループメッセージはデフォルトで **メンション必須** です。エージェントごとにパターンを設定します:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **メタデータメンション**: ネイティブの @ メンション（WhatsApp のタップしてメンション、Telegram の @bot など）
    - **テキストパターン**: `mentionPatterns` 内の安全な regex パターン
    - チャネルごとのオーバーライドと self-chat モードについては、[完全なリファレンス](/gateway/configuration-reference#group-chat-mention-gating) を参照してください。

  </Accordion>

  <Accordion title="エージェントごとに Skills を制限する">
    共通のベースラインには `agents.defaults.skills` を使用し、その後
    特定のエージェントを `agents.list[].skills` で上書きします:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather を継承
          { id: "docs", skills: ["docs-search"] }, // defaults を置き換え
          { id: "locked-down", skills: [] }, // Skills なし
        ],
      },
    }
    ```

    - デフォルトで Skills を無制限にするには `agents.defaults.skills` を省略します。
    - defaults を継承するには `agents.list[].skills` を省略します。
    - Skills をなしにするには `agents.list[].skills: []` を設定します。
    - [Skills](/tools/skills)、[Skills config](/tools/skills-config)、および
      [Configuration Reference](/gateway/configuration-reference#agentsdefaultsskills) を参照してください。

  </Accordion>

  <Accordion title="Gateway のチャネルヘルス監視を調整する">
    停滞しているように見えるチャネルを gateway がどの程度積極的に再起動するかを制御します:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - グローバルにヘルス監視再起動を無効にするには `gateway.channelHealthCheckMinutes: 0` を設定します。
    - `channelStaleEventThresholdMinutes` は、チェック間隔以上にする必要があります。
    - グローバル監視を無効にせずに、1 つのチャネルまたはアカウントだけの自動再起動を無効にするには、`channels.<provider>.healthMonitor.enabled` または `channels.<provider>.accounts.<id>.healthMonitor.enabled` を使用します。
    - 運用上のデバッグについては [Health Checks](/gateway/health)、すべてのフィールドについては [完全なリファレンス](/gateway/configuration-reference#gateway) を参照してください。

  </Accordion>

  <Accordion title="セッションとリセットを設定する">
    セッションは会話の継続性と分離を制御します:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // マルチユーザー向けの推奨設定
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main`（共有） | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: スレッドに束縛されたセッションルーティングのグローバルデフォルト（Discord は `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` をサポート）
    - スコープ、識別リンク、送信ポリシーについては [Session Management](/concepts/session) を参照してください。
    - すべてのフィールドについては [完全なリファレンス](/gateway/configuration-reference#session) を参照してください。

  </Accordion>

  <Accordion title="sandboxing を有効にする">
    エージェントセッションを分離された Docker コンテナーで実行します:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    最初にイメージをビルドします: `scripts/sandbox-setup.sh`

    完全なガイドについては [Sandboxing](/gateway/sandboxing)、すべてのオプションについては [完全なリファレンス](/gateway/configuration-reference#agentsdefaultssandbox) を参照してください。

  </Accordion>

  <Accordion title="公式 iOS ビルド向けに relay-backed push を有効にする">
    relay-backed push は `openclaw.json` で設定します。

    Gateway config に次を設定します:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // 任意。デフォルト: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    CLI の同等設定:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    これにより何が行われるか:

    - gateway は外部 relay を通じて `push.test`、wake nudges、reconnect wakes を送信できるようになります。
    - paired iOS app が転送する registration スコープの send grant を使用します。gateway にはデプロイメント全体の relay token は不要です。
    - 各 relay-backed registration は、その iOS app が pairing した gateway identity に結び付けられるため、別の gateway が保存済み registration を再利用することはできません。
    - ローカル / 手動の iOS ビルドは direct APNs のままです。relay-backed 送信は、relay を通じて登録された公式配布ビルドにのみ適用されます。
    - 公式 / TestFlight iOS ビルドに組み込まれた relay base URL と一致している必要があります。これにより registration と送信トラフィックの両方が同じ relay デプロイメントに到達します。

    エンドツーエンドのフロー:

    1. 同じ relay base URL でコンパイルされた公式 / TestFlight iOS ビルドをインストールします。
    2. gateway で `gateway.push.apns.relay.baseUrl` を設定します。
    3. iOS app を gateway に pairing し、node セッションと operator セッションの両方を接続します。
    4. iOS app は gateway identity を取得し、App Attest と app receipt を使って relay に登録し、その後 relay-backed の `push.apns.register` ペイロードを paired gateway に公開します。
    5. gateway は relay handle と send grant を保存し、`push.test`、wake nudges、reconnect wakes にそれらを使用します。

    運用上の注意:

    - iOS app を別の gateway に切り替えた場合は、app を再接続して、その gateway に結び付いた新しい relay registration を公開できるようにしてください。
    - 別の relay デプロイメントを指す新しい iOS ビルドを出荷した場合、app は古い relay origin を再利用する代わりに、キャッシュされた relay registration を更新します。

    互換性に関する注意:

    - `OPENCLAW_APNS_RELAY_BASE_URL` と `OPENCLAW_APNS_RELAY_TIMEOUT_MS` は、引き続き一時的な env 上書きとして動作します。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` は、引き続き loopback 専用の開発用エスケープハッチです。HTTP relay URL を config に永続化しないでください。

    エンドツーエンドのフローについては [iOS App](/platforms/ios#relay-backed-push-for-official-builds)、relay のセキュリティモデルについては [Authentication and trust flow](/platforms/ios#authentication-and-trust-flow) を参照してください。

  </Accordion>

  <Accordion title="heartbeat（定期チェックイン）を設定する">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: 期間文字列（`30m`、`2h`）。無効にするには `0m` を設定します。
    - `target`: `last` | `none` | `<channel-id>`（例: `discord`, `matrix`, `telegram`, `whatsapp`）
    - `directPolicy`: DM 形式の heartbeat ターゲットに対して `allow`（デフォルト）または `block`
    - 完全なガイドについては [Heartbeat](/gateway/heartbeat) を参照してください。

  </Accordion>

  <Accordion title="cron ジョブを設定する">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: 完了した分離実行セッションを `sessions.json` から削除します（デフォルト `24h`。無効にするには `false` を設定）。
    - `runLog`: サイズと保持行数に基づいて `cron/runs/<jobId>.jsonl` を削減します。
    - 機能概要と CLI 例については [Cron jobs](/ja-JP/automation/cron-jobs) を参照してください。

  </Accordion>

  <Accordion title="webhooks（hooks）をセットアップする">
    Gateway で HTTP webhook エンドポイントを有効にします:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    セキュリティに関する注意:
    - すべての hook / webhook ペイロード内容は信頼できない入力として扱ってください。
    - 専用の `hooks.token` を使用してください。共有 Gateway token を再利用しないでください。
    - hook 認証はヘッダーのみです（`Authorization: Bearer ...` または `x-openclaw-token`）。クエリ文字列の token は拒否されます。
    - `hooks.path` を `/` にすることはできません。webhook 受信は `/hooks` のような専用サブパスにしてください。
    - 安全でないコンテンツのバイパスフラグ（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）は、厳密に範囲を絞ったデバッグを行う場合を除き無効のままにしてください。
    - `hooks.allowRequestSessionKey` を有効にする場合は、呼び出し元が選択する session key を制限するために `hooks.allowedSessionKeyPrefixes` も設定してください。
    - hook 駆動エージェントでは、強力で現代的なモデル階層と厳格なツールポリシーを推奨します（たとえば、可能であればメッセージング専用 + sandboxing）。

    すべてのマッピングオプションと Gmail 統合については、[完全なリファレンス](/gateway/configuration-reference#hooks) を参照してください。

  </Accordion>

  <Accordion title="マルチエージェントルーティングを設定する">
    別々の workspace とセッションを持つ複数の分離エージェントを実行します:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    バインディングルールとエージェントごとのアクセスプロファイルについては、[Multi-Agent](/concepts/multi-agent) と [完全なリファレンス](/gateway/configuration-reference#multi-agent-routing) を参照してください。

  </Accordion>

  <Accordion title="config を複数ファイルに分割する（$include）">
    大きな config を整理するには `$include` を使用します:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **単一ファイル**: 含まれているオブジェクトを置き換えます
    - **ファイル配列**: 順番に deep-merge されます（後のものが優先）
    - **兄弟キー**: include の後にマージされます（含まれた値を上書き）
    - **ネストした include**: 最大 10 階層までサポート
    - **相対パス**: include 元ファイルを基準に解決
    - **エラー処理**: ファイル欠落、パースエラー、循環 include に対して明確なエラー

  </Accordion>
</AccordionGroup>

## config の hot reload

Gateway は `~/.openclaw/openclaw.json` を監視し、自動的に変更を適用します。ほとんどの設定では手動再起動は不要です。

### reload モード

| モード                   | 動作                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------- |
| **`hybrid`**（デフォルト） | 安全な変更は即座に hot-apply します。重要な変更は自動的に再起動します。           |
| **`hot`**              | 安全な変更のみ hot-apply します。再起動が必要な場合は警告を記録し、対応は自分で行います。 |
| **`restart`**          | 安全かどうかに関係なく、あらゆる config 変更で Gateway を再起動します。                 |
| **`off`**              | ファイル監視を無効にします。変更は次回の手動再起動時に反映されます。                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### hot-apply されるものと再起動が必要なもの

ほとんどのフィールドはダウンタイムなしで hot-apply されます。`hybrid` モードでは、再起動が必要な変更は自動処理されます。

| カテゴリー            | フィールド                                                               | 再起動が必要? |
| ------------------- | ------------------------------------------------------------------------ | ------------- |
| Channels            | `channels.*`, `web`（WhatsApp）— すべての組み込みおよび extension channels | いいえ        |
| Agent & models      | `agent`, `agents`, `models`, `routing`                                   | いいえ        |
| Automation          | `hooks`, `cron`, `agent.heartbeat`                                       | いいえ        |
| Sessions & messages | `session`, `messages`                                                    | いいえ        |
| Tools & media       | `tools`, `browser`, `skills`, `audio`, `talk`                            | いいえ        |
| UI & misc           | `ui`, `logging`, `identity`, `bindings`                                  | いいえ        |
| Gateway server      | `gateway.*`（port、bind、auth、tailscale、TLS、HTTP）                    | **はい**      |
| Infrastructure      | `discovery`, `canvasHost`, `plugins`                                     | **はい**      |

<Note>
`gateway.reload` と `gateway.remote` は例外です。これらの変更では **再起動はトリガーされません**。
</Note>

## Config RPC（プログラムによる更新）

<Note>
コントロールプレーンの書き込み RPC（`config.apply`, `config.patch`, `update.run`）は、`deviceId+clientIp` ごとに **60 秒あたり 3 リクエスト** にレート制限されています。制限された場合、RPC は `UNAVAILABLE` を `retryAfterMs` 付きで返します。
</Note>

安全 / デフォルトのフロー:

- `config.schema.lookup`: 浅い
  スキーマノード、一致したヒントメタデータ、直下の子要約を含む、1 つの path スコープ付き config サブツリーを調べる
- `config.get`: 現在のスナップショット + hash を取得する
- `config.patch`: 推奨される部分更新パス
- `config.apply`: config 全体の置き換え時のみ
- `update.run`: 明示的な self-update + 再起動

config 全体を置き換えるのでない場合は、`config.schema.lookup`
の後に `config.patch` を使うのが推奨です。

<AccordionGroup>
  <Accordion title="config.apply（完全置換）">
    config 全体を検証 + 書き込みし、1 ステップで Gateway を再起動します。

    <Warning>
    `config.apply` は **config 全体** を置き換えます。部分更新には `config.patch`、単一キーには `openclaw config set` を使用してください。
    </Warning>

    パラメーター:

    - `raw`（string）— config 全体の JSON5 ペイロード
    - `baseHash`（任意）— `config.get` の config hash（config が存在する場合は必須）
    - `sessionKey`（任意）— 再起動後の wake-up ping 用 session key
    - `note`（任意）— restart sentinel 用メモ
    - `restartDelayMs`（任意）— 再起動までの遅延（デフォルト 2000）

    すでに保留中 / 進行中の再起動がある間は再起動要求は集約され、再起動サイクル間には 30 秒のクールダウンが適用されます。

    ```bash
    openclaw gateway call config.get --params '{}'  # payload.hash を取得
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch（部分更新）">
    部分更新を既存の config にマージします（JSON merge patch セマンティクス）:

    - オブジェクトは再帰的にマージされる
    - `null` はキーを削除する
    - 配列は置き換えられる

    パラメーター:

    - `raw`（string）— 変更するキーだけを含む JSON5
    - `baseHash`（必須）— `config.get` の config hash
    - `sessionKey`、`note`、`restartDelayMs` — `config.apply` と同じ

    再起動動作は `config.apply` と同じです。保留中の再起動は集約され、再起動サイクル間には 30 秒のクールダウンが適用されます。

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## 環境変数

OpenClaw は、親プロセスからの env vars に加えて、次も読み取ります:

- 現在の作業ディレクトリの `.env`（存在する場合）
- `~/.openclaw/.env`（グローバルフォールバック）

どちらのファイルも、既存の env vars を上書きしません。config でインライン env vars を設定することもできます:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="シェル env のインポート（任意）">
  有効な場合、必要なキーが設定されていなければ、OpenClaw はログインシェルを実行し、不足しているキーだけをインポートします:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env var の同等設定: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="config 値での env var 置換">
  任意の config 文字列値で `${VAR_NAME}` を使って env vars を参照できます:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

ルール:

- 一致するのは大文字名のみ: `[A-Z_][A-Z0-9_]*`
- 欠落 / 空の vars は読み込み時にエラーになります
- リテラル出力には `$${VAR}` でエスケープします
- `$include` ファイル内でも動作します
- インライン置換: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret ref（env、file、exec）">
  SecretRef オブジェクトをサポートするフィールドでは、次を使用できます:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

SecretRef の詳細（`env` / `file` / `exec` 用の `secrets.providers` を含む）は [Secrets Management](/gateway/secrets) にあります。
サポートされる認証情報パスは [SecretRef Credential Surface](/reference/secretref-credential-surface) に一覧があります。
</Accordion>

完全な優先順位とソースについては [Environment](/help/environment) を参照してください。

## 完全なリファレンス

完全なフィールド別リファレンスについては、**[Configuration Reference](/gateway/configuration-reference)** を参照してください。

---

_関連: [Configuration Examples](/gateway/configuration-examples) · [Configuration Reference](/gateway/configuration-reference) · [Doctor](/gateway/doctor)_
