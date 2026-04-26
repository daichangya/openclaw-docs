---
read_when:
    - あなたは OpenClaw Plugin を保守しています
    - Plugin の互換性に関する警告が表示されます
    - あなたは Plugin SDK またはマニフェストの移行を計画しています
summary: Plugin の互換性コントラクト、非推奨メタデータ、および移行に関する想定事項
title: Plugin の互換性
x-i18n:
    generated_at: "2026-04-26T11:36:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4e11dc57c29eac72844b91bec75a9d48005bbd3c89a2a9d7a5634ab782e5fc
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw は、Plugin SDK、マニフェスト、セットアップ、設定、エージェントランタイムのコントラクトが進化する間も、既存のバンドル済みおよび外部 Plugin を保護するために、古い Plugin コントラクトを削除する前に、名前付きの互換性アダプターを通じて接続したままにします。

## 互換性レジストリ

Plugin の互換性コントラクトは、コアレジストリ `src/plugins/compat/registry.ts` で追跡されます。

各レコードには次の情報があります。

- 安定した互換性コード
- ステータス: `active`、`deprecated`、`removal-pending`、または `removed`
- オーナー: SDK、config、setup、channel、provider、plugin execution、agent runtime、または core
- 該当する場合の導入日と非推奨化日
- 置き換えに関するガイダンス
- 古い動作と新しい動作をカバーする docs、diagnostics、tests

このレジストリは、メンテナーによる計画立案と、将来の Plugin inspector チェックの情報源です。Plugin 向けの動作が変更される場合は、アダプターを追加するのと同じ変更内で互換性レコードを追加または更新してください。

Doctor の修復および移行の互換性は、`src/commands/doctor/shared/deprecation-compat.ts` で別途追跡されます。これらのレコードは、古い config 形状、install-ledger レイアウト、およびランタイム互換性パスが削除された後も利用可能なままである必要がある修復 shim を対象とします。

リリース時の確認では、両方のレジストリをチェックする必要があります。対応するランタイムまたは config の互換性レコードが期限切れになったからといって、Doctor の移行を削除しないでください。まず、その修復をまだ必要とするサポート対象のアップグレードパスが存在しないことを確認してください。また、provider や channel が core の外に移動するにつれて Plugin の所有権や config の範囲が変わる可能性があるため、リリース計画時には各置き換え注記を再検証してください。

## Plugin inspector パッケージ

Plugin inspector は、バージョン管理された互換性コントラクトおよびマニフェストコントラクトに基づく、core OpenClaw リポジトリ外の別パッケージ / 別リポジトリとして存在するべきです。

初期段階の CLI は次のようになります。

```sh
openclaw-plugin-inspector ./my-plugin
```

これは次を出力するべきです。

- manifest/schema の検証
- チェック対象のコントラクト互換性バージョン
- install/source メタデータのチェック
- コールドパスの import チェック
- 非推奨および互換性の警告

CI アノテーションで安定した機械可読出力を得るには `--json` を使用します。OpenClaw core は inspector が利用できるコントラクトとフィクスチャを公開するべきですが、メインの `openclaw` パッケージから inspector バイナリを公開するべきではありません。

## 非推奨化ポリシー

OpenClaw は、文書化された Plugin コントラクトを、その置き換えを導入した同じリリースで削除するべきではありません。

移行の順序は次のとおりです。

1. 新しいコントラクトを追加する。
2. 古い動作を、名前付き互換性アダプターを通じて接続したままにする。
3. Plugin 作成者が対応可能な時点で diagnostics または warnings を出す。
4. 置き換え先とタイムラインを文書化する。
5. 古いパスと新しいパスの両方をテストする。
6. 告知済みの移行期間が経過するまで待つ。
7. 明示的な破壊的変更リリースの承認がある場合にのみ削除する。

非推奨レコードには、警告開始日、置き換え先、docs リンク、および警告開始から 3 か月以内の最終削除日を必ず含める必要があります。メンテナーがそれを恒久的な互換性であると明示的に判断して `active` とマークしない限り、削除期限が未定のままの非推奨互換性パスを追加しないでください。

## 現在の互換性領域

現在の互換性レコードには次が含まれます。

- `openclaw/plugin-sdk/compat` などのレガシーな広範囲 SDK import
- レガシーな hook 専用 Plugin 形状と `before_agent_start`
- Plugin が `register(api)` に移行するまでの間の、レガシーな `activate(api)` Plugin エントリーポイント
- `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth` の status builder、`openclaw/plugin-sdk/test-utils`、および `ClawdbotConfig` / `OpenClawSchemaType` 型エイリアスなどのレガシー SDK エイリアス
- バンドル済み Plugin の allowlist と有効化動作
- レガシーな provider/channel の env-var manifest メタデータ
- provider が明示的な catalog、auth、thinking、replay、transport hook に移行する間の、レガシーな provider Plugin hook と型エイリアス
- `api.runtime.taskFlow`、`api.runtime.subagent.getSession`、`api.runtime.stt` などのレガシーなランタイムエイリアス
- memory Plugin が `registerMemoryCapability` に移行する間の、レガシーな memory-Plugin 分割登録
- ネイティブメッセージスキーマ、mention ゲーティング、受信 envelope 形式化、approval capability のネストに関するレガシー channel SDK ヘルパー
- manifest contribution ownership に置き換えられつつある activation hints
- setup descriptor がコールドな `setup.requiresRuntime: false` メタデータに移行する間の `setup-api` ランタイムフォールバック
- provider catalog hook が `catalog.run(...)` に移行する間の provider `discovery` hook
- channel パッケージが `openclaw.channel.exposure` に移行する間の channel `showConfigured` / `showInSetup` メタデータ
- Doctor がオペレーターを `agentRuntime` に移行する間のレガシー runtime-policy config キー
- レジストリ優先の `channelConfigs` メタデータが導入されるまでの、生成済みバンドル channel config メタデータフォールバック
- 修復フローがオペレーターを `openclaw plugins registry --refresh` と `openclaw doctor --fix` に移行する間の、永続化された plugin registry disable および install-migration env フラグ
- Doctor がそれらを `plugins.entries.<plugin>.config` に移行する間の、レガシーな Plugin 所有の web search、web fetch、および x_search config パス
- install メタデータが状態管理される Plugin ledger に移行する間の、レガシーな `plugins.installs` 作成 config とバンドル済み Plugin の load-path エイリアス

新しい Plugin コードでは、レジストリおよび個別の移行ガイドに記載された置き換え先を優先して使用するべきです。既存の Plugin は、docs、diagnostics、release notes で削除期間が告知されるまでは、互換性パスを引き続き使用できます。

## リリースノート

リリースノートには、予定されている Plugin の非推奨化について、目標日と移行 docs へのリンクを含める必要があります。その警告は、互換性パスが `removal-pending` または `removed` に移る前に行う必要があります。
