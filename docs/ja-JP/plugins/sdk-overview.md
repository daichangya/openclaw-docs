---
read_when:
    - どの SDK サブパスからインポートするかを把握する必要があります
    - OpenClawPluginApi のすべての登録メソッドのリファレンスが必要な場合
    - 特定の SDK エクスポートを調べています
sidebarTitle: SDK Overview
summary: インポートマップ、登録 API リファレンス、SDK アーキテクチャ
title: Plugin SDK の概要
x-i18n:
    generated_at: "2026-04-19T01:11:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 522c2c542bc0ea4793541fda18931b963ad71f07e9c83e4f22f05184eb1ba91a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK の概要

plugin SDK は、プラグインとコアの間にある型付きコントラクトです。このページは、**何をインポートするか**、そして **何を登録できるか** のリファレンスです。

<Tip>
  **ハウツーガイドを探していますか？**
  - 最初のプラグインですか？ [はじめに](/ja-JP/plugins/building-plugins) から始めてください
  - Channel Plugin ですか？ [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) を参照してください
  - Provider Plugin ですか？ [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) を参照してください
</Tip>

## インポート規約

必ず特定のサブパスからインポートしてください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは小さく自己完結したモジュールです。これにより起動が高速に保たれ、循環依存の問題を防げます。Channel 固有のエントリ/ビルドヘルパーについては、`openclaw/plugin-sdk/channel-core` を優先してください。`openclaw/plugin-sdk/core` は、より広いアンブレラサーフェスと、`buildChannelConfigSchema` のような共有ヘルパー向けに使ってください。

`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp` のような provider 名付きの convenience seam や、channel ブランド付きの helper seam を追加したり、それらに依存したりしないでください。バンドル済みプラグインは、独自の `api.ts` または `runtime-api.ts` barrel 内で汎用 SDK サブパスを組み合わせるべきであり、コアはそれらのプラグインローカルな barrel を使うか、必要が本当にクロスチャネルである場合にのみ狭い汎用 SDK コントラクトを追加するべきです。

生成された export map には、`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、`plugin-sdk/matrix*` のような、少数のバンドル済みプラグイン用 helper seam が依然として含まれています。これらのサブパスは、バンドル済みプラグインの保守と互換性のためだけに存在します。意図的に以下の一般的な表からは除外されており、新しいサードパーティ製プラグインに推奨されるインポートパスではありません。

## サブパスリファレンス

目的別にグループ化した、最もよく使われるサブパスです。200 を超えるサブパスの完全な生成リストは `scripts/lib/plugin-sdk-entrypoints.json` にあります。

予約されたバンドル済みプラグイン用 helper サブパスも、その生成リストには引き続き表示されます。ドキュメントページで明示的に公開対象として推奨されていない限り、それらは実装詳細/互換性サーフェスとして扱ってください。

### Plugin entry

| Subpath                     | 主なエクスポート                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | Subpath | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマのエクスポート（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、allowlist プロンプト、セットアップステータスビルダー |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチアカウント設定/アクションゲートヘルパー、デフォルトアカウントのフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、account-id 正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント検索 + デフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 狭い用途の account-list/account-action ヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Channel 設定スキーマ型 |
    | `plugin-sdk/telegram-command-config` | バンドル済みコントラクトのフォールバックを備えた Telegram カスタムコマンドの正規化/バリデーションヘルパー |
    | `plugin-sdk/command-gating` | 狭い用途のコマンド認可ゲートヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | 共有 inbound route + envelope builder ヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | 共有 inbound record-and-dispatch ヘルパー |
    | `plugin-sdk/messaging-targets` | ターゲット解析/マッチングヘルパー |
    | `plugin-sdk/outbound-media` | 共有 outbound media 読み込みヘルパー |
    | `plugin-sdk/outbound-runtime` | outbound identity/send delegate ヘルパー |
    | `plugin-sdk/poll-runtime` | 狭い用途の poll 正規化ヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | thread-binding のライフサイクルとアダプタヘルパー |
    | `plugin-sdk/agent-media-payload` | レガシー agent media payload builder |
    | `plugin-sdk/conversation-runtime` | 会話/thread binding、pairing、および configured-binding ヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | ランタイム設定スナップショットヘルパー |
    | `plugin-sdk/runtime-group-policy` | ランタイム group-policy 解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有 channel status スナップショット/サマリーヘルパー |
    | `plugin-sdk/channel-config-primitives` | 狭い用途の channel config-schema プリミティブ |
    | `plugin-sdk/channel-config-writes` | Channel 設定書き込み認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有 channel plugin prelude エクスポート |
    | `plugin-sdk/allowlist-config-edit` | allowlist 設定の編集/読み取りヘルパー |
    | `plugin-sdk/group-access` | 共有 group-access 判定ヘルパー |
    | `plugin-sdk/direct-dm` | 共有 direct-DM auth/guard ヘルパー |
    | `plugin-sdk/interactive-runtime` | 対話型 reply payload の正規化/縮約ヘルパー |
    | `plugin-sdk/channel-inbound` | inbound debounce、mention matching、mention-policy ヘルパー、および envelope ヘルパーのための互換性 barrel |
    | `plugin-sdk/channel-mention-gating` | より広い inbound runtime サーフェスを含まない、狭い用途の mention-policy ヘルパー |
    | `plugin-sdk/channel-location` | Channel location コンテキストおよびフォーマットヘルパー |
    | `plugin-sdk/channel-logging` | inbound drop や typing/ack failure 向けの channel logging ヘルパー |
    | `plugin-sdk/channel-send-result` | reply result 型 |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | ターゲット解析/マッチングヘルパー |
    | `plugin-sdk/channel-contract` | Channel コントラクト型 |
    | `plugin-sdk/channel-feedback` | フィードバック/リアクションの配線 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`、および secret target 型などの狭い用途の secret-contract ヘルパー |
  </Accordion>

  <Accordion title="Provider subpaths">
    | Subpath | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | キュレートされた local/self-hosted provider セットアップヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換の self-hosted provider セットアップに特化したヘルパー |
    | `plugin-sdk/cli-backend` | CLI バックエンドのデフォルト + watchdog 定数 |
    | `plugin-sdk/provider-auth-runtime` | Provider Plugin 向けのランタイム API キー解決ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` などの API キー オンボーディング/profile-write ヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth auth-result builder |
    | `plugin-sdk/provider-auth-login` | Provider Plugin 向けの共有対話型ログインヘルパー |
    | `plugin-sdk/provider-env-vars` | provider auth env-var 検索ヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共有 replay-policy builder、provider-endpoint ヘルパー、および `normalizeNativeXaiModelId` などの model-id 正規化ヘルパー |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用 provider HTTP/endpoint capability ヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` などの、狭い用途の web-fetch 設定/選択コントラクトヘルパー |
    | `plugin-sdk/provider-web-fetch` | web-fetch provider の登録/キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | プラグイン有効化の配線を必要としない provider 向けの、狭い用途の web-search 設定/credential ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`、およびスコープ付き credential setter/getter などの、狭い用途の web-search 設定/credential コントラクトヘルパー |
    | `plugin-sdk/provider-web-search` | web-search provider の登録/キャッシュ/ランタイムヘルパー |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`、Gemini スキーマのクリーンアップ + diagnostics、ならびに `resolveXaiModelCompatPatch` / `applyXaiModelCompat` などの xAI compat ヘルパー |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` など |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、stream wrapper 型、および共有の Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper ヘルパー |
    | `plugin-sdk/provider-transport-runtime` | guarded fetch、transport message transforms、writable transport event streams などのネイティブ provider transport ヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルな singleton/map/cache ヘルパー |
  </Accordion>

  <Accordion title="認証とセキュリティのサブパス">
    | Subpath | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、コマンドレジストリヘルパー、送信者認可ヘルパー |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` や `buildHelpMessage` などのコマンド/ヘルプメッセージビルダー |
    | `plugin-sdk/approval-auth-runtime` | approver 解決および同一チャット action-auth ヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブ exec approval profile/filter ヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ approval capability/delivery アダプタ |
    | `plugin-sdk/approval-gateway-runtime` | 共有 approval gateway-resolution ヘルパー |
    | `plugin-sdk/approval-handler-adapter-runtime` | ホットな Channel エントリポイント向けの軽量なネイティブ approval adapter 読み込みヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広い approval handler ランタイムヘルパー。狭い adapter/gateway seam で十分な場合はそちらを優先してください |
    | `plugin-sdk/approval-native-runtime` | ネイティブ approval target + account-binding ヘルパー |
    | `plugin-sdk/approval-reply-runtime` | exec/plugin approval reply payload ヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブ command auth + ネイティブ session-target ヘルパー |
    | `plugin-sdk/command-detection` | 共有 command 検出ヘルパー |
    | `plugin-sdk/command-surface` | command-body 正規化および command-surface ヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Channel/Plugin の secret surface 向けの、狭い secret-contract 収集ヘルパー |
    | `plugin-sdk/secret-ref-runtime` | secret-contract/config 解析向けの、狭い `coerceSecretRef` および SecretRef 型ヘルパー |
    | `plugin-sdk/security-runtime` | 共有 trust、DM gating、external-content、および secret-collection ヘルパー |
    | `plugin-sdk/ssrf-policy` | ホスト allowlist および private-network SSRF policy ヘルパー |
    | `plugin-sdk/ssrf-dispatcher` | 広い infra ランタイムサーフェスを含まない、狭い pinned-dispatcher ヘルパー |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、SSRF 保護付き fetch、および SSRF policy ヘルパー |
    | `plugin-sdk/secret-input` | secret input 解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhook リクエスト/ターゲットヘルパー |
    | `plugin-sdk/webhook-request-guards` | リクエストボディのサイズ/タイムアウトヘルパー |
  </Accordion>

  <Accordion title="ランタイムとストレージのサブパス">
    | Subpath | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/runtime` | 広範なランタイム/ロギング/バックアップ/プラグインインストールヘルパー |
    | `plugin-sdk/runtime-env` | 狭い用途の runtime env、logger、timeout、retry、および backoff ヘルパー |
    | `plugin-sdk/channel-runtime-context` | 汎用 Channel runtime-context の登録および検索ヘルパー |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有 plugin command/hook/http/interactive ヘルパー |
    | `plugin-sdk/hook-runtime` | 共有 Webhook/internal hook パイプラインヘルパー |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` などの lazy runtime import/binding ヘルパー |
    | `plugin-sdk/process-runtime` | プロセス実行ヘルパー |
    | `plugin-sdk/cli-runtime` | CLI のフォーマット、wait、version ヘルパー |
    | `plugin-sdk/gateway-runtime` | Gateway クライアントおよび channel-status patch ヘルパー |
    | `plugin-sdk/config-runtime` | 設定の読み込み/書き込みヘルパー |
    | `plugin-sdk/telegram-command-config` | バンドル済み Telegram コントラクトサーフェスが利用できない場合でも、Telegram の command-name/description の正規化および重複/競合チェック |
    | `plugin-sdk/text-autolink-runtime` | 広い text-runtime barrel を使わない file-reference autolink 検出 |
    | `plugin-sdk/approval-runtime` | exec/plugin approval ヘルパー、approval-capability builder、auth/profile ヘルパー、ネイティブルーティング/ランタイムヘルパー |
    | `plugin-sdk/reply-runtime` | 共有 inbound/reply ランタイムヘルパー、chunking、dispatch、Heartbeat、reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | 狭い reply dispatch/finalize ヘルパー |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` などの共有 short-window reply-history ヘルパー |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭い text/markdown chunking ヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションストアのパス + updated-at ヘルパー |
    | `plugin-sdk/state-paths` | State/OAuth ディレクトリパスヘルパー |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` などの route/session-key/account binding ヘルパー |
    | `plugin-sdk/status-helpers` | 共有 channel/account status サマリーヘルパー、runtime-state のデフォルト、および issue metadata ヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有 target resolver ヘルパー |
    | `plugin-sdk/string-normalization-runtime` | slug/string 正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch/request 風入力から文字列 URL を抽出 |
    | `plugin-sdk/run-command` | stdout/stderr 結果を正規化する timed command runner |
    | `plugin-sdk/param-readers` | 一般的な tool/CLI パラメータリーダー |
    | `plugin-sdk/tool-payload` | tool result オブジェクトから正規化済み payload を抽出 |
    | `plugin-sdk/tool-send` | tool 引数から canonical send target フィールドを抽出 |
    | `plugin-sdk/temp-path` | 共有 temp-download パスヘルパー |
    | `plugin-sdk/logging-core` | subsystem logger および redaction ヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdown table モードヘルパー |
    | `plugin-sdk/json-store` | 小規模 JSON state の読み書きヘルパー |
    | `plugin-sdk/file-lock` | 再入可能な file-lock ヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスクバックの dedupe cache ヘルパー |
    | `plugin-sdk/acp-runtime` | ACP runtime/session および reply-dispatch ヘルパー |
    | `plugin-sdk/acp-binding-resolve-runtime` | ライフサイクル起動 import を伴わない、読み取り専用の ACP binding 解決 |
    | `plugin-sdk/agent-config-primitives` | 狭い agent runtime config-schema プリミティブ |
    | `plugin-sdk/boolean-param` | 緩い boolean パラメータリーダー |
    | `plugin-sdk/dangerous-name-runtime` | dangerous-name マッチング解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | デバイス bootstrap および pairing token ヘルパー |
    | `plugin-sdk/extension-shared` | 共有 passive-channel、status、および ambient proxy helper プリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models` コマンド/provider reply ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skill コマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドレジストリの build/serialize ヘルパー |
    | `plugin-sdk/agent-harness` | 低レベル agent harness 向けの実験的 trusted-plugin サーフェス: harness 型、active-run の steer/abort ヘルパー、OpenClaw tool bridge ヘルパー、および attempt result ユーティリティ |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI endpoint 検出ヘルパー |
    | `plugin-sdk/infra-runtime` | システムイベント/Heartbeat ヘルパー |
    | `plugin-sdk/collection-runtime` | 小規模な bounded cache ヘルパー |
    | `plugin-sdk/diagnostic-runtime` | diagnostic フラグおよび event ヘルパー |
    | `plugin-sdk/error-runtime` | error graph、フォーマット、共有 error 分類ヘルパー、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップされた fetch、proxy、および pinned lookup ヘルパー |
    | `plugin-sdk/runtime-fetch` | proxy/guarded-fetch import を含まない dispatcher-aware runtime fetch |
    | `plugin-sdk/response-limit-runtime` | 広い media ランタイムサーフェスを使わない bounded response-body reader |
    | `plugin-sdk/session-binding-runtime` | configured binding routing や pairing store を伴わない、現在の conversation binding state |
    | `plugin-sdk/session-store-runtime` | 広い config write/maintenance import を伴わない session-store 読み取りヘルパー |
    | `plugin-sdk/context-visibility-runtime` | 広い config/security import を伴わない context visibility 解決および supplemental context filtering |
    | `plugin-sdk/string-coerce-runtime` | markdown/logging import を伴わない、狭い primitive record/string coercion および正規化ヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名および SCP ホスト正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | retry 設定および retry runner ヘルパー |
    | `plugin-sdk/agent-runtime` | agent ディレクトリ/identity/workspace ヘルパー |
    | `plugin-sdk/directory-runtime` | 設定バックのディレクトリ query/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability とテストのサブパス">
    | Subpath | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共有 media fetch/transform/store ヘルパーに加え、media payload builder |
    | `plugin-sdk/media-generation-runtime` | 共有 media-generation failover ヘルパー、候補選択、および model 不足時メッセージ |
    | `plugin-sdk/media-understanding` | media understanding provider 型に加え、provider 向け image/audio helper エクスポート |
    | `plugin-sdk/text-runtime` | assistant-visible-text の除去、markdown render/chunking/table ヘルパー、redaction ヘルパー、directive-tag ヘルパー、安全なテキストユーティリティなどの共有 text/markdown/logging ヘルパー |
    | `plugin-sdk/text-chunking` | outbound text chunking ヘルパー |
    | `plugin-sdk/speech` | speech provider 型に加え、provider 向け directive、registry、および validation ヘルパー |
    | `plugin-sdk/speech-core` | 共有 speech provider 型、registry、directive、および正規化ヘルパー |
    | `plugin-sdk/realtime-transcription` | realtime transcription provider 型および registry ヘルパー |
    | `plugin-sdk/realtime-voice` | realtime voice provider 型および registry ヘルパー |
    | `plugin-sdk/image-generation` | image generation provider 型 |
    | `plugin-sdk/image-generation-core` | 共有 image-generation 型、failover、auth、および registry ヘルパー |
    | `plugin-sdk/music-generation` | music generation provider/request/result 型 |
    | `plugin-sdk/music-generation-core` | 共有 music-generation 型、failover ヘルパー、provider lookup、および model-ref 解析 |
    | `plugin-sdk/video-generation` | video generation provider/request/result 型 |
    | `plugin-sdk/video-generation-core` | 共有 video-generation 型、failover ヘルパー、provider lookup、および model-ref 解析 |
    | `plugin-sdk/webhook-targets` | Webhook ターゲットレジストリおよび route-install ヘルパー |
    | `plugin-sdk/webhook-path` | Webhook パス正規化ヘルパー |
    | `plugin-sdk/web-media` | 共有 remote/local media 読み込みヘルパー |
    | `plugin-sdk/zod` | plugin SDK 利用者向けに再エクスポートされた `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory のサブパス">
    | Subpath | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI ヘルパー向けの、バンドル済み memory-core helper サーフェス |
    | `plugin-sdk/memory-core-engine-runtime` | Memory index/search ランタイムファサード |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory host foundation engine エクスポート |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding コントラクト、registry アクセス、local provider、および汎用 batch/remote ヘルパー |
    | `plugin-sdk/memory-core-host-engine-qmd` | Memory host QMD engine エクスポート |
    | `plugin-sdk/memory-core-host-engine-storage` | Memory host storage engine エクスポート |
    | `plugin-sdk/memory-core-host-multimodal` | Memory host multimodal ヘルパー |
    | `plugin-sdk/memory-core-host-query` | Memory host query ヘルパー |
    | `plugin-sdk/memory-core-host-secret` | Memory host secret ヘルパー |
    | `plugin-sdk/memory-core-host-events` | Memory host event journal ヘルパー |
    | `plugin-sdk/memory-core-host-status` | Memory host status ヘルパー |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory host CLI ランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory host core ランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory host file/runtime ヘルパー |
    | `plugin-sdk/memory-host-core` | Memory host core ランタイムヘルパーの vendor-neutral エイリアス |
    | `plugin-sdk/memory-host-events` | Memory host event journal ヘルパーの vendor-neutral エイリアス |
    | `plugin-sdk/memory-host-files` | Memory host file/runtime ヘルパーの vendor-neutral エイリアス |
    | `plugin-sdk/memory-host-markdown` | memory-adjacent plugins 向けの共有 managed-markdown ヘルパー |
    | `plugin-sdk/memory-host-search` | 検索マネージャーアクセス向けの Active Memory ランタイムファサード |
    | `plugin-sdk/memory-host-status` | Memory host status ヘルパーの vendor-neutral エイリアス |
    | `plugin-sdk/memory-lancedb` | バンドル済み memory-lancedb helper サーフェス |
  </Accordion>

  <Accordion title="予約済みバンドル helper サブパス">
    | Family | 現在のサブパス | 想定用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | バンドル済み browser plugin のサポートヘルパー（`browser-support` は互換性 barrel のまま） |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | バンドル済み Matrix helper/runtime サーフェス |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | バンドル済み LINE helper/runtime サーフェス |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | バンドル済み IRC helper サーフェス |
    | Channel 固有ヘルパー | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | バンドル済み Channel 互換性/helper seam |
    | 認証/Plugin 固有ヘルパー | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | バンドル済み機能/Plugin helper seam。`plugin-sdk/github-copilot-token` は現在 `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken` をエクスポートします |
  </Accordion>
</AccordionGroup>

## 登録 API

`register(api)` コールバックは、以下のメソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります。

### Capability の登録

| Method                                           | 登録するもの                            |
| ------------------------------------------------ | --------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論（LLM）                     |
| `api.registerAgentHarness(...)`                  | 実験的な低レベル agent executor         |
| `api.registerCliBackend(...)`                    | ローカル CLI 推論バックエンド           |
| `api.registerChannel(...)`                       | メッセージングチャネル                  |
| `api.registerSpeechProvider(...)`                | 音声合成 / STT 合成                     |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミング realtime transcription   |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向 realtime voice セッション        |
| `api.registerMediaUnderstandingProvider(...)`    | 画像/音声/動画解析                      |
| `api.registerImageGenerationProvider(...)`       | 画像生成                                |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                                |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                                |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape provider             |
| `api.registerWebSearchProvider(...)`             | Web 検索                                |

### Tools と commands

| Method                          | 登録するもの                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | agent tool（必須または `{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLM をバイパス）            |

### インフラストラクチャ

| Method                                         | 登録するもの                           |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | イベント Hook                          |
| `api.registerHttpRoute(params)`                | Gateway HTTP エンドポイント            |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC メソッド                   |
| `api.registerCli(registrar, opts?)`            | CLI サブコマンド                       |
| `api.registerService(service)`                 | バックグラウンドサービス               |
| `api.registerInteractiveHandler(registration)` | 対話型ハンドラ                         |
| `api.registerMemoryPromptSupplement(builder)`  | 加算型の memory-adjacent prompt セクション |
| `api.registerMemoryCorpusSupplement(adapter)`  | 加算型の memory search/read corpus     |

予約済みのコア管理 namespace（`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`）は、プラグインがより狭い Gateway メソッドスコープを割り当てようとしても、常に `operator.admin` のままです。プラグインが所有するメソッドには、プラグイン固有の prefix を使うことを推奨します。

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は、2 種類のトップレベルメタデータを受け付けます。

- `commands`: registrar が所有する明示的なコマンドルート
- `descriptors`: ルート CLI ヘルプ、ルーティング、lazy Plugin CLI 登録に使われる parse-time command descriptor

プラグインコマンドを通常のルート CLI パスで lazy-loaded のままにしたい場合は、その registrar が公開するすべてのトップレベルコマンドルートをカバーする `descriptors` を指定してください。

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Matrix アカウント、認証、デバイス、およびプロフィール状態を管理します",
        hasSubcommands: true,
      },
    ],
  },
);
```

lazy なルート CLI 登録が不要な場合にのみ、`commands` を単独で使ってください。この eager 互換パスは引き続きサポートされていますが、parse-time lazy loading 用の descriptor-backed placeholder はインストールされません。

### CLI バックエンドの登録

`api.registerCliBackend(...)` を使うと、`codex-cli` のようなローカル AI CLI バックエンドのデフォルト設定をプラグインが所有できます。

- バックエンドの `id` は、`codex-cli/gpt-5` のような model ref における provider prefix になります。
- バックエンドの `config` は、`agents.defaults.cliBackends.<id>` と同じ形状を使います。
- ユーザー設定が優先されます。OpenClaw は CLI 実行前に、プラグインのデフォルトに対して `agents.defaults.cliBackends.<id>` をマージします。
- マージ後に互換性のための書き換えが必要な場合（たとえば古い flag 形式の正規化など）は、`normalizeConfig` を使ってください。

### 排他的スロット

| Method                                     | 登録するもの                                                                                                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に 1 つだけアクティブ）。`assemble()` コールバックは `availableTools` と `citationsMode` を受け取り、エンジンが prompt 追加を調整できるようになっています。 |
| `api.registerMemoryCapability(capability)` | 統合 memory capability                                                                                                                                         |
| `api.registerMemoryPromptSection(builder)` | memory prompt セクションビルダー                                                                                                                               |
| `api.registerMemoryFlushPlan(resolver)`    | memory flush plan resolver                                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | memory runtime アダプタ                                                                                                                                        |

### Memory 埋め込みアダプタ

| Method                                         | 登録するもの                              |
| ---------------------------------------------- | ----------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブなプラグイン用の memory embedding アダプタ |

- `registerMemoryCapability` は、推奨される排他的 memory-plugin API です。
- `registerMemoryCapability` は、`publicArtifacts.listArtifacts(...)` を公開することもでき、companion plugin が特定の memory plugin の private layout に直接アクセスする代わりに、`openclaw/plugin-sdk/memory-host-core` を通じてエクスポートされた memory artifact を利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、`registerMemoryRuntime` は、レガシー互換の排他的 memory-plugin API です。
- `registerMemoryEmbeddingProvider` により、アクティブな memory plugin は 1 つ以上の embedding adapter id（たとえば `openai`、`gemini`、またはプラグイン定義のカスタム id）を登録できます。
- `agents.defaults.memorySearch.provider` や `agents.defaults.memorySearch.fallback` のようなユーザー設定は、それらの登録済み adapter id に対して解決されます。

### イベントとライフサイクル

| Method                                       | 役割                           |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクル Hook      |
| `api.onConversationBindingResolved(handler)` | 会話バインディングコールバック |

### Hook の決定セマンティクス

- `before_tool_call`: `{ block: true }` を返すと終端になります。いずれかのハンドラがこれを設定すると、それより優先度の低いハンドラはスキップされます。
- `before_tool_call`: `{ block: false }` を返しても、決定なしとして扱われます（`block` を省略した場合と同じ）であり、上書きにはなりません。
- `before_install`: `{ block: true }` を返すと終端になります。いずれかのハンドラがこれを設定すると、それより優先度の低いハンドラはスキップされます。
- `before_install`: `{ block: false }` を返しても、決定なしとして扱われます（`block` を省略した場合と同じ）であり、上書きにはなりません。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端になります。いずれかのハンドラがディスパッチを引き受けると、それより優先度の低いハンドラとデフォルトのモデルディスパッチパスはスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端になります。いずれかのハンドラがこれを設定すると、それより優先度の低いハンドラはスキップされます。
- `message_sending`: `{ cancel: false }` を返しても、決定なしとして扱われます（`cancel` を省略した場合と同じ）であり、上書きにはなりません。

### API オブジェクトのフィールド

| Field                    | Type                      | 説明                                                                                             |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Plugin id                                                                                        |
| `api.name`               | `string`                  | 表示名                                                                                           |
| `api.version`            | `string?`                 | Plugin version（任意）                                                                           |
| `api.description`        | `string?`                 | Plugin の説明（任意）                                                                            |
| `api.source`             | `string`                  | Plugin のソースパス                                                                              |
| `api.rootDir`            | `string?`                 | Plugin のルートディレクトリ（任意）                                                              |
| `api.config`             | `OpenClawConfig`          | 現在の設定スナップショット（利用可能な場合は、アクティブなインメモリのランタイムスナップショット） |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` にある Plugin 固有設定                                             |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | スコープ付き logger（`debug`, `info`, `warn`, `error`）                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在のロードモード。`"setup-runtime"` は、完全なエントリ読み込み前の軽量な起動/セットアップ用ウィンドウです |
| `api.resolvePath(input)` | `(string) => string`      | Plugin ルートからの相対パスを解決                                                                |

## 内部モジュール規約

Plugin 内では、内部インポートにローカル barrel ファイルを使ってください。

```
my-plugin/
  api.ts            # 外部利用者向けの公開エクスポート
  runtime-api.ts    # 内部専用のランタイムエクスポート
  index.ts          # Plugin エントリポイント
  setup-entry.ts    # 軽量なセットアップ専用エントリ（任意）
```

<Warning>
  本番コードから、自分自身の Plugin を `openclaw/plugin-sdk/<your-plugin>` 経由でインポートしないでください。
  内部インポートは `./api.ts` または
  `./runtime-api.ts` を経由してください。SDK パスは外部向けコントラクト専用です。
</Warning>

ファサード読み込みされるバンドル済み Plugin の公開サーフェス（`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`、および同様の公開エントリファイル）は、OpenClaw がすでに動作中であれば、現在のランタイム設定スナップショットを優先して使うようになりました。まだランタイムスナップショットが存在しない場合は、ディスク上で解決された設定ファイルにフォールバックします。

Provider Plugin は、ヘルパーが意図的に provider 固有であり、まだ汎用 SDK サブパスに属さない場合、狭い Plugin ローカルなコントラクト barrel を公開することもできます。現在のバンドル済みの例として、Anthropic provider は Claude ストリームヘルパーを、Anthropic beta-header や `service_tier` ロジックを汎用 `plugin-sdk/*` コントラクトに昇格させる代わりに、自身の公開 `api.ts` / `contract-api.ts` seam に保持しています。

その他の現在のバンドル済みの例:

- `@openclaw/openai-provider`: `api.ts` は provider builder、
  default-model ヘルパー、および realtime provider builder をエクスポートします
- `@openclaw/openrouter-provider`: `api.ts` は provider builder に加えて
  オンボーディング/設定ヘルパーをエクスポートします

<Warning>
  extension の本番コードでも、`openclaw/plugin-sdk/<other-plugin>` の
  インポートは避けるべきです。
  ヘルパーが本当に共有されるべきものなら、2 つの Plugin を結びつけるのではなく、
  `openclaw/plugin-sdk/speech`、`.../provider-model-shared`、
  または他の capability 指向のサーフェスのような中立的な SDK サブパスへ昇格させてください。
</Warning>

## 関連

- [エントリポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` と `defineChannelPluginEntry` のオプション
- [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime) — 完全な `api.runtime` namespace リファレンス
- [セットアップと設定](/ja-JP/plugins/sdk-setup) — パッケージング、マニフェスト、設定スキーマ
- [テスト](/ja-JP/plugins/sdk-testing) — テストユーティリティと lint ルール
- [SDK 移行](/ja-JP/plugins/sdk-migration) — 非推奨サーフェスからの移行
- [Plugin 内部構造](/ja-JP/plugins/architecture) — 詳細なアーキテクチャと capability モデル
