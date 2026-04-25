---
read_when:
    - agent hooksを管理したい場合
    - hookの利用可否を確認したり、workspace hooksを有効にしたりしたい場合
summary: '`openclaw hooks`（agent hooks）のCLIリファレンス'
title: Hooks
x-i18n:
    generated_at: "2026-04-25T13:44:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd84cc984b24996c5509ce6b69f9bb76c61c4fa65b002809fdf5776abe67b48b
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

agent hooks（`/new`、`/reset`、Gateway起動などのコマンド向けイベント駆動オートメーション）を管理します。

サブコマンドなしで`openclaw hooks`を実行すると、`openclaw hooks list`と同等です。

関連:

- Hooks: [Hooks](/ja-JP/automation/hooks)
- Plugin hooks: [Plugin hooks](/ja-JP/plugins/hooks)

## すべてのhookを一覧表示

```bash
openclaw hooks list
```

workspace、managed、extra、bundledディレクトリから見つかったすべてのhookを一覧表示します。  
Gateway起動時には、少なくとも1つのinternal hookが設定されるまで、internal hook handlerは読み込まれません。

**オプション:**

- `--eligible`: 対象条件を満たすhookのみ表示
- `--json`: JSONとして出力
- `-v, --verbose`: 不足している要件を含む詳細情報を表示

**出力例:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**例（詳細表示）:**

```bash
openclaw hooks list --verbose
```

対象条件を満たさないhookについて、不足している要件を表示します。

**例（JSON）:**

```bash
openclaw hooks list --json
```

プログラム利用向けに構造化JSONを返します。

## hook情報を取得

```bash
openclaw hooks info <name>
```

特定のhookの詳細情報を表示します。

**引数:**

- `<name>`: hook名またはhookキー（例: `session-memory`）

**オプション:**

- `--json`: JSONとして出力

**例:**

```bash
openclaw hooks info session-memory
```

**出力:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## hookの対象条件を確認

```bash
openclaw hooks check
```

hookの対象条件ステータスの概要（readyとnot readyの件数）を表示します。

**オプション:**

- `--json`: JSONとして出力

**出力例:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## hookを有効化

```bash
openclaw hooks enable <name>
```

特定のhookをconfig（デフォルトでは`~/.openclaw/openclaw.json`）に追加して有効化します。

**注:** workspace hooksは、ここまたはconfigで有効化するまでデフォルトで無効です。pluginが管理するhookは`openclaw hooks list`で`plugin:<id>`と表示され、ここでは有効化/無効化できません。代わりにpluginを有効化/無効化してください。

**引数:**

- `<name>`: hook名（例: `session-memory`）

**例:**

```bash
openclaw hooks enable session-memory
```

**出力:**

```
✓ Enabled hook: 💾 session-memory
```

**実行内容:**

- hookが存在し、対象条件を満たしているか確認
- config内の`hooks.internal.entries.<name>.enabled = true`を更新
- configをディスクに保存

hookが`<workspace>/hooks/`由来の場合、Gatewayがそれを読み込むには、このオプトイン手順が必要です。

**有効化後:**

- hookを再読み込みするためにGatewayを再起動してください（macOSではメニューバーアプリを再起動するか、devではgatewayプロセスを再起動します）。

## hookを無効化

```bash
openclaw hooks disable <name>
```

特定のhookをconfig更新によって無効化します。

**引数:**

- `<name>`: hook名（例: `command-logger`）

**例:**

```bash
openclaw hooks disable command-logger
```

**出力:**

```
⏸ Disabled hook: 📝 command-logger
```

**無効化後:**

- hookを再読み込みするためにGatewayを再起動してください

## 注意

- `openclaw hooks list --json`、`info --json`、`check --json`は、構造化JSONを直接stdoutへ書き出します。
- plugin管理hookはここでは有効化または無効化できません。代わりに所有pluginを有効化または無効化してください。

## hook packをインストール

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

統一されたpluginsインストーラーを通じてhook packをインストールします。

`openclaw hooks install`も互換エイリアスとして引き続き使えますが、非推奨警告を表示して`openclaw plugins install`へ転送します。

npm指定は**registry-only**です（パッケージ名 + 任意の**正確なversion**または**dist-tag**）。Git/URL/file指定とsemver rangeは拒否されます。依存関係のインストールは、安全のため`--ignore-scripts`付きで実行されます。

素の指定および`@latest`はstableトラックに留まります。npmがそれらのいずれかをprereleaseに解決した場合、OpenClawは停止し、`@beta`/`@rc`のようなprerelease tagまたは正確なprerelease versionで明示的にオプトインするよう求めます。

**実行内容:**

- hook packを`~/.openclaw/hooks/<id>`にコピー
- インストールしたhookを`hooks.internal.entries.*`で有効化
- インストール内容を`hooks.internal.installs`に記録

**オプション:**

- `-l, --link`: ローカルディレクトリをコピーせずリンクします（`hooks.internal.load.extraDirs`に追加）
- `--pin`: npmインストールを、解決済みの正確な`name@version`として`hooks.internal.installs`に記録

**対応アーカイブ:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**例:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

リンクされたhook packは、workspace hooksではなく、オペレーター設定ディレクトリからのmanaged hooksとして扱われます。

## hook packを更新

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

統一されたpluginsアップデーターを通じて、追跡中のnpmベースhook packを更新します。

`openclaw hooks update`も互換エイリアスとして引き続き使えますが、非推奨警告を表示して`openclaw plugins update`へ転送します。

**オプション:**

- `--all`: 追跡中のすべてのhook packを更新
- `--dry-run`: 書き込まずに何が変わるかを表示

保存済みintegrity hashが存在し、取得したartifact hashが変化している場合、OpenClawは警告を表示し、続行前に確認を求めます。CI/非対話実行でプロンプトを回避するには、グローバル`--yes`を使用してください。

## バンドルされたHooks

### session-memory

`/new`または`/reset`を実行したときに、セッションコンテキストをmemoryへ保存します。

**有効化:**

```bash
openclaw hooks enable session-memory
```

**出力:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**参照:** [session-memory documentation](/ja-JP/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap`中に、追加のbootstrapファイル（たとえばmonorepoローカルの`AGENTS.md` / `TOOLS.md`）を注入します。

**有効化:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**参照:** [bootstrap-extra-files documentation](/ja-JP/automation/hooks#bootstrap-extra-files)

### command-logger

すべてのコマンドイベントを一元化された監査ファイルに記録します。

**有効化:**

```bash
openclaw hooks enable command-logger
```

**出力:** `~/.openclaw/logs/commands.log`

**ログを表示:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**参照:** [command-logger documentation](/ja-JP/automation/hooks#command-logger)

### boot-md

Gateway起動時（channel起動後）に`BOOT.md`を実行します。

**イベント**: `gateway:startup`

**有効化**:

```bash
openclaw hooks enable boot-md
```

**参照:** [boot-md documentation](/ja-JP/automation/hooks#boot-md)

## 関連

- [CLI reference](/ja-JP/cli)
- [Automation hooks](/ja-JP/automation/hooks)
