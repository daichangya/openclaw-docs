---
read_when:
    - 組み込みエージェントランタイムまたはハーネスレジストリを変更しています
    - バンドル済みまたは信頼されたプラグインからエージェントハーネスを登録しています
    - Codexプラグインがモデルプロバイダーとどのように関係しているかを理解する必要があります
sidebarTitle: Agent Harness
summary: 低レベルの組み込みエージェント実行器を置き換えるプラグイン向けの実験的なSDKサーフェス
title: エージェントハーネスプラグイン
x-i18n:
    generated_at: "2026-04-12T00:18:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62b88fd24ce8b600179db27e16e8d764a2cd7a14e5c5df76374c33121aa5e365
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# エージェントハーネスプラグイン

**エージェントハーネス**は、準備済みのOpenClawエージェントの1ターンを実行する低レベル実行器です。これはモデルプロバイダーでも、チャネルでも、ツールレジストリでもありません。

このサーフェスは、バンドル済みまたは信頼されたネイティブプラグインにのみ使用してください。パラメーター型が意図的に現在の組み込みランナーを反映しているため、この契約はまだ実験的です。

## ハーネスを使用する場合

モデルファミリーが独自のネイティブセッションランタイムを持ち、通常のOpenClawプロバイダー転送が不適切な抽象化である場合は、エージェントハーネスを登録します。

例:

- スレッドとコンパクションを管理するネイティブのコーディングエージェントサーバー
- ネイティブのプランニング/推論/ツールイベントをストリーミングする必要があるローカルCLIまたはデーモン
- OpenClawセッショントランスクリプトに加えて独自の再開IDが必要なモデルランタイム

新しいLLM APIを追加するためだけにハーネスを登録しないでください。通常のHTTPまたはWebSocketモデルAPIでは、[プロバイダープラグイン](/ja-JP/plugins/sdk-provider-plugins)を構築してください。

## コアが引き続き管理するもの

ハーネスが選択される前に、OpenClawはすでに次を解決しています。

- プロバイダーとモデル
- ランタイム認証状態
- 思考レベルとコンテキスト予算
- OpenClawトランスクリプト/セッションファイル
- ワークスペース、サンドボックス、ツールポリシー
- チャネル返信コールバックとストリーミングコールバック
- モデルフォールバックとライブモデル切り替えポリシー

この分離は意図的なものです。ハーネスは準備済みの試行を実行するものであり、プロバイダーを選択したり、チャネル配信を置き換えたり、モデルを黙って切り替えたりするものではありません。

## ハーネスを登録する

**インポート:** `openclaw/plugin-sdk/agent-harness`

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

OpenClawは、プロバイダー/モデルの解決後にハーネスを選択します。

1. `OPENCLAW_AGENT_RUNTIME=<id>` は、そのIDを持つ登録済みハーネスを強制します。
2. `OPENCLAW_AGENT_RUNTIME=pi` は、組み込みのPIハーネスを強制します。
3. `OPENCLAW_AGENT_RUNTIME=auto` は、解決済みのプロバイダー/モデルをサポートするかどうかを登録済みハーネスに問い合わせます。
4. 一致する登録済みハーネスがない場合、PIフォールバックが無効でない限り、OpenClawはPIを使用します。

強制されたプラグインハーネスの失敗は、実行失敗として表面化します。`auto` モードでは、選択されたプラグインハーネスがターンの副作用を生成する前に失敗した場合、OpenClawはPIにフォールバックすることがあります。その代わりにそのフォールバックをハード失敗にするには、`OPENCLAW_AGENT_HARNESS_FALLBACK=none` または `embeddedHarness.fallback: "none"` を設定してください。

バンドル済みのCodexプラグインは、ハーネスIDとして `codex` を登録します。コアはこれを通常のプラグインハーネスIDとして扱います。Codex固有のエイリアスは、共有ランタイムセレクターではなく、プラグインまたはオペレーター設定に属します。

## プロバイダーとハーネスのペアリング

ほとんどのハーネスは、プロバイダーも登録するべきです。プロバイダーにより、モデル参照、認証状態、モデルメタデータ、`/model` 選択がOpenClawの他の部分から見えるようになります。その後、ハーネスは `supports(...)` でそのプロバイダーを要求します。

バンドル済みのCodexプラグインは、このパターンに従います。

- プロバイダーID: `codex`
- ユーザーモデル参照: `codex/gpt-5.4`、`codex/gpt-5.2`、またはCodexアプリサーバーが返す別のモデル
- ハーネスID: `codex`
- 認証: 合成プロバイダー可用性。CodexハーネスがネイティブのCodexログイン/セッションを管理するため
- アプリサーバーリクエスト: OpenClawは生のモデルIDをCodexに送信し、ハーネスがネイティブのアプリサーバープロトコルと通信します

Codexプラグインは追加的なものです。通常の `openai/gpt-*` 参照は引き続きOpenAIプロバイダー参照のままで、通常のOpenClawプロバイダーパスを使用し続けます。`codex/gpt-*` は、Codex管理の認証、Codexモデル検出、ネイティブスレッド、Codexアプリサーバー実行が必要な場合に選択してください。`/model` は、OpenAIプロバイダー資格情報を必要とせずに、Codexアプリサーバーが返すCodexモデル間を切り替えられます。

オペレーター設定、モデル接頭辞の例、Codex専用設定については、[Codexハーネス](/ja-JP/plugins/codex-harness)を参照してください。

OpenClawは、Codexアプリサーバー `0.118.0` 以降を必要とします。Codexプラグインはアプリサーバーの初期化ハンドシェイクを確認し、古いサーバーまたはバージョンなしのサーバーをブロックすることで、OpenClawがテスト済みのプロトコルサーフェスに対してのみ実行されるようにします。

### ネイティブCodexハーネスモード

バンドル済みの `codex` ハーネスは、組み込みOpenClawエージェントターン向けのネイティブCodexモードです。最初にバンドル済みの `codex` プラグインを有効にし、設定で制限付きallowlistを使用している場合は `plugins.allow` に `codex` を含めてください。これは `openai-codex/*` とは異なります。

- `openai-codex/*` は、通常のOpenClawプロバイダーパスを通じてChatGPT/Codex OAuthを使用します。
- `codex/*` は、バンドル済みのCodexプロバイダーを使用し、ターンをCodexアプリサーバー経由でルーティングします。

このモードが実行されると、CodexがネイティブスレッドID、再開動作、コンパクション、アプリサーバー実行を管理します。OpenClawは引き続き、チャットチャネル、表示用トランスクリプトミラー、ツールポリシー、承認、メディア配信、セッション選択を管理します。Codexアプリサーバーパスが使用されており、PIフォールバックが壊れたネイティブハーネスを隠していないことを証明する必要がある場合は、`embeddedHarness.runtime: "codex"` と `embeddedHarness.fallback: "none"` を使用してください。

## PIフォールバックを無効にする

デフォルトでは、OpenClawは組み込みエージェントを `agents.defaults.embeddedHarness` を `{ runtime: "auto", fallback: "pi" }` に設定して実行します。`auto` モードでは、登録済みプラグインハーネスがプロバイダー/モデルの組み合わせを要求できます。一致するものがない場合、または自動選択されたプラグインハーネスが出力を生成する前に失敗した場合、OpenClawはPIにフォールバックします。

プラグインハーネスだけが実行されていることを証明する必要がある場合は、`fallback: "none"` を設定してください。これにより自動PIフォールバックは無効になりますが、明示的な `runtime: "pi"` または `OPENCLAW_AGENT_RUNTIME=pi` は妨げられません。

Codex専用の組み込み実行の場合:

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

登録済みの任意のプラグインハーネスが一致するモデルを要求できるようにしつつ、OpenClawがPIに黙ってフォールバックすることは望まない場合は、`runtime: "auto"` のままにしてフォールバックを無効にしてください。

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

エージェントごとのオーバーライドでも同じ形を使用します。

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

`OPENCLAW_AGENT_RUNTIME` は、引き続き設定されたランタイムを上書きします。環境からPIフォールバックを無効にするには、`OPENCLAW_AGENT_HARNESS_FALLBACK=none` を使用してください。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

フォールバックを無効にすると、要求されたハーネスが登録されていない、解決済みのプロバイダー/モデルをサポートしていない、またはターンの副作用を生成する前に失敗した場合、セッションは早い段階で失敗します。これは、Codex専用デプロイメントや、Codexアプリサーバーパスが実際に使用されていることを証明しなければならないライブテストでは意図された動作です。

この設定は、組み込みエージェントハーネスのみを制御します。画像、動画、音楽、TTS、PDF、その他のプロバイダー固有のモデルルーティングは無効にしません。

## ネイティブセッションとトランスクリプトミラー

ハーネスは、ネイティブセッションID、スレッドID、またはデーモン側の再開トークンを保持する場合があります。その関連付けはOpenClawセッションに明示的に結び付けたままにし、ユーザーに表示されるアシスタント/ツール出力を引き続きOpenClawトランスクリプトへミラーリングしてください。

OpenClawトランスクリプトは、引き続き次の互換レイヤーです。

- チャネルに表示されるセッション履歴
- トランスクリプト検索とインデックス作成
- 後のターンで組み込みPIハーネスに戻すこと
- 汎用的な `/new`、`/reset`、およびセッション削除の動作

ハーネスがサイドカーの関連付けを保存する場合は、所有するOpenClawセッションがリセットされたときにOpenClawがそれを消去できるよう、`reset(...)` を実装してください。

## ツールとメディアの結果

コアはOpenClawツールリストを構築し、それを準備済みの試行に渡します。ハーネスが動的ツール呼び出しを実行する場合、チャネルメディアを自分で送信するのではなく、ハーネス結果の形を通してツール結果を返してください。

これにより、テキスト、画像、動画、音楽、TTS、承認、メッセージングツールの出力が、PIベースの実行と同じ配信パスに保たれます。

## 現在の制限

- 公開インポートパスは汎用ですが、互換性のために一部の試行/結果型エイリアスにはまだ `Pi` という名前が残っています。
- サードパーティ製ハーネスのインストールは実験的です。ネイティブセッションランタイムが必要になるまでは、プロバイダープラグインを優先してください。
- ターン間でのハーネス切り替えはサポートされています。ネイティブツール、承認、アシスタントテキスト、またはメッセージ送信が始まった後に、ターンの途中でハーネスを切り替えないでください。

## 関連

- [SDK概要](/ja-JP/plugins/sdk-overview)
- [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)
- [プロバイダープラグイン](/ja-JP/plugins/sdk-provider-plugins)
- [Codexハーネス](/ja-JP/plugins/codex-harness)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
