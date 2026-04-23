---
read_when:
    - バンドルされたCodex app-serverハーネスを使いたい場合
    - Codexのモデル参照と設定例が必要な場合
    - Codex専用デプロイ向けにPiフォールバックを無効にしたい場合
summary: バンドルされたCodex app-serverハーネスを通してOpenClawの埋め込みエージェントターンを実行する
title: Codexハーネス
x-i18n:
    generated_at: "2026-04-23T04:47:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc2acc3dc906d12e12a837a25a52ec0e72d44325786106771045d456e6327040
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codexハーネス

バンドルされた `codex` Pluginを使うと、OpenClawは組み込みのPIハーネスの代わりに、Codex app-serverを通して埋め込みエージェントターンを実行できます。

これは、低レベルのエージェントセッションをCodexに任せたい場合に使用します。具体的には、モデル検出、ネイティブなスレッド再開、ネイティブなCompaction、およびapp-server実行です。
OpenClawは引き続き、チャットchannels、セッションファイル、モデル選択、ツール、承認、メディア配信、および可視のトランスクリプトミラーを担当します。

ネイティブなCodexターンは、共有の `before_prompt_build`、`before_compaction`、`after_compaction` Pluginフックも尊重するため、プロンプトシムやCompaction対応の自動化をPIハーネスと整合させたままにできます。
ネイティブなCodexターンは、共有の `before_prompt_build`、`before_compaction`、`after_compaction`、`llm_input`、`llm_output`、`agent_end` Pluginフックも尊重するため、プロンプトシム、Compaction対応の自動化、およびライフサイクルオブザーバーをPIハーネスと整合させたままにできます。

このハーネスはデフォルトでは無効です。`codex` Pluginが有効で、解決されたモデルが `codex/*` モデルである場合、または `embeddedHarness.runtime: "codex"` か `OPENCLAW_AGENT_RUNTIME=codex` を明示的に強制した場合にのみ選択されます。
`codex/*` を一度も設定しなければ、既存のPI、OpenAI、Anthropic、Gemini、local、およびカスタムプロバイダー実行は現在の動作を維持します。

## 適切なモデルプレフィックスを選ぶ

OpenClawには、OpenAIアクセス用とCodex形式アクセス用で別々の経路があります。

| Model ref              | ランタイム経路                                 | 使用する場面                                                           |
| ---------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| `openai/gpt-5.4`       | OpenClaw/PI配管を通るOpenAIプロバイダー        | `OPENAI_API_KEY` で直接OpenAI Platform APIアクセスを使いたい場合。     |
| `openai-codex/gpt-5.4` | PI経由のOpenAI Codex OAuthプロバイダー         | Codex app-serverハーネスなしでChatGPT/Codex OAuthを使いたい場合。      |
| `codex/gpt-5.4`        | バンドルされたCodexプロバイダー + Codexハーネス | 埋め込みエージェントターンでネイティブなCodex app-server実行を使いたい場合。 |

Codexハーネスは `codex/*` モデル参照のみを処理します。既存の `openai/*`、`openai-codex/*`、Anthropic、Gemini、xAI、local、およびカスタムプロバイダー参照は通常の経路のままです。

## 要件

- バンドルされた `codex` Pluginが利用可能なOpenClaw。
- Codex app-server `0.118.0` 以降。
- app-serverプロセスから利用可能なCodex認証。

このPluginは、古いapp-serverハンドシェイクまたはバージョン不明のapp-serverハンドシェイクをブロックします。
これにより、OpenClawはテスト済みのプロトコルサーフェス上に留まります。

ライブテストとDockerスモークテストでは、通常、認証は `OPENAI_API_KEY` に加え、`~/.codex/auth.json` や
`~/.codex/config.toml` のような任意のCodex CLIファイルから取得されます。ローカルのCodex app-serverが使用しているのと同じ認証情報を使ってください。

## 最小構成

`codex/gpt-5.4` を使い、バンドルされたPluginを有効にし、`codex` ハーネスを強制します。

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
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

設定で `plugins.allow` を使っている場合は、そこにも `codex` を含めてください。

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

`agents.defaults.model` またはエージェントモデルを `codex/<model>` に設定すると、バンドルされた `codex` Pluginも自動有効化されます。明示的なPluginエントリーは、デプロイ意図が明確になるため、共有設定では依然として有用です。

## 他のモデルを置き換えずにCodexを追加する

`codex/*` モデルにはCodexを使い、それ以外にはPIを使いたい場合は、`runtime: "auto"` を維持してください。

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
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

この構成では:

- `/model codex` または `/model codex/gpt-5.4` はCodex app-serverハーネスを使います。
- `/model gpt` または `/model openai/gpt-5.4` はOpenAIプロバイダー経路を使います。
- `/model opus` はAnthropicプロバイダー経路を使います。
- 非Codexモデルが選ばれた場合、PIが互換性ハーネスのまま残ります。

## Codex専用デプロイ

すべての埋め込みエージェントターンがCodexハーネスを使うことを保証したい場合は、PIフォールバックを無効にしてください。

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
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

フォールバックを無効にすると、Codex Pluginが無効、要求モデルが `codex/*` 参照ではない、app-serverが古すぎる、またはapp-serverを起動できない場合に、OpenClawは早い段階で失敗します。

## エージェントごとのCodex

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
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

通常のセッションコマンドを使ってエージェントとモデルを切り替えてください。`/new` は新しいOpenClawセッションを作成し、Codexハーネスは必要に応じてそのサイドカーapp-serverスレッドを作成または再開します。`/reset` は、そのスレッドに対するOpenClawセッションバインディングをクリアします。

## モデル検出

デフォルトでは、Codex Pluginは利用可能なモデルをapp-serverに問い合わせます。検出が失敗またはタイムアウトした場合は、バンドルされたフォールバックカタログを使います。

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

`plugins.entries.codex.config.discovery` で検出を調整できます。

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

起動時にCodexをプローブせず、フォールバックカタログに固定したい場合は、検出を無効にしてください。

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

デフォルトでは、OpenClawはローカルCodexハーネスセッションをYOLOモードで起動します:
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、`sandbox: "danger-full-access"`。これは、自律Heartbeatで使われる信頼済みローカルオペレーター姿勢です。Codexは、誰も応答できないネイティブ承認プロンプトで停止せずに、shellおよびnetworkツールを使えます。

Codexのguardianレビュー付き承認を有効にするには、`appServer.mode:
"guardian"` を設定してください。

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

guardianモードは次のように展開されます。

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

guardianはネイティブなCodex承認レビュアーです。Codexがsandboxの外に出る、workspace外へ書き込む、またはnetwork accessのような権限を追加する必要がある場合、Codexはその承認要求を人間へのプロンプトではなくレビュアーsubagentへ送ります。レビュアーはコンテキストを収集し、Codexのリスクフレームワークを適用したうえで、その特定の要求を承認または拒否します。guardianは、YOLOモードより多くのガードレールが欲しいが、無人のエージェントやHeartbeatにも進行してほしい場合に有用です。

Dockerライブハーネスには、`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1` のときguardianプローブが含まれます。これにより、Codexハーネスがguardianモードで起動され、無害な権限昇格shellコマンドが承認されること、および偽のシークレットを信頼できない外部宛先へアップロードする操作が拒否され、エージェントが明示的な承認を求めて戻ってくることが検証されます。

個別のポリシーフィールドは依然として `mode` より優先されるため、高度なデプロイではプリセットと明示的な選択を組み合わせられます。

すでに実行中のapp-serverを使う場合は、WebSocketトランスポートを使用してください。

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

サポートされる `appServer` フィールド:

| Field               | Default                                  | 意味                                                                                                  |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` はCodexを起動し、`"websocket"` は `url` に接続します。                                     |
| `command`           | `"codex"`                                | stdioトランスポート用の実行ファイル。                                                                 |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdioトランスポート用の引数。                                                                         |
| `url`               | unset                                    | WebSocket app-server URL。                                                                            |
| `authToken`         | unset                                    | WebSocketトランスポート用のBearerトークン。                                                           |
| `headers`           | `{}`                                     | 追加のWebSocketヘッダー。                                                                             |
| `requestTimeoutMs`  | `60000`                                  | app-server control-plane呼び出しのタイムアウト。                                                      |
| `mode`              | `"yolo"`                                 | YOLOまたはguardianレビュー付き実行用のプリセット。                                                    |
| `approvalPolicy`    | `"never"`                                | スレッド開始/再開/ターン時に送信されるネイティブCodex承認ポリシー。                                  |
| `sandbox`           | `"danger-full-access"`                   | スレッド開始/再開時に送信されるネイティブCodex sandboxモード。                                        |
| `approvalsReviewer` | `"user"`                                 | Codex Guardianにプロンプトをレビューさせるには `"guardian_subagent"` を使用します。                  |
| `serviceTier`       | unset                                    | 任意のCodex app-server service tier: `"fast"`、`"flex"`、または `null`。無効な旧形式の値は無視されます。 |

古い環境変数も、対応する設定フィールドが未設定であれば、ローカルテスト用のフォールバックとして引き続き機能します:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、
単発のローカルテストでは `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使ってください。再現可能なデプロイでは、Codexハーネス設定の残りと同じレビュー済みファイル内にPluginの挙動を保持できるため、設定ファイルの利用が推奨されます。

## よく使うレシピ

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

guardianレビュー付きCodex承認:

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

明示的なヘッダー付きのリモートapp-server:

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

モデル切り替えは引き続きOpenClawが制御します。OpenClawセッションが既存のCodexスレッドに接続されている場合、次のターンでは、現在選択されている `codex/*` モデル、プロバイダー、承認ポリシー、sandbox、およびservice tierが再びapp-serverへ送信されます。`codex/gpt-5.4` から `codex/gpt-5.2` へ切り替えても、スレッドバインディングは維持されたまま、Codexには新しく選択されたモデルで継続するよう要求されます。

## Codexコマンド

バンドルされたPluginは、認可済みスラッシュコマンドとして `/codex` を登録します。これは汎用で、OpenClawのテキストコマンドをサポートする任意のchannelで動作します。

よく使う形式:

- `/codex status` は、ライブapp-server接続性、モデル、アカウント、レート制限、MCPサーバー、およびSkillsを表示します。
- `/codex models` は、ライブCodex app-serverモデルを一覧表示します。
- `/codex threads [filter]` は、最近のCodexスレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在のOpenClawセッションを既存のCodexスレッドへ接続します。
- `/codex compact` は、接続されているスレッドのCompactionをCodex app-serverへ要求します。
- `/codex review` は、接続されているスレッドに対するCodexネイティブレビューを開始します。
- `/codex account` は、アカウントとレート制限の状態を表示します。
- `/codex mcp` は、Codex app-server MCPサーバーの状態を一覧表示します。
- `/codex skills` は、Codex app-server Skillsを一覧表示します。

`/codex resume` は、ハーネスが通常ターンで使うのと同じサイドカーバインディングファイルを書き込みます。次のメッセージで、OpenClawはそのCodexスレッドを再開し、現在選択されているOpenClawの `codex/*` モデルをapp-serverへ渡し、拡張履歴を有効なまま維持します。

このコマンドサーフェスには、Codex app-server `0.118.0` 以降が必要です。将来版またはカスタムapp-serverがそのJSON-RPCメソッドを公開していない場合、個々の制御メソッドは `unsupported by this Codex app-server` として報告されます。

## ツール、メディア、Compaction

Codexハーネスが変更するのは、低レベルの埋め込みエージェント実行器だけです。

OpenClawは引き続きツール一覧を構築し、ハーネスから動的ツール結果を受け取ります。テキスト、画像、動画、音楽、TTS、承認、およびメッセージングツール出力は、通常のOpenClaw配信経路を通り続けます。

Codex MCPツールの承認要求は、Codexが `_meta.codex_approval_kind` を
`"mcp_tool_call"` としてマークした場合に、OpenClawのPlugin承認フローを通じてルーティングされます。それ以外の要求や自由形式入力リクエストは、引き続きfail closedされます。

選択されたモデルがCodexハーネスを使う場合、ネイティブスレッドCompactionはCodex app-serverへ委譲されます。OpenClawは、channel履歴、検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのために、トランスクリプトミラーを維持します。このミラーには、ユーザープロンプト、最終アシスタントテキスト、およびapp-serverが出力した場合の軽量なCodex reasoningまたはplan記録が含まれます。現時点では、OpenClawはネイティブCompactionの開始および完了シグナルのみを記録します。Compactionの人間可読サマリーや、Compaction後にCodexがどのエントリーを保持したかの監査可能な一覧は、まだ公開していません。

メディア生成にPIは不要です。画像、動画、音楽、PDF、TTS、およびメディア理解は、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts` など、対応するプロバイダー/モデル設定を引き続き使用します。

## トラブルシューティング

**`/model` にCodexが表示されない:** `plugins.entries.codex.enabled` を有効にし、`codex/*` モデル参照を設定するか、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClawがCodexではなくPIを使う:** 実行を処理するCodexハーネスがない場合、OpenClawは互換性バックエンドとしてPIを使うことがあります。テスト中にCodex選択を強制するには `embeddedHarness.runtime: "codex"` を設定し、Pluginハーネスが一致しないときに失敗させるには `embeddedHarness.fallback: "none"` を設定してください。Codex app-serverが選択されるようになれば、その失敗は追加のフォールバック設定なしで直接表面化します。

**app-serverが拒否される:** app-serverハンドシェイクがバージョン `0.118.0` 以降を報告するようにCodexをアップグレードしてください。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にしてください。

**WebSocketトランスポートがすぐ失敗する:** `appServer.url`、`authToken`、およびリモートapp-serverが同じCodex app-serverプロトコルバージョンを話していることを確認してください。

**非CodexモデルがPIを使う:** それは想定どおりです。Codexハーネスは `codex/*` モデル参照のみを処理します。

## 関連

- [Agent Harness Plugins](/ja-JP/plugins/sdk-agent-harness)
- [Model Providers](/ja-JP/concepts/model-providers)
- [Configuration Reference](/ja-JP/gateway/configuration-reference)
- [Testing](/ja-JP/help/testing#live-codex-app-server-harness-smoke)
