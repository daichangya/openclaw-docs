---
read_when:
    - 新しいユーザーに ClawHub を紹介している
    - skills または plugins のインストール、検索、公開を行っている
    - ClawHub CLI のフラグと同期動作を説明している
summary: 'ClawHub ガイド: 公開レジストリ、OpenClaw ネイティブのインストールフロー、ClawHub CLI ワークフロー'
title: ClawHub
x-i18n:
    generated_at: "2026-04-05T12:59:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: e65b3fd770ca96a5dd828dce2dee4ef127268f4884180a912f43d7744bc5706f
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub は、**OpenClaw skills と plugins** の公開レジストリです。

- ネイティブの `openclaw` コマンドを使って skills の検索、インストール、更新、および
  ClawHub からの plugins のインストールを行います。
- レジストリ認証、公開、削除、削除取り消し、同期ワークフローが必要な場合は、
  別個の `clawhub` CLI を使用します。

サイト: [clawhub.ai](https://clawhub.ai)

## OpenClaw ネイティブフロー

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

素の npm-safe plugin spec も、npm より先に ClawHub に対して試行されます:

```bash
openclaw plugins install openclaw-codex-app-server
```

ネイティブの `openclaw` コマンドは、アクティブな workspace にインストールし、
後続の `update` 呼び出しが ClawHub 上にとどまれるよう、ソースメタデータを永続化します。

Plugin のインストールでは、アーカイブインストールの実行前に告知された `pluginApi` と `minGatewayVersion`
の互換性を検証するため、互換性のないホストではパッケージが部分的にインストールされるのではなく、
早い段階で安全に失敗します。

`openclaw plugins install clawhub:...` は、インストール可能な plugin ファミリーのみを受け付けます。
ClawHub パッケージが実際には skill の場合、OpenClaw は停止し、
代わりに `openclaw skills install <slug>` を案内します。

## ClawHub とは何か

- OpenClaw skills と plugins の公開レジストリ。
- スキルバンドルとメタデータのバージョン付きストア。
- 検索、タグ、利用シグナルのための検出面。

## 仕組み

1. ユーザーが skill bundle（files + metadata）を公開します。
2. ClawHub が bundle を保存し、metadata を解析して、バージョンを割り当てます。
3. レジストリがその skill を検索と検出のためにインデックス化します。
4. ユーザーが OpenClaw で skills を閲覧、ダウンロード、インストールします。

## できること

- 新しい skills と既存 skills の新しいバージョンを公開する。
- 名前、タグ、または検索で skills を見つける。
- skill bundles をダウンロードし、その files を確認する。
- 迷惑または危険な skills を報告する。
- モデレーターであれば、非表示、再表示、削除、または禁止を行う。

## どのような人向けか（初心者向け）

OpenClaw エージェントに新しい機能を追加したいなら、ClawHub は skills を見つけてインストールする最も簡単な方法です。バックエンドの仕組みを知る必要はありません。次のことができます:

- 平易な言葉で skills を検索する。
- skill を workspace にインストールする。
- 後で 1 つのコマンドで skills を更新する。
- 自分の skills を公開してバックアップする。

## クイックスタート（非技術者向け）

1. 必要なものを検索します:
   - `openclaw skills search "calendar"`
2. skill をインストールします:
   - `openclaw skills install <skill-slug>`
3. 新しい OpenClaw セッションを開始して、新しい skill を読み込ませます。
4. レジストリ認証を公開または管理したい場合は、別個の
   `clawhub` CLI もインストールしてください。

## ClawHub CLI をインストールする

これは、公開/同期のようなレジストリ認証が必要なワークフローでのみ必要です:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## OpenClaw への組み込み方

ネイティブの `openclaw skills install` は、アクティブな workspace の `skills/`
ディレクトリにインストールします。`openclaw plugins install clawhub:...` は、通常の管理された
plugin インストールに加えて、更新用の ClawHub ソースメタデータを記録します。

匿名の ClawHub plugin インストールも、プライベートパッケージに対しては安全に失敗します。
コミュニティやその他の非公式チャンネルは引き続きインストール可能ですが、OpenClaw は
有効化前にソースと検証をオペレーターが確認できるよう警告します。

別個の `clawhub` CLI も、現在の作業ディレクトリ配下の `./skills` に skills をインストールします。
OpenClaw workspace が設定されている場合、`clawhub` は `--workdir`（または
`CLAWHUB_WORKDIR`）で上書きしない限り、その workspace にフォールバックします。OpenClaw は
`<workspace>/skills` から workspace skills を読み込み、**次の**セッションでそれらを取り込みます。すでに
`~/.openclaw/skills` やバンドル済み skills を使用している場合、workspace skills が優先されます。

Skills の読み込み、共有、ゲートの詳細については、
[Skills](/tools/skills) を参照してください。

## スキルシステム概要

skill は、OpenClaw に特定のタスクの実行方法を教える、バージョン付きの file bundle です。公開のたびに新しいバージョンが作成され、レジストリはバージョン履歴を保持するため、ユーザーは変更を監査できます。

一般的な skill に含まれるもの:

- 主要な説明と使用法を含む `SKILL.md` file。
- skill が使用する任意の config、script、または補助 file。
- タグ、要約、インストール要件などの metadata。

ClawHub は metadata を使用して検出を支え、安全に skill capabilities を公開します。
また、レジストリはランキングと可視性を改善するため、使用シグナル（stars や downloads など）も追跡します。

## サービスが提供するもの（機能）

- skills とその `SKILL.md` コンテンツの**公開ブラウズ**。
- 単なるキーワードではなく、embeddings（ベクトル検索）を使った**検索**。
- semver、changelogs、tags（`latest` を含む）による**バージョニング**。
- バージョンごとの zip としての**ダウンロード**。
- コミュニティフィードバックのための **stars と comments**。
- 承認と監査のための**モデレーション**フック。
- 自動化とスクリプト向けの **CLI フレンドリーな API**。

## セキュリティとモデレーション

ClawHub は既定でオープンです。誰でも skills をアップロードできますが、公開するには GitHub アカウントが
少なくとも 1 週間以上前に作成されている必要があります。これにより、正当な貢献者を妨げることなく
悪用を抑制しやすくなります。

報告とモデレーション:

- サインインしているすべてのユーザーが skill を報告できます。
- 報告理由は必須で、記録されます。
- 各ユーザーは同時に最大 20 件のアクティブな報告を持てます。
- 3 人を超える一意ユーザーから報告された skills は、既定で自動的に非表示になります。
- モデレーターは、非表示の skills を表示し、再表示し、削除し、またはユーザーを禁止できます。
- 報告機能の悪用はアカウント停止につながる可能性があります。

モデレーターになることに興味がありますか？ OpenClaw Discord で質問し、
モデレーターまたは maintainer に連絡してください。

## CLI コマンドとパラメーター

グローバルオプション（すべてのコマンドに適用）:

- `--workdir <dir>`: 作業ディレクトリ（既定: 現在の dir。OpenClaw workspace にフォールバック）
- `--dir <dir>`: skills ディレクトリ。workdir からの相対パス（既定: `skills`）。
- `--site <url>`: サイトの base URL（ブラウザログイン）。
- `--registry <url>`: レジストリ API の base URL。
- `--no-input`: プロンプトを無効化（非対話型）。
- `-V, --cli-version`: CLI バージョンを表示。

認証:

- `clawhub login`（ブラウザフロー）または `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

オプション:

- `--token <token>`: API token を貼り付けます。
- `--label <label>`: ブラウザログイン token に保存されるラベル（既定: `CLI token`）。
- `--no-browser`: ブラウザを開きません（`--token` が必要）。

検索:

- `clawhub search "query"`
- `--limit <n>`: 最大結果数。

インストール:

- `clawhub install <slug>`
- `--version <version>`: 特定のバージョンをインストールします。
- `--force`: フォルダーがすでに存在する場合は上書きします。

更新:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: 特定のバージョンへ更新します（単一 slug のみ）。
- `--force`: ローカル files がどの公開バージョンとも一致しない場合に上書きします。

一覧:

- `clawhub list`（`.clawhub/lock.json` を読み取ります）

skills を公開:

- `clawhub skill publish <path>`
- `--slug <slug>`: Skill slug。
- `--name <name>`: 表示名。
- `--version <version>`: semver バージョン。
- `--changelog <text>`: changelog テキスト（空でも可）。
- `--tags <tags>`: カンマ区切りタグ（既定: `latest`）。

plugins を公開:

- `clawhub package publish <source>`
- `<source>` には、ローカルフォルダー、`owner/repo`、`owner/repo@ref`、または GitHub URL を指定できます。
- `--dry-run`: 何もアップロードせず、正確な公開計画をビルドします。
- `--json`: CI 用に機械可読な出力を行います。
- `--source-repo`, `--source-commit`, `--source-ref`: 自動検出だけでは不十分な場合の任意の上書き。

削除/削除取り消し（owner/admin のみ）:

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

同期（ローカル skills をスキャンして新規/更新分を公開）:

- `clawhub sync`
- `--root <dir...>`: 追加のスキャンルート。
- `--all`: プロンプトなしですべてアップロードします。
- `--dry-run`: 何がアップロードされるかを表示します。
- `--bump <type>`: 更新時の `patch|minor|major`（既定: `patch`）。
- `--changelog <text>`: 非対話型更新用の changelog。
- `--tags <tags>`: カンマ区切りタグ（既定: `latest`）。
- `--concurrency <n>`: レジストリチェック数（既定: 4）。

## エージェント向けの一般的なワークフロー

### skills を検索する

```bash
clawhub search "postgres backups"
```

### 新しい skills をダウンロードする

```bash
clawhub install my-skill-pack
```

### インストール済み skills を更新する

```bash
clawhub update --all
```

### skills をバックアップする（公開または同期）

単一の skill フォルダーの場合:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

複数の skills を一度にスキャンしてバックアップするには:

```bash
clawhub sync --all
```

### GitHub から plugin を公開する

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

コード plugin には、`package.json` に必要な OpenClaw metadata が含まれている必要があります:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

## 詳細情報（技術的）

### バージョニングとタグ

- 各公開は、新しい **semver** `SkillVersion` を作成します。
- タグ（`latest` など）はバージョンを指します。タグを移動することでロールバックできます。
- changelog はバージョンごとに付与され、同期または更新公開時には空でも構いません。

### ローカル変更とレジストリバージョン

更新時には、コンテンツハッシュを使ってローカルの skill 内容をレジストリのバージョンと比較します。ローカル files がどの公開バージョンにも一致しない場合、CLI は上書き前に確認を求めます（非対話実行では `--force` が必要です）。

### 同期スキャンとフォールバックルート

`clawhub sync` は、まず現在の workdir をスキャンします。skills が見つからない場合は、既知のレガシー場所（たとえば `~/openclaw/skills` と `~/.openclaw/skills`）にフォールバックします。これは、追加フラグなしで古い skill インストールを見つけるための設計です。

### ストレージとロックファイル

- インストール済み skills は、workdir 配下の `.clawhub/lock.json` に記録されます。
- Auth tokens は ClawHub CLI の config file に保存されます（`CLAWHUB_CONFIG_PATH` で上書き可能）。

### テレメトリー（インストール数）

ログイン中に `clawhub sync` を実行すると、CLI はインストール数を計算するための最小限のスナップショットを送信します。これを完全に無効化できます:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## 環境変数

- `CLAWHUB_SITE`: サイト URL を上書きします。
- `CLAWHUB_REGISTRY`: レジストリ API URL を上書きします。
- `CLAWHUB_CONFIG_PATH`: CLI が token/config を保存する場所を上書きします。
- `CLAWHUB_WORKDIR`: 既定の workdir を上書きします。
- `CLAWHUB_DISABLE_TELEMETRY=1`: `sync` 時のテレメトリーを無効化します。
