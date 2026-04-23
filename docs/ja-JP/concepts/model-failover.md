---
read_when:
    - 認証プロファイルのローテーション、クールダウン、またはモデルのフォールバック動作の診断
    - 認証プロファイルまたはモデルのフォールオーバールールの更新
    - セッションのモデル上書きがフォールバック再試行とどのように相互作用するかを理解する
summary: OpenClawが認証プロファイルをローテーションし、モデル間でフォールバックする方法
title: モデルのフォールオーバー
x-i18n:
    generated_at: "2026-04-23T04:44:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1f06d5371379cc59998e1cd6f52d250e8c4eba4e7dbfef776a090899b8d3c4
    source_path: concepts/model-failover.md
    workflow: 15
---

# モデルのフォールオーバー

OpenClawは、障害を2段階で処理します。

1. 現在のプロバイダー内での**認証プロファイルのローテーション**。
2. `agents.defaults.model.fallbacks`内の次のモデルへの**モデルのフォールバック**。

このドキュメントでは、ランタイムルールと、それを支えるデータについて説明します。

## ランタイムフロー

通常のテキスト実行では、OpenClawは候補を次の順序で評価します。

1. 現在選択されているセッションモデル。
2. 設定された`agents.defaults.model.fallbacks`を順番に評価。
3. 実行がオーバーライドから開始された場合は、最後に設定済みのプライマリモデル。

各候補の内部では、OpenClawは次のモデル候補へ進む前に、認証プロファイルのフォールオーバーを試行します。

高レベルのシーケンス:

1. アクティブなセッションモデルと認証プロファイル設定を解決する。
2. モデル候補チェーンを構築する。
3. 認証プロファイルのローテーション/クールダウンルールに従って現在のプロバイダーを試す。
4. そのプロバイダーがフォールオーバーに値するエラーで使い尽くされた場合、次のモデル候補に移る。
5. 再試行の開始前に、選択されたフォールバックオーバーライドを永続化し、他のセッションリーダーがランナーがこれから使用しようとしているのと同じプロバイダー/モデルを参照できるようにする。
6. フォールバック候補が失敗した場合、その失敗した候補とまだ一致しているときに限り、フォールバックが所有するセッションオーバーライドフィールドだけをロールバックする。
7. すべての候補が失敗した場合は、試行ごとの詳細と、判明している場合は最も早いクールダウン期限を含む`FallbackSummaryError`を送出する。

これは意図的に「セッション全体を保存して復元する」より狭い動作です。返信ランナーは、フォールバック用に自分が所有するモデル選択フィールドだけを永続化します。

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

これにより、失敗したフォールバック再試行が、試行の実行中に発生した手動の`/model`変更やセッションローテーション更新など、新しい無関係なセッション変更を上書きすることを防ぎます。

## 認証ストレージ（キー + OAuth）

OpenClawは、APIキーとOAuthトークンの両方に**認証プロファイル**を使用します。

- シークレットは`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`に保存されます（旧形式: `~/.openclaw/agent/auth-profiles.json`）。
- ランタイムの認証ルーティング状態は`~/.openclaw/agents/<agentId>/agent/auth-state.json`に保存されます。
- 設定の`auth.profiles` / `auth.order`は**メタデータ + ルーティング専用**です（シークレットは含みません）。
- 旧式のインポート専用OAuthファイル: `~/.openclaw/credentials/oauth.json`（初回使用時に`auth-profiles.json`へインポートされます）。

詳細: [/concepts/oauth](/ja-JP/concepts/oauth)

認証情報の型:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（一部のプロバイダーでは`projectId`/`enterpriseUrl`も含む）

## プロファイルID

OAuthログインは、複数のアカウントが共存できるように、個別のプロファイルを作成します。

- デフォルト: メールアドレスがない場合は`provider:default`。
- メールアドレス付きOAuth: `provider:<email>`（例: `google-antigravity:user@gmail.com`）。

プロファイルは`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`の`profiles`以下に保存されます。

## ローテーション順序

プロバイダーに複数のプロファイルがある場合、OpenClawは次のように順序を選びます。

1. **明示的な設定**: `auth.order[provider]`（設定されている場合）。
2. **設定済みプロファイル**: プロバイダーで絞り込んだ`auth.profiles`。
3. **保存済みプロファイル**: そのプロバイダーに対する`auth-profiles.json`内のエントリ。

明示的な順序が設定されていない場合、OpenClawはラウンドロビン順序を使います。

- **主キー:** プロファイル型（**APIキーよりOAuthを優先**）。
- **副キー:** `usageStats.lastUsed`（各型の中で最も古いものから）。
- **クールダウン中/無効化されたプロファイル**は末尾に移され、期限が最も早い順に並びます。

### セッションのスティッキネス（キャッシュにやさしい）

OpenClawは、プロバイダーキャッシュを温かい状態に保つために、**セッションごとに選択した認証プロファイルを固定**します。
**毎回のリクエストごとにローテーションはしません**。固定されたプロファイルは、次の場合まで再利用されます。

- セッションがリセットされる（`/new` / `/reset`）
- Compactionが完了する（compaction countが増加する）
- そのプロファイルがクールダウン中または無効化されている

`/model …@<profileId>`による手動選択は、そのセッションに対する**ユーザーオーバーライド**を設定し、新しいセッションが開始されるまで自動ローテーションされません。

自動固定されたプロファイル（セッションルーターが選択したもの）は**優先設定**として扱われます:
最初に試行されますが、レート制限やタイムアウト時にはOpenClawが別のプロファイルへローテーションする場合があります。
ユーザー固定プロファイルはそのプロファイルにロックされたままです。失敗し、モデルフォールバックが設定されている場合、OpenClawはプロファイルを切り替える代わりに次のモデルへ移ります。

### OAuthが「失われたように見える」理由

同じプロバイダーに対してOAuthプロファイルとAPIキープロファイルの両方がある場合、固定されていないと、ラウンドロビンによってメッセージ間でそれらが切り替わることがあります。単一のプロファイルを強制するには:

- `auth.order[provider] = ["provider:profileId"]`で固定する、または
- UI/チャット画面が対応している場合、プロファイルオーバーライド付きの`/model …`を使ってセッションごとのオーバーライドを使用する。

## クールダウン

プロファイルが認証エラー/レート制限エラー（またはレート制限のように見えるタイムアウト）で失敗すると、OpenClawはそれをクールダウン状態にし、次のプロファイルへ移ります。
このレート制限バケットは単純な`429`より広く、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`、`weekly/monthly limit reached`のような定期的な使用量ウィンドウ制限などのプロバイダーメッセージも含みます。
フォーマット/無効リクエストエラー（たとえばCloud Code Assistのtool call ID検証失敗）はフォールオーバーに値すると見なされ、同じクールダウンを使用します。
`Unhandled stop reason: error`、`stop reason: error`、`reason: error`のようなOpenAI互換のstop-reasonエラーは、タイムアウト/フォールオーバーシグナルとして分類されます。
プロバイダースコープの一般的なサーバーテキストも、ソースが既知の一時的パターンと一致する場合はそのタイムアウトバケットに入ることがあります。たとえば、Anthropicの素の`An unknown error occurred`や、`internal server error`、`unknown error, 520`、`upstream error`、`backend error`のような一時的なサーバーテキストを含むJSON `api_error`ペイロードは、フォールオーバーに値するタイムアウトとして扱われます。OpenRouter固有の一般的な上流テキストである素の`Provider returned error`も、プロバイダーコンテキストが実際にOpenRouterである場合にのみタイムアウトとして扱われます。`LLM request failed with an unknown error.`のような一般的な内部フォールバックテキストは保守的に扱われ、それ自体ではフォールオーバーを引き起こしません。

一部のプロバイダーSDKは、OpenClawに制御を戻す前に長い`Retry-After`期間スリープしてしまう場合があります。AnthropicやOpenAIのようなStainlessベースのSDKでは、OpenClawはデフォルトでSDK内部の`retry-after-ms` / `retry-after`待機を60秒に制限し、それより長い再試行可能レスポンスを直ちに表面化して、このフォールオーバーパスを実行できるようにします。この上限は`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`で調整または無効化できます。[/concepts/retry](/ja-JP/concepts/retry)を参照してください。

レート制限クールダウンは、モデルスコープにすることもできます。

- OpenClawは、失敗したモデルIDがわかっている場合、レート制限失敗に対して`cooldownModel`を記録します。
- 同じプロバイダー上の兄弟モデルは、クールダウンが別のモデルにスコープされている場合でも試行できます。
- 請求/無効化ウィンドウは、モデルをまたいでプロファイル全体を引き続きブロックします。

クールダウンには指数バックオフを使用します。

- 1分
- 5分
- 25分
- 1時間（上限）

状態は`auth-state.json`の`usageStats`以下に保存されます。

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## 請求による無効化

請求/クレジット失敗（たとえば「insufficient credits」や「credit balance too low」）はフォールオーバーに値すると見なされますが、通常は一時的ではありません。OpenClawは短いクールダウンの代わりに、そのプロファイルを**無効化**としてマークし（より長いバックオフ付きで）、次のプロファイル/プロバイダーへローテーションします。

請求っぽいレスポンスが必ずしも`402`とは限らず、HTTP `402`のすべてがここに入るわけでもありません。OpenClawは、プロバイダーが代わりに`401`や`403`を返した場合でも、明示的な請求テキストは請求レーンに維持しますが、プロバイダー固有のマッチャーはそれを所有するプロバイダーにスコープされたままです（たとえばOpenRouterの`403 Key limit exceeded`）。一方で、一時的な`402`の使用量ウィンドウやorganization/workspaceの支出制限エラーは、メッセージが再試行可能に見える場合、`rate_limit`として分類されます（たとえば`weekly usage limit exhausted`、`daily limit reached, resets tomorrow`、`organization spending limit exceeded`）。これらは長い請求無効化パスではなく、短いクールダウン/フォールオーバーパスに残ります。

状態は`auth-state.json`に保存されます。

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

デフォルト:

- 請求バックオフは**5時間**から始まり、請求失敗ごとに倍増し、**24時間**で上限になります。
- プロファイルが**24時間**失敗していなければ、バックオフカウンターはリセットされます（設定可能）。
- 過負荷時の再試行では、モデルフォールバック前に**同一プロバイダー内で1回の認証プロファイルローテーション**を許可します。
- 過負荷時の再試行では、デフォルトで**0 msのバックオフ**を使用します。

## モデルのフォールバック

プロバイダーのすべてのプロファイルが失敗すると、OpenClawは`agents.defaults.model.fallbacks`内の次のモデルへ移ります。これは、認証失敗、レート制限、タイムアウトによりプロファイルローテーションが尽きた場合に適用されます（その他のエラーではフォールバックは進みません）。

過負荷エラーとレート制限エラーは、請求クールダウンよりも積極的に処理されます。デフォルトでは、OpenClawは同一プロバイダー内で1回の認証プロファイル再試行を許可し、その後は待機せずに次に設定されたモデルフォールバックへ切り替えます。`ModelNotReadyException`のようなプロバイダー多忙シグナルは、その過負荷バケットに入ります。これは`auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs`、`auth.cooldowns.rateLimitedProfileRotations`で調整できます。

実行がモデルオーバーライド（hooksまたはCLI）で開始された場合でも、設定済みフォールバックを試した後の最後は`agents.defaults.model.primary`になります。

### 候補チェーンルール

OpenClawは、現在要求されている`provider/model`と設定済みフォールバックから候補リストを構築します。

ルール:

- 要求されたモデルは常に先頭です。
- 明示的に設定されたフォールバックは重複排除されますが、モデルallowlistではフィルタリングされません。これらは明示的な運用者の意図として扱われます。
- 現在の実行が同じプロバイダーファミリー内の設定済みフォールバック上ですでに動いている場合、OpenClawは設定済みチェーン全体を使い続けます。
- 現在の実行が設定とは異なるプロバイダー上にあり、その現在のモデルが設定済みフォールバックチェーンにまだ含まれていない場合、OpenClawは別プロバイダーの無関係な設定済みフォールバックを追加しません。
- 実行がオーバーライドから開始された場合、設定済みプライマリが末尾に追加されるため、先行候補が尽きたあとでチェーンが通常のデフォルトへ戻ることができます。

### どのエラーでフォールバックが進むか

モデルフォールバックは次の場合に継続します。

- 認証失敗
- レート制限とクールダウン枯渇
- 過負荷/プロバイダー多忙エラー
- タイムアウト型のフォールオーバーエラー
- 請求による無効化
- `LiveSessionModelSwitchError`。これはフォールオーバーパスに正規化されるため、古い永続化モデルが外側の再試行ループを作りません
- まだ候補が残っている場合の、その他の未認識エラー

モデルフォールバックは次の場合には継続しません。

- タイムアウト/フォールオーバー型ではない明示的な中断
- Compaction/再試行ロジック内に留めるべきコンテキストオーバーフローエラー
  （たとえば`request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`The input is too long for the model`、`ollama error: context
length exceeded`）
- 候補がもう残っていない場合の最後の未知のエラー

### クールダウン時のスキップとプローブの動作

プロバイダーのすべての認証プロファイルがすでにクールダウン中であっても、OpenClawはそのプロバイダーを永久に自動スキップするわけではありません。候補ごとに次の判断を行います。

- 永続的な認証失敗では、プロバイダー全体を即座にスキップします。
- 請求による無効化は通常スキップされますが、再起動なしで回復できるように、プライマリ候補はスロットル付きで引き続きプローブされる場合があります。
- プライマリ候補は、プロバイダーごとのスロットル付きで、クールダウン期限の近くでプローブされる場合があります。
- 同一プロバイダー内のフォールバック候補は、失敗が一時的に見える場合（`rate_limit`、`overloaded`、または未知）には、クールダウン中でも試行されることがあります。これは特に、レート制限がモデルスコープで、兄弟モデルがすぐに回復する可能性がある場合に重要です。
- 一時的なクールダウンプローブは、1回のフォールバック実行につきプロバイダーごとに1回に制限されるため、単一のプロバイダーがクロスプロバイダーのフォールバックを停滞させることはありません。

## セッションオーバーライドとライブモデル切り替え

セッションモデルの変更は共有状態です。アクティブなランナー、`/model`コマンド、Compaction/セッション更新、ライブセッションの再調整は、いずれも同じセッションエントリの一部を読み書きします。

つまり、フォールバック再試行はライブモデル切り替えと協調する必要があります。

- 保留中のライブ切り替えとしてマークされるのは、明示的なユーザー駆動のモデル変更だけです。これには`/model`、`session_status(model=...)`、`sessions.patch`が含まれます。
- フォールバックローテーション、Heartbeatオーバーライド、Compactionのようなシステム駆動のモデル変更は、それ自体では保留中のライブ切り替えとしてマークされません。
- フォールバック再試行が始まる前に、返信ランナーは選択したフォールバックオーバーライドフィールドをセッションエントリに永続化します。
- ライブセッション再調整では、古いランタイムモデルフィールドよりも永続化されたセッションオーバーライドが優先されます。
- フォールバック試行が失敗した場合、ランナーは自分が書き込んだオーバーライドフィールドだけを、しかもそれらがまだその失敗した候補と一致している場合に限ってロールバックします。

これにより、典型的な競合を防ぎます。

1. プライマリが失敗する。
2. フォールバック候補がメモリ上で選択される。
3. セッションストアにはまだ古いプライマリが残っている。
4. ライブセッション再調整が古いセッション状態を読み取る。
5. フォールバック試行が始まる前に、再試行が古いモデルへ戻されてしまう。

永続化されたフォールバックオーバーライドはこの隙間を塞ぎ、限定的なロールバックは新しい手動変更またはランタイムのセッション変更をそのまま保ちます。

## 可観測性と障害サマリー

`runWithModelFallback(...)`は、ログとユーザー向けクールダウンメッセージに使われる試行ごとの詳細を記録します。

- 試行されたprovider/model
- reason（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found`、および同様のフォールオーバー理由）
- 任意のstatus/code
- 人が読めるエラーサマリー

すべての候補が失敗した場合、OpenClawは`FallbackSummaryError`を送出します。外側の返信ランナーはこれを使って、「すべてのモデルが一時的にレート制限されています」のような、より具体的なメッセージを構築し、判明している場合は最も早いクールダウン期限を含めることができます。

このクールダウンサマリーはモデルを認識します。

- 試行されたprovider/modelチェーンに無関係なモデルスコープのレート制限は無視されます
- 残っているブロックが一致するモデルスコープのレート制限である場合、OpenClawはそのモデルを引き続きブロックしている最後の一致期限を報告します

## 関連する設定

以下については[Gateway configuration](/ja-JP/gateway/configuration)を参照してください。

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel`ルーティング

より広いモデル選択とフォールバックの概要については、[Models](/ja-JP/concepts/models)を参照してください。
