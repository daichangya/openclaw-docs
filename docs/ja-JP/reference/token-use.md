---
read_when:
    - トークン使用量、コスト、またはコンテキストウィンドウについて説明するとき
    - コンテキストの増加や圧縮動作をデバッグするとき
summary: OpenClaw がどのようにプロンプトコンテキストを構築し、トークン使用量とコストを報告するか
title: トークン使用量とコスト
x-i18n:
    generated_at: "2026-04-05T12:56:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e7a0ac0311298cf1484d663799a3f5a9687dd5afc9702233e983aba1979f1d
    source_path: reference/token-use.md
    workflow: 15
---

# トークン使用量とコスト

OpenClaw は**文字数**ではなく**トークン**を追跡します。トークンはモデルごとに異なりますが、ほとんどの
OpenAI スタイルのモデルでは、英語テキストは平均して 1 トークンあたり約 4 文字です。

## システムプロンプトの構築方法

OpenClaw は実行のたびに独自のシステムプロンプトを組み立てます。これには次のものが含まれます。

- ツール一覧 + 短い説明
- Skills 一覧（メタデータのみ。指示は必要に応じて `read` で読み込まれます）
- 自己更新の指示
- ワークスペース + ブートストラップファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、新規時の `BOOTSTRAP.md`、さらに存在する場合は `MEMORY.md`、または小文字フォールバックとして `memory.md`）。大きなファイルは `agents.defaults.bootstrapMaxChars`（デフォルト: 20000）で切り詰められ、ブートストラップ全体の注入量は `agents.defaults.bootstrapTotalMaxChars`（デフォルト: 150000）で上限が設定されます。`memory/*.md` ファイルはメモリツール経由のオンデマンドであり、自動注入はされません。
- 時刻（UTC + ユーザーのタイムゾーン）
- 返信タグ + heartbeat の動作
- ランタイムメタデータ（ホスト/OS/モデル/thinking）

完全な内訳は [System Prompt](/ja-JP/concepts/system-prompt) を参照してください。

## コンテキストウィンドウに含まれるもの

モデルが受け取るものは、すべてコンテキスト制限に含まれます。

- システムプロンプト（上記のすべてのセクション）
- 会話履歴（ユーザー + アシスタントのメッセージ）
- ツール呼び出しとツール結果
- 添付ファイル/文字起こし（画像、音声、ファイル）
- 圧縮要約と剪定アーティファクト
- プロバイダーラッパーまたは安全性ヘッダー（表示はされませんが、それでもカウントされます）

画像については、OpenClaw はプロバイダー呼び出し前に文字起こし/ツールの画像ペイロードを縮小します。
これを調整するには `agents.defaults.imageMaxDimensionPx`（デフォルト: `1200`）を使用します。

- 値を小さくすると、通常はビジョントークン使用量とペイロードサイズが減ります。
- 値を大きくすると、OCR や UI 中心のスクリーンショットでより多くの視覚的詳細を保持できます。

実用的な内訳（注入されたファイルごと、ツール、Skills、システムプロンプトサイズごと）を確認するには、`/context list` または `/context detail` を使用してください。[Context](/ja-JP/concepts/context) を参照してください。

## 現在のトークン使用量を確認する方法

チャットでは次を使用します。

- `/status` → セッションモデル、コンテキスト使用量、
  前回応答の入力/出力トークン、および**推定コスト**（API キーのみ）を含む**絵文字豊富なステータスカード**。
- `/usage off|tokens|full` → すべての返信に**応答ごとの使用量フッター**を追加します。
  - セッションごとに保持されます（`responseUsage` として保存）。
  - OAuth 認証では**コストは非表示**になります（トークンのみ）。
- `/usage cost` → OpenClaw のセッションログからローカルのコスト要約を表示します。

その他の表示面:

- **TUI/Web TUI:** `/status` と `/usage` に対応しています。
- **CLI:** `openclaw status --usage` と `openclaw channels list` は
  正規化されたプロバイダーのクォータウィンドウ（応答ごとのコストではなく `X% left`）を表示します。
  現在の使用量ウィンドウ対応プロバイダー: Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi、z.ai。

使用量表示面では、表示前に一般的なプロバイダーネイティブのフィールド別名を正規化します。
OpenAI 系の Responses トラフィックでは、これには `input_tokens` /
`output_tokens` と `prompt_tokens` / `completion_tokens` の両方が含まれるため、転送方式ごとの
フィールド名によって `/status`、`/usage`、またはセッション要約が変わることはありません。
Gemini CLI の JSON 使用量も正規化されます。返信テキストは `response` から取得され、
CLI が明示的な `stats.input` フィールドを省略した場合は、`stats.cached` は `cacheRead` に対応付けられ、
`stats.input_tokens - stats.cached` が使用されます。
ネイティブの OpenAI 系 Responses トラフィックでは、WebSocket/SSE の使用量別名も
同じ方法で正規化され、`total_tokens` が欠けているか `0` の場合は、合計値は正規化済みの入力 + 出力にフォールバックします。
現在のセッションスナップショットが疎な場合、`/status` と `session_status` は
最新の文字起こし使用量ログからトークン/キャッシュカウンターとアクティブなランタイムモデルラベルを
復元することもできます。既存のゼロ以外のライブ値は引き続き文字起こしフォールバック値より優先され、
保存された合計が欠けているか小さい場合は、より大きなプロンプト指向の
文字起こし合計が優先されることがあります。
プロバイダークォータウィンドウの使用量認証は、利用可能な場合はプロバイダー固有のフックから取得されます。
それ以外の場合、OpenClaw は auth プロファイル、環境変数、または設定から一致する OAuth/API キー資格情報にフォールバックします。

## コスト見積もり（表示される場合）

コストは、モデル価格設定の構成から見積もられます。

```
models.providers.<provider>.models[].cost
```

これらは `input`、`output`、`cacheRead`、`cacheWrite` に対する**100 万トークンあたりの USD**です。価格設定がない場合、OpenClaw はトークンのみを表示します。OAuth トークンではドル建てコストは表示されません。

## キャッシュ TTL と剪定の影響

プロバイダーのプロンプトキャッシュは、キャッシュ TTL ウィンドウ内でのみ適用されます。OpenClaw は
必要に応じて**cache-ttl pruning** を実行できます。これは、キャッシュ TTL の
期限が切れた時点でセッションを剪定し、その後キャッシュウィンドウをリセットして、以降のリクエストが
履歴全体を再キャッシュする代わりに、新しくキャッシュされたコンテキストを再利用できるようにするものです。これにより、セッションが TTL を超えてアイドル状態になったときのキャッシュ書き込み
コストを低く保てます。

これは [Gateway configuration](/ja-JP/gateway/configuration) で設定でき、
動作の詳細は [Session pruning](/ja-JP/concepts/session-pruning) を参照してください。

heartbeat は、アイドル時間の空白をまたいでキャッシュを**温かい状態**に保てます。モデルのキャッシュ TTL が
`1h` の場合、heartbeat 間隔をその少し手前（たとえば `55m`）に設定すると、プロンプト全体の再キャッシュを避けられ、
キャッシュ書き込みコストを減らせます。

マルチエージェント構成では、1 つの共有モデル構成を維持したまま、
`agents.list[].params.cacheRetention` でエージェントごとにキャッシュ動作を調整できます。

各設定項目ごとの完全なガイドは [Prompt Caching](/reference/prompt-caching) を参照してください。

Anthropic API の価格設定では、キャッシュ読み取りは入力
トークンより大幅に安価である一方、キャッシュ書き込みはより高い倍率で課金されます。最新の料金と TTL 倍率については、Anthropic の
プロンプトキャッシュ価格設定を参照してください:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 例: heartbeat で 1 時間のキャッシュを温かく保つ

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### 例: エージェントごとのキャッシュ戦略による混在トラフィック

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # ほとんどのエージェント向けのデフォルト基準
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # 深いセッションのために長いキャッシュを温かく保つ
    - id: "alerts"
      params:
        cacheRetention: "none" # バースト的な通知ではキャッシュ書き込みを避ける
```

`agents.list[].params` は、選択されたモデルの `params` の上にマージされるため、
`cacheRetention` だけを上書きし、他のモデルデフォルトはそのまま継承できます。

### 例: Anthropic 1M コンテキストのベータヘッダーを有効にする

Anthropic の 1M コンテキストウィンドウは、現在ベータ制限付きです。OpenClaw は、
対応する Opus または Sonnet モデルで `context1m` を有効にすると、必要な
`anthropic-beta` の値を注入できます。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

これは Anthropic の `context-1m-2025-08-07` ベータヘッダーに対応します。

これは、そのモデルエントリーで `context1m: true` が設定されている場合にのみ適用されます。

要件: 資格情報がロングコンテキスト利用の対象である必要があります（API キーの
課金、または Extra Usage が有効な OpenClaw の Claude-login 経路）。そうでない場合、
Anthropic は
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`
で応答します。

Anthropic を OAuth/サブスクリプショントークン（`sk-ant-oat-*`）で認証している場合、
Anthropic は現在この組み合わせを HTTP 401 で拒否するため、OpenClaw は `context-1m-*` ベータヘッダーをスキップします。

## トークン圧迫を減らすためのヒント

- `/compact` を使用して長いセッションを要約する。
- ワークフロー内で大きなツール出力を切り詰める。
- スクリーンショット中心のセッションでは `agents.defaults.imageMaxDimensionPx` を下げる。
- Skills の説明を短く保つ（Skill 一覧はプロンプトに注入されます）。
- 冗長で探索的な作業には、より小さなモデルを優先する。

正確な Skill 一覧のオーバーヘッド計算式については [Skills](/tools/skills) を参照してください。
