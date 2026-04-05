---
read_when:
    - Gatewayプラグインまたは互換バンドルをインストールまたは管理したい場合
    - プラグインの読み込み失敗をデバッグしたい場合
summary: '`openclaw plugins`のCLIリファレンス（list、install、marketplace、uninstall、enable/disable、doctor）'
title: plugins
x-i18n:
    generated_at: "2026-04-05T12:40:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c35ccf68cd7be1af5fee175bd1ce7de88b81c625a05a23887e5780e790df925
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gatewayプラグイン/拡張機能、フックパック、および互換バンドルを管理します。

関連:

- プラグインシステム: [Plugins](/tools/plugin)
- バンドル互換性: [プラグインバンドル](/plugins/bundles)
- プラグインマニフェスト + スキーマ: [プラグインマニフェスト](/plugins/manifest)
- セキュリティ強化: [セキュリティ](/gateway/security)

## コマンド

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

バンドル済みプラグインはOpenClawに同梱されています。一部はデフォルトで有効です（たとえば、バンドル済みのモデルプロバイダー、バンドル済みの音声プロバイダー、バンドル済みのブラウザプラグイン）。それ以外は`plugins enable`が必要です。

ネイティブOpenClawプラグインは、インラインJSON Schema（空でも`configSchema`）を含む`openclaw.plugin.json`を同梱する必要があります。互換バンドルは、代わりに独自のバンドルマニフェストを使用します。

`plugins list`には`Format: openclaw`または`Format: bundle`が表示されます。詳細なlist/info出力では、バンドルのサブタイプ（`codex`、`claude`、または`cursor`）と、検出されたバンドル機能も表示されます。

### インストール

```bash
openclaw plugins install <package>                      # 最初にClawHub、次にnpm
openclaw plugins install clawhub:<package>              # ClawHubのみ
openclaw plugins install <package> --force              # 既存のインストールを上書き
openclaw plugins install <package> --pin                # バージョンを固定
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # ローカルパス
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace（明示指定）
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

パッケージ名のみの指定は、最初にClawHub、次にnpmで確認されます。セキュリティ上の注意: プラグインのインストールはコードを実行するのと同様に扱ってください。固定バージョンを推奨します。

設定が無効な場合、`plugins install`は通常フェイルクローズし、先に`openclaw doctor --fix`を実行するよう案内します。文書化されている唯一の例外は、`openclaw.install.allowInvalidConfigRecovery`を明示的にオプトインしているプラグイン向けの、限定的なバンドル済みプラグイン復旧パスです。

`--force`は既存のインストール先を再利用し、すでにインストール済みのプラグインまたはフックパックをその場で上書きします。新しいローカルパス、アーカイブ、ClawHubパッケージ、またはnpmアーティファクトから同じidを意図的に再インストールする場合に使用します。

`--pin`はnpmインストールにのみ適用されます。marketplaceインストールではサポートされません。これは、marketplaceインストールではnpm specではなくmarketplaceソースメタデータが保存されるためです。

`--dangerously-force-unsafe-install`は、組み込みの危険コードスキャナーで誤検知が発生した場合の非常手段オプションです。組み込みスキャナーが`critical`の検出結果を報告してもインストールを続行できますが、プラグインの`before_install`フックによるポリシーブロックを回避するものではなく、スキャン失敗も回避しません。

このCLIフラグは、プラグインのインストール/更新フローに適用されます。Gateway経由のSkills依存関係インストールでは、対応する`dangerouslyForceUnsafeInstall`リクエストオーバーライドを使用します。一方、`openclaw skills install`は別個のClawHub Skillsダウンロード/インストールフローのままです。

`plugins install`は、`package.json`で`openclaw.hooks`を公開するフックパックのインストール画面でもあります。フックの絞り込み表示やフック単位の有効化には`openclaw hooks`を使用し、パッケージのインストールには使用しないでください。

npm specは**レジストリ専用**です（パッケージ名 + 任意の**完全一致バージョン**または**dist-tag**）。Git/URL/file specおよびsemver rangeは拒否されます。依存関係のインストールは安全のため`--ignore-scripts`付きで実行されます。

specのみの指定と`@latest`は安定トラックに留まります。npmがそれらのいずれかをプレリリースに解決した場合、OpenClawは停止し、`@beta`/`@rc`のようなプレリリースタグや、`@1.2.3-beta.4`のような完全一致のプレリリースバージョンで明示的にオプトインするよう求めます。

インストールspecのみの指定がバンドル済みプラグインid（たとえば`diffs`）に一致する場合、OpenClawはそのバンドル済みプラグインを直接インストールします。同名のnpmパッケージをインストールするには、明示的なスコープ付きspec（たとえば`@scope/diffs`）を使用してください。

サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。

Claude marketplaceインストールもサポートされています。

ClawHubインストールでは、明示的な`clawhub:<package>`ロケーターを使用します:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClawは現在、npmで安全なプラグインspecのみの指定に対してもClawHubを優先します。ClawHubにそのパッケージまたはバージョンがない場合のみ、npmにフォールバックします:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClawはClawHubからパッケージアーカイブをダウンロードし、告知されたプラグインAPI/最小Gateway互換性を確認してから、通常のアーカイブパスでインストールします。記録されたインストールには、後続の更新のためにClawHubソースメタデータが保持されます。

marketplace名がClaudeのローカルレジストリキャッシュ`~/.claude/plugins/known_marketplaces.json`に存在する場合は、`plugin@marketplace`の短縮記法を使用します:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

marketplaceソースを明示的に渡したい場合は`--marketplace`を使用します:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

marketplaceソースには次のものを使用できます:

- `~/.claude/plugins/known_marketplaces.json`のClaude既知marketplace名
- ローカルmarketplaceルートまたは`marketplace.json`のパス
- `owner/repo`のようなGitHubリポジトリ短縮記法
- `https://github.com/owner/repo`のようなGitHubリポジトリURL
- git URL

GitHubまたはgitから読み込まれたリモートmarketplaceでは、プラグインエントリはクローンされたmarketplaceリポジトリ内に留まる必要があります。OpenClawはそのリポジトリからの相対パスソースを受け入れ、リモートマニフェスト内のHTTP(S)、絶対パス、git、GitHub、およびその他の非パスのプラグインソースを拒否します。

ローカルパスおよびアーカイブでは、OpenClawは次を自動検出します:

- ネイティブOpenClawプラグイン（`openclaw.plugin.json`）
- Codex互換バンドル（`.codex-plugin/plugin.json`）
- Claude互換バンドル（`.claude-plugin/plugin.json`またはデフォルトのClaudeコンポーネントレイアウト）
- Cursor互換バンドル（`.cursor-plugin/plugin.json`）

互換バンドルは通常の拡張機能ルートにインストールされ、同じlist/info/enable/disableフローに参加します。現在は、バンドルSkills、Claude command-skills、Claude `settings.json`デフォルト、Claude `.lsp.json` / マニフェストで宣言された`lspServers`デフォルト、Cursor command-skills、および互換Codexフックディレクトリがサポートされています。その他の検出されたバンドル機能はdiagnostics/infoに表示されますが、まだランタイム実行には配線されていません。

### 一覧表示

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

`--enabled`を使用すると、読み込み済みプラグインのみを表示します。`--verbose`を使用すると、テーブル表示から、ソース/オリジン/バージョン/アクティベーションメタデータを含むプラグインごとの詳細行に切り替わります。機械可読なインベントリとレジストリdiagnosticsには`--json`を使用してください。

ローカルディレクトリをコピーしないようにするには`--link`を使用します（`plugins.load.paths`に追加されます）:

```bash
openclaw plugins install -l ./my-plugin
```

リンクされたインストールでは管理対象のインストール先にコピーする代わりにソースパスを再利用するため、`--link`では`--force`はサポートされません。

npmインストールで`--pin`を使用すると、デフォルト動作を非固定のまま維持しつつ、解決された完全一致spec（`name@version`）を`plugins.installs`に保存します。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`は、該当する場合、`plugins.entries`、`plugins.installs`、プラグイン許可リスト、およびリンクされた`plugins.load.paths`エントリからプラグイン記録を削除します。アクティブなメモリプラグインでは、メモリスロットは`memory-core`にリセットされます。

デフォルトでは、アンインストール時にアクティブなstate-dirプラグインルート配下のプラグインインストールディレクトリも削除されます。ディスク上のファイルを保持するには、`--keep-files`を使用してください。

`--keep-config`は、`--keep-files`の非推奨エイリアスとしてサポートされています。

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新は、`plugins.installs`内で追跡されているインストールと、`hooks.internal.installs`内で追跡されているフックパックインストールに適用されます。

プラグインidを渡すと、OpenClawはそのプラグインに記録されているインストールspecを再利用します。つまり、以前保存された`@beta`のようなdist-tagや、固定された完全一致バージョンは、後続の`update <id>`実行でも引き続き使用されます。

npmインストールでは、dist-tagまたは完全一致バージョン付きの明示的なnpmパッケージspecを渡すこともできます。OpenClawはそのパッケージ名を追跡対象のプラグイン記録に対応付け直し、そのインストール済みプラグインを更新し、今後のidベース更新のために新しいnpm specを記録します。

保存済みのintegrityハッシュが存在し、取得したアーティファクトのハッシュが変更されている場合、OpenClawは警告を表示し、続行前に確認を求めます。CIや非対話環境でプロンプトを回避するには、グローバル`--yes`を使用してください。

`--dangerously-force-unsafe-install`は、プラグイン更新中に組み込み危険コードスキャンで誤検知が発生した場合の非常手段オーバーライドとして、`plugins update`でも使用できます。それでも、プラグインの`before_install`ポリシーブロックやスキャン失敗によるブロックは回避せず、プラグイン更新にのみ適用され、フックパック更新には適用されません。

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

単一プラグインの詳細な内部検査です。識別情報、読み込み状態、ソース、登録済み機能、フック、ツール、コマンド、サービス、Gatewayメソッド、HTTPルート、ポリシーフラグ、diagnostics、インストールメタデータ、バンドル機能、および検出されたMCPまたはLSPサーバーサポートを表示します。

各プラグインは、実際にランタイムで何を登録するかによって次のように分類されます:

- **plain-capability** — 1つの機能タイプ（例: プロバイダー専用プラグイン）
- **hybrid-capability** — 複数の機能タイプ（例: テキスト + 音声 + 画像）
- **hook-only** — フックのみで、機能やサーフェスなし
- **non-capability** — ツール/コマンド/サービスはあるが機能なし

機能モデルの詳細については、[プラグイン形状](/plugins/architecture#plugin-shapes)を参照してください。

`--json`フラグは、スクリプト処理や監査に適した機械可読レポートを出力します。

`inspect --all`は、形状、機能種別、互換性通知、バンドル機能、およびフック概要列を含む、フリート全体のテーブルを表示します。

`info`は`inspect`のエイリアスです。

### Doctor

```bash
openclaw plugins doctor
```

`doctor`は、プラグインの読み込みエラー、マニフェスト/ディスカバリーdiagnostics、および互換性通知を報告します。問題がなければ、`No plugin issues detected.`と表示されます。

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace listでは、ローカルmarketplaceパス、`marketplace.json`パス、`owner/repo`のようなGitHub短縮記法、GitHubリポジトリURL、またはgit URLを受け付けます。`--json`は、解決されたソースラベルと、解析されたmarketplaceマニフェストおよびプラグインエントリを出力します。
