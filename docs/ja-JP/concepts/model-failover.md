---
read_when:
    - auth profile のローテーション、クールダウン、またはモデルフォールバックの動作を診断する場合
    - auth profile またはモデルのフォールバックルールを更新する場合
    - セッションのモデルオーバーライドがフォールバックのリトライとどのように相互作用するかを理解する場合
summary: OpenClaw が auth profile をローテーションし、モデル間でフォールバックする方法
title: Model Failover
x-i18n:
    generated_at: "2026-04-05T12:42:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 899041aa0854e4f347343797649fd11140a01e069e88b1fbc0a76e6b375f6c96
    source_path: concepts/model-failover.md
    workflow: 15
---

# Model failover

OpenClaw は失敗を 2 段階で処理します:

1. 現在のプロバイダー内での **Auth profile のローテーション**。
2. `agents.defaults.model.fallbacks` 内の次のモデルへの **モデルフォールバック**。

このドキュメントでは、実行時ルールと、それを支えるデータについて説明します。

## 実行時フロー

通常のテキスト実行では、OpenClaw は候補を次の順序で評価します:

1. 現在選択されているセッションモデル。
2. 設定された `agents.defaults.model.fallbacks` を順番に。
3. 実行がオーバーライドから始まった場合は、最後に設定済みのプライマリモデル。

各候補の内部では、OpenClaw は次のモデル候補に進む前に
auth-profile フォールバックを試します。

大まかなシーケンス:

1. アクティブなセッションモデルと auth-profile の優先設定を解決する。
2. モデル候補チェーンを構築する。
3. auth-profile のローテーション / クールダウンルールで現在のプロバイダーを試す。
4. そのプロバイダーがフォールバックに値するエラーで使い尽くされたら、次の
   モデル候補に移動する。
5. リトライ開始前に選択されたフォールバックオーバーライドを永続化し、他の
   セッション読み取り側がランナーがこれから使用するのと同じプロバイダー / モデルを見るようにする。
6. フォールバック候補が失敗した場合、その失敗した候補とまだ一致しているときに限り、
   フォールバック所有のセッションオーバーライドフィールドだけをロールバックする。
7. すべての候補が失敗した場合、各試行の詳細と、判明している場合は最も早い
   クールダウン満了時刻を含む `FallbackSummaryError` を投げる。

これは意図的に「セッション全体を保存して復元する」より狭い範囲です。reply ランナーは
フォールバックのために自分が所有するモデル選択フィールドだけを永続化します:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

これにより、失敗したフォールバックリトライが、実行中に発生した手動の `/model` 変更や
セッションローテーション更新など、新しい無関係なセッション変更を上書きするのを防ぎます。

## Auth ストレージ（キー + OAuth）

OpenClaw は API キーと OAuth トークンの両方に **auth profile** を使用します。

- シークレットは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` に保存されます（レガシー: `~/.openclaw/agent/auth-profiles.json`）。
- config の `auth.profiles` / `auth.order` は **メタデータ + ルーティングのみ** です（シークレットは含みません）。
- レガシーのインポート専用 OAuth ファイル: `~/.openclaw/credentials/oauth.json`（初回利用時に `auth-profiles.json` にインポートされます）。

詳細: [/concepts/oauth](/concepts/oauth)

認証情報のタイプ:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（一部のプロバイダーでは `projectId` / `enterpriseUrl` を追加）

## Profile ID

OAuth ログインでは、複数アカウントが共存できるように個別の profile が作成されます。

- デフォルト: メールアドレスが利用できない場合は `provider:default`
- メールアドレス付き OAuth: `provider:<email>`（例: `google-antigravity:user@gmail.com`）

profile は `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` の `profiles` 配下に保存されます。

## ローテーション順序

あるプロバイダーに複数の profile がある場合、OpenClaw は次のように順序を決定します:

1. **明示的な config**: `auth.order[provider]`（設定されている場合）
2. **設定済み profile**: プロバイダーで絞り込んだ `auth.profiles`
3. **保存済み profile**: そのプロバイダーの `auth-profiles.json` 内のエントリー

明示的な順序が設定されていない場合、OpenClaw はラウンドロビン順序を使用します:

- **主キー:** profile のタイプ（**API キーより OAuth を優先**）
- **副キー:** `usageStats.lastUsed`（各タイプ内で最も古いものから）
- **クールダウン中 / 無効化済み profile** は末尾に移動され、最も早い満了時刻順に並べられます。

### セッション固定性（キャッシュに優しい）

OpenClaw は、プロバイダーキャッシュを温かいまま保つために、**選択した auth profile をセッションごとに固定** します。
リクエストごとにローテーションはしません。固定された profile は次の場合まで再利用されます:

- セッションがリセットされる（`/new` / `/reset`）
- compaction が完了する（compaction 回数が増える）
- profile がクールダウン中または無効化される

`/model …@<profileId>` による手動選択は、そのセッションの **ユーザーオーバーライド** を設定し、
新しいセッションが開始されるまで自動ローテーションされません。

自動的に固定された profile（セッションルーターによって選択されたもの）は **優先設定** として扱われます:
最初に試されますが、レート制限 / タイムアウト時には OpenClaw が別の profile にローテーションすることがあります。
ユーザー固定の profile はその profile に固定されたままです。これが失敗し、モデルフォールバックが
設定されている場合、OpenClaw は profile を切り替える代わりに次のモデルへ移動します。

### OAuth が「失われたように見える」理由

同じプロバイダーに対して OAuth profile と API キー profile の両方がある場合、
固定されていないとラウンドロビンによりメッセージ間でそれらが切り替わることがあります。単一の profile を強制するには:

- `auth.order[provider] = ["provider:profileId"]` で固定する、または
- `/model …` に profile オーバーライドを付けたセッションごとのオーバーライドを使用する
  （UI / チャットサーフェスが対応している場合）。

## クールダウン

auth / レート制限エラー（またはレート制限のように見えるタイムアウト）によって profile が失敗すると、
OpenClaw はそれをクールダウン状態にし、次の profile に進みます。
このレート制限バケットは単なる `429` より広く、`Too many concurrent requests`、`ThrottlingException`、
`concurrency limit reached`、`workers_ai ... quota limit exceeded`、
`throttled`、`resource exhausted`、および
`weekly/monthly limit reached` のような定期的な利用枠制限も含みます。
形式エラー / 無効リクエストエラー（たとえば Cloud Code Assist の tool call ID
検証失敗）はフォールバックに値するものとして扱われ、同じクールダウンが使われます。
`Unhandled stop reason: error`、
`stop reason: error`、`reason: error` のような OpenAI 互換の stop-reason エラーは、
タイムアウト / フォールバックシグナルとして分類されます。
プロバイダースコープの一般的なサーバーテキストも、ソースが既知の一時的パターンに一致する場合、
このタイムアウトバケットに入ることがあります。たとえば Anthropic の素の
`An unknown error occurred` や、`internal server error`、`unknown error, 520`、
`upstream error`、`backend error` のような一時的なサーバーテキストを含む JSON の `api_error` ペイロードは、
フォールバックに値するタイムアウトとして扱われます。OpenRouter 固有の
一般的な上流テキスト、たとえば素の `Provider returned error` も、
実際にプロバイダーコンテキストが OpenRouter のときに限りタイムアウトとして扱われます。
`LLM request failed with an unknown error.` のような一般的な内部フォールバックテキストは、
保守的に扱われ、それだけではフォールバックをトリガーしません。

レート制限クールダウンはモデルスコープにもできます:

- OpenClaw は、失敗したモデル ID が分かっている場合、レート制限失敗に対して `cooldownModel` を記録します。
- 同じプロバイダー上の兄弟モデルは、クールダウンが別のモデルにスコープされている場合でも試行できます。
- 課金 / 無効化ウィンドウは、引き続きその profile を全モデルでブロックします。

クールダウンは指数バックオフを使用します:

- 1 分
- 5 分
- 25 分
- 1 時間（上限）

状態は `auth-profiles.json` の `usageStats` 配下に保存されます:

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

## 課金による無効化

課金 / クレジット失敗（たとえば「insufficient credits」や「credit balance too low」）は
フォールバックに値するものとして扱われますが、通常は一時的ではありません。短いクールダウンの代わりに、
OpenClaw はその profile を **disabled** としてマークし（より長いバックオフ付きで）、
次の profile / プロバイダーにローテーションします。

すべての課金っぽいレスポンスが `402` というわけではなく、すべての HTTP `402` が
ここに入るわけでもありません。OpenClaw は、プロバイダーが代わりに `401` や `403` を返した場合でも、
明示的な課金テキストは課金レーンに残しますが、プロバイダー固有のマッチャーは
それを所有するプロバイダーにスコープされたままです（たとえば OpenRouter の `403 Key limit
exceeded`）。一方で、一時的な `402` の利用枠ウィンドウや
organization / workspace の支出制限エラーは、メッセージが再試行可能に見える場合、
`rate_limit` として分類されます（たとえば `weekly usage limit exhausted`、`daily
limit reached, resets tomorrow`、`organization spending limit exceeded`）。
これらは、長い課金無効化パスではなく、短いクールダウン / フォールバック経路に残ります。

状態は `auth-profiles.json` に保存されます:

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

- 課金バックオフは **5 時間** から始まり、課金失敗ごとに倍増し、**24 時間** で上限になります。
- profile が **24 時間** 失敗していなければ、バックオフカウンターはリセットされます（設定可能）。
- 過負荷リトライでは、モデルフォールバックの前に **同一プロバイダーの profile ローテーションを 1 回** 許可します。
- 過負荷リトライはデフォルトで **0 ms バックオフ** を使用します。

## モデルフォールバック

あるプロバイダーのすべての profile が失敗した場合、OpenClaw は
`agents.defaults.model.fallbacks` 内の次のモデルに移動します。これは auth 失敗、レート制限、
および profile ローテーションを使い切ったタイムアウトに適用されます
（他のエラーではフォールバックは進みません）。

過負荷エラーとレート制限エラーは、課金クールダウンよりも積極的に処理されます。
デフォルトでは、OpenClaw は同一プロバイダーの auth-profile リトライを 1 回許可し、
その後は待たずに次の設定済みモデルフォールバックに切り替えます。
`ModelNotReadyException` のようなプロバイダー多忙シグナルは、その過負荷バケットに入ります。
これは `auth.cooldowns.overloadedProfileRotations`、
`auth.cooldowns.overloadedBackoffMs`、および
`auth.cooldowns.rateLimitedProfileRotations` で調整できます。

モデルオーバーライド（hooks または CLI）で実行が始まった場合でも、
設定済みフォールバックを試した後は、最終的に `agents.defaults.model.primary` で終了します。

### 候補チェーンのルール

OpenClaw は、現在要求されている `provider/model` と設定済みのフォールバックから候補リストを構築します。

ルール:

- 要求されたモデルは常に先頭です。
- 明示的に設定されたフォールバックは重複排除されますが、モデルの
  allowlist ではフィルタリングされません。これらは明示的な運用者の意図として扱われます。
- 現在の実行がすでに同じプロバイダーファミリー内の設定済みフォールバック上にある場合、
  OpenClaw は設定済みチェーン全体を使い続けます。
- 現在の実行が config と異なるプロバイダー上にあり、その現在の
  モデルが設定済みフォールバックチェーンの一部でない場合、OpenClaw は
  別プロバイダーの無関係な設定済みフォールバックを追加しません。
- 実行がオーバーライドから始まった場合、設定済みのプライマリが末尾に追加されるため、
  先行候補を使い切った後にチェーンは通常のデフォルトへ戻ることができます。

### どのエラーでフォールバックが進むか

モデルフォールバックは次の場合に継続します:

- auth 失敗
- レート制限とクールダウン枯渇
- 過負荷 / プロバイダー多忙エラー
- タイムアウト型のフォールバックエラー
- 課金による無効化
- `LiveSessionModelSwitchError`。これは古い永続化モデルが外側のリトライループを作らないよう、
  フォールバックパスに正規化されます
- 他に候補が残っている場合の、その他の未認識エラー

モデルフォールバックは次の場合には継続しません:

- タイムアウト / フォールバック型でない明示的な中断
- compaction / リトライロジック内にとどまるべきコンテキストオーバーフローエラー
  （たとえば `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`The input is too long for the model`、または `ollama error: context
length exceeded`）
- 候補が残っていない最終的な未知のエラー

### クールダウン時のスキップとプローブの動作

あるプロバイダーのすべての auth profile がすでにクールダウン中であっても、
OpenClaw はそのプロバイダーを永続的に自動スキップするわけではありません。候補ごとに次の判断を行います:

- 永続的な auth 失敗では、そのプロバイダー全体を即座にスキップします。
- 課金による無効化では通常スキップしますが、再起動なしで回復可能にするため、
  プライマリ候補はスロットル付きでなおプローブされることがあります。
- プライマリ候補は、プロバイダーごとのスロットル付きで、クールダウン満了近くにプローブされる場合があります。
- 同一プロバイダーの兄弟フォールバックは、失敗が一時的に見える場合
  （`rate_limit`、`overloaded`、または unknown）には、クールダウン中でも試行されることがあります。
  これは、レート制限がモデルスコープで、兄弟モデルがすぐに回復する可能性がある場合に特に重要です。
- 一時的なクールダウンプローブは、単一のプロバイダーがクロスプロバイダーのフォールバックを停滞させないよう、
  フォールバック実行ごとにプロバイダーあたり 1 回に制限されます。

## セッションオーバーライドとライブモデル切り替え

セッションモデルの変更は共有状態です。アクティブなランナー、`/model` コマンド、
compaction / セッション更新、ライブセッション再調整はすべて、
同じセッションエントリーの一部を読み書きします。

つまり、フォールバックリトライはライブモデル切り替えと協調する必要があります:

- 保留中のライブ切り替えをマークするのは、明示的なユーザー主導のモデル変更だけです。
  これには `/model`、`session_status(model=...)`、`sessions.patch` が含まれます。
- フォールバックローテーション、heartbeat オーバーライド、
  compaction のようなシステム主導のモデル変更は、それ自体では保留中のライブ切り替えをマークしません。
- フォールバックリトライが始まる前に、reply ランナーは選択された
  フォールバックオーバーライドフィールドをセッションエントリーに永続化します。
- ライブセッション再調整は、古い実行時モデルフィールドよりも
  永続化されたセッションオーバーライドを優先します。
- フォールバック試行が失敗した場合、ランナーは自分が書いたオーバーライドフィールドのみを、
  しかもそれがその失敗した候補とまだ一致している場合にのみロールバックします。

これにより、典型的な競合を防ぎます:

1. プライマリが失敗する。
2. フォールバック候補がメモリ内で選択される。
3. セッションストアにはまだ古いプライマリが記録されている。
4. ライブセッション再調整がその古いセッション状態を読み取る。
5. フォールバック試行が始まる前に、リトライが古いモデルに戻される。

永続化されたフォールバックオーバーライドがこの隙間を塞ぎ、狭いロールバックによって
新しい手動または実行時のセッション変更は保たれます。

## 可観測性と失敗サマリー

`runWithModelFallback(...)` は、ログとユーザー向けのクールダウンメッセージに使われる
試行ごとの詳細を記録します:

- 試行した provider/model
- reason（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found`、
  および類似のフォールバック理由）
- 任意の status/code
- 人間が読めるエラーサマリー

すべての候補が失敗すると、OpenClaw は `FallbackSummaryError` を投げます。外側の
reply ランナーはこれを使って、「all models
are temporarily rate-limited」のようなより具体的なメッセージを構築し、
判明している場合は最も早いクールダウン満了時刻を含めることができます。

そのクールダウンサマリーはモデル認識型です:

- 試行された provider/model チェーンに無関係なモデルスコープのレート制限は無視されます
- 残っているブロックがそのモデルに一致するモデルスコープのレート制限である場合、
  OpenClaw はそのモデルをまだブロックしている最後の一致する満了時刻を報告します

## 関連する config

以下については [Gateway configuration](/gateway/configuration) を参照してください:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` ルーティング

モデル選択とフォールバックのより広い概要については [Models](/concepts/models) を参照してください。
