---
read_when:
    - ソースチェックアウトを安全に更新したい
    - '`--update` の短縮動作を理解する必要がある'
summary: '`openclaw update` のCLIリファレンス（比較的安全なソース更新 + Gateway自動再起動）'
title: update
x-i18n:
    generated_at: "2026-04-05T12:40:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12c8098654b644c3666981d379f6c018e84fde56a5420f295d78052f9001bdad
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

OpenClawを安全に更新し、stable/beta/devチャンネルを切り替えます。

**npm/pnpm/bun**経由でインストールした場合（グローバルインストール、gitメタデータなし）、更新は[Updating](/install/updating)のパッケージマネージャーフローで行われます。

## 使用方法

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## オプション

- `--no-restart`: 更新成功後にGatewayサービスを再起動しません。
- `--channel <stable|beta|dev>`: 更新チャンネルを設定します（git + npm。設定に永続化されます）。
- `--tag <dist-tag|version|spec>`: 今回の更新に限ってパッケージターゲットを上書きします。パッケージインストールでは、`main` は `github:openclaw/openclaw#main` にマッピングされます。
- `--dry-run`: 設定の書き込み、インストール、プラグイン同期、再起動を行わずに、予定されている更新アクション（チャンネル/タグ/ターゲット/再起動フロー）をプレビューします。
- `--json`: 機械可読な `UpdateRunResult` JSONを出力します。
- `--timeout <seconds>`: 各ステップのタイムアウト（デフォルトは1200秒）。
- `--yes`: 確認プロンプトをスキップします（たとえばダウングレード確認）。

注: 古いバージョンでは設定が壊れる可能性があるため、ダウングレードには確認が必要です。

## `update status`

現在の更新チャンネルと git タグ/ブランチ/SHA（ソースチェックアウトの場合）、および更新の可用性を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械可読なステータスJSONを出力します。
- `--timeout <seconds>`: チェックのタイムアウト（デフォルトは3秒）。

## `update wizard`

更新チャンネルを選択し、更新後にGatewayを再起動するかどうかを確認する対話フローです
（デフォルトでは再起動します）。gitチェックアウトなしで `dev` を選択した場合は、
それを作成する提案が表示されます。

オプション:

- `--timeout <seconds>`: 各更新ステップのタイムアウト（デフォルトは `1200`）

## 実行内容

明示的にチャンネルを切り替えると（`--channel ...`）、OpenClawは
インストール方法もそれに合わせて維持します。

- `dev` → gitチェックアウトを確保し（デフォルト: `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き可能）、
  それを更新して、そのチェックアウトからグローバルCLIをインストールします。
- `stable` → `latest` を使ってnpmからインストールします。
- `beta` → npm dist-tag `beta` を優先しますが、betaが存在しないか現在のstableリリースより古い場合は
  `latest` にフォールバックします。

Gatewayコアの自動アップデーター（設定で有効な場合）は、この同じ更新パスを再利用します。

## Gitチェックアウトフロー

チャンネル:

- `stable`: 最新の非betaタグをチェックアウトしてから、build + doctorを実行します。
- `beta`: 最新の `-beta` タグを優先しますが、betaが存在しないか古い場合は最新のstableタグにフォールバックします。
- `dev`: `main` をチェックアウトしてから、fetch + rebaseを実行します。

概要:

1. クリーンなworktreeが必要です（コミットされていない変更なし）。
2. 選択したチャンネル（タグまたはブランチ）に切り替えます。
3. upstreamをfetchします（devのみ）。
4. devのみ: 一時worktreeで事前のlint + TypeScript buildを実行します。先端のコミットが失敗した場合は、最大10コミットさかのぼって、正常にbuildできる最新のコミットを探します。
5. 選択したコミットへrebaseします（devのみ）。
6. 依存関係をインストールします（`pnpm` を優先し、`npm` にフォールバック、`bun` は二次的な互換性フォールバックとして引き続き利用可能です）。
7. buildを実行し、Control UIもbuildします。
8. 最終的な「安全な更新」チェックとして `openclaw doctor` を実行します。
9. プラグインを現在のチャンネルに同期します（devはバンドルされた拡張機能を使用し、stable/betaはnpmを使用）し、npmインストール済みプラグインを更新します。

## `--update` の短縮形

`openclaw --update` は `openclaw update` に書き換えられます（シェルやランチャースクリプトで便利です）。

## 関連項目

- `openclaw doctor`（gitチェックアウトでは先にupdateを実行することを提案します）
- [Development channels](/install/development-channels)
- [Updating](/install/updating)
- [CLI reference](/cli)
