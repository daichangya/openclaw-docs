---
read_when:
    - 組み込みエージェントランタイムまたはハーネスレジストリを変更しようとしています
    - 同梱 Plugin または信頼済み Plugin からエージェントハーネスを登録しようとしています
    - Codex Plugin がモデルプロバイダーとどのように関係するかを理解する必要があります
sidebarTitle: Agent Harness
summary: 低レベルの組み込みエージェント実行子を置き換える、Plugin 向けの実験的な SDK サーフェス
title: エージェントハーネス Plugin
x-i18n:
    generated_at: "2026-04-25T13:54:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: bceb0ccf51431918aec2dfca047af6ed916aa1a8a7c34ca38cb64a14655e4d50
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**エージェントハーネス** は、準備済みの OpenClaw エージェントターン 1 回分に対する低レベルの実行子です。これはモデルプロバイダーではなく、channel でもなく、ツールレジストリでもありません。ユーザー向けのメンタルモデルについては、[Agent runtimes](/ja-JP/concepts/agent-runtimes) を参照してください。

このサーフェスは、同梱または信頼済みのネイティブ Plugin にのみ使用してください。コントラクトは、パラメーター型が意図的に現在の組み込みランナーを反映しているため、まだ実験的です。

## ハーネスを使うべきタイミング

モデルファミリーが独自のネイティブセッションランタイムを持ち、通常の OpenClaw プロバイダートランスポートでは抽象化として不適切な場合は、エージェントハーネスを登録します。

例:

- スレッドと Compaction を管理するネイティブのコーディングエージェントサーバー
- ネイティブの plan/reasoning/tool イベントをストリーミングしなければならないローカル CLI またはデーモン
- OpenClaw のセッショントランスクリプトに加えて独自の resume id を必要とするモデルランタイム

新しい LLM API を追加するだけの目的でハーネスを登録してはいけません。通常の HTTP または WebSocket モデル API については、[provider plugin](/ja-JP/plugins/sdk-provider-plugins) を構築してください。

## コアが引き続き所有するもの

ハーネスが選択される前に、OpenClaw はすでに次を解決しています。

- provider と model
- ランタイム認証状態
- thinking level と context budget
- OpenClaw の transcript/session file
- workspace、sandbox、tool policy
- channel reply callback と streaming callback
- モデル fallback とライブモデル切り替えポリシー

この分離は意図的なものです。ハーネスは準備済みの試行を実行するものであり、provider を選択したり、channel 配信を置き換えたり、暗黙に model を切り替えたりはしません。

## ハーネスを登録する

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

OpenClaw は provider/model の解決後にハーネスを選択します。

1. 既存セッションに記録された harness id が優先されるため、config/env の変更によってその transcript が別のランタイムへホットスイッチされることはありません。
2. `OPENCLAW_AGENT_RUNTIME=<id>` は、すでに固定されていないセッションに対して、その id の登録済みハーネスを強制します。
3. `OPENCLAW_AGENT_RUNTIME=pi` は、組み込みの PI ハーネスを強制します。
4. `OPENCLAW_AGENT_RUNTIME=auto` は、登録済みハーネスに対して、解決済み provider/model をサポートするかどうかを問い合わせます。
5. 一致する登録済みハーネスがない場合、PI fallback が無効化されていなければ OpenClaw は PI を使用します。

Plugin ハーネスの失敗は、実行失敗として表面化します。`auto` モードでは、PI fallback が使われるのは、解決済み provider/model をサポートする登録済み Plugin ハーネスが存在しない場合だけです。Plugin ハーネスが一度実行を引き受けたら、OpenClaw は同じターンを PI で再実行しません。これは auth/runtime の意味論が変わったり、副作用が重複したりする可能性があるためです。

選択された harness id は、組み込み実行後に session id とともに永続化されます。ハーネス固定が導入される前に作成されたレガシーセッションは、transcript 履歴を持つ時点で PI 固定として扱われます。PI とネイティブ Plugin ハーネスを切り替える場合は、新しい/reset したセッションを使用してください。`/status` では、`codex` のようなデフォルト以外の harness id が `Fast` の横に表示されます。PI はデフォルトの互換性パスであるため表示されません。選択されたハーネスが想定外である場合は、`agents/harness` のデバッグログを有効にし、Gateway の構造化された `agent harness selected` レコードを確認してください。そこには、選択された harness id、選択理由、runtime/fallback ポリシー、および `auto` モードでは各 Plugin 候補のサポート結果が含まれます。

同梱の Codex Plugin は、`codex` をその harness id として登録します。コアはこれを通常の Plugin ハーネス id として扱います。Codex 固有のエイリアスは、共有ランタイムセレクターではなく、Plugin またはオペレーター設定に属します。

## provider と harness の組み合わせ

ほとんどのハーネスは provider も登録するべきです。provider によって、model ref、auth status、model metadata、`/model` 選択が OpenClaw の他の部分から見えるようになります。その上で、ハーネスは `supports(...)` でその provider を引き受けます。

同梱の Codex Plugin はこのパターンに従います。

- 推奨されるユーザー model ref: `openai/gpt-5.5` と `embeddedHarness.runtime: "codex"`
- 互換 ref: 従来の `codex/gpt-*` ref も引き続き受け付けられますが、新しい config では通常の provider/model ref として使用するべきではありません
- harness id: `codex`
- auth: 合成された provider availability。Codex ハーネスがネイティブな Codex login/session を所有するためです
- app-server request: OpenClaw は素の model id を Codex に送信し、ハーネスにネイティブ app-server プロトコルとの通信を任せます

Codex Plugin は追加的なものです。通常の `openai/gpt-*` ref は、`embeddedHarness.runtime: "codex"` で Codex ハーネスを強制しない限り、引き続き通常の OpenClaw provider パスを使用します。古い `codex/gpt-*` ref も、互換性のために引き続き Codex provider と harness を選択します。

オペレーター設定、model prefix の例、Codex 専用 config については、[Codex Harness](/ja-JP/plugins/codex-harness) を参照してください。

OpenClaw は Codex app-server `0.118.0` 以降を必要とします。Codex Plugin は app-server の initialize handshake を確認し、古いサーバーまたはバージョン未設定のサーバーをブロックすることで、OpenClaw が検証済みのプロトコルサーフェスに対してのみ実行されるようにします。

### ツール結果ミドルウェア

同梱 Plugin は、マニフェストの `contracts.agentToolResultMiddleware` で対象ランタイム id を宣言している場合、`api.registerAgentToolResultMiddleware(...)` を通じてランタイム中立のツール結果ミドルウェアを追加できます。この信頼済みシームは、PI または Codex がツール出力をモデルへ返す前に実行しなければならない、非同期のツール結果変換のためのものです。

レガシーな同梱 Plugin は、引き続き Codex app-server 専用ミドルウェアに `api.registerCodexAppServerExtensionFactory(...)` を使用できますが、新しい結果変換ではランタイム中立 API を使用するべきです。Pi 専用の `api.registerEmbeddedExtensionFactory(...)` フックは削除されました。Pi のツール結果変換では、ランタイム中立ミドルウェアを使用する必要があります。

### ネイティブ Codex ハーネスモード

同梱の `codex` ハーネスは、組み込み OpenClaw エージェントターン向けのネイティブ Codex モードです。まず同梱の `codex` Plugin を有効にし、config が制限付き allowlist を使用している場合は `plugins.allow` に `codex` を含めてください。ネイティブ app-server config では、`embeddedHarness.runtime: "codex"` を指定した `openai/gpt-*` を使用するべきです。PI 経由の Codex OAuth には代わりに `openai-codex/*` を使用してください。従来の `codex/*` model ref は、ネイティブハーネス向けの互換エイリアスとして引き続き残ります。

このモードが実行されると、Codex はネイティブ thread id、resume 動作、Compaction、app-server 実行を所有します。OpenClaw は引き続き chat channel、可視 transcript mirror、tool policy、approval、media delivery、session selection を所有します。実行を引き受けられるのが Codex app-server パスだけであることを証明する必要がある場合は、`fallback` の override を付けずに `embeddedHarness.runtime: "codex"` を使用してください。明示的な Plugin ランタイムは、デフォルトで失敗時に閉じる挙動になります。ハーネス選択が欠けている場合に意図的に PI に処理させたい場合のみ `fallback: "pi"` を設定してください。Codex app-server の失敗は、PI を通した再試行ではなく、すでに直接失敗します。

## PI fallback を無効にする

デフォルトでは、OpenClaw は `agents.defaults.embeddedHarness` を `{ runtime: "auto", fallback: "pi" }` に設定して組み込みエージェントを実行します。`auto` モードでは、登録済み Plugin ハーネスが provider/model の組み合わせを引き受けることができます。一致するものがなければ、OpenClaw は PI に fallback します。

`auto` モードでは、Plugin ハーネスが選択されない場合に PI を使わず失敗させる必要があるときは、`fallback: "none"` を設定してください。`runtime: "codex"` のような明示的な Plugin ランタイムは、同じ config または環境 override スコープで `fallback: "pi"` が設定されていない限り、デフォルトで失敗時に閉じる挙動になります。選択された Plugin ハーネスの失敗は常にハードフェイルします。これは明示的な `runtime: "pi"` または `OPENCLAW_AGENT_RUNTIME=pi` を妨げるものではありません。

Codex 専用の組み込み実行では:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex"
      }
    }
  }
}
```

登録済みの任意の Plugin ハーネスに一致する model を引き受けさせたいが、OpenClaw が暗黙に PI へ fallback することは決して望まない場合は、`runtime: "auto"` のまま fallback を無効化してください。

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

エージェント単位の override も同じ形を使います。

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
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` は、引き続き設定済みランタイムを override します。環境から PI fallback を無効にするには `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を使用してください。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

fallback が無効な場合、要求されたハーネスが登録されていない、解決済み provider/model をサポートしていない、またはターンの副作用を生み出す前に失敗したとき、セッションは早期に失敗します。これは Codex 専用デプロイや、Codex app-server パスが実際に使われていることを証明しなければならない live test では意図された動作です。

この設定が制御するのは組み込みエージェントハーネスのみです。image、video、music、TTS、PDF、またはその他の provider 固有モデルルーティングを無効にするものではありません。

## ネイティブセッションと transcript mirror

ハーネスは、ネイティブ session id、thread id、またはデーモン側の resume token を保持することがあります。その関連付けは OpenClaw セッションに明示的に結び付けたままにし、ユーザーに見える assistant/tool 出力を OpenClaw transcript にミラーし続けてください。

OpenClaw transcript は、引き続き次のための互換レイヤーです。

- channel に表示されるセッション履歴
- transcript の検索とインデックス作成
- 後続ターンで組み込み PI ハーネスへ戻すこと
- 汎用の `/new`、`/reset`、およびセッション削除動作

ハーネスが sidecar binding を保存する場合は、所有する OpenClaw セッションが reset されたときに OpenClaw がそれを消去できるよう、`reset(...)` を実装してください。

## ツールとメディアの結果

コアは OpenClaw のツールリストを構築し、それを準備済み試行に渡します。ハーネスが動的ツール呼び出しを実行する場合は、channel media を自分で送信するのではなく、ハーネス結果の形を通じてツール結果を返してください。

これにより、text、image、video、music、TTS、approval、messaging-tool 出力が、PI ベースの実行と同じ配信パスに保たれます。

## 現在の制限事項

- 公開 import パスは汎用的ですが、一部の試行/結果型エイリアスには互換性のためにまだ `Pi` という名前が残っています。
- サードパーティハーネスのインストールは実験的です。ネイティブセッションランタイムが必要になるまでは provider plugin を優先してください。
- ターンをまたいだハーネス切り替えはサポートされています。ネイティブツール、approval、assistant text、または message send が始まった後で、ターンの途中にハーネスを切り替えないでください。

## 関連

- [SDK Overview](/ja-JP/plugins/sdk-overview)
- [Runtime Helpers](/ja-JP/plugins/sdk-runtime)
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins)
- [Codex Harness](/ja-JP/plugins/codex-harness)
- [Model Providers](/ja-JP/concepts/model-providers)
