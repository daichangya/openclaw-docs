---
read_when:
    - ローカルの OpenClaw 状態に対する正式なバックアップアーカイブが欲しいとき
    - リセットやアンインストールの前に、どのパスが含まれるかを事前確認したいとき
summary: '`openclaw backup` の CLI リファレンス（ローカルバックアップアーカイブの作成）'
title: backup
x-i18n:
    generated_at: "2026-04-05T12:38:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 700eda8f9eac1cc93a854fa579f128e5e97d4e6dfc0da75b437c0fb2a898a37d
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

OpenClaw の状態、config、認証プロファイル、チャネル/プロバイダー認証情報、セッション、および必要に応じてワークスペースのためのローカルバックアップアーカイブを作成します。

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## 注記

- アーカイブには、解決済みのソースパスとアーカイブレイアウトを含む `manifest.json` ファイルが含まれます。
- デフォルト出力は、現在の作業ディレクトリに作成されるタイムスタンプ付きの `.tar.gz` アーカイブです。
- 現在の作業ディレクトリがバックアップ対象のソースツリー内にある場合、OpenClaw はデフォルトのアーカイブ保存先としてホームディレクトリにフォールバックします。
- 既存のアーカイブファイルは上書きされません。
- ソースの state/workspace ツリー内にある出力パスは、自己包含を避けるため拒否されます。
- `openclaw backup verify <archive>` は、アーカイブにルート manifest がちょうど 1 つ含まれていることを検証し、トラバーサル形式のアーカイブパスを拒否し、manifest で宣言されたすべてのペイロードが tarball 内に存在することを確認します。
- `openclaw backup create --verify` は、アーカイブ書き込み直後にその検証を実行します。
- `openclaw backup create --only-config` は、アクティブな JSON config ファイルだけをバックアップします。

## バックアップされる内容

`openclaw backup create` は、ローカルの OpenClaw インストールからバックアップ対象のソースを計画します。

- OpenClaw のローカル state resolver が返す状態ディレクトリ（通常は `~/.openclaw`）
- アクティブな config ファイルパス
- 状態ディレクトリの外に存在する場合の、解決済み `credentials/` ディレクトリ
- 現在の config から見つかったワークスペースディレクトリ（`--no-include-workspace` を渡さない限り）

モデル認証プロファイルは、すでに状態ディレクトリ内の
`agents/<agentId>/agent/auth-profiles.json` に含まれているため、通常は
state バックアップ項目でカバーされます。

`--only-config` を使う場合、OpenClaw は状態、認証情報ディレクトリ、ワークスペース検出をスキップし、アクティブな config ファイルパスのみをアーカイブします。

OpenClaw は、アーカイブ構築前にパスを正規化します。config、
認証情報ディレクトリ、またはワークスペースがすでに状態ディレクトリ内にある場合、
それらは別個のトップレベルバックアップソースとして重複しません。存在しないパスは
スキップされます。

アーカイブのペイロードには、それらのソースツリーからのファイル内容が保存され、埋め込まれた `manifest.json` には、解決済みの絶対ソースパスと各アセットに使用されたアーカイブレイアウトが記録されます。

## 無効な config の動作

`openclaw backup` は、復旧時にも役立つように、通常の config 事前チェックを意図的にバイパスします。ただし、ワークスペース検出は有効な config に依存するため、config ファイルが存在していて無効であり、かつワークスペースバックアップが有効のままである場合、`openclaw backup create` は即座に失敗します。

その状況でも部分バックアップを行いたい場合は、次を再実行してください。

```bash
openclaw backup create --no-include-workspace
```

これにより、ワークスペース検出全体をスキップしつつ、state、config、および外部認証情報ディレクトリは対象に含まれます。

config ファイル自体のコピーだけが必要であれば、`--only-config` も config が不正な場合に使えます。これはワークスペース検出のために config の解析に依存しないためです。

## サイズとパフォーマンス

OpenClaw は、組み込みのバックアップ最大サイズやファイルごとのサイズ上限を強制しません。

実際の制限は、ローカルマシンと保存先ファイルシステムによって決まります。

- 一時アーカイブ書き込みと最終アーカイブのための空き容量
- 大きなワークスペースツリーを走査して `.tar.gz` に圧縮する時間
- `openclaw backup create --verify` を使う場合、または `openclaw backup verify` を実行する場合にアーカイブを再走査する時間
- 保存先パスのファイルシステム挙動。OpenClaw は上書きしないハードリンク公開ステップを優先し、ハードリンクがサポートされない場合は排他的コピーにフォールバックします

大きなワークスペースは通常、アーカイブサイズの主な要因です。より小さい、またはより高速なバックアップが必要な場合は、`--no-include-workspace` を使用してください。

最小のアーカイブが必要な場合は、`--only-config` を使用してください。
