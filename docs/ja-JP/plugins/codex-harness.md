---
read_when:
    - 同梱のCodex app-serverハーネスを使いたい場合
    - Codexモデル参照と設定例が必要です
    - Codex専用デプロイ向けにPiフォールバックを無効にしたい場合
summary: 同梱のCodex app-serverハーネスを通してOpenClaw埋め込みエージェントターンを実行する
title: Codexハーネス
x-i18n:
    generated_at: "2026-04-24T08:59:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: c02b1e6cbaaefee858db7ebd7e306261683278ed9375bca6fe74855ca84eabd8
    source_path: plugins/codex-harness.md
    workflow: 15
---

同梱の`codex` Pluginを使うと、OpenClawは組み込みエージェントターンを、組み込みのPiハーネスではなくCodex app-server経由で実行できます。

これは、低レベルのエージェントセッションをCodexに任せたい場合に使用します。対象は、モデル検出、ネイティブなスレッド再開、ネイティブCompaction、app-server実行です。OpenClawは引き続き、チャットチャネル、セッションファイル、モデル選択、ツール、承認、メディア配信、およびユーザーに見えるトランスクリプトミラーを管理します。

ネイティブCodexターンでは、OpenClawのPluginフックが公開互換レイヤーとして維持されます。これらはプロセス内のOpenClawフックであり、Codexの`hooks.json`コマンドフックではありません。

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- ミラーされたトランスクリプトレコード向けの`before_message_write`
- `agent_end`

同梱Pluginは、非同期の`tool_result`ミドルウェアを追加するためのCodex app-server extension factoryも登録できます。このミドルウェアは、OpenClawが動的ツールを実行した後、結果がCodexへ返される前に実行されます。これは、OpenClaw管理のトランスクリプトに対するツール結果書き込みを変換する公開`tool_result_persist` Pluginフックとは別物です。

このハーネスはデフォルトで無効です。新しい設定では、OpenAIモデル参照を`openai/gpt-*`の正規形に保ち、ネイティブapp-server実行を使いたい場合は`embeddedHarness.runtime: "codex"`または`OPENCLAW_AGENT_RUNTIME=codex`を明示的に指定してください。レガシーの`codex/*`モデル参照は、互換性のため引き続き自動的にハーネスを選択します。

## 正しいモデル接頭辞を選ぶ

OpenAI系ルートは接頭辞ごとに分かれています。PI経由でCodex OAuthを使いたい場合は`openai-codex/*`を、直接OpenAI APIアクセスを使いたい場合、またはネイティブCodex app-serverハーネスを強制したい場合は`openai/*`を使ってください。

| モデル参照                                            | ランタイム経路                               | 使用する場面                                                               |
| ----------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | OpenClaw/PI経由のOpenAIプロバイダー経路      | `OPENAI_API_KEY`を使った現在の直接OpenAI Platform APIアクセスが必要な場合。 |
| `openai-codex/gpt-5.5`                                | OpenClaw/PI経由のOpenAI Codex OAuth          | デフォルトのPIランナーでChatGPT/Codexサブスクリプション認証を使いたい場合。 |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-serverハーネス                     | 組み込みエージェントターンでネイティブCodex app-server実行を使いたい場合。  |

現在、GPT-5.5はOpenClawではサブスクリプション/OAuth専用です。PI OAuthには`openai-codex/gpt-5.5`を使うか、Codex app-serverハーネスと組み合わせて`openai/gpt-5.5`を使ってください。`openai/gpt-5.5`に対する直接APIキーアクセスは、OpenAIが公開APIでGPT-5.5を有効にした時点でサポートされます。

レガシーの`codex/gpt-*`参照は、互換エイリアスとして引き続き受け付けられます。新しいPI Codex OAuth設定では`openai-codex/gpt-*`を、新しいネイティブapp-serverハーネス設定では`openai/gpt-*`に加えて`embeddedHarness.runtime: "codex"`を使ってください。

`agents.defaults.imageModel`も同じ接頭辞分割に従います。画像理解をOpenAI Codex OAuthプロバイダー経路で実行したい場合は`openai-codex/gpt-*`を使ってください。画像理解を制限付きのCodex app-serverターンで実行したい場合は`codex/gpt-*`を使ってください。Codex app-serverモデルは画像入力対応を公開している必要があります。テキスト専用のCodexモデルでは、メディアターン開始前に失敗します。

現在のセッションで実際に使われているハーネスは`/status`で確認してください。選択結果が予想外なら、`agents/harness`サブシステムのデバッグログを有効にし、Gatewayの構造化ログにある`agent harness selected`レコードを確認してください。そこには、選択されたハーネスid、選択理由、runtime/fallbackポリシー、および`auto`モードでは各Plugin候補のサポート結果が含まれます。

ハーネス選択はライブセッション制御ではありません。組み込みターンが実行されると、OpenClawはそのセッションに対して選択されたハーネスidを記録し、同じセッションidの後続ターンでもそれを使い続けます。今後のセッションで別のハーネスを使いたい場合は、`embeddedHarness`設定または`OPENCLAW_AGENT_RUNTIME`を変更してください。既存の会話をPiとCodexの間で切り替える前には、`/new`または`/reset`で新しいセッションを開始してください。これにより、互換性のない2つのネイティブセッションシステムに同じトランスクリプトを再生してしまうことを防げます。

ハーネス固定導入前に作成されたレガシーセッションは、トランスクリプト履歴を持っている場合、Pi固定として扱われます。設定変更後にその会話をCodexへ切り替えたい場合は、`/new`または`/reset`を使ってください。

`/status`では、有効な非PIハーネスが`Fast`の横に表示されます。たとえば`Fast · codex`です。デフォルトのPiハーネスは引き続き`Runner: pi (embedded)`として表示され、個別のハーネスバッジは追加されません。

## 要件

- 同梱の`codex` Pluginが利用可能なOpenClaw
- Codex app-server `0.118.0`以降
- app-serverプロセスから利用可能なCodex認証

このPluginは、古いapp-serverハンドシェイク、またはバージョン情報のないapp-serverハンドシェイクを拒否します。これにより、OpenClawは検証済みのプロトコル面に留まります。

ライブおよびDockerスモークテストでは、通常、認証は`OPENAI_API_KEY`、加えて`~/.codex/auth.json`や`~/.codex/config.toml`のような任意のCodex CLIファイルから提供されます。ローカルのCodex app-serverが使っているものと同じ認証情報を使用してください。

## 最小構成

`openai/gpt-5.5`を使い、同梱Pluginを有効にし、`codex`ハーネスを強制します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

設定で`plugins.allow`を使っている場合は、そこにも`codex`を含めてください。

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

`agents.defaults.model`またはエージェントモデルに`codex/<model>`を設定するレガシー設定では、引き続き同梱の`codex` Pluginが自動有効化されます。新しい設定では、上記の明示的な`embeddedHarness`エントリとともに`openai/<model>`を使うことを推奨します。

## 他のモデルを置き換えずにCodexを追加する

レガシーの`codex/*`参照でCodexを選び、それ以外はすべてPIにしたい場合は、`runtime: "auto"`を維持してください。新しい設定では、ハーネスを使わせたいエージェントに対して明示的に`runtime: "codex"`を指定することを推奨します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

この構成では:

- `/model gpt`または`/model openai/gpt-5.5`は、この設定ではCodex app-serverハーネスを使います。
- `/model opus`はAnthropicプロバイダー経路を使います。
- 非Codexモデルが選ばれた場合、PIが互換ハーネスのまま残ります。

## Codex専用デプロイ

すべての組み込みエージェントターンがCodexハーネスを使うことを保証したい場合は、Piフォールバックを無効にしてください。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

環境変数による上書き:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

フォールバックを無効にすると、Codex Pluginが無効、app-serverが古すぎる、またはapp-serverが起動できない場合に、OpenClawは早い段階で失敗します。

## エージェント単位のCodex

デフォルトエージェントは通常の自動選択のままにしつつ、1つのエージェントだけをCodex専用にできます。

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

通常のセッションコマンドでエージェントやモデルを切り替えてください。`/new`は新しいOpenClawセッションを作成し、Codexハーネスは必要に応じてそのsidecar app-serverスレッドを作成または再開します。`/reset`はそのスレッドに対するOpenClawセッションバインディングをクリアし、次のターンで現在の設定から再びハーネスを解決できるようにします。

## モデル検出

デフォルトでは、Codex Pluginは利用可能なモデルをapp-serverに問い合わせます。検出が失敗またはタイムアウトした場合は、次のための同梱フォールバックカタログを使います。

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

検出は`plugins.entries.codex.config.discovery`で調整できます。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

起動時にCodexへのprobeを避けて、フォールバックカタログに固定したい場合は、検出を無効にしてください。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## App-server接続とポリシー

デフォルトでは、このPluginはローカルで次のようにCodexを起動します。

```bash
codex app-server --listen stdio://
```

デフォルトでは、OpenClawはローカルCodexハーネスセッションをYOLOモードで起動します。設定は`approvalPolicy: "never"`、`approvalsReviewer: "user"`、`sandbox: "danger-full-access"`です。これは、自律Heartbeatで使われる信頼済みローカルオペレータ姿勢です。誰も応答できないネイティブ承認プロンプトで止まることなく、Codexがシェルやネットワークツールを使えるようにするためです。

Codexのguardianレビュー付き承認を有効にしたい場合は、`appServer.mode: "guardian"`を設定してください。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Guardianは、Codexネイティブの承認レビュアーです。Codexがサンドボックス外へのアクセス、ワークスペース外への書き込み、またはネットワークアクセスのような権限追加を求めると、Codexはその承認要求を人間へのプロンプトではなくレビュアーsubagentへ送ります。レビュアーはCodexのリスクフレームワークを適用し、その特定の要求を承認または拒否します。YOLOモードよりもガードレールを強めつつ、無人のエージェントでも進行できるようにしたい場合はGuardianを使ってください。

`guardian`プリセットは、`approvalPolicy: "on-request"`、`approvalsReviewer: "guardian_subagent"`、`sandbox: "workspace-write"`へ展開されます。個々のポリシーフィールドは引き続き`mode`を上書きするため、高度なデプロイではこのプリセットと明示的な指定を組み合わせることができます。

すでに起動中のapp-serverを使う場合は、WebSocketトランスポートを使います。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

サポートされる`appServer`フィールド:

| フィールド            | デフォルト                                 | 意味                                                                                          |
| --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `transport`           | `"stdio"`                                  | `"stdio"`はCodexを起動し、`"websocket"`は`url`へ接続します。                                  |
| `command`             | `"codex"`                                  | stdioトランスポート用の実行ファイル。                                                         |
| `args`                | `["app-server", "--listen", "stdio://"]`   | stdioトランスポート用の引数。                                                                 |
| `url`                 | 未設定                                     | WebSocket app-server URL。                                                                    |
| `authToken`           | 未設定                                     | WebSocketトランスポート用のBearerトークン。                                                   |
| `headers`             | `{}`                                       | 追加のWebSocketヘッダー。                                                                     |
| `requestTimeoutMs`    | `60000`                                    | app-serverのcontrol-plane呼び出しのタイムアウト。                                             |
| `mode`                | `"yolo"`                                   | YOLO実行またはguardianレビュー付き実行のプリセット。                                          |
| `approvalPolicy`      | `"never"`                                  | スレッド開始/再開/ターン時に送信されるネイティブCodex承認ポリシー。                           |
| `sandbox`             | `"danger-full-access"`                     | スレッド開始/再開時に送信されるネイティブCodexサンドボックスモード。                          |
| `approvalsReviewer`   | `"user"`                                   | Codex Guardianにプロンプトをレビューさせるには`"guardian_subagent"`を使います。               |
| `serviceTier`         | 未設定                                     | 任意のCodex app-server service tier: `"fast"`、`"flex"`、または`null`。無効なレガシー値は無視されます。 |

古い環境変数も、対応する設定フィールドが未設定の場合は、ローカルテスト用のフォールバックとして引き続き使えます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`は削除されました。代わりに`plugins.entries.codex.config.appServer.mode: "guardian"`を使ってください。単発のローカルテストでは`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`も使えます。再現可能なデプロイでは、Codexハーネス設定のほかの部分と同じレビュー済みファイルにPlugin挙動を保持できるため、設定ファイルの使用を推奨します。

## よくあるレシピ

デフォルトのstdioトランスポートを使うローカルCodex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

PIフォールバックを無効にした、Codex専用ハーネスの検証:

```json5
{
  embeddedHarness: {
    fallback: "none",
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Guardianレビュー付きCodex承認:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

明示的ヘッダーを使うリモートapp-server:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

モデル切り替えは引き続きOpenClawが管理します。OpenClawセッションが既存のCodexスレッドに接続されている場合、次のターンで現在選択されているOpenAIモデル、プロバイダー、承認ポリシー、サンドボックス、service tierが再度app-serverへ送信されます。`openai/gpt-5.5`から`openai/gpt-5.2`へ切り替えると、スレッドバインディングは維持されますが、新しく選択されたモデルで継続するようCodexへ要求します。

## Codexコマンド

同梱Pluginは、認可済みスラッシュコマンドとして`/codex`を登録します。これは汎用で、OpenClawのテキストコマンドをサポートする任意のチャネルで動作します。

よく使う形式:

- `/codex status` は、app-server接続性、モデル、アカウント、レート制限、MCPサーバー、Skillsのライブ状態を表示します。
- `/codex models` は、現在のCodex app-serverモデルを一覧表示します。
- `/codex threads [filter]` は、最近のCodexスレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在のOpenClawセッションを既存のCodexスレッドへ接続します。
- `/codex compact` は、接続済みスレッドのCompactionをCodex app-serverへ要求します。
- `/codex review` は、接続済みスレッドに対してCodexネイティブレビューを開始します。
- `/codex account` は、アカウントとレート制限の状態を表示します。
- `/codex mcp` は、Codex app-serverのMCPサーバー状態を一覧表示します。
- `/codex skills` は、Codex app-serverのSkillsを一覧表示します。

`/codex resume`は、ハーネスが通常ターンで使うのと同じsidecarバインディングファイルを書き込みます。次のメッセージで、OpenClawはそのCodexスレッドを再開し、現在選択されているOpenClawモデルをapp-serverへ渡し、拡張履歴を有効にしたままにします。

このコマンド面にはCodex app-server `0.118.0`以降が必要です。将来のapp-serverやカスタムapp-serverがそのJSON-RPCメソッドを公開していない場合、個別の制御メソッドは`unsupported by this Codex app-server`として報告されます。

## フック境界

Codexハーネスには3つのフック層があります。

| 層                                    | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Pluginフック                 | OpenClaw                 | PIハーネスとCodexハーネスをまたいだ製品/Plugin互換性。              |
| Codex app-server拡張ミドルウェア      | OpenClaw同梱Plugin       | OpenClaw動的ツール周りのターン単位アダプター挙動。                  |
| Codexネイティブフック                 | Codex                    | Codex設定による低レベルCodexライフサイクルとネイティブツールポリシー。 |

OpenClawは、OpenClaw Plugin挙動のルーティングに、プロジェクトまたはグローバルのCodex `hooks.json`ファイルを使いません。Codexネイティブフックは、シェルポリシー、ネイティブツール結果レビュー、停止処理、ネイティブCompaction/モデルライフサイクルのようなCodex所有の操作には有用ですが、OpenClawのPlugin APIではありません。

OpenClaw動的ツールについては、Codexが呼び出しを要求した後でOpenClawがツールを実行するため、OpenClawはハーネスアダプター内で、自身が所有するPluginとミドルウェアの挙動を発火させます。Codexネイティブツールについては、Codexが正規のツール記録を所有します。OpenClawは選択されたイベントをミラーできますが、Codexがその操作をapp-serverまたはネイティブフックコールバック経由で公開しない限り、ネイティブCodexスレッドを書き換えることはできません。

より新しいCodex app-serverビルドがネイティブCompactionおよびモデルライフサイクルのフックイベントを公開するようになった場合、OpenClawはそのプロトコルサポートをバージョンゲートし、意味が正直に対応する範囲でイベントを既存のOpenClawフック契約へマッピングすべきです。それまでは、OpenClawの`before_compaction`、`after_compaction`、`llm_input`、`llm_output`イベントはアダプターレベルの観測であり、Codex内部のリクエストやCompaction payloadをバイト単位で捕捉したものではありません。

Codexネイティブの`hook/started`および`hook/completed` app-server通知は、軌跡およびデバッグのために`codex_app_server.hook`エージェントイベントとして投影されます。これらはOpenClaw Pluginフックを呼び出しません。

## ツール、メディア、Compaction

Codexハーネスが変更するのは、低レベルの組み込みエージェント実行器だけです。

OpenClawは引き続きツール一覧を構築し、ハーネスから動的ツール結果を受け取ります。テキスト、画像、動画、音楽、TTS、承認、メッセージングツール出力は、通常のOpenClaw配信経路を通り続けます。

Codex MCPツールの承認要求は、Codexが`_meta.codex_approval_kind`を`"mcp_tool_call"`としてマークした場合、OpenClawのPlugin承認フロー経由でルーティングされます。Codexの`request_user_input`プロンプトは元のチャットへ返送され、次にキューされたフォローアップメッセージは追加コンテキストとして扱われるのではなく、そのネイティブサーバー要求への応答になります。その他のMCP要求は引き続きfail closedします。

選択されたモデルがCodexハーネスを使う場合、ネイティブスレッドCompactionはCodex app-serverへ委譲されます。OpenClawは、チャネル履歴、検索、`/new`、`/reset`、および将来のモデルやハーネス切り替えのために、トランスクリプトミラーを保持します。このミラーには、ユーザープロンプト、最終アシスタントテキスト、およびapp-serverがそれらを出力した場合の軽量なCodex推論またはプラン記録が含まれます。現時点では、OpenClawはネイティブCompactionの開始と完了シグナルのみを記録します。まだ、人間が読めるCompaction要約や、Compaction後にCodexがどのエントリを保持したかの監査可能な一覧は公開していません。

Codexが正規のネイティブスレッドを所有するため、`tool_result_persist`は現在Codexネイティブツール結果レコードを書き換えません。これは、OpenClawがOpenClaw所有のセッショントランスクリプトツール結果を書き込む場合にのみ適用されます。

メディア生成にPiは不要です。画像、動画、音楽、PDF、TTS、メディア理解は、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts`のような対応するプロバイダー/モデル設定を引き続き使います。

## トラブルシューティング

**`/model`にCodexが出てこない:** `plugins.entries.codex.enabled`を有効にし、`embeddedHarness.runtime: "codex"`を持つ`openai/gpt-*`モデル（またはレガシーの`codex/*`参照）を選択し、`plugins.allow`が`codex`を除外していないか確認してください。

**OpenClawがCodexではなくPIを使う:** Codexハーネスがその実行を引き受けない場合、OpenClawは互換バックエンドとしてPIを使うことがあります。テスト時にCodex選択を強制するには`embeddedHarness.runtime: "codex"`を設定するか、どのPluginハーネスも一致しない場合に失敗させるには`embeddedHarness.fallback: "none"`を設定してください。Codex app-serverが選択されると、その失敗は追加のフォールバック設定なしで直接表面化します。

**app-serverが拒否される:** Codexをアップグレードして、app-serverハンドシェイクがバージョン`0.118.0`以降を報告するようにしてください。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs`を下げるか、検出を無効にしてください。

**WebSocketトランスポートがすぐ失敗する:** `appServer.url`、`authToken`、およびリモートapp-serverが同じCodex app-serverプロトコルバージョンを話していることを確認してください。

**非CodexモデルがPIを使う:** `embeddedHarness.runtime: "codex"`を強制していない限り（またはレガシーの`codex/*`参照を選んでいない限り）、これは想定どおりです。通常の`openai/gpt-*`やその他のプロバイダー参照は、通常のプロバイダー経路に留まります。

## 関連

- [Agent Harness Plugins](/ja-JP/plugins/sdk-agent-harness)
- [Model Providers](/ja-JP/concepts/model-providers)
- [Configuration Reference](/ja-JP/gateway/configuration-reference)
- [Testing](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
