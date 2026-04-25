---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'OpenClaw の sandboxing の仕組み: モード、スコープ、ワークスペースアクセス、イメージ'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-25T13:49:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f22778690a4d41033c7abf9e97d54e53163418f8d45f1a816ce2be9d124fedf
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw は**sandbox backend 内でツールを実行**して、影響範囲を小さくできます。
これは**任意機能**で、設定（`agents.defaults.sandbox` または
`agents.list[].sandbox`）によって制御されます。sandboxing がオフの場合、ツールはホスト上で実行されます。
Gateway 自体はホスト上に残り、ツール実行だけが、有効時に分離された sandbox 内で動作します。

これは完全なセキュリティ境界ではありませんが、モデルが何かまずいことをしたときの
ファイルシステムやプロセスへのアクセスを実質的に制限します。

## sandbox 化されるもの

- ツール実行（`exec`、`read`、`write`、`edit`、`apply_patch`、`process` など）。
- 任意の sandbox 化された browser（`agents.defaults.sandbox.browser`）。
  - デフォルトでは、browser ツールが必要とすると sandbox browser は自動起動し（CDP 到達性を確保）、利用可能にします。
    `agents.defaults.sandbox.browser.autoStart` と `agents.defaults.sandbox.browser.autoStartTimeoutMs` で設定します。
  - デフォルトでは、sandbox browser コンテナはグローバル `bridge` ネットワークではなく、専用の Docker ネットワーク（`openclaw-sandbox-browser`）を使います。
    `agents.defaults.sandbox.browser.network` で設定します。
  - 任意の `agents.defaults.sandbox.browser.cdpSourceRange` では、CIDR 許可リスト（たとえば `172.21.0.1/32`）でコンテナ境界の CDP ingress を制限できます。
  - noVNC の observer アクセスはデフォルトでパスワード保護されます。OpenClaw は短寿命のトークン URL を発行し、ローカル bootstrap ページを配信して、URL フラグメント内のパスワード付きで noVNC を開きます（クエリ/ヘッダーログには残りません）。
  - `agents.defaults.sandbox.browser.allowHostControl` を使うと、sandbox 化されたセッションがホスト browser を明示的にターゲットにできます。
  - 任意の許可リストで `target: "custom"` を制御できます: `allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

sandbox 化されないもの:

- Gateway プロセス自体。
- 明示的に sandbox 外実行を許可されたツール（たとえば `tools.elevated`）。
  - **Elevated exec は sandboxing をバイパスし、設定された escape path（デフォルトは `gateway`、exec ターゲットが `node` の場合は `node`）を使います。**
  - sandboxing がオフなら、`tools.elevated` は実行方法を変えません（すでにホスト上）。[Elevated Mode](/ja-JP/tools/elevated) を参照してください。

## モード

`agents.defaults.sandbox.mode` は、sandboxing を**いつ**使うかを制御します。

- `"off"`: sandboxing なし。
- `"non-main"`: **メイン以外**のセッションだけを sandbox 化（通常チャットはホスト上にしたい場合のデフォルト）。
- `"all"`: すべてのセッションを sandbox 内で実行。
  注意: `"non-main"` は agent id ではなく `session.mainKey`（デフォルト `"main"`）基準です。
  グループ/チャネルセッションは独自の key を使うため、non-main とみなされ sandbox 化されます。

## スコープ

`agents.defaults.sandbox.scope` は、コンテナを**いくつ**作るかを制御します。

- `"agent"`（デフォルト）: agent ごとに 1 コンテナ。
- `"session"`: セッションごとに 1 コンテナ。
- `"shared"`: sandbox 化されたすべてのセッションで 1 コンテナを共有。

## バックエンド

`agents.defaults.sandbox.backend` は、どのランタイムが sandbox を提供するかを制御します。

- `"docker"`（sandboxing 有効時のデフォルト）: ローカル Docker ベースの sandbox ランタイム。
- `"ssh"`: 汎用 SSH ベースのリモート sandbox ランタイム。
- `"openshell"`: OpenShell ベースの sandbox ランタイム。

SSH 固有の設定は `agents.defaults.sandbox.ssh` 配下にあります。
OpenShell 固有の設定は `plugins.entries.openshell.config` 配下にあります。

### バックエンドの選び方

|                     | Docker                           | SSH                            | OpenShell                                       |
| ------------------- | -------------------------------- | ------------------------------ | ----------------------------------------------- |
| **実行場所**        | ローカルコンテナ                 | SSH アクセス可能な任意のホスト | OpenShell 管理の sandbox                        |
| **セットアップ**    | `scripts/sandbox-setup.sh`       | SSH キー + 対象ホスト          | OpenShell Plugin を有効化                       |
| **ワークスペースモデル** | bind-mount または copy       | remote-canonical（1 回シード） | `mirror` または `remote`                        |
| **ネットワーク制御** | `docker.network`（デフォルト: none） | リモートホストに依存      | OpenShell に依存                                |
| **browser sandbox** | サポートあり                     | 非対応                         | まだ非対応                                      |
| **bind mount**      | `docker.binds`                   | N/A                            | N/A                                             |
| **最適な用途**      | ローカル開発、完全な分離         | リモートマシンへのオフロード   | 任意の双方向同期を備えた管理型リモート sandbox |

### Docker バックエンド

sandboxing はデフォルトでオフです。sandboxing を有効にしてバックエンドを選ばない場合、
OpenClaw は Docker バックエンドを使います。ツールと sandbox browser は
Docker daemon socket（`/var/run/docker.sock`）経由でローカル実行されます。sandbox コンテナの
分離は Docker namespace によって決まります。

**Docker-out-of-Docker（DooD）の制約**:
OpenClaw Gateway 自体を Docker コンテナとしてデプロイする場合、それはホストの Docker socket を使って兄弟 sandbox コンテナをオーケストレーションします（DooD）。これには固有のパスマッピング制約があります。

- **config にはホストパスが必要**: `openclaw.json` の `workspace` 設定には、Gateway コンテナ内のパスではなく、**ホスト上の絶対パス**（例: `/home/user/.openclaw/workspaces`）を設定しなければなりません。OpenClaw が Docker daemon に sandbox 起動を依頼すると、daemon はパスを Gateway 名前空間ではなくホスト OS 名前空間基準で評価します。
- **FS bridge の整合性（同一ボリュームマップ）**: OpenClaw Gateway のネイティブプロセスも、`workspace` ディレクトリに heartbeat と bridge ファイルを書き込みます。Gateway も、コンテナ化された自身の環境内からまったく同じ文字列（ホストパス）を評価するため、Gateway デプロイにはホスト名前空間をネイティブに結びつける同一のボリュームマップ（`-v /home/user/.openclaw:/home/user/.openclaw`）を含める必要があります。

絶対ホストパスとの整合なしに内部パスだけをマッピングすると、その完全修飾パス文字列がコンテナ内でネイティブに存在しないため、OpenClaw はコンテナ環境内で heartbeat を書き込もうとして `EACCES` 権限エラーをネイティブに投げます。

### SSH バックエンド

任意の SSH アクセス可能マシン上で `exec`、ファイルツール、メディア読み取りを
sandbox 化したい場合は `backend: "ssh"` を使ってください。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // またはローカルファイルの代わりに SecretRef / インライン内容を使用:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

仕組み:

- OpenClaw は `sandbox.ssh.workspaceRoot` 配下にスコープごとのリモート root を作成します。
- 作成または再作成後の初回利用時に、OpenClaw はローカルワークスペースからそのリモートワークスペースへ 1 回だけシードします。
- その後、`exec`、`read`、`write`、`edit`、`apply_patch`、プロンプトメディア読み取り、受信メディア staging は SSH 経由でリモートワークスペースに対して直接実行されます。
- OpenClaw はリモート変更をローカルワークスペースへ自動同期しません。

認証素材:

- `identityFile`、`certificateFile`、`knownHostsFile`: 既存のローカルファイルを使い、OpenSSH config 経由で渡します。
- `identityData`、`certificateData`、`knownHostsData`: インライン文字列または SecretRef を使います。OpenClaw は通常の secrets ランタイムスナップショット経由でそれらを解決し、`0600` の一時ファイルに書き出し、SSH セッション終了時に削除します。
- 同じ項目に `*File` と `*Data` の両方が設定されている場合、その SSH セッションでは `*Data` が優先されます。

これは**remote-canonical** モデルです。初期シード後は、リモート SSH ワークスペースが実際の sandbox 状態になります。

重要な結果:

- シード後に OpenClaw 外で行ったホストローカル編集は、sandbox を再作成するまでリモートには反映されません。
- `openclaw sandbox recreate` はスコープごとのリモート root を削除し、次回利用時にローカルから再シードします。
- browser sandboxing は SSH バックエンドではサポートされません。
- `sandbox.docker.*` 設定は SSH バックエンドには適用されません。

### OpenShell バックエンド

OpenShell 管理のリモート環境でツールを sandbox 化したい場合は、
`backend: "openshell"` を使ってください。完全なセットアップガイド、設定
リファレンス、ワークスペースモード比較については、専用の
[OpenShell page](/ja-JP/gateway/openshell) を参照してください。

OpenShell は、汎用 SSH バックエンドと同じコア SSH トランスポートとリモートファイルシステム bridge を再利用し、
OpenShell 固有のライフサイクル
（`sandbox create/get/delete`、`sandbox ssh-config`）と任意の `mirror`
ワークスペースモードを追加します。

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
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

OpenShell モード:

- `mirror`（デフォルト）: ローカルワークスペースが正本のままです。OpenClaw は exec 前にローカルファイルを OpenShell に同期し、exec 後にリモートワークスペースを同期して戻します。
- `remote`: sandbox 作成後は OpenShell ワークスペースが正本になります。OpenClaw はローカルワークスペースからリモートワークスペースへ 1 回だけシードし、その後は変更を戻さずに、ファイルツールと exec をリモート sandbox に対して直接実行します。

リモートトランスポート詳細:

- OpenClaw は `openshell sandbox ssh-config <name>` を通じて、sandbox 固有の SSH config を OpenShell に要求します。
- コアはその SSH config を一時ファイルに書き込み、SSH セッションを開き、`backend: "ssh"` で使われるのと同じリモートファイルシステム bridge を再利用します。
- `mirror` モードのみライフサイクルが異なります: exec 前にローカルからリモートへ同期し、その後で同期して戻します。

現在の OpenShell の制限:

- sandbox browser はまだ非対応
- `sandbox.docker.binds` は OpenShell バックエンドではサポートされません
- `sandbox.docker.*` 配下の Docker 固有ランタイムノブは、引き続き Docker バックエンドにのみ適用されます

#### ワークスペースモード

OpenShell には 2 つのワークスペースモデルがあります。実運用で最も重要なのはこの部分です。

##### `mirror`

**ローカルワークスペースを正本のまま保ちたい**場合は `plugins.entries.openshell.config.mode: "mirror"` を使ってください。

動作:

- `exec` の前に、OpenClaw はローカルワークスペースを OpenShell sandbox へ同期します。
- `exec` の後に、OpenClaw はリモートワークスペースをローカルワークスペースへ同期して戻します。
- ファイルツールは引き続き sandbox bridge 経由で動作しますが、ターン間ではローカルワークスペースが source of truth のままです。

このモードが向いているケース:

- OpenClaw 外でローカルにファイル編集し、それを sandbox に自動反映したい
- OpenShell sandbox をできるだけ Docker バックエンドに近い振る舞いにしたい
- 各 exec turn の後で、ホストワークスペースに sandbox の書き込みを反映したい

トレードオフ:

- exec の前後で追加の同期コストがかかる

##### `remote`

**OpenShell ワークスペースを正本にしたい**場合は `plugins.entries.openshell.config.mode: "remote"` を使ってください。

動作:

- sandbox が最初に作成されるとき、OpenClaw はローカルワークスペースからリモートワークスペースへ 1 回だけシードします。
- その後、`exec`、`read`、`write`、`edit`、`apply_patch` はリモート OpenShell ワークスペースに対して直接動作します。
- OpenClaw は exec 後にリモート変更をローカルワークスペースへ**同期しません**。
- プロンプト時のメディア読み取りは、ファイル/メディアツールがローカルホストパス前提ではなく sandbox bridge 経由で読むため、引き続き機能します。
- トランスポートは `openshell sandbox ssh-config` が返す OpenShell sandbox への SSH です。

重要な結果:

- シード後に OpenClaw 外でホスト上のファイルを編集しても、リモート sandbox はその変更を**自動では**認識しません。
- sandbox が再作成されると、リモートワークスペースは再びローカルワークスペースからシードされます。
- `scope: "agent"` または `scope: "shared"` では、そのリモートワークスペースは同じスコープ内で共有されます。

このモードが向いているケース:

- sandbox を主にリモート OpenShell 側で生かしたい
- ターンごとの同期オーバーヘッドを下げたい
- ホストローカル編集でリモート sandbox 状態が黙って上書きされるのを避けたい

sandbox を一時的な実行環境として考えるなら `mirror` を選んでください。
sandbox を実際のワークスペースとして考えるなら `remote` を選んでください。

#### OpenShell ライフサイクル

OpenShell sandbox は引き続き通常の sandbox ライフサイクルで管理されます。

- `openclaw sandbox list` には Docker ランタイムと同様に OpenShell ランタイムも表示されます
- `openclaw sandbox recreate` は現在のランタイムを削除し、次回利用時に OpenClaw に再作成させます
- prune ロジックもバックエンド認識型です

`remote` モードでは、recreate が特に重要です。

- recreate はそのスコープの正規リモートワークスペースを削除します
- 次回利用時に、ローカルワークスペースから新しいリモートワークスペースがシードされます

`mirror` モードでは、ローカルワークスペースがどうせ正本のままなので、
recreate は主にリモート実行環境をリセットします。

## ワークスペースアクセス

`agents.defaults.sandbox.workspaceAccess` は、sandbox が**何を見られるか**を制御します。

- `"none"`（デフォルト）: ツールは `~/.openclaw/sandboxes` 配下の sandbox ワークスペースを見ます。
- `"ro"`: agent ワークスペースを `/agent` に読み取り専用でマウントします（`write`/`edit`/`apply_patch` を無効化）。
- `"rw"`: agent ワークスペースを `/workspace` に読み書き可能でマウントします。

OpenShell バックエンドでは:

- `mirror` モードでは、exec turn 間では引き続きローカルワークスペースが正本です
- `remote` モードでは、初回シード後はリモート OpenShell ワークスペースが正本です
- `workspaceAccess: "ro"` と `"none"` も同様に書き込み動作を制限します

受信メディアはアクティブな sandbox ワークスペース（`media/inbound/*`）へコピーされます。
Skills に関する注意: `read` ツールは sandbox ルート基準です。`workspaceAccess: "none"` では、
OpenClaw は対象 Skills を sandbox ワークスペース（`.../skills`）へミラーし、
読み取れるようにします。`"rw"` では、ワークスペース Skills は
`/workspace/skills` から読み取れます。

## カスタム bind mount

`agents.defaults.sandbox.docker.binds` は追加のホストディレクトリをコンテナへマウントします。
形式: `host:container:mode`（例: `"/home/user/source:/source:rw"`）。

グローバルと agent ごとの bind は**置換ではなくマージ**されます。`scope: "shared"` では、agent ごとの bind は無視されます。

`agents.defaults.sandbox.browser.binds` は、追加のホストディレクトリを**sandbox browser** コンテナにのみマウントします。

- 設定されている場合（`[]` を含む）、browser コンテナでは `agents.defaults.sandbox.docker.binds` を置き換えます。
- 省略された場合、browser コンテナは `agents.defaults.sandbox.docker.binds` にフォールバックします（後方互換）。

例（読み取り専用の source + 追加データディレクトリ）:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

セキュリティ上の注意:

- bind は sandbox ファイルシステムをバイパスします。設定したモード（`:ro` または `:rw`）でホストパスを露出します。
- OpenClaw は危険な bind ソース（例: `docker.sock`、`/etc`、`/proc`、`/sys`、`/dev`、およびそれらを露出する親マウント）をブロックします。
- OpenClaw は `~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm`、`~/.ssh` など、一般的なホームディレクトリ資格情報ルートもブロックします。
- bind 検証は単なる文字列一致ではありません。OpenClaw はソースパスを正規化し、その後で最も深い既存祖先を通じて再解決してから、ブロック対象パスと許可ルートを再検査します。
- つまり、最終 leaf がまだ存在しなくても、親 symlink を使った脱出は閉じたまま失敗します。例: `run-link` がそこを指している場合、`/workspace/run-link/new-file` は依然として `/var/run/...` として解決されます。
- 許可されたソースルートも同様に正規化されるため、symlink 解決前には許可リスト内に見えるだけのパスも、`outside allowed roots` として拒否されます。
- 機密マウント（secret、SSH キー、サービス資格情報）は、絶対に必要でない限り `:ro` にしてください。
- ワークスペースへの読み取りだけが必要なら `workspaceAccess: "ro"` と組み合わせてください。bind モードは独立しています。
- bind がツールポリシーや elevated exec とどう相互作用するかについては [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

## イメージ + セットアップ

デフォルト Docker イメージ: `openclaw-sandbox:bookworm-slim`

一度だけビルドします:

```bash
scripts/sandbox-setup.sh
```

注意: デフォルトイメージには Node が含まれていません。Skill が Node（または
他のランタイム）を必要とする場合は、カスタムイメージに組み込むか、
`sandbox.docker.setupCommand` 経由でインストールしてください（ネットワーク外向き通信 + 書き込み可能な root +
root user が必要）。

`curl`、`jq`、`nodejs`、`python3`、`git` などの一般的なツールを含む、より実用的な sandbox イメージが必要な場合は、次をビルドしてください。

```bash
scripts/sandbox-common-setup.sh
```

その後、`agents.defaults.sandbox.docker.image` を
`openclaw-sandbox-common:bookworm-slim` に設定してください。

sandbox 化された browser イメージ:

```bash
scripts/sandbox-browser-setup.sh
```

デフォルトでは、Docker sandbox コンテナは**ネットワークなし**で実行されます。
必要なら `agents.defaults.sandbox.docker.network` で上書きしてください。

同梱の sandbox browser イメージは、コンテナ化ワークロード向けに保守的な Chromium 起動デフォルトも適用します。
現在のコンテナデフォルトは次のとおりです。

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<OPENCLAW_BROWSER_CDP_PORT から導出>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `noSandbox` が有効な場合は `--no-sandbox`。
- 3 つの graphics hardening フラグ（`--disable-3d-apis`、
  `--disable-software-rasterizer`、`--disable-gpu`）は任意であり、
  コンテナに GPU サポートがない場合に有用です。ワークロードで WebGL や他の 3D/browser 機能が必要なら
  `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` を設定してください。
- `--disable-extensions` はデフォルトで有効で、extension に依存するフローでは
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で無効化できます。
- `--renderer-process-limit=2` は
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で制御され、`0` だと Chromium のデフォルトを維持します。

異なるランタイムプロファイルが必要な場合は、カスタム browser イメージを使い、
独自の entrypoint を用意してください。ローカル（非コンテナ）Chromium profile では、
追加の起動フラグを付けるために `browser.extraArgs` を使ってください。

セキュリティデフォルト:

- `network: "host"` はブロックされます。
- `network: "container:<id>"` はデフォルトでブロックされます（namespace join バイパスのリスク）。
- 緊急用上書き: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

Docker インストールとコンテナ化 Gateway についてはここにあります:
[Docker](/ja-JP/install/docker)

Docker Gateway デプロイでは、`scripts/docker/setup.sh` で sandbox config をブートストラップできます。
この経路を有効にするには `OPENCLAW_SANDBOX=1`（または `true`/`yes`/`on`）を設定してください。
socket の場所は `OPENCLAW_DOCKER_SOCKET` で上書きできます。完全なセットアップと env
リファレンス: [Docker](/ja-JP/install/docker#agent-sandbox)。

## setupCommand（1 回限りのコンテナセットアップ）

`setupCommand` は sandbox コンテナ作成後に**1 回だけ**実行されます（毎回の実行ではありません）。
コンテナ内で `sh -lc` により実行されます。

パス:

- グローバル: `agents.defaults.sandbox.docker.setupCommand`
- agent ごと: `agents.list[].sandbox.docker.setupCommand`

よくある落とし穴:

- デフォルトの `docker.network` は `"none"`（外向き通信なし）なので、パッケージインストールは失敗します。
- `docker.network: "container:<id>"` には `dangerouslyAllowContainerNamespaceJoin: true` が必要で、緊急用に限るべきです。
- `readOnlyRoot: true` では書き込みできません。`readOnlyRoot: false` にするか、カスタムイメージを作成してください。
- パッケージインストールには `user` が root である必要があります（`user` を省略するか、`user: "0:0"` を設定）。
- sandbox exec はホストの `process.env` を継承**しません**。Skill の API キーには
  `agents.defaults.sandbox.docker.env`（またはカスタムイメージ）を使ってください。

## ツールポリシー + 逃げ道

ツールの allow/deny ポリシーは、sandbox ルールより前に引き続き適用されます。グローバルまたは agent ごとにツールが拒否されていれば、
sandboxing によって復活することはありません。

`tools.elevated` は、sandbox 外で `exec` を実行する明示的な escape hatch です（デフォルトでは `gateway`、exec ターゲットが `node` の場合は `node`）。
`/exec` ディレクティブは認可された送信者にのみ適用され、状態はセッションごとに持続します。`exec` を完全に無効にしたい場合は、
ツールポリシー deny を使ってください（[Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照）。

デバッグ:

- `openclaw sandbox explain` を使うと、有効な sandbox mode、ツールポリシー、修正用 config キーを確認できます。
- 「なぜこれがブロックされるのか？」の考え方については [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。
  厳しくロックダウンしてください。

## マルチ agent の上書き

各 agent は sandbox + tools を上書きできます:
`agents.list[].sandbox` と `agents.list[].tools`（および sandbox ツールポリシー用の `agents.list[].tools.sandbox.tools`）。
優先順位については [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

## 最小の有効化例

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## 関連ドキュメント

- [OpenShell](/ja-JP/gateway/openshell) -- 管理型 sandbox backend のセットアップ、ワークスペースモード、設定リファレンス
- [Sandbox Configuration](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) -- 「なぜこれがブロックされるのか？」のデバッグ
- [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) -- agent ごとの上書きと優先順位
- [Security](/ja-JP/gateway/security)
