---
read_when:
    - OpenClawを初めてセットアップすること
    - 一般的な設定パターンを探していること
    - 特定の設定セクションに移動すること
summary: '設定の概要: よくあるタスク、クイックセットアップ、完全なリファレンスへのリンク'
title: 設定
x-i18n:
    generated_at: "2026-04-23T04:45:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39a9f521b124026a32064464b6d0ce1f93597c523df6839fde37d61e597bcce7
    source_path: gateway/configuration.md
    workflow: 15
---

# 設定

OpenClaw は、`~/.openclaw/openclaw.json` から任意の <Tooltip tip="JSON5はコメントと末尾カンマをサポートします">**JSON5**</Tooltip> 設定を読み込みます。
有効な設定パスは通常ファイルである必要があります。シンボリックリンクされた `openclaw.json`
レイアウトは、OpenClaw が所有する書き込みではサポートされません。アトミック書き込みによって、
シンボリックリンクを保持するのではなく、そのパスが置き換えられる場合があります。設定を
デフォルトの状態ディレクトリ外に保持する場合は、`OPENCLAW_CONFIG_PATH` を実際のファイルに直接向けてください。

ファイルが存在しない場合、OpenClaw は安全なデフォルトを使用します。設定を追加する一般的な理由は次のとおりです。

- チャネルを接続し、誰がボットにメッセージを送れるかを制御する
- モデル、ツール、サンドボックス化、自動化（Cron、Hooks）を設定する
- セッション、メディア、ネットワーキング、または UI を調整する

使用可能なすべてのフィールドについては、[完全なリファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

<Tip>
**設定が初めてですか？** 対話型セットアップには `openclaw onboard` から始めるか、完全にコピー＆ペーストできる設定については [Configuration Examples](/ja-JP/gateway/configuration-examples) ガイドを確認してください。
</Tip>

## 最小構成

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
    Control UI は、利用可能な場合は field の
    `title` / `description` ドキュメントメタデータに加えて、plugin と channel のスキーマも含めて、
    ライブ設定スキーマからフォームをレンダリングし、エスケープハッチとして **Raw JSON** エディターを提供します。詳細表示
    UI やその他のツール向けに、gateway は `config.schema.lookup` も公開しており、
    パスにスコープされた1つのスキーマノードと、その直下の子のサマリーを取得できます。
  </Tab>
  <Tab title="直接編集">
    `~/.openclaw/openclaw.json` を直接編集します。Gateway はファイルを監視し、変更を自動的に適用します（[ホットリロード](#config-hot-reload) を参照）。
  </Tab>
</Tabs>

## 厳密な検証

<Warning>
OpenClaw は、スキーマに完全に一致する設定のみを受け入れます。不明なキー、不正な型、無効な値があると、Gateway は**起動を拒否**します。ルートレベルで唯一の例外は `$schema`（文字列）で、エディターが JSON Schema メタデータを関連付けられるようにするためのものです。
</Warning>

スキーマツールに関する注意:

- `openclaw config schema` は、Control UI と
  設定検証で使用されるのと同じ JSON Schema ファミリーを出力します。
- そのスキーマ出力を、`openclaw.json` の正規の機械可読コントラクトとして扱ってください。この概要と
  設定リファレンスは、その要約です。
- field の `title` と `description` の値は、エディターとフォームツール向けに
  スキーマ出力へ引き継がれます。
- ネストしたオブジェクト、ワイルドカード（`*`）、および配列項目（`[]`）のエントリーは、
  一致する field のドキュメントが存在する場合、同じドキュメントメタデータを継承します。
- `anyOf` / `oneOf` / `allOf` の合成ブランチも同じドキュメント
  メタデータを継承するため、ユニオン/インターセクションの各バリアントでも同じ field ヘルプが維持されます。
- `config.schema.lookup` は、1つの正規化された設定パスと、浅い
  スキーマノード（`title`、`description`、`type`、`enum`、`const`、一般的な境界、
  および類似の検証フィールド）、一致する UI ヒントメタデータ、および詳細表示ツール向けの
  直下の子サマリーを返します。
- gateway が現在のマニフェストレジストリを読み込める場合は、ランタイムの plugin/channel スキーマも統合されます。
- `pnpm config:docs:check` は、ドキュメント向け設定ベースライン
  アーティファクトと現在のスキーマ表面とのずれを検出します。

検証に失敗した場合:

- Gateway は起動しません
- 診断コマンドのみが動作します（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 正確な問題を確認するには `openclaw doctor` を実行します
- 修復を適用するには `openclaw doctor --fix`（または `--yes`）を実行します

Gateway はまた、起動成功後に信頼済みの last-known-good コピーを保持します。
`openclaw.json` が後で OpenClaw の外部で変更され、検証に通らなくなった場合、
起動時およびホットリロード時には、その壊れたファイルをタイムスタンプ付きの `.clobbered.*` スナップショットとして保持し、
last-known-good コピーを復元し、復旧理由を含む目立つ警告をログに出力します。
起動時の読み取り復旧では、last-known-good
コピーにそれらのフィールドがあった場合、急激なサイズ減少、設定メタデータの欠落、および
`gateway.mode` の欠落も重大な clobber シグネチャとして扱います。
本来は有効な JSON 設定の先頭に、誤って status/log 行が付加された場合、
gateway の起動時および `openclaw doctor --fix` は、そのプレフィックスを削除し、
汚染されたファイルを `.clobbered.*` として保持して、復旧された
JSON で継続できます。
次のメインエージェントターンでも、設定が復元され、無条件に再書き込みしてはならないことを伝える
system-event 警告を受け取ります。last-known-good の昇格は、
検証済み起動後と受理されたホットリロード後に更新されます。これには、
永続化されたファイルハッシュが受理済み書き込みと一致している OpenClaw 所有の設定書き込みも含まれます。
候補に `***` や短縮されたトークン値などの
秘匿されたシークレットプレースホルダーが含まれている場合は、昇格はスキップされます。

## よくあるタスク

<AccordionGroup>
  <Accordion title="チャネルをセットアップする（WhatsApp、Telegram、Discord など）">
    各チャネルには、`channels.<provider>` の下に専用の設定セクションがあります。セットアップ手順は各専用チャネルページを参照してください。

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

    すべてのチャネルは同じ DM ポリシーパターンを共有します。

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="モデルを選択して設定する">
    主モデルと任意のフォールバックを設定します。

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

    - `agents.defaults.models` はモデルカタログを定義し、`/model` の allowlist としても機能します。
    - 既存のモデルを削除せずに allowlist エントリーを追加するには、`openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。エントリーを削除する通常の置換は、`--replace` を渡さない限り拒否されます。
    - モデル参照は `provider/model` 形式を使用します（例: `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` は、トランスクリプト/ツール画像のダウンスケーリングを制御します（デフォルト `1200`）。通常、値を低くすると、スクリーンショットの多い実行で vision-token 使用量が減ります。
    - チャットでのモデル切り替えについては [Models CLI](/ja-JP/concepts/models) を、auth ローテーションとフォールバック動作については [Model Failover](/ja-JP/concepts/model-failover) を参照してください。
    - カスタム/セルフホスト provider については、リファレンス内の [Custom providers](/ja-JP/gateway/configuration-reference#custom-providers-and-base-urls) を参照してください。

  </Accordion>

  <Accordion title="誰がボットにメッセージできるかを制御する">
    DM アクセスは、チャネルごとに `dmPolicy` で制御されます。

    - `"pairing"`（デフォルト）: 未知の送信者には、承認用の1回限りのペアリングコードが送られます
    - `"allowlist"`: `allowFrom` 内の送信者（またはペア済み allow ストア）のみ
    - `"open"`: すべての受信 DM を許可します（`allowFrom: ["*"]` が必要）
    - `"disabled"`: すべての DM を無視します

    グループについては、`groupPolicy` + `groupAllowFrom` またはチャネル固有の allowlist を使用します。

    チャネルごとの詳細については、[完全なリファレンス](/ja-JP/gateway/configuration-reference#dm-and-group-access) を参照してください。

  </Accordion>

  <Accordion title="グループチャットのメンションゲーティングを設定する">
    グループメッセージはデフォルトで**メンション必須**です。エージェントごとにパターンを設定します。

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

    - **メタデータメンション**: ネイティブの @メンション（WhatsApp のタップしてメンション、Telegram の @bot など）
    - **テキストパターン**: `mentionPatterns` 内の安全な regex パターン
    - チャネルごとの上書きとセルフチャットモードについては、[完全なリファレンス](/ja-JP/gateway/configuration-reference#group-chat-mention-gating) を参照してください。

  </Accordion>

  <Accordion title="エージェントごとに Skills を制限する">
    共有ベースラインには `agents.defaults.skills` を使用し、その後、特定の
    エージェントを `agents.list[].skills` で上書きします。

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather を継承
          { id: "docs", skills: ["docs-search"] }, // デフォルトを置き換える
          { id: "locked-down", skills: [] }, // Skills なし
        ],
      },
    }
    ```

    - デフォルトで Skills を無制限にするには、`agents.defaults.skills` を省略します。
    - デフォルトを継承するには、`agents.list[].skills` を省略します。
    - Skills をなしにするには、`agents.list[].skills: []` を設定します。
    - [Skills](/ja-JP/tools/skills)、[Skills config](/ja-JP/tools/skills-config)、および
      [Configuration Reference](/ja-JP/gateway/configuration-reference#agents-defaults-skills) を参照してください。

  </Accordion>

  <Accordion title="gateway のチャネルヘルス監視を調整する">
    停滞しているように見えるチャネルを、gateway がどれだけ積極的に再起動するかを制御します。

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

    - グローバルにヘルス監視再起動を無効化するには、`gateway.channelHealthCheckMinutes: 0` を設定します。
    - `channelStaleEventThresholdMinutes` は、チェック間隔以上である必要があります。
    - グローバルモニターを無効化せずに、1つのチャネルまたはアカウントだけの自動再起動を無効化するには、`channels.<provider>.healthMonitor.enabled` または `channels.<provider>.accounts.<id>.healthMonitor.enabled` を使用します。
    - 運用上のデバッグについては [Health Checks](/ja-JP/gateway/health) を、すべてのフィールドについては [完全なリファレンス](/ja-JP/gateway/configuration-reference#gateway) を参照してください。

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

    - `dmScope`: `main`（共有） | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: スレッドに紐づくセッションルーティングのグローバルデフォルトです（Discord は `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` をサポートします）。
    - スコープ、ID リンク、送信ポリシーについては、[Session Management](/ja-JP/concepts/session) を参照してください。
    - すべてのフィールドについては、[完全なリファレンス](/ja-JP/gateway/configuration-reference#session) を参照してください。

  </Accordion>

  <Accordion title="サンドボックス化を有効にする">
    分離されたサンドボックスランタイムでエージェントセッションを実行します。

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

    完全なガイドについては [Sandboxing](/ja-JP/gateway/sandboxing) を、すべてのオプションについては [完全なリファレンス](/ja-JP/gateway/configuration-reference#agentsdefaultssandbox) を参照してください。

  </Accordion>

  <Accordion title="公式 iOS ビルド向けに relay-backed push を有効にする">
    relay-backed push は `openclaw.json` で設定します。

    gateway 設定で次を設定します。

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

    対応する CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    これにより次のことが行われます。

    - gateway が外部 relay を通じて `push.test`、wake nudges、reconnect wakes を送信できるようになります。
    - ペアリングされた iOS アプリから転送される、登録スコープの send grant を使用します。gateway にデプロイメント全体の relay トークンは必要ありません。
    - 各 relay-backed 登録を、iOS アプリがペアリングした gateway ID に結び付けるため、別の gateway が保存済み登録を再利用できません。
    - ローカル/手動の iOS ビルドは直接 APNs のまま維持されます。relay-backed 送信は、relay を通じて登録された公式配布ビルドにのみ適用されます。
    - 登録トラフィックと送信トラフィックが同じ relay デプロイメントに到達するよう、公式/TestFlight iOS ビルドに埋め込まれた relay base URL と一致している必要があります。

    エンドツーエンドのフロー:

    1. 同じ relay base URL でコンパイルされた公式/TestFlight iOS ビルドをインストールします。
    2. gateway で `gateway.push.apns.relay.baseUrl` を設定します。
    3. iOS アプリを gateway にペアリングし、node セッションと operator セッションの両方を接続します。
    4. iOS アプリは gateway ID を取得し、App Attest とアプリレシートを使って relay に登録し、その後 relay-backed の `push.apns.register` ペイロードをペアリング済み gateway に公開します。
    5. gateway は relay handle と send grant を保存し、それらを `push.test`、wake nudges、reconnect wakes に使用します。

    運用上の注意:

    - iOS アプリを別の gateway に切り替える場合は、その gateway に紐づく新しい relay 登録を公開できるよう、アプリを再接続してください。
    - 別の relay デプロイメントを指す新しい iOS ビルドを配布した場合、アプリは古い relay origin を再利用する代わりに、キャッシュされた relay 登録を更新します。

    互換性に関する注意:

    - `OPENCLAW_APNS_RELAY_BASE_URL` と `OPENCLAW_APNS_RELAY_TIMEOUT_MS` は、一時的な env 上書きとして引き続き機能します。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` は、loopback 専用の開発用エスケープハッチのままです。HTTP relay URL を設定に永続化しないでください。

    エンドツーエンドのフローについては [iOS App](/ja-JP/platforms/ios#relay-backed-push-for-official-builds) を、relay のセキュリティモデルについては [Authentication and trust flow](/ja-JP/platforms/ios#authentication-and-trust-flow) を参照してください。

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

    - `every`: 期間文字列（`30m`、`2h`）。無効にするには `0m` を設定します。
    - `target`: `last` | `none` | `<channel-id>`（例: `discord`、`matrix`、`telegram`、`whatsapp`）
    - `directPolicy`: DM 形式の heartbeat ターゲット向けに、`allow`（デフォルト）または `block`
    - 完全なガイドについては [Heartbeat](/ja-JP/gateway/heartbeat) を参照してください。

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

    - `sessionRetention`: `sessions.json` から完了済みの分離実行セッションを削除します（デフォルト `24h`。無効にするには `false` を設定）。
    - `runLog`: サイズと保持行数で `cron/runs/<jobId>.jsonl` を削減します。
    - 機能概要と CLI の例については、[Cron jobs](/ja-JP/automation/cron-jobs) を参照してください。

  </Accordion>

  <Accordion title="Webhook（Hooks）を設定する">
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
    - 専用の `hooks.token` を使用し、共有 Gateway トークンは再利用しないでください。
    - hook 認証はヘッダーのみです（`Authorization: Bearer ...` または `x-openclaw-token`）。クエリー文字列トークンは拒否されます。
    - `hooks.path` は `/` にはできません。Webhook 受信は `/hooks` のような専用サブパスにしてください。
    - 危険なコンテンツのバイパスフラグ（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）は、厳密にスコープされたデバッグを行う場合を除き、無効のままにしてください。
    - `hooks.allowRequestSessionKey` を有効にする場合は、呼び出し元が選ぶセッションキーを制限するために `hooks.allowedSessionKeyPrefixes` も設定してください。
    - hook 駆動エージェントでは、強力で現代的なモデル層と厳格なツールポリシー（たとえば、可能であればメッセージング専用 + サンドボックス化）を優先してください。

    すべてのマッピングオプションと Gmail 統合については、[完全なリファレンス](/ja-JP/gateway/configuration-reference#hooks) を参照してください。

  </Accordion>

  <Accordion title="マルチエージェントルーティングを設定する">
    個別のワークスペースとセッションを持つ複数の分離エージェントを実行します。

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

    バインディングルールとエージェントごとのアクセスプロファイルについては、[Multi-Agent](/ja-JP/concepts/multi-agent) と [完全なリファレンス](/ja-JP/gateway/configuration-reference#multi-agent-routing) を参照してください。

  </Accordion>

  <Accordion title="設定を複数ファイルに分割する（$include）">
    大きな設定を整理するには `$include` を使用します。

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
    - **ファイル配列**: 順番にディープマージされます（後勝ち）
    - **兄弟キー**: include の後にマージされます（include された値を上書き）
    - **ネストした include**: 最大10階層までサポート
    - **相対パス**: include 元のファイルを基準に解決されます
    - **OpenClaw 所有の書き込み**: `plugins: { $include: "./plugins.json5" }` のような単一ファイル include によって支えられている1つのトップレベルセクションだけが変更された場合、
      OpenClaw はその include 先ファイルを更新し、`openclaw.json` はそのまま残します
    - **未サポートの書き込みスルー**: ルート include、include 配列、および
      兄弟上書きを伴う include は、設定をフラット化する代わりに
      OpenClaw 所有の書き込みで closed-fail します
    - **エラーハンドリング**: ファイル欠落、パースエラー、循環 include に対して明確なエラーを返します

  </Accordion>
</AccordionGroup>

## 設定のホットリロード

Gateway は `~/.openclaw/openclaw.json` を監視し、変更を自動的に適用します。ほとんどの設定では手動再起動は不要です。

直接のファイル編集は、検証に通るまで信頼されないものとして扱われます。watcher は
エディターの一時書き込み/リネームの揺れが落ち着くのを待ち、最終ファイルを読み込み、
無効な外部編集は last-known-good 設定を復元して拒否します。OpenClaw 所有の
設定書き込みも、書き込み前に同じスキーマゲートを使用します。`gateway.mode` の削除や
ファイルサイズが半分以上縮むといった破壊的な clobber は拒否され、
確認用に `.rejected.*` として保存されます。

ログに `Config auto-restored from last-known-good` または
`config reload restored last-known-good config` と表示された場合は、`openclaw.json` の隣にある
対応する `.clobbered.*` ファイルを確認し、拒否されたペイロードを修正してから
`openclaw config validate` を実行してください。復旧チェックリストについては、[Gateway troubleshooting](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config)
を参照してください。

### リロードモード

| モード | 動作 |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（デフォルト） | 安全な変更を即座にホット適用します。重要な変更では自動的に再起動します。 |
| **`hot`** | 安全な変更のみをホット適用します。再起動が必要な場合は警告をログに出します。対応は自分で行います。 |
| **`restart`** | 安全かどうかに関係なく、任意の設定変更で Gateway を再起動します。 |
| **`off`** | ファイル監視を無効にします。変更は次回の手動再起動時に反映されます。 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ホット適用されるものと再起動が必要なもの

ほとんどのフィールドはダウンタイムなしでホット適用されます。`hybrid` モードでは、再起動が必要な変更は自動的に処理されます。

| カテゴリー | フィールド | 再起動が必要？ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| チャネル | `channels.*`, `web`（WhatsApp）— すべての組み込みチャネルと plugin チャネル | いいえ |
| エージェントとモデル | `agent`, `agents`, `models`, `routing` | いいえ |
| 自動化 | `hooks`, `cron`, `agent.heartbeat` | いいえ |
| セッションとメッセージ | `session`, `messages` | いいえ |
| ツールとメディア | `tools`, `browser`, `skills`, `audio`, `talk` | いいえ |
| UI とその他 | `ui`, `logging`, `identity`, `bindings` | いいえ |
| Gateway サーバー | `gateway.*`（port, bind, auth, tailscale, TLS, HTTP） | **はい** |
| インフラストラクチャ | `discovery`, `canvasHost`, `plugins` | **はい** |

<Note>
`gateway.reload` と `gateway.remote` は例外です。これらの変更では**再起動は発生しません**。
</Note>

## 設定 RPC（プログラムによる更新）

<Note>
コントロールプレーン書き込み RPC（`config.apply`, `config.patch`, `update.run`）は、`deviceId+clientIp` ごとに **60秒あたり3リクエスト** にレート制限されています。制限された場合、RPC は `retryAfterMs` を付けて `UNAVAILABLE` を返します。
</Note>

安全な/デフォルトのフロー:

- `config.schema.lookup`: 浅い
  スキーマノード、一致したヒントメタデータ、および直下の子サマリーを使って、1つのパススコープ付き設定サブツリーを調べます
- `config.get`: 現在のスナップショット + ハッシュを取得します
- `config.patch`: 推奨される部分更新パスです
- `config.apply`: 完全設定の置換専用です
- `update.run`: 明示的な自己更新 + 再起動です

設定全体を置き換えるのでない場合は、`config.schema.lookup`
の後に `config.patch` を使うことを推奨します。

<AccordionGroup>
  <Accordion title="config.apply（完全置換）">
    完全設定を検証して書き込み、1ステップで Gateway を再起動します。

    <Warning>
    `config.apply` は**設定全体**を置き換えます。部分更新には `config.patch` を、単一キーには `openclaw config set` を使用してください。
    </Warning>

    パラメータ:

    - `raw`（string）— 設定全体の JSON5 ペイロード
    - `baseHash`（任意）— `config.get` からの設定ハッシュ（設定が存在する場合は必須）
    - `sessionKey`（任意）— 再起動後のウェイクアップ ping 用セッションキー
    - `note`（任意）— 再起動センチネル用のメモ
    - `restartDelayMs`（任意）— 再起動前の遅延（デフォルト 2000）

    再起動リクエストは、すでに保留中/進行中のものがある間は統合され、再起動サイクル間には30秒のクールダウンが適用されます。

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
    部分更新を既存の設定にマージします（JSON merge patch セマンティクス）:

    - オブジェクトは再帰的にマージされます
    - `null` はキーを削除します
    - 配列は置き換えられます

    パラメータ:

    - `raw`（string）— 変更するキーだけを含む JSON5
    - `baseHash`（必須）— `config.get` からの設定ハッシュ
    - `sessionKey`、`note`、`restartDelayMs` — `config.apply` と同じです

    再起動動作は `config.apply` と同じです。保留中の再起動は統合され、再起動サイクル間には30秒のクールダウンがあります。

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## 環境変数

OpenClaw は、親プロセスからの env var に加えて、次も読み込みます。

- カレントワーキングディレクトリの `.env`（存在する場合）
- `~/.openclaw/.env`（グローバルフォールバック）

どちらのファイルも、既存の env var を上書きしません。設定内でインライン env var を設定することもできます。

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="シェル env のインポート（任意）">
  有効化されていて、期待されるキーが設定されていない場合、OpenClaw はログインシェルを実行し、不足しているキーだけをインポートします。

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env var での同等設定: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="設定値での env var 置換">
  任意の設定文字列値で `${VAR_NAME}` を使って env var を参照できます。

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

ルール:

- 一致するのは大文字名のみ: `[A-Z_][A-Z0-9_]*`
- 欠落または空の変数は、読み込み時にエラーになります
- リテラル出力にするには `$${VAR}` でエスケープします
- `$include` ファイル内でも動作します
- インライン置換: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="シークレット参照（env、file、exec）">
  SecretRef オブジェクトをサポートするフィールドでは、次を使用できます。

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

SecretRef の詳細（`env` / `file` / `exec` 用の `secrets.providers` を含む）は [Secrets Management](/ja-JP/gateway/secrets) にあります。
サポートされる認証情報パスは [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface) に一覧があります。
</Accordion>

優先順位とソースの完全な説明については、[Environment](/ja-JP/help/environment) を参照してください。

## 完全なリファレンス

フィールドごとの完全なリファレンスについては、**[Configuration Reference](/ja-JP/gateway/configuration-reference)** を参照してください。

---

_関連: [Configuration Examples](/ja-JP/gateway/configuration-examples) · [Configuration Reference](/ja-JP/gateway/configuration-reference) · [Doctor](/ja-JP/gateway/doctor)_
