---
read_when:
    - OpenClaw を初めて設定する場合
    - よくある設定パターンを探している場合
    - 特定の設定セクションに移動すること
summary: '設定の概要: よくあるタスク、クイックセットアップ、完全なリファレンスへのリンク'
title: 設定
x-i18n:
    generated_at: "2026-04-25T13:47:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8ffe1972fc7680d4cfc55a24fd6fc3869af593faf8c1137369dad0dbefde43a
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw は、`~/.openclaw/openclaw.json` から任意の <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> config を読み取ります。
有効な config パスは通常ファイルである必要があります。symlink された `openclaw.json`
レイアウトは、OpenClaw 管理の書き込みではサポートされません。アトミック書き込みによって、
symlink を保持せずにそのパス自体が置き換えられることがあります。config を
デフォルト state ディレクトリの外に置く場合は、`OPENCLAW_CONFIG_PATH` を実ファイルに直接向けてください。

ファイルがない場合、OpenClaw は安全なデフォルトを使用します。config を追加する一般的な理由:

- チャンネルを接続し、誰がボットにメッセージできるかを制御する
- モデル、tools、サンドボックス化、または自動化（Cron、hooks）を設定する
- セッション、メディア、ネットワーク、または UI を調整する

利用可能なすべてのフィールドについては、[完全なリファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

<Tip>
**設定が初めてですか?** インタラクティブセットアップには `openclaw onboard` から始めるか、完全なコピー＆ペースト設定については [Configuration Examples](/ja-JP/gateway/configuration-examples) ガイドを確認してください。
</Tip>

## 最小構成

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## config の編集

<Tabs>
  <Tab title="インタラクティブウィザード">
    ```bash
    openclaw onboard       # フルオンボーディングフロー
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
    Control UI は、利用可能な場合に field の
    `title` / `description` docs メタデータに加え、Plugin と channel の schema を含む
    live config schema からフォームをレンダリングし、緊急回避手段として **Raw JSON** エディターも提供します。ドリルダウン
    UI やその他のツール向けに、gateway は `config.schema.lookup` も公開しており、
    1 つの path-scope schema ノードとその直下の子要約を取得できます。
  </Tab>
  <Tab title="直接編集">
    `~/.openclaw/openclaw.json` を直接編集します。Gateway はファイルを監視し、変更を自動適用します（[ホットリロード](#config-hot-reload) を参照）。
  </Tab>
</Tabs>

## 厳密な検証

<Warning>
OpenClaw は schema に完全一致する設定のみ受け付けます。不明なキー、不正な型、無効な値があると、Gateway は **起動を拒否** します。唯一のルートレベル例外は `$schema`（文字列）で、エディターが JSON Schema メタデータを付与できるようにするためのものです。
</Warning>

`openclaw config schema` は、Control UI
と検証に使われる正規の JSON Schema を出力します。`config.schema.lookup` は、単一の path-scope ノードと
その子要約を取得してドリルダウンツールに利用します。field の `title`/`description` docs メタデータは、
ネストされたオブジェクト、ワイルドカード（`*`）、配列項目（`[]`）、および `anyOf`/
`oneOf`/`allOf` 分岐にも引き継がれます。manifest registry が読み込まれると、
ランタイムの Plugin と channel schema もマージされます。

検証に失敗した場合:

- Gateway は起動しません
- 診断コマンドだけが動作します（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 正確な問題を確認するには `openclaw doctor` を実行します
- 修復を適用するには `openclaw doctor --fix`（または `--yes`）を実行します

Gateway は、起動成功のたびに信頼済みの last-known-good コピーを保持します。
その後 `openclaw.json` が検証に失敗した場合（または `gateway.mode` が欠落したり、大幅に
縮小したり、余計なログ行が先頭に付加されたりした場合）、OpenClaw は壊れたファイルを
`.clobbered.*` として保持し、last-known-good コピーを復元し、
復旧理由をログに記録します。次のエージェントターンでも system-event 警告が送られるため、メイン
エージェントが復元済み config を無自覚に再書き換えすることを防げます。
候補に `***` のような秘匿済みシークレットプレースホルダーが含まれている場合、last-known-good への昇格は
スキップされます。すべての検証問題が `plugins.entries.<id>...` に限定されている場合、OpenClaw
はファイル全体の復旧を行いません。現在の config を有効のまま維持し、
Plugin ローカルの失敗を表面化させることで、Plugin schema または host-version の不一致によって
無関係なユーザー設定がロールバックされないようにします。

## よくあるタスク

<AccordionGroup>
  <Accordion title="チャンネルを設定する（WhatsApp、Telegram、Discord など）">
    各チャンネルには `channels.<provider>` 配下に独自の config セクションがあります。セットアップ手順は専用のチャンネルページを参照してください。

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

    すべてのチャンネルは同じ DM ポリシーパターンを共有します。

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // allowlist/open のみ
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="モデルを選択して設定する">
    プライマリモデルと任意のフォールバックを設定します。

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

    - `agents.defaults.models` はモデルカタログを定義し、`/model` の許可リストとしても機能します。
    - 既存モデルを削除せずに許可リスト項目を追加するには、`openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使います。項目を削除する通常の置換は、`--replace` を渡さない限り拒否されます。
    - モデル参照は `provider/model` 形式を使用します（例: `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` は transcript/tool 画像のダウンスケーリングを制御します（デフォルト `1200`）。値を下げると、スクリーンショットの多い実行で vision token 使用量が通常減ります。
    - チャット内でのモデル切り替えは [Models CLI](/ja-JP/concepts/models)、認証ローテーションとフォールバック動作は [Model Failover](/ja-JP/concepts/model-failover) を参照してください。
    - カスタム/セルフホスト型プロバイダーについては、リファレンスの [Custom providers](/ja-JP/gateway/config-tools#custom-providers-and-base-urls) を参照してください。

  </Accordion>

  <Accordion title="誰がボットにメッセージできるかを制御する">
    DM アクセスは `dmPolicy` によってチャンネルごとに制御されます。

    - `"pairing"`（デフォルト）: 未知の送信者には承認用の 1 回限りのペアリングコードが発行される
    - `"allowlist"`: `allowFrom`（またはペア済み allow store）にいる送信者のみ
    - `"open"`: すべての受信 DM を許可（`allowFrom: ["*"]` が必要）
    - `"disabled"`: すべての DM を無視

    グループには、`groupPolicy` + `groupAllowFrom` またはチャンネル固有の許可リストを使います。

    チャンネルごとの詳細は [完全なリファレンス](/ja-JP/gateway/config-channels#dm-and-group-access) を参照してください。

  </Accordion>

  <Accordion title="グループチャットのメンションゲートを設定する">
    グループメッセージはデフォルトで **メンション必須** です。パターンはエージェントごとに設定します。

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

    - **メタデータメンション**: ネイティブの @-mention（WhatsApp のタップメンション、Telegram の @bot など）
    - **テキストパターン**: `mentionPatterns` 内の安全な regex パターン
    - チャンネルごとの上書きと self-chat モードについては [完全なリファレンス](/ja-JP/gateway/config-channels#group-chat-mention-gating) を参照してください。

  </Accordion>

  <Accordion title="エージェントごとに Skills を制限する">
    共有ベースラインには `agents.defaults.skills` を使い、その後
    特定のエージェントを `agents.list[].skills` で上書きします。

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather を継承
          { id: "docs", skills: ["docs-search"] }, // デフォルトを置換
          { id: "locked-down", skills: [] }, // Skills なし
        ],
      },
    }
    ```

    - デフォルトで Skills を無制限にするには `agents.defaults.skills` を省略します。
    - デフォルトを継承するには `agents.list[].skills` を省略します。
    - Skills なしにするには `agents.list[].skills: []` を設定します。
    - [Skills](/ja-JP/tools/skills)、[Skills config](/ja-JP/tools/skills-config)、および
      [Configuration Reference](/ja-JP/gateway/config-agents#agents-defaults-skills) を参照してください。

  </Accordion>

  <Accordion title="Gateway のチャンネルヘルス監視を調整する">
    stale に見えるチャンネルを gateway がどれだけ積極的に再起動するかを制御します。

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

    - ヘルス監視による再起動をグローバルに無効化するには `gateway.channelHealthCheckMinutes: 0` を設定します。
    - `channelStaleEventThresholdMinutes` はチェック間隔以上にする必要があります。
    - グローバルモニターを無効化せずに 1 つのチャンネルまたはアカウントだけ自動再起動を無効化するには、`channels.<provider>.healthMonitor.enabled` または `channels.<provider>.accounts.<id>.healthMonitor.enabled` を使います。
    - 運用上のデバッグには [Health Checks](/ja-JP/gateway/health)、すべてのフィールドについては [完全なリファレンス](/ja-JP/gateway/configuration-reference#gateway) を参照してください。

  </Accordion>

  <Accordion title="セッションとリセットを設定する">
    セッションは会話の継続性と分離を制御します。

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // マルチユーザーに推奨
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

    - `dmScope`: `main`（共有）| `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: スレッド固定セッションルーティングのグローバルデフォルト（Discord は `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` をサポート）。
    - スコープ、identity リンク、送信ポリシーについては [Session Management](/ja-JP/concepts/session) を参照してください。
    - すべてのフィールドは [完全なリファレンス](/ja-JP/gateway/config-agents#session) を参照してください。

  </Accordion>

  <Accordion title="サンドボックス化を有効にする">
    エージェントセッションを分離された sandbox ランタイムで実行します。

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

    まずイメージをビルドします: `scripts/sandbox-setup.sh`

    完全ガイドは [Sandboxing](/ja-JP/gateway/sandboxing)、すべてのオプションは [完全なリファレンス](/ja-JP/gateway/config-agents#agentsdefaultssandbox) を参照してください。

  </Accordion>

  <Accordion title="公式 iOS ビルド向けの relay-backed push を有効にする">
    relay-backed push は `openclaw.json` で設定します。

    gateway config にこれを設定します。

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

    CLI 相当:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    これで行われること:

    - gateway が `push.test`、ウェイク通知、再接続ウェイクを外部 relay 経由で送信できるようになります。
    - ペアリングされた iOS アプリから転送される registration 単位の送信 grant を使用します。gateway にデプロイ全体用の relay token は不要です。
    - 各 relay-backed registration は、その iOS アプリがペアリングした gateway ID に結び付けられるため、別の gateway が保存済み registration を再利用することはできません。
    - ローカル/手動 iOS ビルドは direct APNs のままです。relay-backed 送信は、relay 経由で登録された公式配布ビルドにのみ適用されます。
    - 公式/TestFlight iOS ビルドに組み込まれた relay base URL と一致している必要があります。これにより、registration と送信トラフィックが同じ relay デプロイメントに到達します。

    エンドツーエンドフロー:

    1. 同じ relay base URL でビルドされた公式/TestFlight iOS ビルドをインストールします。
    2. gateway で `gateway.push.apns.relay.baseUrl` を設定します。
    3. iOS アプリを gateway とペアリングし、node セッションと operator セッションの両方を接続します。
    4. iOS アプリは gateway ID を取得し、App Attest とアプリ receipt を使って relay に登録し、その後 relay-backed `push.apns.register` ペイロードをペアリング済み gateway に公開します。
    5. gateway は relay handle と send grant を保存し、それらを `push.test`、ウェイク通知、再接続ウェイクに使用します。

    運用上の注意:

    - iOS アプリを別の gateway に切り替える場合は、アプリを再接続して、その gateway に紐付いた新しい relay registration を公開できるようにしてください。
    - 別の relay デプロイメントを指す新しい iOS ビルドを配布した場合、アプリは古い relay origin を再利用せず、キャッシュ済み relay registration を更新します。

    互換性に関する注意:

    - `OPENCLAW_APNS_RELAY_BASE_URL` と `OPENCLAW_APNS_RELAY_TIMEOUT_MS` は、一時的な env 上書きとして引き続き利用できます。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` は loopback 専用の開発用緊急回避のままです。HTTP relay URL を config に永続化しないでください。

    エンドツーエンドフローについては [iOS App](/ja-JP/platforms/ios#relay-backed-push-for-official-builds)、relay のセキュリティモデルについては [Authentication and trust flow](/ja-JP/platforms/ios#authentication-and-trust-flow) を参照してください。

  </Accordion>

  <Accordion title="Heartbeat を設定する（定期チェックイン）">
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

    - `every`: 期間文字列（`30m`、`2h`）。無効化するには `0m` を設定します。
    - `target`: `last` | `none` | `<channel-id>`（例: `discord`、`matrix`、`telegram`、または `whatsapp`）
    - `directPolicy`: `allow`（デフォルト）または `block`。DM スタイルの Heartbeat ターゲット用
    - 完全ガイドは [Heartbeat](/ja-JP/gateway/heartbeat) を参照してください。

  </Accordion>

  <Accordion title="Cron ジョブを設定する">
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

    - `sessionRetention`: `sessions.json` から完了済みの分離 run セッションを削除します（デフォルト `24h`。無効化するには `false` を設定）。
    - `runLog`: サイズと保持行数に応じて `cron/runs/<jobId>.jsonl` を削除します。
    - 機能概要と CLI 例は [Cron jobs](/ja-JP/automation/cron-jobs) を参照してください。

  </Accordion>

  <Accordion title="Webhook（hooks）を設定する">
    Gateway で HTTP Webhook エンドポイントを有効にします。

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
    - すべての hook/Webhook ペイロード内容は信頼できない入力として扱ってください。
    - 専用の `hooks.token` を使用してください。共有 Gateway token を再利用しないでください。
    - hook 認証はヘッダーのみです（`Authorization: Bearer ...` または `x-openclaw-token`）。クエリ文字列 token は拒否されます。
    - `hooks.path` を `/` にすることはできません。Webhook 受信は `/hooks` のような専用サブパスにしてください。
    - 危険なコンテンツのバイパスフラグ（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）は、厳密に範囲を限定したデバッグでない限り無効のままにしてください。
    - `hooks.allowRequestSessionKey` を有効にする場合は、呼び出し側が選べる session key を制限するため `hooks.allowedSessionKeyPrefixes` も設定してください。
    - hook 駆動エージェントには、強力な最新モデル階層と厳格な tool policy（たとえば、可能ならメッセージング専用 + サンドボックス化）を推奨します。

    すべての mapping オプションと Gmail 連携については [完全なリファレンス](/ja-JP/gateway/configuration-reference#hooks) を参照してください。

  </Accordion>

  <Accordion title="マルチエージェントルーティングを設定する">
    別々の workspace とセッションで複数の分離エージェントを実行します。

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

    バインディングルールとエージェントごとのアクセスプロファイルについては [Multi-Agent](/ja-JP/concepts/multi-agent) と [完全なリファレンス](/ja-JP/gateway/config-agents#multi-agent-routing) を参照してください。

  </Accordion>

  <Accordion title="config を複数ファイルに分割する（$include）">
    大きな config を整理するには `$include` を使います。

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

    - **単一ファイル**: それを含むオブジェクトを置き換えます
    - **ファイル配列**: 順に deep-merge されます（後勝ち）
    - **兄弟キー**: include の後にマージされます（include 値を上書き）
    - **ネストした include**: 最大 10 レベルまでサポート
    - **相対パス**: include 元のファイルを基準に解決されます
    - **OpenClaw 管理の書き込み**: `plugins: { $include: "./plugins.json5" }` のように、単一ファイル include によって裏付けられた 1 つのトップレベルセクションだけが変更される場合、OpenClaw はその include 先ファイルを更新し、`openclaw.json` は変更しません
    - **サポートされない write-through**: ルート include、include 配列、兄弟上書きを伴う include は、config をフラット化する代わりに、OpenClaw 管理の書き込みでは fail closed します
    - **エラー処理**: ファイル欠落、パースエラー、循環 include に対して明確なエラーを出します

  </Accordion>
</AccordionGroup>

## config ホットリロード

Gateway は `~/.openclaw/openclaw.json` を監視し、変更を自動適用します — ほとんどの設定では手動再起動は不要です。

直接のファイル編集は、検証に通るまで信頼されないものとして扱われます。watcher は
エディターの一時書き込み/リネームの揺れが収まるのを待ち、最終ファイルを読み込み、
無効な外部編集は last-known-good config を復元して拒否します。OpenClaw 管理の
config 書き込みも、書き込む前に同じ schema ゲートを使います。`gateway.mode` の削除や、ファイルサイズを半分超で縮小するような
破壊的 clobber は拒否され、確認用に `.rejected.*` として保存されます。

Plugin ローカルの検証失敗は例外です。すべての問題が
`plugins.entries.<id>...` 配下にある場合、リロードは current config を維持し、`.last-good` を復元する代わりに
Plugin 問題を報告します。

ログに `Config auto-restored from last-known-good` または
`config reload restored last-known-good config` が表示された場合は、
`openclaw.json` の隣にある対応する `.clobbered.*` ファイルを確認し、拒否されたペイロードを修正してから
`openclaw config validate` を実行してください。復旧チェックリストについては [Gateway troubleshooting](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config)
を参照してください。

### リロードモード

| モード                 | 動作                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`**（デフォルト） | 安全な変更を即座にホット適用します。重要な変更は自動的に再起動します。                          |
| **`hot`**              | 安全な変更のみをホット適用します。再起動が必要な場合は警告を記録し、対応はあなたが行います。      |
| **`restart`**          | 安全かどうかに関係なく、config 変更ごとに Gateway を再起動します。                           |
| **`off`**              | ファイル監視を無効化します。変更は次回の手動再起動時に反映されます。                          |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ホット適用されるものと再起動が必要なもの

ほとんどのフィールドはダウンタイムなしでホット適用されます。`hybrid` モードでは、再起動必須の変更も自動処理されます。

| カテゴリ           | フィールド                                                          | 再起動が必要? |
| ------------------ | ------------------------------------------------------------------- | ------------- |
| Channels           | `channels.*`、`web`（WhatsApp）— すべての組み込みおよび Plugin channel | No            |
| Agent & models     | `agent`、`agents`、`models`、`routing`                              | No            |
| Automation         | `hooks`、`cron`、`agent.heartbeat`                                  | No            |
| Sessions & messages | `session`、`messages`                                               | No            |
| Tools & media      | `tools`、`browser`、`skills`、`mcp`、`audio`、`talk`                | No            |
| UI & misc          | `ui`、`logging`、`identity`、`bindings`                             | No            |
| Gateway server     | `gateway.*`（port、bind、auth、tailscale、TLS、HTTP）               | **Yes**       |
| Infrastructure     | `discovery`、`canvasHost`、`plugins`                                | **Yes**       |

<Note>
`gateway.reload` と `gateway.remote` は例外です — これらを変更しても **再起動はトリガーされません**。
</Note>

### リロード計画

`$include` 経由で参照されるソースファイルを編集した場合、OpenClaw は
フラット化されたインメモリビューではなく、ソース記述のレイアウトからリロード計画を立てます。
これにより、`plugins: { $include: "./plugins.json5" }` のように
単一のトップレベルセクションが独自の include ファイルにある場合でも、
ホットリロードの判断（ホット適用か再起動か）が予測可能に保たれます。ソースレイアウトが曖昧な場合、リロード計画は fail closed します。

## config RPC（プログラムによる更新）

gateway API 経由で config を書き込むツールでは、次のフローを推奨します。

- `config.schema.lookup` で 1 つのサブツリーを確認する（浅い schema ノード + 子要約）
- `config.get` で current snapshot と `hash` を取得する
- 部分更新には `config.patch` を使う（JSON merge patch: オブジェクトはマージ、`null`
  は削除、配列は置換）
- config 全体を置き換える意図がある場合のみ `config.apply` を使う
- 明示的な self-update + 再起動には `update.run` を使う

<Note>
コントロールプレーン書き込み（`config.apply`、`config.patch`、`update.run`）は、
`deviceId+clientIp` ごとに 60 秒あたり 3 リクエストにレート制限されます。
再起動リクエストは集約された後、再起動サイクル間に 30 秒のクールダウンが課されます。
</Note>

部分パッチの例:

```bash
openclaw gateway call config.get --params '{}'  # payload.hash を取得
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` と `config.patch` はどちらも `raw`、`baseHash`、`sessionKey`、
`note`、`restartDelayMs` を受け付けます。config がすでに存在する場合、
`baseHash` は両メソッドで必須です。

## 環境変数

OpenClaw は、親プロセスに加えて次の env var を読み取ります。

- 現在の作業ディレクトリの `.env`（存在する場合）
- `~/.openclaw/.env`（グローバルフォールバック）

どちらのファイルも既存の env var を上書きしません。config 内でインライン env var を設定することもできます。

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env のインポート（任意）">
  有効にすると、期待されるキーが設定されていない場合に、OpenClaw はログインシェルを実行して不足しているキーだけをインポートします。

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env var 相当: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="config 値内での env var 置換">
  任意の config 文字列値で `${VAR_NAME}` を使って env var を参照できます。

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

ルール:

- 一致するのは大文字名のみ: `[A-Z_][A-Z0-9_]*`
- 欠落または空の var は読み込み時エラーになります
- リテラル出力には `$${VAR}` でエスケープします
- `$include` ファイル内でも機能します
- インライン置換: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef（env、file、exec）">
  SecretRef オブジェクトをサポートするフィールドでは、次のように使えます。

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

SecretRef の詳細（`env`/`file`/`exec` 用の `secrets.providers` を含む）は [Secrets Management](/ja-JP/gateway/secrets) にあります。
サポートされる認証情報パスは [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface) に一覧があります。
</Accordion>

優先順位とソースの詳細は [Environment](/ja-JP/help/environment) を参照してください。

## 完全なリファレンス

完全なフィールド別リファレンスについては、**[Configuration Reference](/ja-JP/gateway/configuration-reference)** を参照してください。

---

_関連: [Configuration Examples](/ja-JP/gateway/configuration-examples) · [Configuration Reference](/ja-JP/gateway/configuration-reference) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [Configuration Reference](/ja-JP/gateway/configuration-reference)
- [Configuration Examples](/ja-JP/gateway/configuration-examples)
- [Gateway runbook](/ja-JP/gateway)
