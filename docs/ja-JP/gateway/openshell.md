---
read_when:
    - ローカル Docker ではなくクラウド管理の sandbox を使いたい
    - OpenShell プラグインをセットアップしている
    - mirror と remote のワークスペースモードのどちらを選ぶべきか判断したい
summary: OpenClaw エージェント向けの管理された sandbox バックエンドとして OpenShell を使用する
title: OpenShell
x-i18n:
    generated_at: "2026-04-05T12:44:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: aaf9027d0632a70fb86455f8bc46dc908ff766db0eb0cdf2f7df39c715241ead
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell は OpenClaw 用の管理された sandbox バックエンドです。Docker
コンテナーをローカルで実行する代わりに、OpenClaw は sandbox のライフサイクルを `openshell` CLI に委任し、
それが SSH ベースのコマンド実行を備えたリモート環境をプロビジョニングします。

OpenShell プラグインは、汎用の [SSH backend](/gateway/sandboxing#ssh-backend) と同じコア SSH 転送とリモートファイルシステム
ブリッジを再利用します。これに OpenShell 固有のライフサイクル（`sandbox create/get/delete`、`sandbox ssh-config`）
と、任意の `mirror` ワークスペースモードを追加します。

## 前提条件

- `openshell` CLI がインストールされていて `PATH` 上にあること（または
  `plugins.entries.openshell.config.command` でカスタムパスを設定すること）
- sandbox アクセス権のある OpenShell アカウント
- ホスト上で OpenClaw Gateway が実行中であること

## クイックスタート

1. プラグインを有効にし、sandbox バックエンドを設定します:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Gateway を再起動します。次のエージェントターンで、OpenClaw は OpenShell
   sandbox を作成し、ツール実行をそこ経由にルーティングします。

3. 確認します:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## ワークスペースモード

これは、OpenShell を使うときの最も重要な判断です。

### `mirror`

**ローカル
ワークスペースを正本のまま保ちたい**場合は、`plugins.entries.openshell.config.mode: "mirror"` を使います。

動作:

- `exec` の前に、OpenClaw はローカルワークスペースを OpenShell sandbox に同期します。
- `exec` の後に、OpenClaw はリモートワークスペースをローカルワークスペースへ同期し戻します。
- ファイルツールは引き続き sandbox ブリッジ経由で動作しますが、ターン間ではローカルワークスペース
  が正本のままです。

最適なケース:

- OpenClaw の外でローカルにファイルを編集し、その変更を
  sandbox に自動的に反映させたい。
- OpenShell sandbox を Docker バックエンドにできるだけ近い形で動作させたい。
- 各 exec ターン後に、ホストワークスペースへ sandbox の書き込みを反映させたい。

トレードオフ: 各 exec の前後で追加の同期コストがかかります。

### `remote`

**OpenShell ワークスペースを正本にしたい**場合は、`plugins.entries.openshell.config.mode: "remote"` を使います。

動作:

- sandbox が最初に作成されるとき、OpenClaw はローカルワークスペースから
  リモートワークスペースへ 1 回だけシードします。
- その後は、`exec`、`read`、`write`、`edit`、`apply_patch` が
  リモートの OpenShell ワークスペースに対して直接動作します。
- OpenClaw はリモート側の変更をローカルワークスペースへ同期し戻しません。
- プロンプト時のメディア読み取りは、ファイルツールとメディアツールが sandbox ブリッジ経由で読むため、引き続き動作します。

最適なケース:

- ワークスペースを主にリモート側で運用したい。
- ターンごとの同期オーバーヘッドを低くしたい。
- ホスト側ローカル編集でリモート sandbox の状態が暗黙に上書きされるのを避けたい。

重要: 初回シード後に OpenClaw の外でホスト上のファイルを編集しても、
リモート sandbox にはその変更は反映されません。再シードするには
`openclaw sandbox recreate` を使ってください。

### モードの選び方

|                          | `mirror`                     | `remote`                  |
| ------------------------ | ---------------------------- | ------------------------- |
| **正本ワークスペース**   | ローカルホスト               | リモート OpenShell        |
| **同期方向**             | 双方向（各 exec ごと）       | 初回シードのみ            |
| **ターンごとの負荷**     | 高い（アップロード + ダウンロード） | 低い（直接リモート操作） |
| **ローカル編集は見えるか** | はい、次の exec で反映       | いいえ、recreate まで反映されない |
| **最適な用途**           | 開発ワークフロー             | 長時間実行エージェント、CI |

## 設定リファレンス

OpenShell の設定はすべて `plugins.entries.openshell.config` 配下にあります:

| Key                       | Type                     | Default       | 説明 |
| ------------------------- | ------------------------ | ------------- | ---- |
| `mode`                    | `"mirror"` or `"remote"` | `"mirror"`    | ワークスペース同期モード |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI のパスまたは名前 |
| `from`                    | `string`                 | `"openclaw"`  | 初回 create 時の sandbox ソース |
| `gateway`                 | `string`                 | —             | OpenShell Gateway 名（`--gateway`） |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell Gateway エンドポイント URL（`--gateway-endpoint`） |
| `policy`                  | `string`                 | —             | sandbox 作成用の OpenShell ポリシー ID |
| `providers`               | `string[]`               | `[]`          | sandbox 作成時にアタッチするプロバイダー名 |
| `gpu`                     | `boolean`                | `false`       | GPU リソースを要求する |
| `autoProviders`           | `boolean`                | `true`        | sandbox create 時に `--auto-providers` を渡す |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | sandbox 内の主要な書き込み可能ワークスペース |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | エージェントワークスペースのマウントパス（読み取り専用アクセス用） |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI 操作のタイムアウト |

sandbox レベルの設定（`mode`、`scope`、`workspaceAccess`）は、他のバックエンドと同様に
`agents.defaults.sandbox` 配下で設定します。完全な対応表については
[Sandboxing](/gateway/sandboxing) を参照してください。

## 例

### 最小の remote セットアップ

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### GPU ありの mirror モード

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### カスタム Gateway を使うエージェント単位の OpenShell

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## ライフサイクル管理

OpenShell sandbox は通常の sandbox CLI で管理されます:

```bash
# すべての sandbox ランタイムを一覧表示（Docker + OpenShell）
openclaw sandbox list

# 有効なポリシーを確認
openclaw sandbox explain

# recreate（リモートワークスペースを削除し、次回利用時に再シード）
openclaw sandbox recreate --all
```

`remote` モードでは、**recreate が特に重要**です。これは、そのスコープの正本である
リモートワークスペースを削除します。次回利用時に、ローカルワークスペースから
新しいリモートワークスペースがシードされます。

`mirror` モードでは、ローカルワークスペースが正本のままであるため、recreate は主に
リモート実行環境をリセットする用途になります。

### recreate すべきタイミング

以下のいずれかを変更した後は recreate してください:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## 現在の制限

- sandbox browser は OpenShell バックエンドではサポートされていません。
- `sandbox.docker.binds` は OpenShell には適用されません。
- `sandbox.docker.*` 配下の Docker 固有ランタイム設定は、Docker
  バックエンドにのみ適用されます。

## 仕組み

1. OpenClaw は `openshell sandbox create` を呼び出します（設定に応じて `--from`、`--gateway`、
   `--policy`、`--providers`、`--gpu` フラグ付き）。
2. OpenClaw は `openshell sandbox ssh-config <name>` を呼び出して、sandbox の SSH 接続
   詳細を取得します。
3. コアは SSH 設定を一時ファイルに書き込み、汎用 SSH バックエンドと同じ
   リモートファイルシステムブリッジを使って SSH セッションを開きます。
4. `mirror` モードでは: exec の前にローカルからリモートへ同期し、実行し、exec 後に同期し戻します。
5. `remote` モードでは: create 時に 1 回だけシードし、その後はリモート
   ワークスペースに対して直接操作します。

## 関連項目

- [Sandboxing](/gateway/sandboxing) -- モード、スコープ、バックエンド比較
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- ブロックされたツールのデバッグ
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- エージェントごとの上書き
- [Sandbox CLI](/cli/sandbox) -- `openclaw sandbox` コマンド
