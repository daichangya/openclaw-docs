---
read_when:
    - OpenClaw を初めて設定する
    - 一般的な設定パターンを探す
    - 特定の設定セクションに移動する
summary: '設定概要: 一般的なタスク、クイックセットアップ、完全なリファレンスへのリンク'
title: 設定
x-i18n:
    generated_at: "2026-04-26T11:29:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc1148b93c00d30e34aad0ffb5e1d4dae5438a195a531f5247bbc9a261142350
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw は、`~/.openclaw/openclaw.json` からオプションの <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> 設定を読み込みます。
有効な設定パスは通常ファイルである必要があります。シンボリックリンクされた `openclaw.json`
レイアウトは、OpenClaw による書き込みではサポートされません。アトミック書き込みによって
シンボリックリンクを維持せず、そのパスが置き換えられる場合があります。設定をデフォルトの
state ディレクトリ外に置く場合は、`OPENCLAW_CONFIG_PATH` を実際のファイルに直接向けてください。

ファイルが存在しない場合、OpenClaw は安全なデフォルトを使用します。設定を追加する一般的な理由:

- チャネルを接続し、誰がボットにメッセージできるかを制御する
- モデル、ツール、サンドボックス化、または自動化（Cron、hooks）を設定する
- セッション、メディア、ネットワーク、または UI を調整する

利用可能なすべてのフィールドについては、[完全なリファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

エージェントと自動化は、設定を編集する前に、正確なフィールドレベルの
ドキュメントについて `config.schema.lookup` を使用するべきです。このページはタスク指向のガイダンス用であり、
より広いフィールドマップとデフォルトについては [設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

<Tip>
**設定が初めてですか?** 対話型セットアップには `openclaw onboard` から始めるか、完全なコピーペースト用設定を載せた [Configuration Examples](/ja-JP/gateway/configuration-examples) ガイドを確認してください。
</Tip>

## 最小設定

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## 設定の編集

<Tabs>
  <Tab title="対話型ウィザード">
    ```bash
    openclaw onboard       # 完全なオンボーディングフロー
    openclaw configure     # 設定ウィザード
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
    Control UI は、利用可能な場合はフィールドの
    `title` / `description` ドキュメントメタデータに加えて Plugin とチャネルのスキーマも含む、ライブ設定スキーマからフォームをレンダリングし、
    逃げ道として **Raw JSON** エディターも提供します。ドリルダウン
    UI やその他のツール向けに、Gateway は `config.schema.lookup` も公開しており、
    1 つのパスに限定されたスキーマノードと、その直下の子サマリーを取得できます。
  </Tab>
  <Tab title="直接編集">
    `~/.openclaw/openclaw.json` を直接編集します。Gateway はファイルを監視し、自動的に変更を適用します（[ホットリロード](#config-hot-reload) を参照）。
  </Tab>
</Tabs>

## 厳密な検証

<Warning>
OpenClaw は、スキーマに完全一致する設定のみを受け付けます。不明なキー、不正な型、無効な値があると、Gateway は**起動を拒否**します。ルートレベルの唯一の例外は `$schema`（文字列）で、エディターが JSON Schema メタデータを関連付けられるようにするためのものです。
</Warning>

`openclaw config schema` は、Control UI
と検証で使用される正規の JSON Schema を出力します。`config.schema.lookup` は、ドリルダウンツール向けに単一のパスに限定されたノードと
子サマリーを取得します。フィールドの `title`/`description` ドキュメントメタデータは、
ネストしたオブジェクト、ワイルドカード（`*`）、配列項目（`[]`）、`anyOf`/
`oneOf`/`allOf` 分岐にも引き継がれます。ランタイムの Plugin およびチャネルスキーマは、
manifest registry がロードされるとマージされます。

検証に失敗した場合:

- Gateway は起動しません
- 診断コマンドのみ動作します（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 正確な問題を確認するには `openclaw doctor` を実行します
- 修復を適用するには `openclaw doctor --fix`（または `--yes`）を実行します

Gateway は、起動に成功するたびに信頼済みの last-known-good コピーを保持します。
その後 `openclaw.json` の検証に失敗した場合（または `gateway.mode` が消えた場合、急激に
縮小した場合、あるいは先頭に不要なログ行が付加された場合）、OpenClaw は壊れたファイルを
`.clobbered.*` として保存し、last-known-good コピーを復元し、
復旧理由をログに記録します。次のエージェントターンでもシステムイベント警告が渡されるため、
メインエージェントが復元された設定を盲目的に再書き換えすることを防げます。
候補に `***` のような秘匿済みシークレットプレースホルダーが含まれている場合、
last-known-good への昇格はスキップされます。
すべての検証問題が `plugins.entries.<id>...` に限定されている場合、OpenClaw
はファイル全体の復旧を行いません。現在の設定を有効なまま維持し、
Plugin ローカルな失敗を表面化させるため、Plugin スキーマまたはホストバージョン不一致によって
無関係なユーザー設定がロールバックされることはありません。

## 一般的なタスク

<AccordionGroup>
  <Accordion title="チャネルを設定する（WhatsApp、Telegram、Discord など）">
    各チャネルには `channels.<provider>` の下に独自の設定セクションがあります。セットアップ手順は各専用チャネルページを参照してください:

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

    - `agents.defaults.models` はモデルカタログを定義し、`/model` の許可リストとしても機能します。
    - 既存モデルを削除せずに許可リストエントリーを追加するには、`openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。エントリーを削除してしまう通常の置換は、`--replace` を渡さない限り拒否されます。
    - モデル参照は `provider/model` 形式を使用します（例: `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` は transcript/tool 画像の縮小サイズを制御します（デフォルト `1200`）。値を小さくすると、通常はスクリーンショットが多い実行で vision token 使用量を減らせます。
    - チャットでのモデル切り替えについては [Models CLI](/ja-JP/concepts/models)、認証ローテーションとフォールバック動作については [Model Failover](/ja-JP/concepts/model-failover) を参照してください。
    - カスタム/セルフホスト型プロバイダーについては、リファレンス内の [Custom providers](/ja-JP/gateway/config-tools#custom-providers-and-base-urls) を参照してください。

  </Accordion>

  <Accordion title="誰がボットにメッセージできるかを制御する">
    DM アクセスは `dmPolicy` を通じてチャネルごとに制御されます:

    - `"pairing"`（デフォルト）: 未知の送信者には、一度きりのペアリングコードが送られ、承認が必要になります
    - `"allowlist"`: `allowFrom`（またはペア済み許可ストア）にいる送信者のみ
    - `"open"`: すべての受信 DM を許可します（`allowFrom: ["*"]` が必要）
    - `"disabled"`: すべての DM を無視します

    グループでは、`groupPolicy` + `groupAllowFrom` またはチャネル固有の許可リストを使用します。

    チャネルごとの詳細は [完全なリファレンス](/ja-JP/gateway/config-channels#dm-and-group-access) を参照してください。

  </Accordion>

  <Accordion title="グループチャットのメンションゲートを設定する">
    グループメッセージはデフォルトで**メンション必須**です。パターンをエージェントごとに設定します:

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

    - **メタデータメンション**: ネイティブな @-mentions（WhatsApp のタップしてメンション、Telegram の @bot など）
    - **テキストパターン**: `mentionPatterns` 内の安全な regex パターン
    - チャネルごとの上書きと self-chat モードについては [完全なリファレンス](/ja-JP/gateway/config-channels#group-chat-mention-gating) を参照してください。

  </Accordion>

  <Accordion title="エージェントごとに Skills を制限する">
    共有ベースラインには `agents.defaults.skills` を使用し、その後
    `agents.list[].skills` で特定エージェントを上書きします:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather を継承
          { id: "docs", skills: ["docs-search"] }, // defaults を置換
          { id: "locked-down", skills: [] }, // Skills なし
        ],
      },
    }
    ```

    - デフォルトで Skills を無制限にするには `agents.defaults.skills` を省略します。
    - defaults を継承するには `agents.list[].skills` を省略します。
    - Skills なしにするには `agents.list[].skills: []` を設定します。
    - [Skills](/ja-JP/tools/skills)、[Skills config](/ja-JP/tools/skills-config)、および
      [Configuration Reference](/ja-JP/gateway/config-agents#agents-defaults-skills) を参照してください。

  </Accordion>

  <Accordion title="Gateway のチャネル健全性監視を調整する">
    stale に見えるチャネルを Gateway がどの程度積極的に再起動するかを制御します:

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

    - 健全性監視による再起動をグローバルに無効にするには `gateway.channelHealthCheckMinutes: 0` を設定します。
    - `channelStaleEventThresholdMinutes` はチェック間隔以上であるべきです。
    - グローバル監視を無効にせずに 1 つのチャネルまたはアカウントの自動再起動を無効化するには、`channels.<provider>.healthMonitor.enabled` または `channels.<provider>.accounts.<id>.healthMonitor.enabled` を使用します。
    - 運用上のデバッグについては [Health Checks](/ja-JP/gateway/health)、すべてのフィールドについては [完全なリファレンス](/ja-JP/gateway/configuration-reference#gateway) を参照してください。

  </Accordion>

  <Accordion title="セッションとリセットを設定する">
    セッションは会話の継続性と分離を制御します:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // 複数ユーザーには推奨
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
    - `threadBindings`: スレッドに紐づくセッションルーティング用のグローバルデフォルト（Discord は `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` をサポート）。
    - スコープ、identity リンク、送信ポリシーについては [Session Management](/ja-JP/concepts/session) を参照してください。
    - すべてのフィールドについては [完全なリファレンス](/ja-JP/gateway/config-agents#session) を参照してください。

  </Accordion>

  <Accordion title="サンドボックス化を有効にする">
    エージェントセッションを分離されたサンドボックスランタイムで実行します:

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

    まずイメージを build します: `scripts/sandbox-setup.sh`

    完全なガイドは [Sandboxing](/ja-JP/gateway/sandboxing)、すべてのオプションは [完全なリファレンス](/ja-JP/gateway/config-agents#agentsdefaultssandbox) を参照してください。

  </Accordion>

  <Accordion title="公式 iOS ビルド向けに relay ベースの push を有効にする">
    relay ベースの push は `openclaw.json` で設定します。

    Gateway 設定でこれを設定します:

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

    CLI での同等設定:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    これで行われること:

    - Gateway が外部 relay 経由で `push.test`、wake nudges、reconnect wakes を送信できるようになります。
    - ペアリング済み iOS アプリから転送された registration スコープの send grant を使用します。Gateway にデプロイ全体向け relay token は不要です。
    - 各 relay ベース registration を、iOS アプリがペアリングした Gateway identity に結び付けるため、別の Gateway が保存済み registration を再利用することはできません。
    - ローカル/手動 iOS ビルドは引き続き直接 APNs を使用します。relay ベースの送信が適用されるのは、relay 経由で登録された公式配布ビルドのみです。
    - registration と送信トラフィックが同じ relay デプロイメントに到達するよう、公式/TestFlight iOS ビルドに組み込まれた relay base URL と一致している必要があります。

    エンドツーエンドフロー:

    1. 同じ relay base URL でコンパイルされた公式/TestFlight iOS ビルドをインストールします。
    2. Gateway で `gateway.push.apns.relay.baseUrl` を設定します。
    3. iOS アプリを Gateway にペアリングし、node セッションと operator セッションの両方を接続させます。
    4. iOS アプリは Gateway identity を取得し、App Attest とアプリレシートを使って relay に登録し、その後 relay ベースの `push.apns.register` ペイロードをペアリング済み Gateway に公開します。
    5. Gateway は relay handle と send grant を保存し、それらを `push.test`、wake nudges、reconnect wakes に使用します。

    運用上の注意:

    - iOS アプリを別の Gateway に切り替える場合は、アプリを再接続して、その Gateway に紐付いた新しい relay registration を公開できるようにしてください。
    - 別の relay デプロイメントを指す新しい iOS ビルドを配布した場合、アプリは古い relay origin を再利用せず、キャッシュされた relay registration を更新します。

    互換性に関する注意:

    - `OPENCLAW_APNS_RELAY_BASE_URL` と `OPENCLAW_APNS_RELAY_TIMEOUT_MS` は、一時的な環境変数上書きとして引き続き動作します。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` は引き続き loopback 専用の開発用 escape hatch です。HTTP relay URL を設定に永続化しないでください。

    エンドツーエンドフローについては [iOS App](/ja-JP/platforms/ios#relay-backed-push-for-official-builds)、relay のセキュリティモデルについては [Authentication and trust flow](/ja-JP/platforms/ios#authentication-and-trust-flow) を参照してください。

  </Accordion>

  <Accordion title="Heartbeat（定期チェックイン）を設定する">
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
    - `target`: `last` | `none` | `<channel-id>`（例: `discord`、`matrix`、`telegram`、`whatsapp`）
    - `directPolicy`: DM 形式の heartbeat ターゲットに対して `allow`（デフォルト）または `block`
    - 完全なガイドは [Heartbeat](/ja-JP/gateway/heartbeat) を参照してください。

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

    - `sessionRetention`: `sessions.json` から完了済みの分離実行セッションを削除します（デフォルト `24h`。無効化するには `false`）。
    - `runLog`: サイズと保持行数で `cron/runs/<jobId>.jsonl` を削除します。
    - 機能概要と CLI 例については [Cron ジョブ](/ja-JP/automation/cron-jobs) を参照してください。

  </Accordion>

  <Accordion title="Webhook（hooks）を設定する">
    Gateway で HTTP Webhook エンドポイントを有効化します:

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

    セキュリティ上の注意:
    - すべての hook/Webhook ペイロード内容は信頼できない入力として扱ってください。
    - 専用の `hooks.token` を使用してください。共有 Gateway token を再利用しないでください。
    - Hook 認証はヘッダーのみです（`Authorization: Bearer ...` または `x-openclaw-token`）。クエリ文字列トークンは拒否されます。
    - `hooks.path` は `/` にできません。Webhook 受信は `/hooks` のような専用サブパスにしてください。
    - 厳密に限定したデバッグを行う場合を除き、unsafe-content bypass フラグ（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）は無効のままにしてください。
    - `hooks.allowRequestSessionKey` を有効にする場合は、呼び出し元が選ぶ session key を制限するために `hooks.allowedSessionKeyPrefixes` も設定してください。
    - hook 駆動のエージェントでは、強力な最新モデル階層と厳格なツールポリシー（たとえば、可能ならメッセージング専用 + サンドボックス化）を優先してください。

    すべてのマッピングオプションと Gmail 統合については [完全なリファレンス](/ja-JP/gateway/configuration-reference#hooks) を参照してください。

  </Accordion>

  <Accordion title="マルチエージェントルーティングを設定する">
    別々の workspace とセッションで複数の分離エージェントを実行します:

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

  <Accordion title="設定を複数ファイルに分割する（$include）">
    大きな設定を整理するには `$include` を使います:

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

    - **単一ファイル**: そのオブジェクト全体を置き換えます
    - **ファイル配列**: 順番に deep-merge されます（後勝ち）
    - **兄弟キー**: include の後でマージされます（include された値を上書き）
    - **ネストした include**: 最大 10 階層までサポート
    - **相対パス**: include 元ファイルを基準に解決されます
    - **OpenClaw 所有の書き込み**: `plugins: { $include: "./plugins.json5" }` のような単一ファイル include によって支えられているトップレベルセクション 1 つだけを変更する書き込みでは、OpenClaw はその include 先ファイルを更新し、`openclaw.json` はそのまま維持します
    - **サポートされない write-through**: ルート include、include 配列、兄弟上書き付き include は、OpenClaw 所有の書き込みでは設定をフラット化せず fail closed します
    - **エラーハンドリング**: ファイル欠落、パースエラー、循環 include に対して明確なエラーを出します

  </Accordion>
</AccordionGroup>

## 設定のホットリロード

Gateway は `~/.openclaw/openclaw.json` を監視し、変更を自動的に適用します — ほとんどの設定では手動再起動は不要です。

直接のファイル編集は、検証に通るまでは信頼されないものとして扱われます。watcher は
エディターの一時書き込み/rename の揺れが落ち着くのを待ち、最終ファイルを読み取り、
無効な外部編集は last-known-good 設定を復元して拒否します。OpenClaw 所有の
設定書き込みでも、書き込み前に同じスキーマゲートが使われます。`gateway.mode` の削除や
ファイルサイズを半分超縮小するような破壊的 clobber は拒否され、
確認用に `.rejected.*` として保存されます。

Plugin ローカルな検証失敗は例外です: すべての問題が
`plugins.entries.<id>...` 配下にある場合、リロードは現在の設定を維持し、
`.last-good` を復元する代わりに Plugin 問題を報告します。

ログに `Config auto-restored from last-known-good` または
`config reload restored last-known-good config` が表示された場合は、
`openclaw.json` の隣にある対応する `.clobbered.*` ファイルを確認し、
拒否されたペイロードを修正した後で `openclaw config validate` を実行してください。
復旧チェックリストについては [Gateway troubleshooting](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config)
を参照してください。

### リロードモード

| Mode                   | Behavior                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（デフォルト） | 安全な変更は即座にホット適用します。重要な変更は自動的に再起動します。                 |
| **`hot`**              | 安全な変更のみをホット適用します。再起動が必要な場合は警告をログに出します — 対応は手動です。 |
| **`restart`**          | 安全かどうかにかかわらず、設定変更ごとに Gateway を再起動します。                      |
| **`off`**              | ファイル監視を無効化します。変更は次の手動再起動時に反映されます。                      |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ホット適用されるものと再起動が必要なもの

ほとんどのフィールドはダウンタイムなしでホット適用されます。`hybrid` モードでは、再起動が必要な変更は自動処理されます。

| Category            | Fields                                                            | Restart needed? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Channels            | `channels.*`、`web`（WhatsApp）— すべての組み込みおよび Plugin チャネル | いいえ          |
| Agent & models      | `agent`、`agents`、`models`、`routing`                            | いいえ          |
| Automation          | `hooks`、`cron`、`agent.heartbeat`                                | いいえ          |
| Sessions & messages | `session`、`messages`                                             | いいえ          |
| Tools & media       | `tools`、`browser`、`skills`、`mcp`、`audio`、`talk`              | いいえ          |
| UI & misc           | `ui`、`logging`、`identity`、`bindings`                           | いいえ          |
| Gateway server      | `gateway.*`（port、bind、auth、tailscale、TLS、HTTP）             | **はい**        |
| Infrastructure      | `discovery`、`canvasHost`、`plugins`                              | **はい**        |

<Note>
`gateway.reload` と `gateway.remote` は例外で、これらを変更しても**再起動は発生しません**。
</Note>

### リロード計画

`$include` を通じて参照されているソースファイルを編集すると、OpenClaw は
フラット化されたインメモリビューではなく、ソース作成時のレイアウトからリロード計画を立てます。
これにより、`plugins: { $include: "./plugins.json5" }` のように
単一のトップレベルセクションが独自の include ファイルにある場合でも、
ホットリロードの判断（ホット適用か再起動か）を予測可能に保てます。ソースレイアウトが曖昧な場合、
リロード計画は fail closed します。

## 設定 RPC（プログラムによる更新）

Gateway API 経由で設定を書き込むツールでは、次のフローを推奨します:

- 1 つのサブツリーを調べるには `config.schema.lookup`（浅いスキーマノード + 子サマリー）
- 現在のスナップショットと `hash` を取得するには `config.get`
- 部分更新には `config.patch`（JSON merge patch: オブジェクトはマージ、`null` は削除、配列は置換）
- 設定全体を置き換える意図がある場合にのみ `config.apply`
- 明示的な self-update + restart には `update.run`

エージェントは、正確なフィールドレベルのドキュメントと制約を得る最初の手段として
`config.schema.lookup` を扱うべきです。より広い設定マップ、デフォルト、または専用
サブシステムリファレンスへのリンクが必要な場合は [設定リファレンス](/ja-JP/gateway/configuration-reference)
を使用してください。

<Note>
control-plane 書き込み（`config.apply`、`config.patch`、`update.run`）は、
`deviceId+clientIp` ごとに 60 秒あたり 3 リクエストに制限されています。
再起動リクエストは集約され、その後、再起動サイクル間に 30 秒のクールダウンが適用されます。
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
`note`、`restartDelayMs` を受け付けます。設定がすでに存在する場合、
両メソッドとも `baseHash` が必須です。

## 環境変数

OpenClaw は親プロセスから環境変数を読み込むほか、次も読み込みます:

- 現在の作業ディレクトリの `.env`（存在する場合）
- `~/.openclaw/.env`（グローバルフォールバック）

どちらのファイルも既存の環境変数を上書きしません。設定内でインライン環境変数を設定することもできます:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="シェル環境変数のインポート（任意）">
  これを有効にし、期待するキーが設定されていない場合、OpenClaw はログインシェルを実行し、不足しているキーだけをインポートします:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

環境変数での同等設定: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="設定値での環境変数置換">
  任意の設定文字列値で `${VAR_NAME}` を使って環境変数を参照できます:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

ルール:

- 一致するのは大文字名のみ: `[A-Z_][A-Z0-9_]*`
- 不足している/空の変数は、読み込み時にエラーになります
- リテラル出力にするには `$${VAR}` でエスケープします
- `$include` ファイル内でも動作します
- インライン置換: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs（env、file、exec）">
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

SecretRef の詳細（`env`/`file`/`exec` 用の `secrets.providers` を含む）は [Secrets Management](/ja-JP/gateway/secrets) にあります。
サポートされる認証情報パスは [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface) に一覧があります。
</Accordion>

完全な優先順位とソースについては [Environment](/ja-JP/help/environment) を参照してください。

## 完全なリファレンス

完全なフィールド単位のリファレンスについては、**[Configuration Reference](/ja-JP/gateway/configuration-reference)** を参照してください。

---

_関連: [Configuration Examples](/ja-JP/gateway/configuration-examples) · [Configuration Reference](/ja-JP/gateway/configuration-reference) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [設定例](/ja-JP/gateway/configuration-examples)
- [Gateway ランブック](/ja-JP/gateway)
