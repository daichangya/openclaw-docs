---
read_when:
    - あなたは OpenClaw の Plugin を保守しています
    - Plugin の互換性に関する警告が表示されます
    - Plugin SDK またはマニフェストの移行を計画しています
summary: Plugin 互換性契約、非推奨メタデータ、および移行要件
title: Plugin の互換性
x-i18n:
    generated_at: "2026-04-25T13:53:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02e0cdbc763eed5a38b303fc44202ddd36e58bce43dc29b6348db3f5fea66f26
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw は、古い Plugin コントラクトを削除する前に、名前付きの互換性アダプターを通して接続したままにします。これにより、SDK、マニフェスト、セットアップ、設定、エージェントランタイムのコントラクトが進化している間も、既存の同梱 Plugin と外部 Plugin が保護されます。

## 互換性レジストリ

Plugin の互換性コントラクトは、コアレジストリ `src/plugins/compat/registry.ts` で追跡されます。

各レコードには次が含まれます。

- 安定した互換性コード
- ステータス: `active`、`deprecated`、`removal-pending`、または `removed`
- オーナー: SDK、config、setup、channel、provider、plugin execution、agent runtime、または core
- 該当する場合の導入日と非推奨化日
- 置き換えに関するガイダンス
- 古い動作と新しい動作をカバーする docs、diagnostics、tests

このレジストリは、メンテナーの計画と将来の plugin inspector チェックの情報源です。Plugin 向けの動作が変わる場合は、アダプターを追加するのと同じ変更で、互換性レコードを追加または更新してください。

## Plugin inspector パッケージ

plugin inspector は、バージョン管理された互換性コントラクトとマニフェストコントラクトに基づく、別個のパッケージ/リポジトリとして OpenClaw コアリポジトリの外部に置く必要があります。

初期段階の CLI は次のようになります。

```sh
openclaw-plugin-inspector ./my-plugin
```

出力する内容は次のとおりです。

- manifest/schema の検証
- チェック対象のコントラクト互換性バージョン
- install/source メタデータのチェック
- コールドパス import のチェック
- 非推奨化と互換性に関する警告

CI annotations で安定した機械可読出力を得るには `--json` を使用します。OpenClaw コアは inspector が利用できるコントラクトとフィクスチャを公開するべきですが、inspector バイナリをメインの `openclaw` パッケージから公開するべきではありません。

## 非推奨化ポリシー

OpenClaw は、置き換えを導入したのと同じリリースで、文書化された Plugin コントラクトを削除してはいけません。

移行シーケンスは次のとおりです。

1. 新しいコントラクトを追加する。
2. 古い動作を名前付きの互換性アダプターを通して接続したままにする。
3. Plugin 作者が対応可能になった時点で diagnostics または警告を出す。
4. 置き換え先とタイムラインを文書化する。
5. 古いパスと新しいパスの両方をテストする。
6. 告知した移行期間を待つ。
7. 明示的な破壊的リリース承認がある場合にのみ削除する。

非推奨化されたレコードには、警告開始日、置き換え先、docs リンク、わかっている場合は削除予定日を含める必要があります。

## 現在の互換性領域

現在の互換性レコードには次が含まれます。

- `openclaw/plugin-sdk/compat` などの従来の広範な SDK import
- 従来の hook 専用 Plugin 形状と `before_agent_start`
- 同梱 Plugin の allowlist と有効化動作
- 従来の provider/channel env-var マニフェストメタデータ
- マニフェストの contribution ownership に置き換えられつつある activation hints
- 公開名が `agentRuntime` に移行する間の `embeddedHarness` と `agent-harness` の命名エイリアス
- レジストリ優先の `channelConfigs` メタデータが導入される間の、生成された同梱 channel config メタデータのフォールバック

新しい Plugin コードでは、レジストリおよび個別の移行ガイドに記載された置き換え先を優先する必要があります。既存の Plugin は、docs、diagnostics、release notes で削除期間が告知されるまで、互換性パスを引き続き使用できます。

## リリースノート

リリースノートには、予定されている Plugin の非推奨化について、対象日と移行 docs へのリンク付きで含める必要があります。その警告は、互換性パスが `removal-pending` または `removed` に移行する前に行う必要があります。
