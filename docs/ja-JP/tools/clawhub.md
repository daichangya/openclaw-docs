---
read_when:
    - 新規ユーザー向けのClawHub紹介
    - SkillsやPluginのインストール、検索、公開
    - ClawHub CLIフラグと同期動作の説明
summary: 'ClawHubガイド: 公開registry、ネイティブOpenClawインストールフロー、およびClawHub CLIワークフロー'
title: ClawHub
x-i18n:
    generated_at: "2026-04-22T04:28:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88980eb2f48c5298aec5b697e8e50762c3df5a4114f567e69424a1cb36e5102e
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHubは**OpenClaw SkillsとPlugin**の公開registryです。

- スキルの検索/インストール/更新、およびClawHubからのPluginインストールには、
  ネイティブの`openclaw`コマンドを使用します。
- registry認証、公開、削除、削除取り消し、または同期ワークフローが必要な場合は、
  別の`clawhub` CLIを使用します。

サイト: [clawhub.ai](https://clawhub.ai)

## ネイティブOpenClawフロー

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

npmで安全な素のPlugin specも、npmより前にClawHubに対して試行されます。

```bash
openclaw plugins install openclaw-codex-app-server
```

ネイティブ`openclaw`コマンドは、アクティブなワークスペースへインストールし、
後続の`update`呼び出しがClawHub上に留まれるように、ソース
メタデータを永続化します。

Pluginインストールでは、archiveインストール実行前に広告された`pluginApi`と`minGatewayVersion`
互換性をバリデーションするため、非互換hostではパッケージを部分的にインストールするのではなく、
早い段階でfail closedします。

`openclaw plugins install clawhub:...`は、インストール可能なPluginファミリーだけを受け付けます。
ClawHubパッケージが実際にはskillである場合、OpenClawは停止し、代わりに
`openclaw skills install <slug>`を案内します。

## ClawHubとは何か

- OpenClaw SkillsとPluginの公開registry。
- スキルバンドルとメタデータのバージョン管理された保存先。
- 検索、タグ、利用シグナルのための発見画面。

## 仕組み

1. ユーザーがスキルバンドル（ファイル + メタデータ）を公開します。
2. ClawHubがバンドルを保存し、メタデータを解析し、バージョンを割り当てます。
3. registryがそのスキルを検索と発見のためにインデックス化します。
4. ユーザーがOpenClawでスキルを閲覧、ダウンロード、インストールします。

## できること

- 新しいスキルと既存スキルの新バージョンを公開する。
- 名前、タグ、または検索でスキルを見つける。
- スキルバンドルをダウンロードし、そのファイルを確認する。
- 悪意のある、または安全でないスキルを報告する。
- モデレーターであれば、非表示、再表示、削除、または禁止を行う。

## どんな人向けか（初心者向け）

OpenClaw agentに新しい能力を追加したい場合、ClawHubはSkillsを見つけてインストールする最も簡単な方法です。バックエンドの仕組みを知る必要はありません。できること:

- 平易な言葉でSkillsを検索する。
- ワークスペースにSkillをインストールする。
- 後で1つのコマンドでSkillsを更新する。
- 自分のSkillsを公開してバックアップする。

## クイックスタート（非技術者向け）

1. 必要なものを検索します:
   - `openclaw skills search "calendar"`
2. Skillをインストールします:
   - `openclaw skills install <skill-slug>`
3. 新しいOpenClawセッションを開始して、新しいSkillを読み込ませます。
4. 公開やregistry認証の管理もしたい場合は、別の
   `clawhub` CLIもインストールしてください。

## ClawHub CLIのインストール

これは、公開/同期のようなregistry認証付きワークフローでのみ必要です。

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## OpenClawの中での位置付け

ネイティブの`openclaw skills install`は、アクティブワークスペースの`skills/`
ディレクトリにインストールします。`openclaw plugins install clawhub:...`は、通常の管理対象
Pluginインストールに加えて、更新用のClawHubソースメタデータを記録します。

匿名のClawHub Pluginインストールも、privateパッケージではfail closedします。
コミュニティやその他の非公式チャンネルからは引き続きインストールできますが、OpenClawは
有効化前にソースと検証を確認できるよう運用者へ警告します。

別の`clawhub` CLIも、現在の作業ディレクトリ配下の`./skills`にSkillsをインストールします。OpenClawワークスペースが設定されている場合、`clawhub`は
`--workdir`（または
`CLAWHUB_WORKDIR`）で上書きしない限り、そのワークスペースへフォールバックします。OpenClawは
`<workspace>/skills`からワークスペースSkillsを読み込み、**次の**セッションでそれらを拾います。すでに
`~/.openclaw/skills`またはバンドル済みSkillsを使っている場合、ワークスペースSkillsが優先されます。

Skillsがどのように読み込まれ、共有され、制御されるかの詳細は
[Skills](/ja-JP/tools/skills)を参照してください。

## Skillシステム概要

Skillは、OpenClawに特定のタスクの実行方法を教える、ファイルのバージョン管理されたバンドルです。
公開のたびに新しいバージョンが作成され、registryはユーザーが変更を監査できるよう
バージョン履歴を保持します。

典型的なSkillには次が含まれます。

- 主な説明と使い方を記載した`SKILL.md`ファイル。
- Skillで使用される任意の設定、スクリプト、または補助ファイル。
- タグ、要約、インストール要件のようなメタデータ。

ClawHubは、発見を支え、Skillの能力を安全に公開するためにメタデータを使用します。
registryはまた、ランキングと可視性を改善するために利用シグナル（starsやdownloadsなど）も追跡します。

## サービスが提供するもの（機能）

- Skillsとその`SKILL.md`内容の**公開閲覧**。
- キーワードだけではない、embeddings（ベクトル検索）による**検索**。
- semver、changelog、タグ（`latest`を含む）による**バージョン管理**。
- バージョンごとのzipとしての**ダウンロード**。
- コミュニティフィードバックのための**starsとコメント**。
- 承認と監査のための**モデレーション**hook。
- 自動化とスクリプト向けの**CLIフレンドリーなAPI**。

## セキュリティとモデレーション

ClawHubはデフォルトでオープンです。誰でもSkillをアップロードできますが、公開するには
GitHubアカウントが少なくとも1週間以上経過している必要があります。これにより、
正当な貢献者を妨げずに悪用を抑制します。

報告とモデレーション:

- サインインしているユーザーなら誰でもSkillを報告できます。
- 報告理由は必須で、記録されます。
- 各ユーザーは同時に最大20件のアクティブ報告を持てます。
- 3件を超えるユニーク報告が付いたSkillは、デフォルトで自動的に非表示になります。
- モデレーターは、非表示Skillの閲覧、再表示、削除、またはユーザー禁止を行えます。
- 報告機能の悪用は、アカウント禁止の対象になることがあります。

モデレーターに興味がありますか？OpenClaw Discordで相談し、
モデレーターまたはメンテナーに連絡してください。

## CLIコマンドとパラメーター

グローバルオプション（すべてのコマンドに適用）:

- `--workdir <dir>`: 作業ディレクトリ（デフォルト: 現在のディレクトリ。OpenClawワークスペースへフォールバック）。
- `--dir <dir>`: workdirからの相対Skillsディレクトリ（デフォルト: `skills`）。
- `--site <url>`: サイトベースURL（ブラウザーログイン）。
- `--registry <url>`: registry APIベースURL。
- `--no-input`: プロンプトを無効化（非対話型）。
- `-V, --cli-version`: CLIバージョンを表示。

認証:

- `clawhub login`（ブラウザーフロー）または`clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

オプション:

- `--token <token>`: APIトークンを貼り付けます。
- `--label <label>`: ブラウザーログイントークンに保存するラベル（デフォルト: `CLI token`）。
- `--no-browser`: ブラウザーを開きません（`--token`が必要）。

検索:

- `clawhub search "query"`
- `--limit <n>`: 最大結果数。

インストール:

- `clawhub install <slug>`
- `--version <version>`: 特定バージョンをインストール。
- `--force`: フォルダーがすでに存在する場合に上書き。

更新:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: 特定バージョンへ更新（単一slugのみ）。
- `--force`: ローカルファイルが公開済みバージョンのどれとも一致しない場合に上書き。

一覧:

- `clawhub list`（`.clawhub/lock.json`を読み取ります）

Skill公開:

- `clawhub skill publish <path>`
- `--slug <slug>`: Skill slug。
- `--name <name>`: 表示名。
- `--version <version>`: Semverバージョン。
- `--changelog <text>`: Changelogテキスト（空でも可）。
- `--tags <tags>`: カンマ区切りタグ（デフォルト: `latest`）。

Plugin公開:

- `clawhub package publish <source>`
- `<source>`には、ローカルフォルダー、`owner/repo`、`owner/repo@ref`、またはGitHub URLを指定できます。
- `--dry-run`: 何もアップロードせず、正確な公開計画を構築します。
- `--json`: CI向けに機械可読出力を生成します。
- `--source-repo`、`--source-commit`、`--source-ref`: 自動検出だけでは不十分な場合の任意の上書き。

削除/削除取り消し（owner/adminのみ）:

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

同期（ローカルSkillsをスキャンして新規/更新を公開）:

- `clawhub sync`
- `--root <dir...>`: 追加のスキャンroot。
- `--all`: プロンプトなしで全件アップロード。
- `--dry-run`: 何がアップロードされるかを表示。
- `--bump <type>`: 更新時の`patch|minor|major`（デフォルト: `patch`）。
- `--changelog <text>`: 非対話型更新用changelog。
- `--tags <tags>`: カンマ区切りタグ（デフォルト: `latest`）。
- `--concurrency <n>`: registryチェック数（デフォルト: 4）。

## agent向けの一般的なワークフロー

### Skillsを検索する

```bash
clawhub search "postgres backups"
```

### 新しいSkillsをダウンロードする

```bash
clawhub install my-skill-pack
```

### インストール済みSkillsを更新する

```bash
clawhub update --all
```

### Skillsをバックアップする（公開または同期）

単一のSkillフォルダーの場合:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

複数のSkillsを一度にスキャンしてバックアップするには:

```bash
clawhub sync --all
```

### GitHubからPluginを公開する

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

コードPluginには、`package.json`に必要なOpenClawメタデータを含める必要があります。

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
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

公開されるパッケージは、ビルド済みJavaScriptを含め、
`runtimeExtensions`をその出力へ向けるべきです。Git checkoutインストールでは、ビルド済みファイルが
存在しない場合に引き続きTypeScriptソースへフォールバックできますが、
ビルド済み実行時entryを用意しておくと、起動、doctor、Pluginロード経路での実行時TypeScript
コンパイルを避けられます。

## 詳細（技術的）

### バージョン管理とタグ

- 公開のたびに新しい**semver** `SkillVersion`が作成されます。
- タグ（`latest`など）はバージョンを指し、タグを動かすことでロールバックできます。
- Changelogはバージョンごとに付与され、同期や更新公開では空でも構いません。

### ローカル変更とregistryバージョン

更新では、ローカルSkill内容をコンテンツハッシュでregistryバージョンと比較します。ローカルファイルが
公開済みバージョンのどれとも一致しない場合、CLIは上書き前に確認を求めます（または非対話型実行では
`--force`が必要です）。

### 同期スキャンとフォールバックroot

`clawhub sync`はまず現在のworkdirをスキャンします。Skillが見つからない場合、
既知の従来ロケーション（たとえば`~/openclaw/skills`や`~/.openclaw/skills`）へフォールバックします。これは、
追加フラグなしで古いSkillインストールを見つけるためのものです。

### 保存先とlockfile

- インストール済みSkillsは、workdir配下の`.clawhub/lock.json`に記録されます。
- 認証トークンはClawHub CLI設定ファイルに保存されます（`CLAWHUB_CONFIG_PATH`で上書き可能）。

### テレメトリー（インストール数）

ログイン済みで`clawhub sync`を実行すると、CLIはインストール数計算のために最小限のスナップショットを送信します。これを完全に無効化できます。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## 環境変数

- `CLAWHUB_SITE`: サイトURLを上書き。
- `CLAWHUB_REGISTRY`: registry API URLを上書き。
- `CLAWHUB_CONFIG_PATH`: CLIがトークン/設定を保存する場所を上書き。
- `CLAWHUB_WORKDIR`: デフォルトworkdirを上書き。
- `CLAWHUB_DISABLE_TELEMETRY=1`: `sync`時のテレメトリーを無効化。
