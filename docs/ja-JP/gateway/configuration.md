---
read_when:
    - OpenClawの初回セットアップ
    - 一般的な設定パターンを探す
    - 特定の設定セクションへ移動する
summary: '設定概要: 一般的なタスク、クイックセットアップ、完全なリファレンスへのリンク'
title: 設定
x-i18n:
    generated_at: "2026-04-22T04:22:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: c627ccf9f17087e0b71663fe3086d637aeaa8cd1d6d34d816bfcbc0f0cc6f07c
    source_path: gateway/configuration.md
    workflow: 15
---

# 設定

OpenClawは、`~/.openclaw/openclaw.json`から任意の<Tooltip tip="JSON5はコメントと末尾カンマをサポートします">**JSON5**</Tooltip>設定を読み込みます。

ファイルが存在しない場合、OpenClawは安全なデフォルトを使用します。設定を追加する一般的な理由:

- チャネルを接続し、誰がボットにメッセージを送れるかを制御する
- モデル、ツール、サンドボックス化、自動化（Cron、フック）を設定する
- セッション、メディア、ネットワーク、UIを調整する

利用可能なすべてのフィールドについては、[完全なリファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

<Tip>
**設定が初めてですか？** 対話型セットアップには`openclaw onboard`から始めるか、完全なコピペ用設定を掲載した[設定例](/ja-JP/gateway/configuration-examples)ガイドを確認してください。
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
  <Tab title="CLI（1行コマンド）">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789)を開き、**Config**タブを使用します。
    Control UIは、ライブ設定スキーマからフォームをレンダリングします。利用可能な場合は、フィールドの
    `title` / `description`ドキュメントメタデータに加えてPluginとチャネルのスキーマも含まれ、
    退避手段として**Raw JSON**エディターも備えています。ドリルダウンUIやその他のツール向けに、
    gatewayは1つのパススコープ付きスキーマノードと直下の子要約を取得するための
    `config.schema.lookup`も公開しています。
  </Tab>
  <Tab title="直接編集">
    `~/.openclaw/openclaw.json`を直接編集します。Gatewayはこのファイルを監視し、自動的に変更を適用します（[ホットリロード](#config-hot-reload)を参照）。
  </Tab>
</Tabs>

## 厳密な検証

<Warning>
OpenClawは、スキーマに完全一致する設定のみを受け入れます。不明なキー、不正な型、無効な値があると、Gatewayは**起動を拒否**します。ルートレベルでの唯一の例外は`$schema`（文字列）で、エディターがJSON Schemaメタデータを付与できるようにするためのものです。
</Warning>

スキーマツールに関する注記:

- `openclaw config schema`は、Control UIと設定検証で使用されるのと同じJSON Schema群を出力します。
- そのスキーマ出力は`openclaw.json`の正規の機械可読コントラクトとして扱ってください。この概要と設定リファレンスはその要約です。
- フィールドの`title`と`description`の値は、エディターとフォームツール向けにスキーマ出力へ引き継がれます。
- ネストしたオブジェクト、ワイルドカード（`*`）、配列項目（`[]`）のエントリは、一致するフィールドドキュメントが存在する場合に同じドキュメントメタデータを継承します。
- `anyOf` / `oneOf` / `allOf`の構成分岐も同じドキュメントメタデータを継承するため、union/intersectionの各バリアントでも同じフィールドヘルプが維持されます。
- `config.schema.lookup`は、正規化された1つの設定パスについて、浅いスキーマノード（`title`、`description`、`type`、`enum`、`const`、一般的な境界値、および類似の検証フィールド）、一致したUIヒントメタデータ、ドリルダウンツール向けの直下の子要約を返します。
- ランタイムのPlugin/チャネルスキーマは、gatewayが現在のmanifest registryを読み込める場合にマージされます。
- `pnpm config:docs:check`は、ドキュメント向け設定ベースライン成果物と現在のスキーマサーフェスのずれを検出します。

検証に失敗した場合:

- Gatewayは起動しません
- 診断コマンドのみ動作します（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 正確な問題を確認するには`openclaw doctor`を実行します
- 修復を適用するには`openclaw doctor --fix`（または`--yes`）を実行します

また、Gatewayは起動成功後に信頼できる「最後に正常だったコピー」も保持します。後から
`openclaw.json`がOpenClawの外で変更され、検証に通らなくなった場合、起動時および
ホットリロード時には、壊れたファイルをタイムスタンプ付きの`.clobbered.*`スナップショットとして保持し、
最後に正常だったコピーを復元し、その復旧理由とともに強い警告を記録します。
次のメインエージェントターンでも、設定が復元され、むやみに上書きしてはならないことを伝える
システムイベント警告を受け取ります。最後に正常だったコピーへの昇格は、
検証済み起動後、および受理されたホットリロード後に更新されます。これには、
永続化されたファイルハッシュが受理済み書き込みと一致するOpenClaw所有の設定書き込みも含まれます。
候補に`***`や短縮されたトークン値などのマスク済みシークレット
プレースホルダーが含まれている場合、昇格はスキップされます。

## 一般的なタスク

<AccordionGroup>
  <Accordion title="チャネルを設定する（WhatsApp、Telegram、Discordなど）">
    各チャネルには、`channels.<provider>`配下に専用の設定セクションがあります。セットアップ手順は専用のチャネルページを参照してください。

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

    すべてのチャネルは同じDMポリシーパターンを共有します。

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

    - `agents.defaults.models`はモデルカタログを定義し、`/model`のallowlistとしても機能します。
    - モデル参照は`provider/model`形式を使用します（例: `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx`は、トランスクリプト/ツール画像の縮小サイズを制御します（デフォルト`1200`）。通常、値を下げるとスクリーンショットが多い実行でvision token使用量を減らせます。
    - チャット内でのモデル切り替えについては[Models CLI](/ja-JP/concepts/models)、認証ローテーションとフォールバック動作については[Model Failover](/ja-JP/concepts/model-failover)を参照してください。
    - カスタム/セルフホスト型プロバイダーについては、リファレンスの[カスタムプロバイダー](/ja-JP/gateway/configuration-reference#custom-providers-and-base-urls)を参照してください。

  </Accordion>

  <Accordion title="誰がボットにメッセージを送れるかを制御する">
    DMアクセスは、チャネルごとに`dmPolicy`で制御します。

    - `"pairing"`（デフォルト）: 未知の送信者には承認用のワンタイムペアリングコードが返されます
    - `"allowlist"`: `allowFrom`内の送信者のみ（またはペア済みallowストア）
    - `"open"`: すべての受信DMを許可します（`allowFrom: ["*"]`が必要）
    - `"disabled"`: すべてのDMを無視します

    グループについては、`groupPolicy` + `groupAllowFrom`またはチャネル固有のallowlistを使用します。

    チャネルごとの詳細は[完全なリファレンス](/ja-JP/gateway/configuration-reference#dm-and-group-access)を参照してください。

  </Accordion>

  <Accordion title="グループチャットのメンション制御を設定する">
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

    - **メタデータメンション**: ネイティブ@メンション（WhatsAppのタップメンション、Telegramの@botなど）
    - **テキストパターン**: `mentionPatterns`内の安全な正規表現パターン
    - チャネルごとの上書きとセルフチャットモードについては[完全なリファレンス](/ja-JP/gateway/configuration-reference#group-chat-mention-gating)を参照してください。

  </Accordion>

  <Accordion title="エージェントごとにSkillsを制限する">
    共有ベースラインには`agents.defaults.skills`を使用し、特定の
    エージェントは`agents.list[].skills`で上書きします。

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather を継承
          { id: "docs", skills: ["docs-search"] }, // デフォルトを置き換え
          { id: "locked-down", skills: [] }, // Skillsなし
        ],
      },
    }
    ```

    - デフォルトでSkillsを無制限にするには`agents.defaults.skills`を省略します。
    - デフォルトを継承するには`agents.list[].skills`を省略します。
    - Skillsを無効にするには`agents.list[].skills: []`を設定します。
    - [Skills](/ja-JP/tools/skills)、[Skills設定](/ja-JP/tools/skills-config)、および
      [設定リファレンス](/ja-JP/gateway/configuration-reference#agents-defaults-skills)を参照してください。

  </Accordion>

  <Accordion title="gatewayのチャネルヘルス監視を調整する">
    古くなったように見えるチャネルをgatewayがどれだけ積極的に再起動するかを制御します。

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

    - ヘルス監視による再起動をグローバルに無効化するには`gateway.channelHealthCheckMinutes: 0`を設定します。
    - `channelStaleEventThresholdMinutes`はチェック間隔以上である必要があります。
    - グローバル監視を無効にせずに1つのチャネルまたはアカウントだけ自動再起動を無効化するには、`channels.<provider>.healthMonitor.enabled`または`channels.<provider>.accounts.<id>.healthMonitor.enabled`を使用します。
    - 運用時のデバッグについては[ヘルスチェック](/ja-JP/gateway/health)、全フィールドについては[完全なリファレンス](/ja-JP/gateway/configuration-reference#gateway)を参照してください。

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
    - `threadBindings`: スレッドに結び付いたセッションルーティングのグローバルデフォルト（Discordは`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`をサポート）
    - スコープ、IDリンク、送信ポリシーについては[セッション管理](/ja-JP/concepts/session)を参照してください。
    - 全フィールドについては[完全なリファレンス](/ja-JP/gateway/configuration-reference#session)を参照してください。

  </Accordion>

  <Accordion title="サンドボックス化を有効にする">
    エージェントセッションを分離されたサンドボックスランタイムで実行します。

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

    完全なガイドについては[サンドボックス化](/ja-JP/gateway/sandboxing)、全オプションについては[完全なリファレンス](/ja-JP/gateway/configuration-reference#agentsdefaultssandbox)を参照してください。

  </Accordion>

  <Accordion title="公式iOSビルド向けのrelayベースpushを有効にする">
    relayベースpushは`openclaw.json`で設定します。

    gateway設定に次を設定します:

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

    CLIでの同等設定:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    これにより行われること:

    - gatewayが外部relay経由で`push.test`、wake通知、再接続wakeを送信できるようになります。
    - ペアリング済みiOSアプリから転送される、登録単位の送信grantを使用します。gatewayにデプロイ全体用のrelay tokenは不要です。
    - 各relayベース登録は、iOSアプリがペアリングしたgateway IDに紐付けられるため、別のgatewayが保存済み登録を再利用することはできません。
    - ローカル/手動のiOSビルドは引き続き直接APNsを使用します。relayベース送信は、relay経由で登録された公式配布ビルドにのみ適用されます。
    - 公式/TestFlight iOSビルドに組み込まれたrelay base URLと一致している必要があります。そうしないと、登録トラフィックと送信トラフィックが同じrelayデプロイ先に到達しません。

    エンドツーエンドフロー:

    1. 同じrelay base URLでコンパイルされた公式/TestFlight iOSビルドをインストールします。
    2. gatewayで`gateway.push.apns.relay.baseUrl`を設定します。
    3. iOSアプリをgatewayにペアリングし、nodeセッションとoperatorセッションの両方を接続させます。
    4. iOSアプリはgateway IDを取得し、App Attestとアプリreceiptを使ってrelayに登録し、その後relayベースの`push.apns.register`ペイロードをペアリング済みgatewayへ公開します。
    5. gatewayはrelay handleとsend grantを保存し、それらを`push.test`、wake通知、再接続wakeに使用します。

    運用上の注記:

    - iOSアプリを別のgatewayへ切り替える場合は、アプリを再接続して、そのgatewayに紐付いた新しいrelay登録を公開できるようにしてください。
    - 別のrelayデプロイ先を指す新しいiOSビルドを配布した場合、アプリは古いrelay originを再利用する代わりに、キャッシュ済みrelay登録を更新します。

    互換性に関する注記:

    - `OPENCLAW_APNS_RELAY_BASE_URL`と`OPENCLAW_APNS_RELAY_TIMEOUT_MS`は、一時的な環境変数上書きとして引き続き動作します。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`は引き続きloopback専用の開発用エスケープハッチです。HTTP relay URLを設定に永続化しないでください。

    エンドツーエンドフローについては[iOS App](/ja-JP/platforms/ios#relay-backed-push-for-official-builds)、relayのセキュリティモデルについては[Authentication and trust flow](/ja-JP/platforms/ios#authentication-and-trust-flow)を参照してください。

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

    - `every`: 期間文字列（`30m`、`2h`）。無効にするには`0m`を設定します。
    - `target`: `last` | `none` | `<channel-id>`（例: `discord`、`matrix`、`telegram`、`whatsapp`）
    - `directPolicy`: DM形式のheartbeatターゲット向けの`allow`（デフォルト）または`block`
    - 完全なガイドは[Heartbeat](/ja-JP/gateway/heartbeat)を参照してください。

  </Accordion>

  <Accordion title="Cronジョブを設定する">
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

    - `sessionRetention`: 完了した分離実行セッションを`sessions.json`から削除します（デフォルト`24h`。無効にするには`false`を設定）。
    - `runLog`: `cron/runs/<jobId>.jsonl`をサイズと保持行数で削減します。
    - 機能概要とCLI例については[Cron jobs](/ja-JP/automation/cron-jobs)を参照してください。

  </Accordion>

  <Accordion title="Webhook（hooks）を設定する">
    GatewayでHTTP Webhookエンドポイントを有効にします。

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

    セキュリティに関する注記:
    - すべてのhook/Webhookペイロード内容は信頼されない入力として扱ってください。
    - 専用の`hooks.token`を使用し、共有Gateway tokenを再利用しないでください。
    - hook認証はヘッダーのみです（`Authorization: Bearer ...`または`x-openclaw-token`）。クエリ文字列トークンは拒否されます。
    - `hooks.path`は`/`にできません。Webhook受信は`/hooks`のような専用サブパスにしてください。
    - 厳密に範囲を限定したデバッグを行う場合を除き、安全でないコンテンツのバイパスフラグ（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）は無効のままにしてください。
    - `hooks.allowRequestSessionKey`を有効にする場合は、呼び出し元が選択するセッションキーを制限するため、`hooks.allowedSessionKeyPrefixes`も設定してください。
    - hook駆動エージェントでは、強力な現代的モデル階層と厳格なツールポリシーを推奨します（例: 可能であればメッセージング専用 + サンドボックス化）。

    すべてのマッピングオプションとGmail連携については、[完全なリファレンス](/ja-JP/gateway/configuration-reference#hooks)を参照してください。

  </Accordion>

  <Accordion title="マルチエージェントルーティングを設定する">
    別々のworkspaceとセッションを持つ複数の分離エージェントを実行します。

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

    バインディングルールとエージェントごとのアクセスプロファイルについては、[Multi-Agent](/ja-JP/concepts/multi-agent)と[完全なリファレンス](/ja-JP/gateway/configuration-reference#multi-agent-routing)を参照してください。

  </Accordion>

  <Accordion title="設定を複数ファイルに分割する（$include）">
    大きな設定を整理するには`$include`を使用します。

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
    - **ファイル配列**: 順番にdeep mergeされます（後勝ち）
    - **兄弟キー**: includeの後にマージされます（includeされた値を上書き）
    - **ネストしたinclude**: 最大10階層までサポート
    - **相対パス**: include元ファイルを基準に解決
    - **エラー処理**: ファイル欠落、解析エラー、循環includeに対する明確なエラー

  </Accordion>
</AccordionGroup>

## 設定のホットリロード

Gatewayは`~/.openclaw/openclaw.json`を監視し、自動的に変更を適用します。ほとんどの設定では手動再起動は不要です。

直接ファイル編集は、検証に通るまで信頼されないものとして扱われます。watcherは
エディターの一時書き込み/リネームの揺れが収まるのを待ち、最終ファイルを読み取り、
無効な外部編集は最後に正常だった設定を復元して拒否します。OpenClaw所有の
設定書き込みも、書き込み前に同じスキーマゲートを通ります。`gateway.mode`の削除や
ファイルサイズを半分超縮小するような破壊的clobberは拒否され、
確認用に`.rejected.*`として保存されます。

ログに`Config auto-restored from last-known-good`または
`config reload restored last-known-good config`が表示された場合は、
`openclaw.json`の隣にある対応する`.clobbered.*`ファイルを確認し、拒否された
ペイロードを修正してから`openclaw config validate`を実行してください。復旧チェックリストは
[Gateway troubleshooting](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config)を参照してください。

### リロードモード

| Mode                   | Behavior                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (default) | 安全な変更は即座にホット適用します。重要な変更は自動的に再起動します。                 |
| **`hot`**              | 安全な変更のみホット適用します。再起動が必要なときは警告を記録します — 対応は手動です。 |
| **`restart`**          | 安全かどうかにかかわらず、任意の設定変更でGatewayを再起動します。                      |
| **`off`**              | ファイル監視を無効にします。変更は次回の手動再起動で反映されます。                     |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ホット適用されるものと再起動が必要なもの

ほとんどのフィールドはダウンタイムなしでホット適用されます。`hybrid`モードでは、再起動が必要な変更は自動処理されます。

| Category            | Fields                                                            | Restart needed? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Channels            | `channels.*`、`web`（WhatsApp）— すべての組み込みおよびPluginチャネル | No              |
| Agent & models      | `agent`、`agents`、`models`、`routing`                            | No              |
| Automation          | `hooks`、`cron`、`agent.heartbeat`                                | No              |
| Sessions & messages | `session`、`messages`                                             | No              |
| Tools & media       | `tools`、`browser`、`skills`、`audio`、`talk`                     | No              |
| UI & misc           | `ui`、`logging`、`identity`、`bindings`                           | No              |
| Gateway server      | `gateway.*`（port、bind、auth、tailscale、TLS、HTTP）             | **Yes**         |
| Infrastructure      | `discovery`、`canvasHost`、`plugins`                              | **Yes**         |

<Note>
`gateway.reload`と`gateway.remote`は例外です。これらを変更しても**再起動は発生しません**。
</Note>

## 設定RPC（プログラムによる更新）

<Note>
コントロールプレーン書き込みRPC（`config.apply`、`config.patch`、`update.run`）は、`deviceId+clientIp`ごとに**60秒あたり3リクエスト**にレート制限されています。制限時、RPCは`retryAfterMs`付きで`UNAVAILABLE`を返します。
</Note>

安全な/デフォルトのフロー:

- `config.schema.lookup`: 1つのパススコープ付き設定サブツリーを、浅い
  スキーマノード、一致したヒントメタデータ、直下の子要約とともに検査
- `config.get`: 現在のスナップショット + hashを取得
- `config.patch`: 推奨される部分更新経路
- `config.apply`: 完全設定の置換のみ
- `update.run`: 明示的なself-update + restart

設定全体を置き換えるのでない限り、`config.schema.lookup`
の後に`config.patch`を使うことを推奨します。

<AccordionGroup>
  <Accordion title="config.apply（完全置換）">
    完全な設定を検証して書き込み、1ステップでGatewayを再起動します。

    <Warning>
    `config.apply`は**設定全体**を置き換えます。部分更新には`config.patch`、単一キーには`openclaw config set`を使用してください。
    </Warning>

    パラメータ:

    - `raw`（文字列）— 設定全体のJSON5ペイロード
    - `baseHash`（任意）— `config.get`の設定hash（設定が存在する場合は必須）
    - `sessionKey`（任意）— 再起動後のwake-up ping用セッションキー
    - `note`（任意）— restart sentinel用の注記
    - `restartDelayMs`（任意）— 再起動前の遅延（デフォルト2000）

    ある再起動がすでに保留中/進行中であれば、再起動リクエストはまとめられます。また、再起動サイクル間には30秒のクールダウンが適用されます。

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
    既存の設定に部分更新をマージします（JSON merge patchセマンティクス）:

    - オブジェクトは再帰的にマージ
    - `null`はキーを削除
    - 配列は置換

    パラメータ:

    - `raw`（文字列）— 変更するキーだけを含むJSON5
    - `baseHash`（必須）— `config.get`から取得した設定hash
    - `sessionKey`、`note`、`restartDelayMs` — `config.apply`と同じ

    再起動動作は`config.apply`と同じです。保留中の再起動はまとめられ、再起動サイクル間には30秒のクールダウンがあります。

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## 環境変数

OpenClawは、親プロセスからの環境変数に加えて、次も読み込みます。

- 現在の作業ディレクトリの`.env`（存在する場合）
- `~/.openclaw/.env`（グローバルフォールバック）

どちらのファイルも既存の環境変数を上書きしません。設定内でインライン環境変数を設定することもできます。

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="シェル環境変数のインポート（任意）">
  有効にすると、期待するキーが設定されていない場合に、OpenClawはログインシェルを実行し、不足しているキーのみをインポートします。

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
  任意の設定文字列値内で`${VAR_NAME}`を使って環境変数を参照できます。

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

ルール:

- 一致するのは大文字名のみ: `[A-Z_][A-Z0-9_]*`
- 変数が未設定または空の場合、読み込み時にエラーになります
- リテラル出力にするには`$${VAR}`でエスケープします
- `$include`ファイル内でも機能します
- インライン置換: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef（env、file、exec）">
  SecretRefオブジェクトをサポートするフィールドでは、次を使用できます。

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

SecretRefの詳細（`env`/`file`/`exec`向けの`secrets.providers`を含む）は[Secrets Management](/ja-JP/gateway/secrets)にあります。
サポートされる認証情報パスは[SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)に一覧があります。
</Accordion>

完全な優先順位とソースについては[Environment](/ja-JP/help/environment)を参照してください。

## 完全なリファレンス

完全なフィールド別リファレンスについては、**[設定リファレンス](/ja-JP/gateway/configuration-reference)**を参照してください。

---

_関連: [設定例](/ja-JP/gateway/configuration-examples) · [設定リファレンス](/ja-JP/gateway/configuration-reference) · [Doctor](/ja-JP/gateway/doctor)_
