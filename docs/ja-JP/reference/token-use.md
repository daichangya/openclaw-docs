---
read_when:
    - トークン使用量、コスト、またはコンテキストウィンドウの説明
    - コンテキストの増加やCompactionの挙動をデバッグする
summary: OpenClawがプロンプトコンテキストを構築し、トークン使用量とコストを報告する仕組み
title: トークン使用量とコスト
x-i18n:
    generated_at: "2026-04-26T11:40:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 828b282103902f55d65ce820c17753c2602169eff068bcea36e629759002f28d
    source_path: reference/token-use.md
    workflow: 15
---

# トークン使用量とコスト

OpenClawは文字数ではなく**トークン**を追跡します。トークンはモデル依存ですが、多くのOpenAIスタイルのモデルでは、英語テキストは平均して1トークンあたり約4文字です。

## システムプロンプトの構築方法

OpenClawは実行のたびに独自のシステムプロンプトを組み立てます。これには次のものが含まれます。

- ツール一覧と短い説明
- Skills一覧（メタデータのみ。指示は必要に応じて`read`で読み込まれます）。
  コンパクトなSkillsブロックは`skills.limits.maxSkillsPromptChars`によって制限され、エージェントごとの任意の上書きは`agents.list[].skillsLimits.maxSkillsPromptChars`にあります。
- 自己更新の指示
- ワークスペースとbootstrapファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、新規時の`BOOTSTRAP.md`、存在する場合の`MEMORY.md`）。ルートの小文字`memory.md`は注入されません。これは`MEMORY.md`と対になっている場合の`openclaw doctor --fix`向けのレガシー修復入力です。大きなファイルは`agents.defaults.bootstrapMaxChars`（デフォルト: 12000）で切り詰められ、bootstrap注入全体は`agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で上限設定されます。`memory/*.md`の日次ファイルは通常のbootstrapプロンプトには含まれません。通常ターンではメモリツール経由のオンデマンドのままですが、素の`/new`および`/reset`では、その最初のターンに限り、最近の日次メモリを含む1回限りのstartup-contextブロックが先頭に追加されることがあります。このstartup preludeは`agents.defaults.startupContext`で制御されます。
- 時刻（UTC + ユーザータイムゾーン）
- 返信タグとHeartbeatの動作
- ランタイムメタデータ（ホスト/OS/モデル/thinking）

完全な内訳は[System Prompt](/ja-JP/concepts/system-prompt)を参照してください。

## コンテキストウィンドウに含まれるもの

モデルが受け取るものはすべてコンテキスト上限にカウントされます。

- システムプロンプト（上記のすべてのセクション）
- 会話履歴（ユーザー + アシスタントメッセージ）
- ツール呼び出しとツール結果
- 添付ファイル/文字起こし（画像、音声、ファイル）
- Compaction要約と剪定アーティファクト
- プロバイダーラッパーまたは安全性ヘッダー（表示されませんが、それでもカウントされます）

一部のランタイム負荷の高いサーフェスには、独自の明示的な上限があります。

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

エージェントごとの上書きは`agents.list[].contextLimits`にあります。これらのノブは、上限付きランタイム抜粋と、ランタイム所有の注入ブロック向けです。これらはbootstrap上限、startup-context上限、Skillsプロンプト上限とは別です。

画像については、OpenClawはプロバイダー呼び出し前に文字起こし/ツール画像ペイロードを縮小します。これを調整するには`agents.defaults.imageMaxDimensionPx`（デフォルト: `1200`）を使います。

- 値を小さくすると、通常はvisionトークン使用量とペイロードサイズが減ります。
- 値を大きくすると、OCR/UI中心のスクリーンショットでより多くの視覚的詳細を保持できます。

実用的な内訳（注入された各ファイル、ツール、Skills、およびシステムプロンプトサイズごと）を見るには、`/context list`または`/context detail`を使ってください。[Context](/ja-JP/concepts/context)を参照してください。

## 現在のトークン使用量を確認する方法

チャット内では次を使います。

- `/status` → セッションモデル、コンテキスト使用量、最後の応答の入力/出力トークン、および**推定コスト**（APIキーのみ）を表示する**絵文字付きステータスカード**。
- `/usage off|tokens|full` → すべての返信に**応答ごとの使用量フッター**を追加します。
  - セッションごとに永続化されます（`responseUsage`として保存）。
  - OAuth認証では**コストは非表示**になります（トークンのみ）。
- `/usage cost` → OpenClawセッションログからローカルのコスト要約を表示します。

その他のサーフェス:

- **TUI/Web TUI:** `/status`と`/usage`がサポートされています。
- **CLI:** `openclaw status --usage`と`openclaw channels list`は、正規化されたプロバイダークォータウィンドウ（応答ごとのコストではなく`X% left`）を表示します。現在の使用量ウィンドウ対応プロバイダー: Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、Xiaomi、z.ai。

使用量サーフェスは、表示前に一般的なプロバイダーネイティブのフィールド別名を正規化します。OpenAIファミリーのResponsesトラフィックでは、これには`input_tokens` / `output_tokens`と`prompt_tokens` / `completion_tokens`の両方が含まれるため、転送固有のフィールド名が`/status`、`/usage`、またはセッション要約を変えることはありません。Gemini CLI JSON使用量も正規化されます。返信テキストは`response`から取得され、CLIが明示的な`stats.input`フィールドを省略した場合、`stats.cached`は`cacheRead`にマップされ、`stats.input_tokens - stats.cached`が使われます。
ネイティブOpenAIファミリーResponsesトラフィックでは、WebSocket/SSE使用量エイリアスも同様に正規化され、`total_tokens`が欠落しているか`0`の場合、合計は正規化済みの入力 + 出力にフォールバックします。
現在のセッションスナップショットが疎である場合、`/status`と`session_status`は、最新のトランスクリプト使用量ログからトークン/キャッシュカウンターとアクティブなランタイムモデルラベルを復元することもできます。既存の非ゼロのライブ値は引き続きトランスクリプトのフォールバック値より優先され、保存済み合計が欠落しているかそれより小さい場合は、より大きいプロンプト指向のトランスクリプト合計が優先されることがあります。
プロバイダークォータウィンドウの使用量認証は、利用可能であればプロバイダー固有のフックから取得されます。そうでない場合、OpenClawはauth profile、env、またはconfigから一致するOAuth/APIキー認証情報にフォールバックします。
アシスタントのトランスクリプトエントリーは、正規化された同じ使用量形状を保持します。これには、アクティブなモデルに価格設定があり、プロバイダーが使用量メタデータを返す場合の`usage.cost`も含まれます。これにより、ライブランタイム状態が消えた後でも、`/usage cost`とトランスクリプトベースのセッションステータスに安定した情報源が提供されます。

OpenClawは、プロバイダーの使用量会計を現在のコンテキストスナップショットとは分離して保持します。プロバイダーの`usage.total`には、キャッシュされた入力、出力、および複数のツールループモデル呼び出しが含まれる場合があるため、コストやtelemetryには有用ですが、ライブコンテキストウィンドウを過大評価することがあります。コンテキスト表示と診断では、`context.used`に対して最新のプロンプトスナップショット（`promptTokens`、またはプロンプトスナップショットがない場合は最後のモデル呼び出し）が使用されます。

## コスト見積もり（表示される場合）

コストはモデル価格設定configから見積もられます。

```
models.providers.<provider>.models[].cost
```

これらは`input`、`output`、`cacheRead`、`cacheWrite`に対する**100万トークンあたりのUSD**です。価格設定がない場合、OpenClawはトークンのみを表示します。OAuthトークンではドルコストは表示されません。

## キャッシュTTLと剪定の影響

プロバイダーのプロンプトキャッシュは、キャッシュTTLウィンドウ内でのみ適用されます。OpenClawは任意で**cache-ttl pruning**を実行できます。キャッシュTTLが期限切れになるとセッションを剪定し、その後キャッシュウィンドウをリセットすることで、後続のリクエストが履歴全体を再キャッシュする代わりに、新しくキャッシュされたコンテキストを再利用できるようにします。これにより、TTLを超えてセッションがアイドルになった場合のキャッシュ書き込みコストを低く抑えられます。

設定は[Gateway configuration](/ja-JP/gateway/configuration)で行い、動作の詳細は[Session pruning](/ja-JP/concepts/session-pruning)を参照してください。

Heartbeatは、アイドルギャップをまたいでキャッシュを**ウォーム**な状態に保つことができます。モデルキャッシュTTLが`1h`の場合、Heartbeat間隔をそれより少し短く（例: `55m`）設定すると、プロンプト全体の再キャッシュを避けられ、キャッシュ書き込みコストを削減できます。

マルチエージェント構成では、1つの共有モデルconfigを維持しつつ、`agents.list[].params.cacheRetention`でエージェントごとにキャッシュ動作を調整できます。

各ノブの完全なガイドは[Prompt Caching](/ja-JP/reference/prompt-caching)を参照してください。

Anthropic APIの価格設定では、キャッシュ読み取りは入力トークンより大幅に安価ですが、キャッシュ書き込みはより高い倍率で課金されます。最新の料金とTTL倍率については、Anthropicのプロンプトキャッシュ料金を参照してください:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 例: Heartbeatで1時間キャッシュをウォームに保つ

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

### 例: エージェントごとのキャッシュ戦略を使った混在トラフィック

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # 大半のエージェント向けのデフォルトベースライン
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # 深いセッションのために長いキャッシュをウォームに保つ
    - id: "alerts"
      params:
        cacheRetention: "none" # バースト的な通知ではキャッシュ書き込みを避ける
```

`agents.list[].params`は選択されたモデルの`params`の上にマージされるため、`cacheRetention`だけを上書きし、他のモデルデフォルトはそのまま継承できます。

### 例: Anthropic 1Mコンテキストベータヘッダーを有効にする

Anthropicの1Mコンテキストウィンドウは現在ベータ制限付きです。OpenClawは、サポートされているOpusまたはSonnetモデルで`context1m`を有効にすると、必要な`anthropic-beta`値を注入できます。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

これはAnthropicの`context-1m-2025-08-07`ベータヘッダーにマップされます。

これは、そのモデルエントリーで`context1m: true`が設定されている場合にのみ適用されます。

要件: 認証情報が長コンテキスト使用の対象である必要があります。そうでない場合、Anthropicはそのリクエストに対してプロバイダー側のレート制限エラーを返します。

AnthropicをOAuth/サブスクリプショントークン（`sk-ant-oat-*`）で認証している場合、OpenClawは`context-1m-*`ベータヘッダーをスキップします。これは、Anthropicが現在その組み合わせをHTTP 401で拒否するためです。

## トークン圧力を減らすヒント

- 長いセッションを要約するには`/compact`を使用する。
- ワークフロー内の大きなツール出力を切り詰める。
- スクリーンショット中心のセッションでは`agents.defaults.imageMaxDimensionPx`を下げる。
- Skills説明は短く保つ（Skills一覧はプロンプトに注入される）。
- 冗長で探索的な作業では、より小さいモデルを優先する。

正確なSkills一覧オーバーヘッドの計算式については[Skills](/ja-JP/tools/skills)を参照してください。

## 関連

- [API使用量とコスト](/ja-JP/reference/api-usage-costs)
- [Prompt caching](/ja-JP/reference/prompt-caching)
- [使用量追跡](/ja-JP/concepts/usage-tracking)
