---
read_when:
    - Gatewayプラグインまたは互換バンドルをインストールまたは管理したい場合
    - プラグインの読み込み失敗をデバッグしたい場合
summary: '`openclaw plugins` のCLIリファレンス（list、install、marketplace、uninstall、enable/disable、doctor）'
title: プラグイン
x-i18n:
    generated_at: "2026-04-24T15:21:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc693d5e3bc49057e1a108ba65a4dcb3bb662c00229e6fa38a0335afba8240e5
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gatewayプラグイン、フックパック、および互換バンドルを管理します。

関連項目:

- Pluginシステム: [プラグイン](/ja-JP/tools/plugin)
- バンドル互換性: [Pluginバンドル](/ja-JP/plugins/bundles)
- Pluginマニフェスト + スキーマ: [Pluginマニフェスト](/ja-JP/plugins/manifest)
- セキュリティ強化: [セキュリティ](/ja-JP/gateway/security)

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
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

バンドル済みPluginはOpenClawに同梱されています。いくつかはデフォルトで有効です（たとえば、バンドル済みのモデルプロバイダー、バンドル済みの音声プロバイダー、バンドル済みのブラウザPlugin）。それ以外は `plugins enable` が必要です。

ネイティブOpenClaw Pluginは、インラインJSON Schema（空の場合でも `configSchema`）を含む `openclaw.plugin.json` を含める必要があります。互換バンドルは代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細なlist/info出力では、バンドルのサブタイプ（`codex`、`claude`、または `cursor`）に加えて、検出されたバンドル機能も表示されます。

### インストール

```bash
openclaw plugins install <package>                      # まずClawHub、次にnpm
openclaw plugins install clawhub:<package>              # ClawHubのみ
openclaw plugins install <package> --force              # 既存のインストールを上書き
openclaw plugins install <package> --pin                # バージョンを固定
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # ローカルパス
openclaw plugins install <plugin>@<marketplace>         # マーケットプレイス
openclaw plugins install <plugin> --marketplace <name>  # マーケットプレイス（明示指定）
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

素のパッケージ名は、まずClawHub、次にnpmで確認されます。セキュリティ上の注意: Pluginのインストールはコードの実行と同様に扱ってください。固定バージョンを推奨します。

`plugins` セクションが単一ファイルの `$include` で構成されている場合、`plugins install/update/enable/disable/uninstall` はそのインクルード先ファイルに書き込み、`openclaw.json` は変更しません。ルートインクルード、インクルード配列、兄弟オーバーライドを持つインクルードは、フラット化せずにフェイルクローズします。対応する形状については [Config includes](/ja-JP/gateway/configuration) を参照してください。

設定が無効な場合、`plugins install` は通常フェイルクローズし、まず `openclaw doctor --fix` を実行するよう案内します。文書化されている唯一の例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインしたPlugin向けの、限定的なバンドル済みPlugin復旧パスです。

`--force` は既存のインストール先を再利用し、すでにインストール済みのPluginまたはフックパックをその場で上書きします。同じidを新しいローカルパス、アーカイブ、ClawHubパッケージ、またはnpmアーティファクトから意図的に再インストールする場合に使用します。すでに追跡されているnpm Pluginを通常アップグレードするには、`openclaw plugins update <id-or-npm-spec>` を使ってください。

すでにインストール済みのPlugin idに対して `plugins install` を実行すると、OpenClawは停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を、本当に別ソースから現在のインストールを上書きしたい場合には `plugins install <package> --force` を案内します。

`--pin` はnpmインストールにのみ適用されます。マーケットプレイスのインストールはnpm specではなくマーケットプレイスのソースメタデータを保持するため、`--marketplace` とは併用できません。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる誤検知に対する最終手段のオプションです。組み込みスキャナーが `critical` の検出結果を報告してもインストールを続行できますが、Pluginの `before_install` フックポリシーによるブロックは回避できず、スキャン失敗も回避できません。

このCLIフラグはPluginのinstall/updateフローに適用されます。Gateway経由のSkills依存関係インストールでは対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用します。一方で、`openclaw skills install` は別個のClawHub Skillsダウンロード/インストールフローのままです。

`plugins install` は、`package.json` に `openclaw.hooks` を公開するフックパックのインストール面でもあります。フィルタされたフック可視性やフックごとの有効化には `openclaw hooks` を使い、パッケージのインストールには使わないでください。

npm spec は**レジストリ専用**です（パッケージ名 + 任意の**正確なバージョン**または**dist-tag**）。Git/URL/file specやsemver rangeは拒否されます。安全のため、依存関係のインストールは `--ignore-scripts` 付きで実行されます。

素のspecと `@latest` は安定版トラックのままです。npmがそのいずれかをプレリリースに解決した場合、OpenClawは停止し、`@beta`/`@rc` のようなプレリリースタグ、または `@1.2.3-beta.4` のような正確なプレリリースバージョンで明示的にオプトインするよう求めます。

素のインストールspecがバンドル済みPlugin id（たとえば `diffs`）と一致する場合、OpenClawはそのバンドル済みPluginを直接インストールします。同名のnpmパッケージをインストールするには、明示的なスコープ付きspec（たとえば `@scope/diffs`）を使用してください。

サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。

Claudeマーケットプレイスからのインストールにも対応しています。

ClawHubインストールでは、明示的な `clawhub:<package>` ロケーターを使用します:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClawは現在、npmで安全な素のPlugin specに対してもClawHubを優先します。ClawHubにそのパッケージまたはバージョンがない場合にのみnpmへフォールバックします:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClawはClawHubからパッケージアーカイブをダウンロードし、告知されたplugin API / 最小gateway互換性を確認したうえで、通常のアーカイブ経路でインストールします。記録されたインストールには、後の更新のためにClawHubのソースメタデータが保持されます。

Claudeのローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` にマーケットプレイス名が存在する場合は、`plugin@marketplace` の短縮記法を使用します:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

マーケットプレイスのソースを明示的に渡したい場合は `--marketplace` を使用します:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

マーケットプレイスのソースには次のものを指定できます:

- `~/.claude/plugins/known_marketplaces.json` にあるClaude既知マーケットプレイス名
- ローカルのマーケットプレイスルート、または `marketplace.json` のパス
- `owner/repo` のようなGitHubリポジトリ短縮表記
- `https://github.com/owner/repo` のようなGitHubリポジトリURL
- git URL

GitHubまたはgitから読み込まれたリモートマーケットプレイスでは、Pluginエントリはクローンされたマーケットプレイスリポジトリ内にとどまる必要があります。OpenClawはそのリポジトリからの相対パスソースを受け入れ、リモートマニフェスト内のHTTP(S)、絶対パス、git、GitHub、およびその他の非パスPluginソースを拒否します。

ローカルパスとアーカイブについては、OpenClawが次を自動検出します:

- ネイティブOpenClaw Plugin（`openclaw.plugin.json`）
- Codex互換バンドル（`.codex-plugin/plugin.json`）
- Claude互換バンドル（`.claude-plugin/plugin.json` またはデフォルトのClaudeコンポーネントレイアウト）
- Cursor互換バンドル（`.cursor-plugin/plugin.json`）

互換バンドルは通常のPluginルートにインストールされ、同じlist/info/enable/disableフローに参加します。現在は、バンドルのSkills、Claude command-skills、Claude `settings.json` のデフォルト、Claude `.lsp.json` / マニフェスト宣言の `lspServers` デフォルト、Cursor command-skills、および互換Codexフックディレクトリがサポートされています。その他の検出されたバンドル機能はdiagnostics/infoに表示されますが、まだランタイム実行には接続されていません。

### 一覧

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

`--enabled` を使うと、読み込まれたPluginのみを表示します。`--verbose` を使うと、テーブル表示から、ソース/由来/バージョン/アクティベーションメタデータを含むPluginごとの詳細行に切り替わります。機械可読なインベントリとレジストリdiagnosticsには `--json` を使用します。

`plugins list` は、現在のCLI環境と設定から検出を実行します。Pluginが有効か、読み込み可能かを確認するのには便利ですが、すでに実行中のGatewayプロセスに対するライブなランタイムプローブではありません。Pluginコード、有効化状態、フックポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードやフックが実行されることを期待する前に、そのチャネルを提供しているGatewayを再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

ランタイムフックのデバッグ用:

- `openclaw plugins inspect <id> --json` は、モジュール読み込み済みのinspectionパスから、登録されたフックとdiagnosticsを表示します。
- `openclaw gateway status --deep --require-rpc` は、到達可能なGateway、サービス/プロセスのヒント、configパス、RPCの健全性を確認します。
- バンドルされていない会話フック（`llm_input`、`llm_output`、`agent_end`）には `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルディレクトリをコピーせずに使うには `--link` を使用します（`plugins.load.paths` に追加されます）:

```bash
openclaw plugins install -l ./my-plugin
```

リンクインストールでは管理対象のインストール先へコピーせずソースパスを再利用するため、`--force` は `--link` と併用できません。

npmインストールで `--pin` を使用すると、デフォルト動作を固定しないまま、解決された正確なspec（`name@version`）が `plugins.installs` に保存されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、`plugins.entries`、`plugins.installs`、Plugin許可リスト、および該当する場合はリンクされた `plugins.load.paths` エントリからPluginレコードを削除します。Active Memory Pluginの場合、メモリスロットは `memory-core` にリセットされます。

デフォルトでは、アンインストール時にアクティブなstate-dirのPluginルート配下にあるPluginインストールディレクトリも削除されます。ディスク上のファイルを残すには `--keep-files` を使用してください。

`--keep-config` は `--keep-files` の非推奨エイリアスとしてサポートされています。

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新は、`plugins.installs` 内の追跡対象インストールと、`hooks.internal.installs` 内の追跡対象フックパックインストールに適用されます。

Plugin idを渡すと、OpenClawはそのPluginに記録されているインストールspecを再利用します。つまり、以前保存された `@beta` のようなdist-tagや、正確に固定されたバージョンは、その後の `update <id>` 実行でも引き続き使用されます。

npmインストールでは、dist-tagまたは正確なバージョンを含む明示的なnpmパッケージspecを渡すこともできます。OpenClawはそのパッケージ名を追跡対象Pluginレコードに解決し、そのインストール済みPluginを更新し、今後のidベース更新のために新しいnpm specを記録します。

バージョンやタグなしでnpmパッケージ名を渡した場合も、追跡対象Pluginレコードに解決されます。これは、Pluginが正確なバージョンに固定されていて、それをレジストリのデフォルトリリース系列に戻したい場合に使用します。

ライブのnpm更新の前に、OpenClawはインストール済みパッケージのバージョンをnpmレジストリメタデータと照合します。インストール済みバージョンと記録済みアーティファクト識別子が、解決された対象とすでに一致している場合、更新はスキップされ、ダウンロード、再インストール、`openclaw.json` の書き換えは行われません。

保存済みのintegrityハッシュが存在し、取得したアーティファクトのハッシュが変化した場合、OpenClawはそれをnpmアーティファクトドリフトとして扱います。対話型の `openclaw plugins update` コマンドは、想定されたハッシュと実際のハッシュを表示し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し側が明示的な続行ポリシーを指定しない限り、フェイルクローズします。

`--dangerously-force-unsafe-install` は、Plugin更新中に組み込みの危険コードスキャンで誤検知が起きた場合の最終手段オーバーライドとして、`plugins update` でも利用できます。これは依然としてPluginの `before_install` ポリシーブロックやスキャン失敗によるブロックを回避せず、Plugin更新にのみ適用され、フックパック更新には適用されません。

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

単一Pluginの詳細なイントロスペクションです。ID、読み込み状態、ソース、登録された機能、フック、ツール、コマンド、サービス、Gatewayメソッド、HTTPルート、ポリシーフラグ、diagnostics、インストールメタデータ、バンドル機能、検出されたMCPまたはLSPサーバー対応を表示します。

各Pluginは、実行時に実際に登録する内容によって分類されます:

- **plain-capability** — 1種類の機能タイプ（例: プロバイダー専用Plugin）
- **hybrid-capability** — 複数の機能タイプ（例: テキスト + 音声 + 画像）
- **hook-only** — フックのみで、機能やサーフェスなし
- **non-capability** — ツール/コマンド/サービスはあるが機能なし

機能モデルの詳細については [Plugin shapes](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

`--json` フラグは、スクリプトや監査に適した機械可読レポートを出力します。

`inspect --all` は、shape、capability kind、互換性通知、バンドル機能、およびフック概要の列を含む全体テーブルを表示します。

`info` は `inspect` のエイリアスです。

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は、Pluginの読み込みエラー、マニフェスト/検出diagnostics、および互換性通知を報告します。問題がない場合は `No plugin issues detected.` と表示します。

`register`/`activate` エクスポートの欠落のようなモジュール形状の失敗については、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を付けて再実行すると、diagnostic出力にコンパクトなエクスポート形状の要約が含まれます。

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

マーケットプレイス一覧では、ローカルのマーケットプレイスパス、`marketplace.json` のパス、`owner/repo` のようなGitHub短縮表記、GitHubリポジトリURL、またはgit URLを受け付けます。`--json` は、解決されたソースラベルに加え、解析済みのマーケットプレイスマニフェストとPluginエントリを出力します。

## 関連

- [CLIリファレンス](/ja-JP/cli)
- [Pluginのビルド](/ja-JP/plugins/building-plugins)
- [コミュニティPlugin](/ja-JP/plugins/community)
