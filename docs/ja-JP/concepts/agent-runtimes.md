---
read_when:
    - Pi、Codex、ACP、または別のネイティブagent runtimeのどれを選ぶかを決めている場合
    - statusやconfigにあるprovider/model/runtimeのラベルの違いが分かりにくい場合
    - ネイティブharnessのサポート互換性を文書化している場合
summary: OpenClawがモデルプロバイダー、モデル、channel、agent runtimeをどのように分離しているか
title: agent runtimes
x-i18n:
    generated_at: "2026-04-25T13:45:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f492209da2334361060f0827c243d5d845744be906db9ef116ea00384879b33
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

**agent runtime**は、1つの準備済みモデルループを担当するコンポーネントです。プロンプトを受け取り、モデル出力を進め、ネイティブツール呼び出しを処理し、完了したターンをOpenClawに返します。

runtimeは、どちらもモデル設定の近くに現れるため、providerと混同しやすい概念です。これらは別のレイヤーです。

| レイヤー | 例 | 意味 |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Provider | `openai`, `anthropic`, `openai-codex` | OpenClawがどのように認証し、モデルを検出し、model refに名前を付けるか。 |
| Model | `gpt-5.5`, `claude-opus-4-6` | agentターンに選択されたモデル。 |
| Agent runtime | `pi`, `codex`, ACP-backed runtimes | 準備済みターンを実行する低レベルループ。 |
| Channel | Telegram, Discord, Slack, WhatsApp | メッセージがOpenClawに入出力される場所。 |

コードやconfigでは**harness**という語も見かけます。harnessは、agent runtimeを提供する実装です。たとえば、バンドルされたCodex harnessは`codex` runtimeを実装します。互換性のためconfigキー名は引き続き`embeddedHarness`ですが、ユーザー向けドキュメントやstatus出力では、通常はruntimeと表記すべきです。

一般的なCodexセットアップでは、`openai` providerと`codex` runtimeを使用します。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

これは、OpenClawがOpenAIのmodel refを選択し、その後Codex app-server runtimeに埋め込みagentターンの実行を依頼することを意味します。channel、モデルprovider catalog、またはOpenClawセッションストアがCodexになることを意味するわけではありません。

OpenAI系プレフィックスの分割については、[OpenAI](/ja-JP/providers/openai)と[Model providers](/ja-JP/concepts/model-providers)を参照してください。Codex runtimeのサポート契約については、[Codex harness](/ja-JP/plugins/codex-harness#v1-support-contract)を参照してください。

## Runtime ownership

runtimeごとに、ループのどこまでを担当するかは異なります。

| Surface | OpenClaw Pi embedded | Codex app-server |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| モデルループの所有者 | PI embedded runnerを通したOpenClaw | Codex app-server |
| 正式なスレッド状態 | OpenClaw transcript | Codex thread、およびOpenClaw transcript mirror |
| OpenClaw dynamic tools | ネイティブなOpenClawツールループ | Codex adapterを介してブリッジ |
| ネイティブshellおよびfile tools | Pi/OpenClaw経路 | Codexネイティブtools。サポートされる場合はnative hooks経由でブリッジ |
| コンテキストエンジン | ネイティブなOpenClawコンテキスト組み立て | OpenClawがプロジェクト化したコンテキストをCodexターンに組み立て |
| Compaction | OpenClawまたは選択されたコンテキストエンジン | CodexネイティブCompaction。OpenClaw通知とmirror維持付き |
| Channel配信 | OpenClaw | OpenClaw |

このownership分割が主要な設計ルールです。

- OpenClawがsurfaceを所有している場合、OpenClawは通常のplugin hook動作を提供できます。
- ネイティブruntimeがsurfaceを所有している場合、OpenClawにはruntime eventsまたはnative hooksが必要です。
- ネイティブruntimeが正式なスレッド状態を所有している場合、OpenClawはmirrorとコンテキスト投影を行うべきであり、未サポートの内部実装を書き換えるべきではありません。

## Runtime selection

OpenClawは、providerとmodelの解決後に埋め込みruntimeを選択します。

1. セッションに記録されたruntimeが優先されます。config変更によって、既存transcriptを別のネイティブthread systemへホットスイッチすることはありません。
2. `OPENCLAW_AGENT_RUNTIME=<id>`は、新規またはリセットされたセッションに対してそのruntimeを強制します。
3. `agents.defaults.embeddedHarness.runtime`または`agents.list[].embeddedHarness.runtime`で、`auto`、`pi`、または`codex`のような登録済みruntime idを設定できます。
4. `auto`モードでは、登録済みplugin runtimeが対応するprovider/modelの組み合わせを引き受けることができます。
5. `auto`モードでどのruntimeもターンを引き受けず、`fallback: "pi"`が設定されている場合（デフォルト）、OpenClawは互換性フォールバックとしてPiを使用します。未一致の`auto`モード選択を失敗させたい場合は、`fallback: "none"`を設定してください。

明示的なplugin runtimeは、デフォルトでfail closedです。たとえば、`runtime: "codex"`は、同じ上書きスコープで`fallback: "pi"`を設定しない限り、Codexまたは明確な選択エラーを意味します。runtime overrideはより広いfallback設定を継承しないため、agentレベルの`runtime: "codex"`が、defaultsで`fallback: "pi"`を使っていたからといって、暗黙にPiへ戻されることはありません。

## Compatibility contract

runtimeがPiでない場合、そのruntimeは、どのOpenClaw surfaceをサポートするかを文書化すべきです。runtimeドキュメントには次の形式を使用してください。

| 問い | 重要である理由 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 誰がモデルループを所有するか | リトライ、ツール継続、最終回答の判断がどこで行われるかを決定します。 |
| 誰が正式なスレッド履歴を所有するか | OpenClawが履歴を編集できるのか、mirrorしかできないのかを決定します。 |
| OpenClaw dynamic toolsは動作するか | メッセージング、セッション、Cron、およびOpenClaw所有toolsはこれに依存します。 |
| dynamic tool hooksは動作するか | pluginは、OpenClaw所有toolsの周囲で`before_tool_call`、`after_tool_call`、middlewareを期待します。 |
| native tool hooksは動作するか | shell、patch、runtime所有toolsには、ポリシーと観測のためnative hookサポートが必要です。 |
| コンテキストエンジンのライフサイクルは動作するか | メモリとコンテキストpluginは、assemble、ingest、after-turn、Compactionライフサイクルに依存します。 |
| どのCompactionデータが公開されるか | pluginによっては通知だけで十分ですが、保持/破棄メタデータが必要なものもあります。 |
| 意図的に未サポートなものは何か | ネイティブruntimeがより多くの状態を所有する場合、ユーザーはPi同等と想定すべきではありません。 |

Codex runtimeのサポート契約は、[Codex harness](/ja-JP/plugins/codex-harness#v1-support-contract)に記載されています。

## Status labels

status出力には`Execution`と`Runtime`の両方のラベルが表示されることがあります。これらはprovider名ではなく診断情報として読んでください。

- `openai/gpt-5.5`のようなmodel refは、選択されたprovider/modelを示します。
- `codex`のようなruntime idは、どのループがそのターンを実行しているかを示します。
- TelegramやDiscordのようなchannel labelは、会話がどこで行われているかを示します。

runtime configを変更した後もセッションがPiのまま表示される場合は、`/new`で新しいセッションを開始するか、`/reset`で現在のセッションをクリアしてください。既存セッションは記録されたruntimeを保持するため、1つのtranscriptが互換性のない2つのネイティブsession systemを通して再生されることはありません。

## 関連

- [Codex harness](/ja-JP/plugins/codex-harness)
- [OpenAI](/ja-JP/providers/openai)
- [Agent harness plugins](/ja-JP/plugins/sdk-agent-harness)
- [Agent loop](/ja-JP/concepts/agent-loop)
- [Models](/ja-JP/concepts/models)
- [Status](/ja-JP/cli/status)
