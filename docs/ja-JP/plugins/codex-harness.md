---
read_when:
    - バンドルされた Codex app-server ハーネスを使いたい場合
    - Codex ハーネスの config 例が必要な場合
    - Codex 専用デプロイで PI へのフォールバックではなく失敗させたい場合
summary: バンドルされた Codex app-server ハーネスを通して OpenClaw の埋め込み agent ターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-04-25T13:53:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5458c8501338361a001c3457235d2a9abfc7e24709f2e50185bc31b92bbadb3b
    source_path: plugins/codex-harness.md
    workflow: 15
---

バンドルされた `codex` Plugin により、OpenClaw は組み込み PI ハーネスの代わりに
Codex app-server を通して埋め込み agent ターンを実行できます。

これは、低レベルの agent セッションを Codex に担当させたい場合に使います。具体的には model
検出、ネイティブな thread resume、ネイティブ Compaction、app-server 実行です。
一方で OpenClaw は、チャットチャネル、セッションファイル、model 選択、ツール、
承認、メディア配信、そして可視の transcript ミラーを引き続き管理します。

全体像を把握したい場合は、まず
[Agent runtimes](/ja-JP/concepts/agent-runtimes) から始めてください。要点だけ言うと、
`openai/gpt-5.5` は model ref、`codex` はランタイムであり、Telegram、
Discord、Slack、または他のチャネルは引き続き通信画面です。

ネイティブ Codex ターンは、OpenClaw Plugin フックを公開互換レイヤーとして維持します。
これらはプロセス内の OpenClaw フックであり、Codex の `hooks.json` コマンドフックではありません。

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- ミラーされた transcript レコード用の `before_message_write`
- `agent_end`

Plugin は、OpenClaw がツールを実行した後、結果が Codex に返される前に、
OpenClaw の動的ツール結果を書き換えるランタイム中立の tool-result middleware も登録できます。これは公開
`tool_result_persist` Plugin フックとは別物で、後者は OpenClaw 所有の transcript
tool-result 書き込みを変換します。

Plugin フック自体のセマンティクスについては、[Plugin hooks](/ja-JP/plugins/hooks)
と [Plugin guard behavior](/ja-JP/tools/plugin) を参照してください。

このハーネスはデフォルトでオフです。新しい config では OpenAI model ref を
`openai/gpt-*` として正規化し、ネイティブ app-server 実行を望む場合は
`embeddedHarness.runtime: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex` を
明示的に強制するべきです。旧来の `codex/*` model ref は互換性のため引き続き
ハーネスを自動選択しますが、ランタイムに支えられた旧 provider 接頭辞は通常の
model/provider 選択肢としては表示されません。

## 正しい model 接頭辞を選ぶ

OpenAI 系ルートは接頭辞に依存します。PI 経由で Codex OAuth を使いたいなら
`openai-codex/*` を使い、直接 OpenAI API アクセスを使いたい場合、または
ネイティブ Codex app-server ハーネスを強制したい場合は `openai/*` を使ってください。

| Model ref                                             | ランタイム経路                               | 使う場面                                                                  |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | OpenClaw/PI 配線を通る OpenAI provider        | `OPENAI_API_KEY` で現在の直接 OpenAI Platform API アクセスを使いたい。    |
| `openai-codex/gpt-5.5`                                | OpenClaw/PI を通る OpenAI Codex OAuth         | デフォルトの PI ランナーで ChatGPT/Codex subscription auth を使いたい。   |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server ハーネス                     | 埋め込み agent ターンにネイティブ Codex app-server 実行を使いたい。       |

GPT-5.5 は現在、OpenClaw では subscription/OAuth 専用です。
PI OAuth には `openai-codex/gpt-5.5` を、Codex
app-server ハーネスには `embeddedHarness.runtime: "codex"` 付きの `openai/gpt-5.5` を使ってください。
`openai/gpt-5.5` に対する直接 API-key アクセスは、
OpenAI が公開 API で GPT-5.5 を有効にし次第サポートされます。

旧来の `codex/gpt-*` ref は互換性エイリアスとして引き続き受け付けられます。Doctor
互換性移行では、旧 primary runtime ref を正規 model
ref に書き換え、ランタイムポリシーは別に記録します。一方、fallback のみの旧 ref は、
ランタイムが agent コンテナ全体に設定されるため変更されません。新しい PI Codex OAuth config では
`openai-codex/gpt-*` を使うべきであり、新しいネイティブ
app-server ハーネス config では `embeddedHarness.runtime: "codex"` 付きの
`openai/gpt-*` を使うべきです。

`agents.defaults.imageModel` も同じ接頭辞分割に従います。画像理解を OpenAI
Codex OAuth provider 経路で実行したい場合は `openai-codex/gpt-*` を使ってください。
画像理解を制限付き Codex app-server ターンで実行したい場合は `codex/gpt-*` を使ってください。Codex app-server model は
画像入力サポートを公開している必要があります。テキスト専用 Codex model はメディアターンが
始まる前に失敗します。

現在のセッションで実際に使われているハーネスを確認するには `/status` を使ってください。選択結果が想定外なら、
`agents/harness` サブシステムのデバッグログを有効にし、
gateway の構造化された `agent harness selected` レコードを確認してください。そこには
選択された harness id、選択理由、runtime/fallback policy、および
`auto` モードでは各 Plugin 候補のサポート結果が含まれます。

ハーネス選択はライブセッション制御ではありません。埋め込みターンが実行されると、
OpenClaw はそのセッションに選択された harness id を記録し、同じ session id の後続ターンでも
それを使い続けます。将来のセッションで別のハーネスを使いたい場合は、
`embeddedHarness` config または `OPENCLAW_AGENT_RUNTIME` を変更してください。既存の会話を
PI と Codex の間で切り替える前には、`/new` または `/reset` を使って新しいセッションを開始してください。
これにより、互換性のない 2 つのネイティブセッションシステムを 1 つの transcript に対して再生するのを防ぎます。

ハーネス pin が導入される前に作成された旧セッションは、transcript 履歴を持つ時点で
PI に pin されたものとして扱われます。config 変更後にその会話を Codex に移行するには
`/new` または `/reset` を使ってください。

`/status` には有効な model ランタイムが表示されます。デフォルトの PI ハーネスは
`Runtime: OpenClaw Pi Default` と表示され、Codex app-server ハーネスは
`Runtime: OpenAI Codex` と表示されます。

## 要件

- バンドルされた `codex` Plugin が利用可能な OpenClaw。
- Codex app-server `0.118.0` 以降。
- app-server プロセスから利用可能な Codex auth。

この Plugin は、古いまたはバージョン不明の app-server handshake をブロックします。これにより
OpenClaw は、テスト済みのプロトコル画面に留まります。

ライブおよび Docker スモークテストでは、auth は通常 `OPENAI_API_KEY` から提供され、
加えて `~/.codex/auth.json` や
`~/.codex/config.toml` のような任意の Codex CLI ファイルが使われます。ローカル Codex
app-server が使っているのと同じ auth 素材を使ってください。

## 最小 config

`openai/gpt-5.5` を使い、バンドルされた Plugin を有効にし、`codex` ハーネスを強制します。

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
      },
    },
  },
}
```

config で `plugins.allow` を使っている場合は、そこにも `codex` を含めてください。

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

`agents.defaults.model` または agent model を
`codex/<model>` に設定する旧 config は、引き続きバンドルされた `codex` Plugin を自動有効化します。新しい config では
`openai/<model>` と上記の明示的な `embeddedHarness` エントリを使うべきです。

## Codex を他の model と併用する

同じ agent が Codex と非 Codex provider model の間を自由に切り替えるべき場合は、
グローバルに `runtime: "codex"` を設定しないでください。強制ランタイムは、その agent またはセッションの
すべての埋め込みターンに適用されます。Anthropic model を選んでも、
OpenClaw は引き続き Codex ハーネスを試し、黙って PI に回さずクローズドに失敗します。

代わりに、次のいずれかの形を使ってください。

- Codex を `embeddedHarness.runtime: "codex"` 付きの専用 agent に置く。
- デフォルト agent は `runtime: "auto"` と PI fallback のままにして、通常の混在
  provider 利用に使う。
- 旧 `codex/*` ref は互換性のためだけに使う。新しい config では
  `openai/*` と明示的な Codex runtime policy を使うべきです。

たとえば、これはデフォルト agent を通常の自動選択のまま保ち、
別の Codex agent を追加します。

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
        },
      },
    ],
  },
}
```

この形では:

- デフォルトの `main` agent は通常の provider 経路と PI 互換 fallback を使います。
- `codex` agent は Codex app-server ハーネスを使います。
- `codex` agent に対して Codex が欠落または未対応なら、そのターンは
  黙って PI を使うのではなく失敗します。

## Codex 専用デプロイ

すべての埋め込み agent ターンが Codex を使うことを保証したい場合は、
Codex ハーネスを強制してください。明示的な Plugin runtime はデフォルトで PI fallback を持たないため、
`fallback: "none"` は任意ですが、ドキュメントとして有用なことが多いです。

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
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Codex を強制すると、Codex Plugin が無効、app-server が古すぎる、または
app-server を起動できない場合、OpenClaw は早期に失敗します。ハーネス選択が欠落した場合に
意図的に PI に処理させたい場合のみ、
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` を設定してください。

## agent ごとの Codex

1 つの agent だけを Codex 専用にしつつ、デフォルト agent は通常の
自動選択のままにできます。

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

通常のセッションコマンドで agent と model を切り替えてください。`/new` は新しい
OpenClaw セッションを作成し、Codex ハーネスは必要に応じて sidecar app-server
thread を作成または再開します。`/reset` はその thread に対する OpenClaw のセッションバインディングを解除し、
次のターンで現在の config から再びハーネスを解決できるようにします。

## model 検出

デフォルトでは、Codex Plugin は app-server に利用可能な model を問い合わせます。検出が
失敗またはタイムアウトした場合、次のためのバンドル済み fallback catalog を使います。

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

検出は `plugins.entries.codex.config.discovery` 配下で調整できます。

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

起動時に Codex への probe を避け、fallback catalog に固定したい場合は、
検出を無効にしてください。

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

## app-server 接続とポリシー

デフォルトでは、この Plugin はローカルで次のように Codex を起動します。

```bash
codex app-server --listen stdio://
```

デフォルトでは、OpenClaw はローカル Codex ハーネスセッションを YOLO モードで起動します:
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"`。これは、自律 Heartbeat に使われる信頼済みローカル operator 姿勢です。Codex は shell と network ツールを使え、
誰も答えないネイティブ承認プロンプトで停止しません。

Codex の guardian 審査付き承認を有効にするには、`appServer.mode:
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

Guardian モードは、Codex のネイティブ auto-review 承認経路を使います。Codex が
sandbox を出る、ワークスペース外へ書き込む、または network
access のような権限追加を求めた場合、Codex はその承認要求を人間へのプロンプトではなくネイティブ reviewer に送ります。reviewer は Codex のリスクフレームワークを適用し、
その個別要求を承認または拒否します。YOLO モードより強いガードレールが必要だが、
無人 agent が進行し続ける必要もある場合は Guardian を使ってください。

`guardian` プリセットは、`approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`、`sandbox: "workspace-write"` に展開されます。
個別のポリシーフィールドは引き続き `mode` を上書きするため、高度なデプロイでは
このプリセットを明示的な指定と組み合わせられます。古い `guardian_subagent` reviewer 値も
互換性エイリアスとして引き続き受け付けられますが、新しい config では
`auto_review` を使うべきです。

すでに稼働中の app-server を使う場合は、WebSocket トランスポートを使用します。

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

| Field               | Default                                  | 意味                                                                                                       |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` は Codex を起動し、`"websocket"` は `url` に接続します。                                          |
| `command`           | `"codex"`                                | stdio トランスポート用の実行ファイル。                                                                     |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio トランスポート用の引数。                                                                             |
| `url`               | unset                                    | WebSocket app-server URL。                                                                                 |
| `authToken`         | unset                                    | WebSocket トランスポート用の Bearer token。                                                                |
| `headers`           | `{}`                                     | 追加の WebSocket ヘッダー。                                                                                |
| `requestTimeoutMs`  | `60000`                                  | app-server control-plane 呼び出しのタイムアウト。                                                          |
| `mode`              | `"yolo"`                                 | YOLO 実行または guardian 審査付き実行のプリセット。                                                         |
| `approvalPolicy`    | `"never"`                                | thread start/resume/turn に送られるネイティブ Codex 承認ポリシー。                                         |
| `sandbox`           | `"danger-full-access"`                   | thread start/resume に送られるネイティブ Codex sandbox モード。                                            |
| `approvalsReviewer` | `"user"`                                 | ネイティブ承認プロンプトを Codex に審査させるには `"auto_review"` を使います。`guardian_subagent` は旧エイリアスのままです。 |
| `serviceTier`       | unset                                    | 任意の Codex app-server service tier: `"fast"`、`"flex"`、または `null`。無効な旧値は無視されます。       |

古い環境変数も、対応する config フィールドが未設定の場合は、ローカルテスト用フォールバックとして引き続き使えます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使うか、
1 回限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使ってください。繰り返し可能なデプロイでは、
Plugin の動作を Codex ハーネス設定の他部分と同じレビュー済みファイルにまとめられるため、config の方が推奨されます。

## よくあるレシピ

デフォルト stdio トランスポートを使うローカル Codex:

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

Codex 専用ハーネスの検証:

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
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

guardian 審査付き Codex 承認:

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
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

明示的ヘッダー付きリモート app-server:

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

model 切り替えは引き続き OpenClaw が制御します。OpenClaw セッションが
既存の Codex thread に接続されている場合、次のターンでは現在選択されている
OpenAI model、provider、approval policy、sandbox、service tier が
再び app-server に送られます。`openai/gpt-5.5` から `openai/gpt-5.2` への切り替えでは、
thread binding は維持されつつ、Codex に新しく選択された model で継続するよう要求します。

## Codex コマンド

バンドルされた Plugin は、認可されたスラッシュコマンドとして `/codex` を登録します。これは
汎用であり、OpenClaw のテキストコマンドをサポートするどのチャネルでも動作します。

よく使う形式:

- `/codex status` は、app-server 接続性、models、account、rate limits、MCP servers、Skills のライブ状態を表示します。
- `/codex models` は、ライブの Codex app-server models を一覧表示します。
- `/codex threads [filter]` は、最近の Codex threads を一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex thread に接続します。
- `/codex compact` は、接続中の thread を Codex app-server に Compaction させます。
- `/codex review` は、接続中の thread に対する Codex ネイティブ review を開始します。
- `/codex account` は、account と rate-limit 状態を表示します。
- `/codex mcp` は、Codex app-server の MCP server 状態を一覧表示します。
- `/codex skills` は、Codex app-server の Skills を一覧表示します。

`/codex resume` は、ハーネスが通常ターンで使うのと同じ sidecar binding ファイルを書き込みます。
次のメッセージで OpenClaw はその Codex thread を再開し、現在選択されている
OpenClaw model を app-server に渡し、拡張履歴を有効なまま維持します。

このコマンド画面には Codex app-server `0.118.0` 以降が必要です。個別の
control method は、将来またはカスタムの app-server がその JSON-RPC method を公開していない場合、
`unsupported by this Codex app-server` と報告されます。

## フック境界

Codex ハーネスには 3 層のフックがあります。

| Layer                                 | Owner                    | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin フック                | OpenClaw                 | PI と Codex ハーネスをまたぐ製品/Plugin 互換性。                    |
| Codex app-server extension middleware | OpenClaw バンドル Plugin | OpenClaw 動的ツール周りのターンごとのアダプター動作。                |
| Codex ネイティブフック                | Codex                    | Codex config 由来の低レベル Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、OpenClaw Plugin の動作をルーティングするために project または
グローバルな Codex `hooks.json` ファイルは使いません。サポートされるネイティブツールと権限 bridge のために、
OpenClaw は `PreToolUse`、`PostToolUse`、`PermissionRequest` 用のスレッドごとの Codex config を注入します。`SessionStart`、
`UserPromptSubmit`、`Stop` のような他の Codex フックは、引き続き Codex レベルの制御です。v1 コントラクトでは OpenClaw Plugin フックとして公開されません。

OpenClaw 動的ツールについては、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、
OpenClaw はハーネスアダプター内で自らが所有する Plugin と middleware の動作を発火させます。Codex ネイティブツールについては、
正規のツール記録は Codex が所有します。OpenClaw は選択されたイベントをミラーできますが、
Codex が app-server またはネイティブフックコールバック経由でその操作を公開しない限り、
ネイティブ Codex thread を書き換えることはできません。

Compaction と LLM ライフサイクルの投影は、Codex app-server
通知と OpenClaw アダプター状態から得られるものであり、ネイティブ Codex フックコマンドから得られるものではありません。
OpenClaw の `before_compaction`、`after_compaction`、`llm_input`、`llm_output` イベントは
アダプターレベルの観測であり、Codex 内部のリクエストや Compaction ペイロードを 1 バイト単位で捉えたものではありません。

Codex ネイティブの `hook/started` および `hook/completed` app-server 通知は、
経路追跡とデバッグ用に `codex_app_server.hook` agent event として投影されます。
これらは OpenClaw Plugin フックを呼び出しません。

## V1 サポートコントラクト

Codex モードは、下で別の model 呼び出しをしているだけの PI ではありません。Codex は
ネイティブ model ループのより多くを所有し、OpenClaw はその境界の周りで
Plugin とセッション画面を適応させます。

Codex runtime v1 でサポートされるもの:

| Surface                                 | Support                           | 理由                                                                                                                                       |
| --------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Codex を通る OpenAI model ループ         | Supported                         | Codex app-server が OpenAI ターン、ネイティブ thread resume、ネイティブツール継続を所有します。                                           |
| OpenClaw のチャネルルーティングと配信    | Supported                         | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャネルは model ランタイムの外側に残ります。                                       |
| OpenClaw 動的ツール                      | Supported                         | Codex がこれらのツール実行を OpenClaw に求めるため、OpenClaw は実行経路に留まります。                                                     |
| prompt と context Plugin                | Supported                         | OpenClaw は thread の開始/再開前に prompt オーバーレイを構築し、context を Codex ターンへ投影します。                                    |
| context engine ライフサイクル           | Supported                         | Assemble、ingest または after-turn maintenance、および context-engine Compaction coordination が Codex ターンでも実行されます。           |
| 動的ツールフック                         | Supported                         | `before_tool_call`、`after_tool_call`、tool-result middleware が OpenClaw 所有の動的ツールの周囲で動作します。                            |
| ライフサイクルフック                     | アダプター観測として Supported    | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は、正直な Codex-mode ペイロードで発火します。           |
| ネイティブ shell と patch のブロック/観測 | native hook relay を通じて Supported | Codex の `PreToolUse` と `PostToolUse` は、コミットされたネイティブツール画面に対して relay されます。ブロックはサポートされますが、引数書き換えはサポートされません。 |
| ネイティブ権限ポリシー                   | native hook relay を通じて Supported | ランタイムが公開している場合、Codex `PermissionRequest` は OpenClaw ポリシーを通してルーティングできます。                               |
| app-server trajectory capture           | Supported                         | OpenClaw は、自身が app-server に送ったリクエストと、app-server から受け取った通知を記録します。                                         |

Codex runtime v1 でサポートされないもの:

| Surface                                             | V1 境界                                                                                                                                        | 将来の方向性                                                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| ネイティブツール引数の変更                          | Codex ネイティブ pre-tool フックはブロックできますが、OpenClaw は Codex ネイティブツール引数を書き換えません。                                 | 置換用ツール入力に対する Codex の hook/schema サポートが必要です。                                      |
| 編集可能な Codex ネイティブ transcript 履歴         | 正規のネイティブ thread 履歴は Codex が所有します。OpenClaw はミラーを所有し、将来の context は投影できますが、未サポート内部構造を変更すべきではありません。 | ネイティブ thread の外科的変更が必要なら、明示的な Codex app-server API を追加します。                 |
| Codex ネイティブツール記録に対する `tool_result_persist` | このフックは OpenClaw 所有の transcript 書き込みを変換するもので、Codex ネイティブツール記録は対象ではありません。                              | 変換済み記録をミラーすることは可能ですが、正規の書き換えには Codex サポートが必要です。                |
| リッチなネイティブ Compaction メタデータ             | OpenClaw は Compaction の開始と完了を観測しますが、安定した保持/削除一覧、トークン差分、要約ペイロードは受け取りません。                        | より豊かな Codex Compaction イベントが必要です。                                                        |
| Compaction への介入                                 | 現在の OpenClaw Compaction フックは、Codex モードでは通知レベルです。                                                                           | Plugin がネイティブ Compaction を拒否または書き換える必要があるなら、Codex の pre/post Compaction フックを追加します。 |
| stop または最終回答のゲーティング                   | Codex にはネイティブ stop フックがありますが、OpenClaw は最終回答ゲーティングを v1 Plugin コントラクトとして公開していません。                  | ループとタイムアウト保護付きの将来的なオプトイン primitive。                                             |
| コミット済み v1 画面としてのネイティブ MCP フック同等性 | relay 自体は汎用ですが、OpenClaw はネイティブ MCP の pre/post フック動作を end to end で version-gate してテストしていません。                 | サポート対象 app-server プロトコルの下限がそれらのペイロードをカバーしたら、OpenClaw の MCP relay テストとドキュメントを追加します。 |
| バイト単位で一致する model API リクエストの捕捉      | OpenClaw は app-server リクエストと通知を捕捉できますが、最終的な OpenAI API リクエストは Codex コアが内部で組み立てます。                     | Codex の model-request tracing event または debug API が必要です。                                      |

## ツール、メディア、Compaction

Codex ハーネスが変更するのは、低レベルの埋め込み agent executor だけです。

OpenClaw は引き続きツール一覧を構築し、ハーネスから動的ツール結果を受け取ります。text、images、video、music、TTS、承認、messaging-tool 出力は、
通常の OpenClaw 配信経路を通り続けます。

native hook relay は意図的に汎用ですが、v1 サポートコントラクトは OpenClaw がテストしている
Codex ネイティブのツールおよび権限経路に限定されます。将来の Codex フックイベントすべてが
OpenClaw Plugin 画面だと、このランタイムコントラクトで明示されるまでは想定しないでください。

Codex MCP ツール承認の elicitation は、Codex が `_meta.codex_approval_kind` を
`"mcp_tool_call"` とマークした場合、OpenClaw の Plugin
承認フローを通じてルーティングされます。Codex の `request_user_input` プロンプトは元のチャットへ返送され、
次のキュー済み follow-up メッセージは追加コンテキストとして扱われるのではなく、そのネイティブ
server リクエストへの回答になります。その他の MCP elicitation
リクエストは引き続きクローズドに失敗します。

選択された model が Codex ハーネスを使う場合、ネイティブ thread Compaction は
Codex app-server に委譲されます。OpenClaw は、チャネル履歴、検索、`/new`、`/reset`、および将来の model またはハーネス切り替えのために transcript ミラーを維持します。この
ミラーには、ユーザープロンプト、最終 assistant テキスト、そして app-server が出力した場合には軽量な Codex
reasoning または plan レコードが含まれます。現時点では、OpenClaw はネイティブ
Compaction の開始と完了シグナルだけを記録します。Codex が
Compaction 後にどのエントリを保持したかを示す、人間が読める Compaction 要約や監査可能な一覧はまだ公開していません。

正規のネイティブ thread を Codex が所有するため、`tool_result_persist` は現在
Codex ネイティブツール結果記録を書き換えません。これは
OpenClaw が OpenClaw 所有セッショントランスクリプトのツール結果を書き込む場合にのみ適用されます。

メディア生成に PI は不要です。image、video、music、PDF、TTS、メディア
理解は、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、
`messages.tts` のような対応する provider/model 設定を引き続き使います。

## トラブルシューティング

**Codex が通常の `/model` provider として表示されない:** 新しい config では
想定どおりです。`embeddedHarness.runtime: "codex"`（または旧 `codex/*` ref）付きの
`openai/gpt-*` model を選択し、`plugins.entries.codex.enabled` を有効にし、
`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく PI を使う:** `runtime: "auto"` では、Codex ハーネスが実行を引き受けない場合、
互換性バックエンドとして引き続き PI が使われることがあります。テスト中に
Codex 選択を強制するには `embeddedHarness.runtime: "codex"` を設定してください。
強制された Codex ランタイムは、明示的に `embeddedHarness.fallback: "pi"` を設定しない限り、
PI にフォールバックせず失敗するようになりました。Codex app-server が
選択されると、その失敗は追加の fallback config なしで直接表面化します。

**app-server が拒否される:** app-server handshake が
バージョン `0.118.0` 以降を報告するよう、Codex を更新してください。

**model 検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs`
を下げるか、検出を無効にしてください。

**WebSocket トランスポートがすぐ失敗する:** `appServer.url`、`authToken`、
およびリモート app-server が同じ Codex app-server プロトコルバージョンを話していることを確認してください。

**非 Codex model が PI を使う:** その agent に対して
`embeddedHarness.runtime: "codex"` を強制しているか、旧
`codex/*` ref を選んでいない限り、これは想定どおりです。通常の `openai/gpt-*` や他の provider ref は、
`auto` モードでは通常の provider 経路に留まります。`runtime: "codex"` を強制した場合、その agent の
すべての埋め込みターンは Codex 対応 OpenAI model でなければなりません。

## 関連

- [Agent harness plugins](/ja-JP/plugins/sdk-agent-harness)
- [Agent runtimes](/ja-JP/concepts/agent-runtimes)
- [Model providers](/ja-JP/concepts/model-providers)
- [OpenAI provider](/ja-JP/providers/openai)
- [Status](/ja-JP/cli/status)
- [Plugin hooks](/ja-JP/plugins/hooks)
- [Configuration reference](/ja-JP/gateway/configuration-reference)
- [Testing](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
