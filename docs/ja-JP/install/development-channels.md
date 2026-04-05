---
read_when:
    - stable/beta/dev を切り替えたい場合
    - 特定のバージョン、タグ、または SHA を固定したい場合
    - プレリリースをタグ付けまたは公開する場合
sidebarTitle: Release Channels
summary: 'stable、beta、dev チャネル: セマンティクス、切り替え、固定、タグ付け'
title: Release Channels
x-i18n:
    generated_at: "2026-04-05T12:47:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f33a77bf356f989cd4de5f8bb57f330c276e7571b955bea6994a4527e40258d
    source_path: install/development-channels.md
    workflow: 15
---

# Development channels

OpenClaw には 3 つのアップデートチャネルがあります:

- **stable**: npm dist-tag `latest`。ほとんどのユーザーに推奨されます。
- **beta**: 現在の npm dist-tag `beta`。beta が存在しない、または
  最新の stable リリースより古い場合、アップデートフローは `latest` にフォールバックします。
- **dev**: `main`（git）の最新先頭。npm dist-tag: `dev`（公開されている場合）。
  `main` ブランチは実験と活発な開発のためのものです。不完全な機能や
  破壊的変更を含むことがあります。本番 Gateway には使用しないでください。

通常、stable ビルドはまず **beta** に出荷し、そこでテストしてから、
検証済みビルドをバージョン番号を変更せずに `latest` へ移す
明示的な昇格ステップを実行します。必要に応じて、メンテナーは stable リリースを
直接 `latest` に公開することもできます。npm インストールでは dist-tag が信頼できる情報源です。

## チャネルの切り替え

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` は選択を設定（`update.channel`）に永続化し、
インストール方法を合わせます:

- **`stable`**（package installs）: npm dist-tag `latest` 経由で更新します。
- **`beta`**（package installs）: npm dist-tag `beta` を優先しますが、
  `beta` が存在しない、または現在の stable タグより古い場合は `latest` にフォールバックします。
- **`stable`**（git installs）: 最新の stable git タグをチェックアウトします。
- **`beta`**（git installs）: 最新の beta git タグを優先しますが、
  beta が存在しない、または古い場合は最新の stable git タグにフォールバックします。
- **`dev`**: git checkout を確保し（デフォルトは `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き可能）、
  `main` に切り替え、upstream に対して rebase し、ビルドして、その checkout から
  グローバル CLI をインストールします。

ヒント: stable と dev を並行して使いたい場合は、clone を 2 つ保持し、
Gateway を stable 側に向けてください。

## 1 回限りのバージョンまたはタグの指定

永続化されたチャネルを変更せずに、1 回の
アップデートだけ特定の dist-tag、バージョン、または package spec を対象にするには `--tag` を使います:

```bash
# 特定のバージョンをインストール
openclaw update --tag 2026.4.1-beta.1

# beta dist-tag からインストール（1 回限り、永続化しない）
openclaw update --tag beta

# GitHub main ブランチからインストール（npm tarball）
openclaw update --tag main

# 特定の npm package spec をインストール
openclaw update --tag openclaw@2026.4.1-beta.1
```

注意:

- `--tag` は **package（npm）install のみ** に適用されます。git install では無視されます。
- このタグは永続化されません。次回の `openclaw update` では、通常どおり設定済み
  チャネルが使われます。
- ダウングレード保護: 対象バージョンが現在のバージョンより古い場合、
  OpenClaw は確認を求めます（`--yes` でスキップ）。
- `--channel beta` は `--tag beta` とは異なります。チャネルフローは
  beta が存在しない、または古い場合に stable/latest へフォールバックできますが、`--tag beta` は
  その 1 回の実行で生の `beta` dist-tag を対象にします。

## ドライラン

変更を加えずに `openclaw update` が何をするかをプレビューします:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

ドライランでは、実効チャネル、対象バージョン、予定されたアクション、
およびダウングレード確認が必要かどうかが表示されます。

## Plugins とチャネル

`openclaw update` でチャネルを切り替えると、OpenClaw は plugin
ソースも同期します:

- `dev` は git checkout からのバンドルされた plugins を優先します。
- `stable` と `beta` は npm インストールされた plugin パッケージを復元します。
- npm インストールされた plugins は、コアアップデート完了後に更新されます。

## 現在の状態を確認する

```bash
openclaw update status
```

アクティブなチャネル、インストール種別（git または package）、現在のバージョン、
およびソース（config、git tag、git branch、または default）を表示します。

## タグ付けのベストプラクティス

- git checkout の着地点にしたいリリースにはタグを付けてください（stable には `vYYYY.M.D`、
  beta には `vYYYY.M.D-beta.N`）。
- 互換性のために `vYYYY.M.D.beta.N` も認識されますが、`-beta.N` を推奨します。
- レガシーの `vYYYY.M.D-<patch>` タグも、stable（non-beta）として引き続き認識されます。
- タグは不変に保ってください。タグを移動したり再利用したりしないでください。
- npm インストールでは、引き続き npm dist-tag が信頼できる情報源です:
  - `latest` -> stable
  - `beta` -> 候補ビルドまたは beta 先行の stable ビルド
  - `dev` -> main スナップショット（任意）

## macOS アプリの提供状況

beta および dev ビルドには macOS アプリリリースが**含まれない**場合があります。これは問題ありません:

- それでも git タグと npm dist-tag は公開できます。
- リリースノートまたは changelog では「この beta には macOS ビルドがない」ことを明記してください。
