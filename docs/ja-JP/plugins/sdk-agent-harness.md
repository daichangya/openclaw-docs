---
read_when:
    - 組み込みエージェントランタイムまたはハーネスレジストリを変更している場合
    - バンドル済みまたは信頼済みの Plugin からエージェントハーネスを登録している場合
    - Codex Plugin がモデルプロバイダーとどのように関係するかを理解する必要がある場合
sidebarTitle: Agent Harness
summary: 低レベルの組み込みエージェント実行器を置き換える Plugin 向けの実験的 SDK サーフェス
title: Agent Harness Plugins
x-i18n:
    generated_at: "2026-04-23T04:47:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: efaecca18210af0e9e641bd888c1edb55e08e96299158ff021d6c2dd0218ec25
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Agent Harness Plugins

**agent harness** とは、準備済みの OpenClaw エージェントターン 1 回分を実行する低レベル実行器です。これはモデルプロバイダーでも、チャンネルでも、ツールレジストリでもありません。

このサーフェスは、バンドル済みまたは信頼済みのネイティブ Plugin にのみ使用してください。コントラクトは、パラメーター型が意図的に現在の組み込みランナーを反映しているため、まだ実験的です。

## harness を使うべき場合

モデルファミリーが独自のネイティブセッションランタイムを持ち、通常の OpenClaw プロバイダートランスポートが不適切な抽象化である場合に、agent harness を登録してください。

例:

- スレッドと Compaction を管理するネイティブなコーディングエージェントサーバー
- ネイティブの plan/reasoning/tool イベントをストリーミングしなければならないローカル CLI またはデーモン
- OpenClaw セッショントランスクリプトに加えて独自の resume id を必要とするモデルランタイム

新しい LLM API を追加するだけの目的で harness を登録してはいけません。通常の HTTP または WebSocket モデル API には、[provider plugin](/ja-JP/plugins/sdk-provider-plugins) を構築してください。

## コアが引き続き所有するもの

harness が選択される前に、OpenClaw はすでに次を解決しています。

- provider と model
- ランタイム認証状態
- thinking レベルとコンテキスト予算
- OpenClaw トランスクリプト/セッションファイル
- ワークスペース、sandbox、およびツールポリシー
- チャンネル返信コールバックとストリーミングコールバック
- モデルフォールバックとライブモデル切り替えポリシー

この分離は意図的なものです。harness は準備済みの試行を実行するのであって、provider を選択したり、チャンネル配信を置き換えたり、モデルを黙って切り替えたりはしません。

## harness の登録

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## 選択ポリシー

OpenClaw は provider/model 解決後に harness を選択します。

1. `OPENCLAW_AGENT_RUNTIME=<id>` は、その id を持つ登録済み harness を強制します。
2. `OPENCLAW_AGENT_RUNTIME=pi` は、組み込みの PI harness を強制します。
3. `OPENCLAW_AGENT_RUNTIME=auto` は、登録済み harness に対して、解決済みの provider/model をサポートするか問い合わせます。
4. 一致する登録済み harness がない場合、PI fallback が無効でなければ OpenClaw は PI を使用します。

Plugin harness の失敗は、実行失敗として表面化します。`auto` モードでは、解決済みの
provider/model をサポートする登録済み Plugin harness がない場合にのみ、PI fallback が使用されます。いったん Plugin harness が実行を引き受けた後は、認証/ランタイムの意味論が変化したり副作用が重複したりする可能性があるため、OpenClaw は同じターンを PI で再実行しません。

バンドル済み Codex Plugin は、その harness id として `codex` を登録します。コアはこれを通常の Plugin harness id として扱います。Codex 固有のエイリアスは、共有ランタイムセレクターではなく、Plugin または運用者設定に属するべきです。

## provider と harness の組み合わせ

ほとんどの harness は provider も登録するべきです。provider によって、モデル参照、
認証状態、モデルメタデータ、および `/model` 選択が OpenClaw の他の部分から見えるようになります。その後 harness が `supports(...)` でその provider を引き受けます。

バンドル済み Codex Plugin はこのパターンに従っています。

- provider id: `codex`
- ユーザーモデル参照: `codex/gpt-5.4`、`codex/gpt-5.2`、または Codex app server が返すその他の model
- harness id: `codex`
- auth: 合成された provider 可用性。Codex harness がネイティブの Codex ログイン/セッションを所有するため
- app-server request: OpenClaw は裸の model id を Codex に送り、harness にネイティブ app-server プロトコルを話させます

Codex Plugin は加算的です。通常の `openai/gpt-*` 参照は OpenAI provider 参照のままであり、通常の OpenClaw provider パスを引き続き使用します。Codex 管理の auth、Codex モデル検出、ネイティブスレッド、および Codex app-server 実行が必要な場合は `codex/gpt-*` を選択してください。`/model` は、OpenAI provider の認証情報を必要とせずに、Codex app server が返す Codex モデル間を切り替えられます。

運用者向けセットアップ、モデルプレフィックスの例、および Codex 専用設定については、
[Codex Harness](/ja-JP/plugins/codex-harness) を参照してください。

OpenClaw は Codex app-server `0.118.0` 以上を必要とします。Codex Plugin は
app-server の initialize ハンドシェイクを確認し、バージョンの古いサーバーやバージョン情報のないサーバーをブロックすることで、OpenClaw がテスト済みのプロトコルサーフェスに対してのみ実行されるようにします。

### Codex app-server tool-result middleware

バンドル済み Plugin は、その manifest で `contracts.embeddedExtensionFactories: ["codex-app-server"]` を宣言している場合、`api.registerCodexAppServerExtensionFactory(...)` を通じて Codex app-server 固有の `tool_result` middleware もアタッチできます。これは、ツール出力が OpenClaw トランスクリプトに投影される前に、ネイティブ Codex harness 内で実行する必要がある非同期ツール結果変換のための、信頼済み Plugin 向けの継ぎ目です。

### ネイティブ Codex harness モード

バンドル済みの `codex` harness は、組み込み OpenClaw
エージェントターン用のネイティブ Codex モードです。まずバンドル済み `codex` Plugin を有効にし、設定で制限付き allowlist を使用している場合は `plugins.allow` に `codex` を含めてください。これは `openai-codex/*` とは異なります。

- `openai-codex/*` は通常の OpenClaw provider パスを通じて ChatGPT/Codex OAuth を使用します。
- `codex/*` はバンドル済み Codex provider を使用し、ターンを Codex
  app-server 経由でルーティングします。

このモードが実行されると、Codex がネイティブスレッド id、resume 動作、
Compaction、および app-server 実行を所有します。OpenClaw は引き続きチャットチャンネル、
可視トランスクリプトミラー、ツールポリシー、承認、メディア配信、およびセッション選択を所有します。Codex app-server パスだけがその実行を引き受けられることを証明する必要がある場合は、`embeddedHarness.runtime: "codex"` と
`embeddedHarness.fallback: "none"` を使用してください。この設定は選択ガードにすぎません。Codex app-server の失敗は、すでに PI を通じて再試行されず直接失敗します。

## PI fallback を無効にする

デフォルトでは、OpenClaw は組み込みエージェントを `agents.defaults.embeddedHarness`
を `{ runtime: "auto", fallback: "pi" }` に設定した状態で実行します。`auto` モードでは、登録済み Plugin
harness が provider/model の組み合わせを引き受けることができます。一致するものがなければ、OpenClaw は PI にフォールバックします。

Plugin harness の選択漏れ時に PI を使わず失敗させたい場合は、`fallback: "none"` を設定してください。選択済み Plugin harness の失敗は、すでにハードに失敗します。これは明示的な `runtime: "pi"` や `OPENCLAW_AGENT_RUNTIME=pi` を妨げません。

Codex 専用の組み込み実行の場合:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

一致するモデルを任意の登録済み Plugin harness に引き受けさせつつも、OpenClaw が黙って PI にフォールバックすることを決して望まない場合は、`runtime: "auto"` を維持し、fallback を無効にしてください。

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

エージェントごとのオーバーライドも同じ形を使います。

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` は引き続き設定済みランタイムを上書きします。環境から
PI fallback を無効にするには `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を使用してください。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

fallback を無効にすると、要求された harness が登録されていない、解決済みの provider/model をサポートしていない、またはターンの副作用を生成する前に失敗した場合に、セッションは早期に失敗します。これは Codex 専用デプロイや、Codex app-server パスが実際に使用されていることを証明しなければならない live test のために意図された動作です。

この設定が制御するのは組み込み agent harness だけです。画像、動画、音楽、TTS、PDF、その他の provider 固有のモデルルーティングは無効にしません。

## ネイティブセッションとトランスクリプトミラー

harness はネイティブ session id、thread id、またはデーモン側の resume token を保持する場合があります。そのバインディングは OpenClaw セッションに明示的に関連付けたままにし、ユーザーに見える assistant/tool 出力を OpenClaw トランスクリプトに引き続きミラーしてください。

OpenClaw トランスクリプトは、次のための互換レイヤーとして残ります。

- チャンネルに見えるセッション履歴
- トランスクリプトの検索とインデックス作成
- 後続ターンで組み込み PI harness に戻すこと
- 汎用的な `/new`、`/reset`、およびセッション削除動作

harness が sidecar バインディングを保存する場合は、その所有する OpenClaw セッションがリセットされたときに OpenClaw がそれをクリアできるよう、`reset(...)` を実装してください。

## ツール結果とメディア結果

コアは OpenClaw ツール一覧を構築し、それを準備済み試行に渡します。harness が動的ツール呼び出しを実行する場合、チャンネルメディアを自分で送信するのではなく、harness 結果の形を通じてツール結果を返してください。

これにより、テキスト、画像、動画、音楽、TTS、承認、およびメッセージングツールの出力が、PI ベース実行と同じ配信パスに保たれます。

## 現在の制限

- 公開 import パスは汎用的ですが、一部の試行/結果型エイリアスは互換性のために依然として
  `Pi` 名を含んでいます。
- サードパーティ harness のインストールは実験的です。ネイティブセッションランタイムが必要になるまでは provider plugin を優先してください。
- harness の切り替えはターン間でサポートされています。ネイティブツール、承認、assistant テキスト、またはメッセージ送信が始まった後のターン途中で harness を切り替えてはいけません。

## 関連

- [SDK Overview](/ja-JP/plugins/sdk-overview)
- [Runtime Helpers](/ja-JP/plugins/sdk-runtime)
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins)
- [Codex Harness](/ja-JP/plugins/codex-harness)
- [Model Providers](/ja-JP/concepts/model-providers)
