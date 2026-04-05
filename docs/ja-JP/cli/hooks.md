---
read_when:
    - エージェントフックを管理したい
    - フックの利用可否を確認したい、またはワークスペースフックを有効化したい
summary: '`openclaw hooks` の CLI リファレンス（エージェントフック）'
title: hooks
x-i18n:
    generated_at: "2026-04-05T12:39:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dc9144e9844e9c3cdef2514098eb170543746fcc55ca5a1cc746c12d80209e7
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

エージェントフックを管理します（`/new`、`/reset`、Gateway 起動などのコマンドに対するイベント駆動の自動化）。

サブコマンドなしで `openclaw hooks` を実行すると、`openclaw hooks list` と同等です。

関連:

- フック: [Hooks](/automation/hooks)
- プラグインフック: [Plugin hooks](/plugins/architecture#provider-runtime-hooks)

## すべてのフックを一覧表示

```bash
openclaw hooks list
```

workspace、managed、extra、bundled ディレクトリから検出されたすべてのフックを一覧表示します。

**オプション:**

- `--eligible`: 利用可能なフックのみを表示します（要件を満たしているもの）
- `--json`: JSON として出力します
- `-v, --verbose`: 不足している要件を含む詳細情報を表示します

**出力例:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**例（verbose）:**

```bash
openclaw hooks list --verbose
```

利用可能でないフックについて、不足している要件を表示します。

**例（JSON）:**

```bash
openclaw hooks list --json
```

プログラムで利用できる構造化 JSON を返します。

## フック情報を取得

```bash
openclaw hooks info <name>
```

特定のフックの詳細情報を表示します。

**引数:**

- `<name>`: フック名またはフックキー（例: `session-memory`）

**オプション:**

- `--json`: JSON として出力します

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

## フックの利用可否を確認

```bash
openclaw hooks check
```

フックの利用可否ステータスの概要（利用可能な数と利用不可の数）を表示します。

**オプション:**

- `--json`: JSON として出力します

**出力例:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## フックを有効化

```bash
openclaw hooks enable <name>
```

特定のフックを設定に追加して有効化します（デフォルトでは `~/.openclaw/openclaw.json`）。

**注意:** ワークスペースフックは、ここまたは設定で有効化するまでデフォルトで無効です。プラグインが管理するフックは `openclaw hooks list` に `plugin:<id>` と表示され、ここでは有効化/無効化できません。代わりにプラグイン自体を有効化/無効化してください。

**引数:**

- `<name>`: フック名（例: `session-memory`）

**例:**

```bash
openclaw hooks enable session-memory
```

**出力:**

```
✓ Enabled hook: 💾 session-memory
```

**動作:**

- フックが存在し、利用可能であることを確認します
- 設定内の `hooks.internal.entries.<name>.enabled = true` を更新します
- 設定をディスクに保存します

フックが `<workspace>/hooks/` から来ている場合、このオプトイン手順は
Gateway がそれを読み込む前に必須です。

**有効化後:**

- フックを再読み込みするために Gateway を再起動してください（macOS ではメニューバーアプリを再起動、開発環境では Gateway プロセスを再起動）。

## フックを無効化

```bash
openclaw hooks disable <name>
```

特定のフックを設定更新によって無効化します。

**引数:**

- `<name>`: フック名（例: `command-logger`）

**例:**

```bash
openclaw hooks disable command-logger
```

**出力:**

```
⏸ Disabled hook: 📝 command-logger
```

**無効化後:**

- フックを再読み込みするために Gateway を再起動してください

## 注意事項

- `openclaw hooks list --json`、`info --json`、`check --json` は、構造化 JSON を直接 stdout に書き出します。
- プラグイン管理のフックはここでは有効化または無効化できません。代わりに所有しているプラグインを有効化または無効化してください。

## フックパックをインストール

```bash
openclaw plugins install <package>        # まず ClawHub、次に npm
openclaw plugins install <package> --pin  # バージョン固定
openclaw plugins install <path>           # ローカルパス
```

統一された plugins インストーラーを通じてフックパックをインストールします。

`openclaw hooks install` も互換エイリアスとして引き続き動作しますが、非推奨警告を表示し、
`openclaw plugins install` に転送されます。

npm spec は **レジストリ専用** です（パッケージ名 + オプションで **正確なバージョン** または
**dist-tag**）。Git/URL/file spec と semver 範囲は拒否されます。依存関係の
インストールは安全のため `--ignore-scripts` 付きで実行されます。

プレーン spec と `@latest` は安定トラックのままです。npm がこれらのいずれかを
プレリリースに解決した場合、OpenClaw は停止し、`@beta`/`@rc` のような
プレリリースタグまたは正確なプレリリースバージョンで明示的にオプトインするよう求めます。

**動作:**

- フックパックを `~/.openclaw/hooks/<id>` にコピーします
- インストールされたフックを `hooks.internal.entries.*` で有効化します
- インストールを `hooks.internal.installs` に記録します

**オプション:**

- `-l, --link`: コピーの代わりにローカルディレクトリをリンクします（`hooks.internal.load.extraDirs` に追加します）
- `--pin`: npm インストールを、解決済みの正確な `name@version` として `hooks.internal.installs` に記録します

**サポートされるアーカイブ:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**例:**

```bash
# ローカルディレクトリ
openclaw plugins install ./my-hook-pack

# ローカルアーカイブ
openclaw plugins install ./my-hook-pack.zip

# NPM パッケージ
openclaw plugins install @openclaw/my-hook-pack

# コピーせずにローカルディレクトリをリンク
openclaw plugins install -l ./my-hook-pack
```

リンクされたフックパックは、ワークスペースフックではなく、
オペレーター設定ディレクトリからの managed フックとして扱われます。

## フックパックを更新

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

統一された plugins アップデーターを通じて、追跡対象の npm ベースのフックパックを更新します。

`openclaw hooks update` も互換エイリアスとして引き続き動作しますが、非推奨警告を表示し、
`openclaw plugins update` に転送されます。

**オプション:**

- `--all`: 追跡対象のすべてのフックパックを更新します
- `--dry-run`: 書き込みを行わず、何が変わるかを表示します

保存済みの整合性ハッシュが存在し、取得したアーティファクトハッシュが変化している場合、
OpenClaw は警告を表示し、続行前に確認を求めます。CI/非対話実行でプロンプトを回避するには、
グローバル `--yes` を使用してください。

## バンドルされたフック

### session-memory

`/new` または `/reset` を実行したときに、セッションコンテキストをメモリに保存します。

**有効化:**

```bash
openclaw hooks enable session-memory
```

**出力:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**参照:** [session-memory documentation](/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` 中に追加の bootstrap ファイル（たとえばモノレポローカルの `AGENTS.md` / `TOOLS.md`）を注入します。

**有効化:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**参照:** [bootstrap-extra-files documentation](/automation/hooks#bootstrap-extra-files)

### command-logger

すべてのコマンドイベントを一元化された監査ファイルに記録します。

**有効化:**

```bash
openclaw hooks enable command-logger
```

**出力:** `~/.openclaw/logs/commands.log`

**ログの表示:**

```bash
# 最近のコマンド
tail -n 20 ~/.openclaw/logs/commands.log

# 整形表示
cat ~/.openclaw/logs/commands.log | jq .

# アクションでフィルター
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**参照:** [command-logger documentation](/automation/hooks#command-logger)

### boot-md

Gateway 起動時（チャネル起動後）に `BOOT.md` を実行します。

**イベント**: `gateway:startup`

**有効化**:

```bash
openclaw hooks enable boot-md
```

**参照:** [boot-md documentation](/automation/hooks#boot-md)
