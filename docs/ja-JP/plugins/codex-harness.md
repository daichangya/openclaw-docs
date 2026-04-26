---
read_when:
    - バンドル済みの Codex app-server ハーネスを使いたい場合
    - Codex ハーネスの config 例が必要な場合
    - Codex 専用デプロイで Pi へのフォールバックではなく失敗させたい場合
summary: バンドル済みの Codex app-server ハーネスを通して OpenClaw の組み込み agent ターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-04-26T11:35:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf54ee2eab64e611e50605e8fef24cc840b3246d0bddc18ae03730a05848e271
    source_path: plugins/codex-harness.md
    workflow: 15
---

バンドル済みの `codex` Plugin を使うと、OpenClaw は組み込み agent ターンを、内蔵の Pi ハーネスではなく Codex app-server 経由で実行できます。

これは、Codex に低レベルの agent セッションを所有させたい場合に使います。対象は、model 検出、ネイティブ thread resume、ネイティブ Compaction、app-server 実行です。OpenClaw は引き続き、チャットチャネル、session files、model 選択、tools、approvals、media 配信、および可視 transcript mirror を所有します。

全体像を把握したい場合は、まず [Agent runtimes](/ja-JP/concepts/agent-runtimes) から始めてください。短く言えば、`openai/gpt-5.5` は model ref、`codex` は runtime、そして Telegram、Discord、Slack、または他のチャネルは通信サーフェスのままです。

## この Plugin が変更する内容

バンドル済みの `codex` Plugin は、いくつかの独立した機能を提供します。

| 機能 | 使い方 | 何をするか |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| ネイティブ組み込み runtime | `agentRuntime.id: "codex"` | OpenClaw の組み込み agent ターンを Codex app-server 経由で実行します。 |
| ネイティブ chat-control コマンド | `/codex bind`, `/codex resume`, `/codex steer`, ... | メッセージ会話から Codex app-server thread をバインドして制御します。 |
| Codex app-server provider/catalog | `codex` 内部機構。ハーネス経由で表面化 | runtime が app-server model を検出および検証できるようにします。 |
| Codex media-understanding パス | `codex/*` image-model 互換パス | 対応する image understanding models に対して、制限付き Codex app-server ターンを実行します。 |
| ネイティブ hook relay | Codex ネイティブイベントの前後にある Plugin hooks | OpenClaw が対応する Codex ネイティブ tool/finalization イベントを観測/ブロックできるようにします。 |

この Plugin を有効化すると、これらの機能が利用可能になります。**ただし、次のことは行いません**:

- すべての OpenAI model で Codex を使い始める
- `openai-codex/*` model ref をネイティブ runtime に変換する
- ACP/acpx をデフォルトの Codex パスにする
- すでに Pi runtime を記録済みの既存セッションをホットスイッチする
- OpenClaw のチャネル配信、session files、auth-profile ストレージ、またはメッセージルーティングを置き換える

同じ Plugin は、ネイティブな `/codex` chat-control コマンドサーフェスも所有します。Plugin が有効で、ユーザーがチャットから Codex thread の bind、resume、steer、stop、inspect を求めた場合、agent は ACP より `/codex ...` を優先すべきです。ACP は、ユーザーが ACP/acpx を明示した場合、または ACP Codex アダプターをテストしている場合の明示的フォールバックとして残ります。

ネイティブ Codex ターンでは、OpenClaw Plugin hooks が公開互換レイヤーとして維持されます。これらはプロセス内の OpenClaw hooks であり、Codex の `hooks.json` コマンド hooks ではありません:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- mirror された transcript レコード用の `before_message_write`
- Codex `Stop` relay 経由の `before_agent_finalize`
- `agent_end`

Plugins は、OpenClaw が tool を実行した後、かつ結果が Codex に返される前に、OpenClaw の動的 tool result を書き換える runtime 中立の tool-result middleware も登録できます。これは、OpenClaw 所有の transcript tool-result 書き込みを変換する公開 `tool_result_persist` Plugin hook とは別です。

Plugin hook 自体の意味については、[Plugin hooks](/ja-JP/plugins/hooks) と [Plugin guard behavior](/ja-JP/tools/plugin) を参照してください。

このハーネスはデフォルトでは無効です。新しい config では、OpenAI model ref は `openai/gpt-*` の canonical 形式を維持し、ネイティブ app-server 実行が必要な場合にのみ `agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex` を明示的に強制してください。旧式の `codex/*` model ref は互換性のため引き続きハーネスを自動選択しますが、runtime に裏打ちされた旧来 provider 接頭辞は通常の model/provider 選択肢としては表示されません。

`codex` Plugin が有効でも primary model がまだ `openai-codex/*` の場合、`openclaw doctor` はルートを変更せずに警告します。これは意図的です。`openai-codex/*` は引き続き Pi の Codex OAuth/サブスクリプション経路であり、ネイティブ app-server 実行は明示的な runtime 選択のままです。

## ルートマップ

config を変更する前に、この表を使ってください。

| 望む動作 | Model ref | Runtime 設定 | 必要な Plugin | 期待されるステータスラベル |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| 通常の OpenClaw runner 経由の OpenAI API | `openai/gpt-*` | 省略、または `runtime: "pi"` | OpenAI provider | `Runtime: OpenClaw Pi Default` |
| Pi 経由の Codex OAuth/サブスクリプション | `openai-codex/gpt-*` | 省略、または `runtime: "pi"` | OpenAI Codex OAuth provider | `Runtime: OpenClaw Pi Default` |
| ネイティブ Codex app-server 組み込みターン | `openai/gpt-*` | `agentRuntime.id: "codex"` | `codex` Plugin | `Runtime: OpenAI Codex` |
| 保守的な auto mode の mixed provider | provider 固有 ref | `agentRuntime.id: "auto"` | 任意の Plugin runtime | 選択された runtime に依存 |
| 明示的な Codex ACP アダプターセッション | ACP の prompt/model に依存 | `sessions_spawn` と `runtime: "acp"` | 健全な `acpx` backend | ACP task/session status |

重要なのは provider と runtime の分離です。

- `openai-codex/*` が答えるのは「Pi はどの provider/auth ルートを使うべきか？」
- `agentRuntime.id: "codex"` が答えるのは「この組み込みターンはどのループで実行すべきか？」
- `/codex ...` が答えるのは「このチャットはどのネイティブ Codex 会話を bind または control すべきか？」
- ACP が答えるのは「acpx はどの外部ハーネスプロセスを起動すべきか？」

## 正しい model 接頭辞を選ぶ

OpenAI 系ルートは接頭辞ごとに異なります。Pi 経由で Codex OAuth を使いたい場合は `openai-codex/*` を使い、直接 OpenAI API アクセスを使いたい場合、またはネイティブ Codex app-server ハーネスを強制したい場合は `openai/*` を使ってください。

| Model ref | Runtime パス | 使用する場面 |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4` | OpenClaw/Pi 経由の OpenAI provider | `OPENAI_API_KEY` で現在の直接 OpenAI Platform API アクセスを使いたい。 |
| `openai-codex/gpt-5.5` | OpenClaw/Pi 経由の OpenAI Codex OAuth | デフォルトの Pi runner で ChatGPT/Codex サブスクリプション auth を使いたい。 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server ハーネス | 組み込み agent ターンにネイティブ Codex app-server 実行を使いたい。 |

GPT-5.5 は現在、OpenClaw ではサブスクリプション/OAuth 専用です。Pi OAuth には `openai-codex/gpt-5.5` を使い、Codex app-server ハーネスには `openai/gpt-5.5` と組み合わせてください。`openai/gpt-5.5` への直接 API-key アクセスは、OpenAI が GPT-5.5 を public API で有効化するとサポートされます。

旧式の `codex/gpt-*` ref は互換エイリアスとして引き続き受け付けられます。Doctor の互換マイグレーションでは、旧式の primary runtime ref を canonical な model ref に書き換え、runtime ポリシーは別に記録します。一方で fallback 専用の旧式 ref は、runtime が agent コンテナ全体に対して設定されるため、そのまま残されます。新しい Pi Codex OAuth config では `openai-codex/gpt-*` を使い、新しいネイティブ app-server ハーネス config では `openai/gpt-*` と `agentRuntime.id: "codex"` の組み合わせを使ってください。

`agents.defaults.imageModel` も同じ接頭辞の分割に従います。image understanding を OpenAI Codex OAuth provider パス経由で実行したい場合は `openai-codex/gpt-*` を使ってください。制限付き Codex app-server ターン経由で image understanding を実行したい場合は `codex/gpt-*` を使ってください。Codex app-server model は image input 対応を宣言している必要があります。テキスト専用の Codex model は media turn 開始前に失敗します。

現在のセッションで実際に使われるハーネスを確認するには `/status` を使ってください。選択結果が予想外なら、`agents/harness` サブシステムの debug logging を有効にして、gateway の構造化 `agent harness selected` レコードを確認してください。そこには、選択された harness id、選択理由、runtime/fallback policy、そして `auto` mode では各 Plugin 候補の対応結果が含まれます。

### Doctor の警告が意味するもの

`openclaw doctor` は、次のすべてが真の場合に警告します。

- バンドル済みの `codex` Plugin が有効、または許可されている
- agent の primary model が `openai-codex/*`
- その agent の実効 runtime が `codex` ではない

この警告があるのは、多くのユーザーが「Codex Plugin が有効」=「ネイティブ Codex app-server runtime」と期待するためです。OpenClaw はその飛躍を行いません。この警告の意味は次のとおりです。

- ChatGPT/Codex OAuth を Pi 経由で使う意図なら、**変更は不要**です。
- ネイティブ app-server 実行を意図しているなら、model を `openai/<model>` に変更し、`agentRuntime.id: "codex"` を設定してください。
- runtime 変更後でも、既存セッションには `/new` または `/reset` が必要です。session runtime pin は sticky だからです。

Harness 選択はライブセッション制御ではありません。組み込みターンが実行されると、OpenClaw は選択された harness id をそのセッションに記録し、同じ session id の後続ターンでもそれを使い続けます。将来のセッションで別の harness を使いたい場合は `agentRuntime` config または `OPENCLAW_AGENT_RUNTIME` を変更し、既存会話を Pi と Codex の間で切り替える前に `/new` または `/reset` で新しいセッションを開始してください。これにより、1 つの transcript を互換性のない 2 つのネイティブセッションシステムで再生することを避けられます。

Harness pin が導入される前に作成された旧式セッションは、transcript 履歴を持つと Pi 固定として扱われます。config を変更した後、その会話を Codex に切り替えるには `/new` または `/reset` を使ってください。

`/status` は実効 model runtime を表示します。デフォルトの Pi ハーネスは `Runtime: OpenClaw Pi Default`、Codex app-server ハーネスは `Runtime: OpenAI Codex` と表示されます。

## 要件

- バンドル済み `codex` Plugin が利用可能な OpenClaw。
- Codex app-server `0.125.0` 以降。バンドル済み Plugin は互換性のある Codex app-server バイナリをデフォルトで管理するため、`PATH` 上のローカル `codex` コマンドは通常のハーネス起動には影響しません。
- app-server プロセスで利用可能な Codex auth。

この Plugin は、古い app-server ハンドシェイクやバージョン情報のないハンドシェイクをブロックします。これにより、OpenClaw はテスト済みのプロトコルサーフェスに留まります。

live および Docker smoke tests では、auth は通常 `OPENAI_API_KEY` に加えて、`~/.codex/auth.json` や `~/.codex/config.toml` のような任意の Codex CLI file から取得されます。ローカル Codex app-server が使っているのと同じ auth 情報を使用してください。

## 最小 config

`openai/gpt-5.5` を使い、バンドル済み Plugin を有効化し、`codex` ハーネスを強制します。

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
      agentRuntime: {
        id: "codex",
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

`agents.defaults.model` または agent model に `codex/<model>` を設定する旧式 config では、引き続きバンドル済み `codex` Plugin が自動有効化されます。新しい config では、`openai/<model>` と上記の明示的な `agentRuntime` エントリの組み合わせを推奨します。

## 他の model と並べて Codex を追加する

同じ agent が Codex provider model と非 Codex provider model を自由に切り替える必要がある場合、`agentRuntime.id: "codex"` をグローバルには設定しないでください。強制 runtime は、その agent または session のすべての組み込みターンに適用されます。その runtime が強制されている状態で Anthropic model を選ぶと、OpenClaw はそのターンを Pi に静かにルーティングするのではなく、Codex ハーネスを試して closed fail します。

代わりに、次のいずれかの形を使ってください:

- `agentRuntime.id: "codex"` を設定した専用 agent に Codex を置く。
- 通常の mixed provider 利用には、デフォルト agent を `agentRuntime.id: "auto"` と Pi フォールバックのままにする。
- 旧式の `codex/*` ref は互換性目的にのみ使う。新しい config では `openai/*` と明示的な Codex runtime policy の組み合わせを推奨する。

たとえば、次の構成ではデフォルト agent を通常の自動選択のままにし、別の Codex agent を追加します。

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
      agentRuntime: {
        id: "auto",
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

この構成では:

- デフォルトの `main` agent は通常の provider パスと Pi 互換フォールバックを使用します。
- `codex` agent は Codex app-server ハーネスを使用します。
- `codex` agent に対して Codex が見つからない、または未対応の場合、そのターンは PI を静かに使うのではなく失敗します。

## Agent コマンドルーティング

agent は、単に「Codex」という単語だけでなく、ユーザーの意図に基づいてリクエストをルーティングすべきです。

| ユーザーが求めていること | agent が使うべきもの |
| -------------------------------------------------------- | ------------------------------------------------ |
| 「このチャットを Codex に bind して」 | `/codex bind` |
| 「Codex thread `<id>` をここで resume して」 | `/codex resume <id>` |
| 「Codex threads を表示して」 | `/codex threads` |
| 「この agent の runtime として Codex を使って」 | `agentRuntime.id` への config 変更 |
| 「通常の OpenClaw で ChatGPT/Codex サブスクリプションを使って」 | `openai-codex/*` model ref |
| 「ACP/acpx 経由で Codex を実行して」 | ACP `sessions_spawn({ runtime: "acp", ... })` |
| 「スレッド内で Claude Code/Gemini/OpenCode/Cursor を開始して」 | ACP/acpx。`/codex` でもネイティブ sub-agent でもない |

OpenClaw は、ACP が有効で、dispatch 可能で、ロード済み runtime backend に支えられている場合にのみ、ACP spawn ガイダンスを agent に公開します。ACP が利用できない場合、system prompt や Plugin Skills は agent に ACP ルーティングを教えるべきではありません。

## Codex 専用デプロイ

すべての組み込み agent ターンが Codex を使用することを保証したい場合は、Codex ハーネスを強制してください。明示的な Plugin runtime はデフォルトで Pi フォールバックなしになるため、`fallback: "none"` は任意ですが、ドキュメントとして有用なことが多いです。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

環境変数でのオーバーライド:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Codex を強制すると、Codex Plugin が無効、app-server が古すぎる、または app-server を起動できない場合に OpenClaw は早期に失敗します。ハーネス選択が欠けている場合に意図的に PI へ処理させたい場合にのみ、`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` を設定してください。

## agent ごとの Codex

デフォルト agent は通常の自動選択のままにしつつ、1 つの agent だけを Codex 専用にできます。

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
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
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

通常の session コマンドで agent と model を切り替えてください。`/new` は新しい OpenClaw session を作成し、Codex ハーネスは必要に応じてその sidecar app-server thread を作成または resume します。`/reset` はその thread に対する OpenClaw session binding をクリアし、次のターンで現在の config から再びハーネスを解決できるようにします。

## Model 検出

デフォルトでは、Codex Plugin は app-server に利用可能な model を問い合わせます。検出が失敗またはタイムアウトした場合、次のためのバンドル済みフォールバック catalog を使用します。

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

`plugins.entries.codex.config.discovery` 配下で検出を調整できます。

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

起動時に Codex を probe せず、フォールバック catalog に固定したい場合は、検出を無効にします。

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

## App-server 接続とポリシー

デフォルトでは、Plugin は OpenClaw が管理するローカル Codex バイナリを次のように起動します。

```bash
codex app-server --listen stdio://
```

この管理バイナリはバンドル済み Plugin runtime 依存関係として宣言され、`codex` Plugin の他の依存関係と一緒に配置されます。これにより、app-server のバージョンは、ローカルにたまたまインストールされている別の Codex CLI ではなく、バンドル済み Plugin に紐付きます。`appServer.command` は、意図的に別の実行ファイルを使いたい場合にのみ設定してください。

デフォルトでは、OpenClaw はローカル Codex ハーネスセッションを YOLO mode で起動します: `approvalPolicy: "never"`、`approvalsReviewer: "user"`、`sandbox: "danger-full-access"`。これは、自律 Heartbeat に使われる信頼済みローカル運用者の姿勢です。Codex は、誰も応答しないネイティブ承認プロンプトで停止することなく、shell と network tools を使用できます。

Codex の guardian-reviewed 承認を有効にするには、`appServer.mode: "guardian"` を設定してください。

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

Guardian mode は Codex ネイティブの auto-review 承認パスを使います。Codex が sandbox を抜ける、workspace 外へ書き込む、または network access のような権限追加を求めた場合、Codex はその承認リクエストを人間へのプロンプトではなくネイティブ reviewer にルーティングします。reviewer は Codex のリスクフレームワークを適用し、その具体的なリクエストを承認または拒否します。YOLO mode より多くのガードレールがほしいが、無人 agent に進行させたい場合は Guardian を使ってください。

`guardian` プリセットは、`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、`sandbox: "workspace-write"` に展開されます。個々のポリシーフィールドは依然として `mode` を上書きするため、高度なデプロイではプリセットと明示的な選択を混在させることもできます。古い `guardian_subagent` reviewer 値も互換エイリアスとして引き続き受け付けられますが、新しい config では `auto_review` を使うべきです。

すでに実行中の app-server を使う場合は、WebSocket トランスポートを使用してください。

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

対応する `appServer` フィールド:

| Field | Default | 意味 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `transport` | `"stdio"` | `"stdio"` は Codex を起動し、`"websocket"` は `url` に接続します。 |
| `command` | 管理された Codex バイナリ | stdio トランスポート用の実行ファイル。管理バイナリを使うには未設定のままにし、明示的な override の場合にのみ設定してください。 |
| `args` | `["app-server", "--listen", "stdio://"]` | stdio トランスポート用の引数。 |
| `url` | 未設定 | WebSocket app-server URL。 |
| `authToken` | 未設定 | WebSocket トランスポート用の Bearer token。 |
| `headers` | `{}` | 追加の WebSocket ヘッダー。 |
| `requestTimeoutMs` | `60000` | app-server 制御プレーン呼び出しのタイムアウト。 |
| `mode` | `"yolo"` | YOLO 実行または guardian-reviewed 実行のプリセット。 |
| `approvalPolicy` | `"never"` | thread start/resume/turn に送られるネイティブ Codex 承認ポリシー。 |
| `sandbox` | `"danger-full-access"` | thread start/resume に送られるネイティブ Codex sandbox mode。 |
| `approvalsReviewer` | `"user"` | Codex にネイティブ承認プロンプトをレビューさせるには `"auto_review"` を使用します。`guardian_subagent` は旧式エイリアスとして残ります。 |
| `serviceTier` | 未設定 | 任意の Codex app-server service tier: `"fast"`、`"flex"`、または `null`。無効な旧式値は無視されます。 |

ローカルテスト用の環境変数オーバーライドも引き続き利用可能です。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、`OPENCLAW_CODEX_APP_SERVER_BIN` は管理バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに `plugins.entries.codex.config.appServer.mode: "guardian"` を使うか、一時的なローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使ってください。繰り返し可能なデプロイでは、Codex ハーネス設定の他の部分と同じレビュー対象ファイルに Plugin の挙動を保てるため、config の方が推奨されます。

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

Codex 専用ハーネス検証:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
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

Guardian-reviewed Codex 承認:

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

明示的なヘッダー付きのリモート app-server:

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

model 切り替えは引き続き OpenClaw が制御します。OpenClaw session が既存の Codex thread に接続されている場合、次のターンでは現在選択されている OpenAI model、provider、approval policy、sandbox、service tier が再度 app-server に送られます。`openai/gpt-5.5` から `openai/gpt-5.2` に切り替えると thread binding は維持されますが、新しく選択した model で続行するよう Codex に求めます。

## Codex コマンド

バンドル済み Plugin は、認可された slash command として `/codex` を登録します。これは汎用であり、OpenClaw のテキストコマンドをサポートする任意のチャネルで動作します。

よく使う形式:

- `/codex status` は、live app-server 接続性、models、account、rate limits、MCP servers、Skills を表示します。
- `/codex models` は、live Codex app-server models を一覧表示します。
- `/codex threads [filter]` は、最近の Codex threads を一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw session を既存の Codex thread に接続します。
- `/codex compact` は、接続された thread の Compaction を Codex app-server に要求します。
- `/codex review` は、接続された thread に対する Codex ネイティブ review を開始します。
- `/codex account` は、account と rate-limit 状態を表示します。
- `/codex mcp` は、Codex app-server MCP server 状態を一覧表示します。
- `/codex skills` は、Codex app-server Skills を一覧表示します。

`/codex resume` は、ハーネスが通常ターンで使うのと同じ sidecar binding file を書き込みます。次のメッセージで OpenClaw はその Codex thread を resume し、現在選択されている OpenClaw model を app-server に渡し、拡張履歴を有効のまま維持します。

このコマンドサーフェスには Codex app-server `0.125.0` 以降が必要です。将来またはカスタムの app-server がその JSON-RPC メソッドを公開していない場合、個々の制御メソッドは `unsupported by this Codex app-server` として報告されます。

## Hook 境界

Codex ハーネスには 3 つの hook レイヤーがあります。

| レイヤー | 所有者 | 目的 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin hooks | OpenClaw | Pi と Codex ハーネス間の製品/Plugin 互換性。 |
| Codex app-server 拡張 middleware | OpenClaw バンドル済み Plugins | OpenClaw の動的 tools 周辺のターン単位アダプター挙動。 |
| Codex ネイティブ hooks | Codex | Codex config からの低レベル Codex ライフサイクルとネイティブ tool policy。 |

OpenClaw は、OpenClaw Plugin 挙動のルーティングに project またはグローバルの Codex `hooks.json` files を使いません。サポートされるネイティブ tool および permission bridge では、OpenClaw は thread ごとの Codex config を注入し、`PreToolUse`、`PostToolUse`、`PermissionRequest`、`Stop` を扱います。`SessionStart` や `UserPromptSubmit` のような他の Codex hooks は引き続き Codex レベルの制御であり、v1 契約では OpenClaw Plugin hooks としては公開されません。

OpenClaw の動的 tools では、Codex が呼び出しを要求した後に OpenClaw がその tool を実行するため、OpenClaw はハーネスアダプター内で自分が所有する Plugin および middleware 挙動を発火します。Codex ネイティブ tools では、Codex が canonical な tool record を所有します。OpenClaw は選択されたイベントを mirror できますが、Codex が app-server またはネイティブ hook callback を通じてその操作を公開しない限り、ネイティブ Codex thread 自体を書き換えることはできません。

Compaction と LLM ライフサイクルの投影は、ネイティブ Codex hook コマンドではなく、Codex app-server 通知と OpenClaw アダプター状態から来ます。OpenClaw の `before_compaction`、`after_compaction`、`llm_input`、`llm_output` イベントはアダプターレベルの観測であり、Codex の内部リクエストや Compaction ペイロードの完全一致キャプチャではありません。

Codex ネイティブの `hook/started` および `hook/completed` app-server 通知は、trajectory とデバッグのために `codex_app_server.hook` agent event として投影されます。これらは OpenClaw Plugin hooks を呼び出しません。

## V1 サポート契約

Codex mode は、下で別の model call を使っているだけの Pi ではありません。Codex はネイティブ model loop のより多くを所有し、OpenClaw はその境界の周囲に Plugin と session サーフェスを適応させます。

Codex runtime v1 でサポートされるもの:

| サーフェス | サポート | 理由 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex 経由の OpenAI model loop | サポート | Codex app-server が OpenAI ターン、ネイティブ thread resume、ネイティブ tool continuation を所有します。 |
| OpenClaw のチャネルルーティングと配信 | サポート | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャネルは model runtime の外側に留まります。 |
| OpenClaw の動的 tools | サポート | Codex はこれらの tools の実行を OpenClaw に要求するため、OpenClaw は実行パス内に留まります。 |
| Prompt と context Plugins | サポート | OpenClaw は prompt overlay を構築し、thread を開始または resume する前に context を Codex ターンへ投影します。 |
| Context engine ライフサイクル | サポート | Assemble、ingest または after-turn maintenance、および context-engine の Compaction 協調が Codex ターンでも実行されます。 |
| 動的 tool hooks | サポート | `before_tool_call`、`after_tool_call`、および tool-result middleware は OpenClaw 所有の動的 tools の周辺で実行されます。 |
| ライフサイクル hooks | アダプター観測としてサポート | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は正直な Codex mode ペイロードで発火します。 |
| 最終回答 revision gate | ネイティブ hook relay 経由でサポート | Codex `Stop` は `before_agent_finalize` に relay され、`revise` は finalization 前にもう 1 回 model pass を Codex に要求します。 |
| ネイティブ shell、patch、MCP のブロックまたは観測 | ネイティブ hook relay 経由でサポート | Codex `PreToolUse` と `PostToolUse` は、Codex app-server `0.125.0` 以降の MCP payload を含む、確定済みネイティブ tool サーフェスに対して relay されます。ブロックはサポートされますが、引数の書き換えはサポートされません。 |
| ネイティブ permission policy | ネイティブ hook relay 経由でサポート | runtime が公開している範囲で、Codex `PermissionRequest` は OpenClaw policy を経由できます。OpenClaw が決定を返さない場合、Codex は通常の guardian または user 承認パスを続行します。 |
| App-server trajectory capture | サポート | OpenClaw は app-server に送ったリクエストと、app-server から受け取った通知を記録します。 |

Codex runtime v1 でサポートされないもの:

| サーフェス | V1 境界 | 将来の方向 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ネイティブ tool 引数の変更 | Codex ネイティブ pre-tool hooks はブロックできますが、OpenClaw は Codex ネイティブ tool 引数を書き換えません。 | 置換 tool input のための Codex hook/schema サポートが必要です。 |
| 編集可能な Codex ネイティブ transcript 履歴 | Codex が canonical なネイティブ thread 履歴を所有します。OpenClaw は mirror を所有し、将来の context を投影できますが、未対応の内部構造を変更すべきではありません。 | ネイティブ thread 手術が必要なら、明示的な Codex app-server API を追加します。 |
| Codex ネイティブ tool record に対する `tool_result_persist` | この hook は OpenClaw 所有の transcript 書き込みを変換するものであり、Codex ネイティブ tool record ではありません。 | 変換後 record を mirror することはできても、canonical な書き換えには Codex サポートが必要です。 |
| 詳細なネイティブ Compaction メタデータ | OpenClaw は Compaction の開始と完了を観測しますが、安定した kept/dropped リスト、token delta、summary payload は受け取りません。 | より豊富な Codex Compaction イベントが必要です。 |
| Compaction 介入 | 現在の OpenClaw Compaction hooks は、Codex mode では通知レベルです。 | Plugin がネイティブ Compaction を拒否または書き換えられるよう、Codex の pre/post Compaction hooks を追加します。 |
| byte-for-byte の model API request capture | OpenClaw は app-server のリクエストと通知をキャプチャできますが、最終的な OpenAI API request は Codex core が内部で構築します。 | Codex の model-request tracing イベントまたは debug API が必要です。 |

## Tools、media、Compaction

Codex ハーネスが変更するのは低レベルの組み込み agent executor だけです。

OpenClaw は引き続き tool list を構築し、ハーネスから動的 tool result を受け取ります。テキスト、画像、動画、音楽、TTS、approvals、messaging-tool 出力は、通常の OpenClaw 配信パスを通ります。

ネイティブ hook relay は意図的に汎用ですが、v1 サポート契約は OpenClaw がテストしている Codex ネイティブ tool および permission パスに限定されています。Codex runtime では、これには shell、patch、および MCP の `PreToolUse`、`PostToolUse`、`PermissionRequest` ペイロードが含まれます。今後の Codex hook event が runtime 契約で明示されるまでは、それが OpenClaw Plugin サーフェスだと仮定しないでください。

`PermissionRequest` については、OpenClaw は policy が判断した場合にのみ明示的な allow または deny を返します。no-decision の結果は allow ではありません。Codex はそれを hook 決定なしとして扱い、自身の guardian または user 承認パスにフォールスルーします。

Codex MCP tool 承認 elicitations は、Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` としてマークした場合、OpenClaw の Plugin 承認フローを通じてルーティングされます。Codex `request_user_input` プロンプトは元のチャットへ返送され、次にキューに入ったフォローアップメッセージは追加コンテキストとして steer されるのではなく、そのネイティブ server リクエストへの応答になります。その他の MCP elicitation リクエストは引き続き closed fail します。

選択された model が Codex ハーネスを使う場合、ネイティブ thread の Compaction は Codex app-server に委譲されます。OpenClaw は、チャネル履歴、検索、`/new`、`/reset`、および将来の model またはハーネス切り替えのために transcript mirror を維持します。この mirror には、ユーザープロンプト、最終 assistant テキスト、および app-server が出力した場合は軽量な Codex 推論または計画レコードが含まれます。現時点では、OpenClaw はネイティブ Compaction の開始と完了シグナルだけを記録します。Codex が Compaction 後にどのエントリを保持したかについて、人間向けに読める Compaction summary や監査可能な一覧はまだ公開していません。

Codex が canonical なネイティブ thread を所有するため、`tool_result_persist` は現在、Codex ネイティブ tool result レコードを書き換えません。これは OpenClaw が OpenClaw 所有の session transcript tool result を書き込むときにのみ適用されます。

media 生成に Pi は不要です。画像、動画、音楽、PDF、TTS、および media understanding は、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts` のような対応する provider/model 設定を引き続き使用します。

## トラブルシューティング

**Codex が通常の `/model` provider として表示されない:** 新しい config では想定どおりです。`agentRuntime.id: "codex"`（または旧式の `codex/*` ref）とともに `openai/gpt-*` model を選び、`plugins.entries.codex.enabled` を有効化し、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく Pi を使う:** `agentRuntime.id: "auto"` は、Codex ハーネスが実行を引き受けない場合に、互換 backend として依然 Pi を使うことがあります。テスト中に Codex 選択を強制するには `agentRuntime.id: "codex"` を設定してください。強制された Codex runtime は、`agentRuntime.fallback: "pi"` を明示的に設定しない限り、Pi にフォールバックせず失敗するようになりました。Codex app-server が選択されると、その失敗は追加のフォールバック設定なしに直接表面化します。

**app-server が拒否される:** app-server ハンドシェイクが `0.125.0` 以降を報告するように Codex を更新してください。`0.125.0-alpha.2` や `0.125.0+custom` のような同一バージョンの prerelease や build 接尾辞付きバージョンは拒否されます。OpenClaw がテストしているプロトコル下限は stable な `0.125.0` だからです。

**model 検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効化してください。

**WebSocket トランスポートがすぐ失敗する:** `appServer.url`、`authToken`、およびリモート app-server が同じ Codex app-server プロトコルバージョンを話していることを確認してください。

**非 Codex model が Pi を使う:** その agent に対して `agentRuntime.id: "codex"` を強制していない限り、または旧式の `codex/*` ref を選んでいない限り、想定どおりです。通常の `openai/gpt-*` や他の provider ref は、`auto` mode では通常の provider パスのままです。`agentRuntime.id: "codex"` を強制する場合、その agent のすべての組み込みターンは Codex がサポートする OpenAI model でなければなりません。

## 関連

- [Agent harness plugins](/ja-JP/plugins/sdk-agent-harness)
- [Agent runtimes](/ja-JP/concepts/agent-runtimes)
- [Model providers](/ja-JP/concepts/model-providers)
- [OpenAI provider](/ja-JP/providers/openai)
- [Status](/ja-JP/cli/status)
- [Plugin hooks](/ja-JP/plugins/hooks)
- [Configuration reference](/ja-JP/gateway/configuration-reference)
- [Testing](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
