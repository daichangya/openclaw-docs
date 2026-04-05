---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'OpenClawのサンドボックス化の仕組み: モード、スコープ、ワークスペースアクセス、およびイメージ'
title: サンドボックス化
x-i18n:
    generated_at: "2026-04-05T12:46:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 756ebd5b9806c23ba720a311df7e3b4ffef6ce41ba4315ee4b36b5ea87b26e60
    source_path: gateway/sandboxing.md
    workflow: 15
---

# サンドボックス化

OpenClawは、影響範囲を減らすために**サンドボックスバックエンド内でツールを実行**できます。
これは**任意**機能で、設定（`agents.defaults.sandbox` または
`agents.list[].sandbox`）で制御されます。サンドボックス化がオフの場合、ツールはホスト上で実行されます。
Gatewayはホスト上に残り、ツール実行は有効時に分離されたサンドボックス内で行われます。

これは完全なセキュリティ境界ではありませんが、モデルが何か愚かなことをしたときに、ファイルシステムとプロセスへのアクセスを実質的に制限します。

## 何がサンドボックス化されるか

- ツール実行（`exec`、`read`、`write`、`edit`、`apply_patch`、`process` など）。
- 任意のサンドボックス化されたブラウザー（`agents.defaults.sandbox.browser`）。
  - デフォルトでは、ブラウザーツールが必要とするときにサンドボックスブラウザーが自動起動し（CDPに到達可能であることを保証）、設定は `agents.defaults.sandbox.browser.autoStart` と `agents.defaults.sandbox.browser.autoStartTimeoutMs` で行います。
  - デフォルトでは、サンドボックスブラウザーコンテナはグローバルな `bridge` ネットワークではなく、専用のDockerネットワーク（`openclaw-sandbox-browser`）を使用します。
    `agents.defaults.sandbox.browser.network` で設定します。
  - 任意の `agents.defaults.sandbox.browser.cdpSourceRange` では、CIDR allowlist（たとえば `172.21.0.1/32`）でコンテナ境界のCDP ingressを制限できます。
  - noVNCのオブザーバーアクセスはデフォルトでパスワード保護されます。OpenClawは短命のトークンURLを発行し、ローカルのブートストラップページを配信して、URLフラグメント内のパスワードでnoVNCを開きます（query/headerログには残りません）。
  - `agents.defaults.sandbox.browser.allowHostControl` により、サンドボックス化されたセッションが明示的にホストブラウザーを対象にできます。
  - 任意のallowlistで `target: "custom"` を制御できます: `allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

サンドボックス化されないもの:

- Gatewayプロセス自体。
- 明示的にサンドボックス外で実行を許可されたツール（例: `tools.elevated`）。
  - **elevated execはサンドボックス化をバイパスし、設定されたエスケープパス（デフォルトは `gateway`、execターゲットが `node` の場合は `node`）を使用します。**
  - サンドボックス化がオフの場合、`tools.elevated` は実行を変更しません（すでにホスト上です）。[Elevated Mode](/tools/elevated) を参照してください。

## モード

`agents.defaults.sandbox.mode` は、**いつ**サンドボックス化を使用するかを制御します:

- `"off"`: サンドボックス化しません。
- `"non-main"`: **non-main** セッションのみサンドボックス化します（通常のチャットをホスト上に残したい場合のデフォルト）。
- `"all"`: すべてのセッションをサンドボックスで実行します。
  注: `"non-main"` はagent idではなく `session.mainKey`（デフォルト `"main"`）に基づきます。
  グループ/チャネルセッションは独自のキーを使うため、non-mainとして扱われ、サンドボックス化されます。

## スコープ

`agents.defaults.sandbox.scope` は、**いくつコンテナを作成するか**を制御します:

- `"agent"`（デフォルト）: agentごとに1コンテナ。
- `"session"`: sessionごとに1コンテナ。
- `"shared"`: すべてのサンドボックス化セッションで1コンテナを共有。

## バックエンド

`agents.defaults.sandbox.backend` は、**どのランタイム**がサンドボックスを提供するかを制御します:

- `"docker"`（デフォルト）: ローカルDockerベースのサンドボックスランタイム。
- `"ssh"`: 汎用SSHベースのリモートサンドボックスランタイム。
- `"openshell"`: OpenShellベースのサンドボックスランタイム。

SSH固有の設定は `agents.defaults.sandbox.ssh` 配下にあります。
OpenShell固有の設定は `plugins.entries.openshell.config` 配下にあります。

### バックエンドの選択

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **実行場所**        | ローカルコンテナ                 | SSHでアクセス可能な任意のホスト | OpenShell管理サンドボックス                         |
| **セットアップ**    | `scripts/sandbox-setup.sh`       | SSHキー + 対象ホスト           | OpenShellプラグインを有効化                         |
| **ワークスペースモデル** | Bind-mountまたはコピー       | リモートを正とする（最初に一度seed） | `mirror` または `remote`                         |
| **ネットワーク制御** | `docker.network`（デフォルト: none） | リモートホスト依存         | OpenShell依存                                       |
| **ブラウザーサンドボックス** | 対応                   | 非対応                         | まだ非対応                                          |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **最適な用途**      | ローカル開発、完全な分離         | リモートマシンへのオフロード   | 任意の双方向同期付き管理されたリモートサンドボックス |

### SSHバックエンド

任意のSSHアクセス可能なマシン上で、OpenClawに `exec`、ファイルツール、メディア読み取りをサンドボックス化させたい場合は `backend: "ssh"` を使用します。

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
          // または、ローカルファイルの代わりに SecretRef / インライン内容を使います:
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

- OpenClawは `sandbox.ssh.workspaceRoot` 配下に、スコープごとのリモートrootを作成します。
- 作成または再作成後の最初の使用時に、OpenClawはローカルワークスペースからそのリモートワークスペースへ一度だけseedします。
- その後、`exec`、`read`、`write`、`edit`、`apply_patch`、プロンプトメディア読み取り、および受信メディアのステージングは、SSH経由で直接そのリモートワークスペースに対して実行されます。
- OpenClawは、リモートの変更をローカルワークスペースへ自動同期しません。

認証素材:

- `identityFile`、`certificateFile`、`knownHostsFile`: 既存のローカルファイルを使い、OpenSSH設定を通して渡します。
- `identityData`、`certificateData`、`knownHostsData`: インライン文字列またはSecretRefを使います。OpenClawは通常のsecretsランタイムスナップショット経由でそれらを解決し、`0600` で一時ファイルに書き出し、SSHセッション終了時に削除します。
- 同じ項目に対して `*File` と `*Data` の両方が設定されている場合、そのSSHセッションでは `*Data` が優先されます。

これは**リモートを正とする**モデルです。初回seed後は、リモートSSHワークスペースが実際のサンドボックス状態になります。

重要な影響:

- seedステップ後にOpenClaw外で行われたホストローカル編集は、サンドボックスを再作成するまでリモートには反映されません。
- `openclaw sandbox recreate` はスコープごとのリモートrootを削除し、次回使用時にローカルから再度seedします。
- SSHバックエンドではブラウザーサンドボックス化はサポートされません。
- `sandbox.docker.*` 設定はSSHバックエンドには適用されません。

### OpenShellバックエンド

OpenShell管理のリモート環境でツールをサンドボックス化したい場合は、`backend: "openshell"` を使用します。完全なセットアップガイド、設定リファレンス、およびワークスペースモード比較については、専用の
[OpenShellページ](/gateway/openshell) を参照してください。

OpenShellは、汎用SSHバックエンドと同じコアSSHトランスポートおよびリモートファイルシステムブリッジを再利用し、OpenShell固有のライフサイクル
（`sandbox create/get/delete`、`sandbox ssh-config`）に加えて、任意の `mirror`
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

OpenShellモード:

- `mirror`（デフォルト）: ローカルワークスペースが正のままです。OpenClawは `exec` 前にローカルファイルをOpenShellへ同期し、`exec` 後にリモートワークスペースをローカルへ同期し戻します。
- `remote`: サンドボックス作成後はOpenShellワークスペースが正になります。OpenClawはローカルワークスペースから一度だけリモートワークスペースをseedし、その後はファイルツールとexecが変更を戻し同期せずに、直接そのリモートサンドボックスに対して実行されます。

リモートトランスポートの詳細:

- OpenClawは `openshell sandbox ssh-config <name>` 経由で、サンドボックス固有のSSH設定をOpenShellに要求します。
- コアはそのSSH設定を一時ファイルに書き出し、SSHセッションを開き、`backend: "ssh"` で使われるのと同じリモートファイルシステムブリッジを再利用します。
- `mirror` モードではライフサイクルのみが異なります: `exec` 前にローカルからリモートへ同期し、その後に同期し戻します。

現在のOpenShellの制限:

- サンドボックスブラウザーはまだサポートされていません
- `sandbox.docker.binds` はOpenShellバックエンドではサポートされていません
- `sandbox.docker.*` 配下のDocker固有ランタイムノブも、引き続きDockerバックエンドにのみ適用されます

#### ワークスペースモード

OpenShellには2つのワークスペースモデルがあります。実際には、ここが最も重要な部分です。

##### `mirror`

**ローカルワークスペースを正に保ちたい**場合は、`plugins.entries.openshell.config.mode: "mirror"` を使用します。

動作:

- `exec` 前に、OpenClawはローカルワークスペースをOpenShellサンドボックスへ同期します。
- `exec` 後に、OpenClawはリモートワークスペースをローカルワークスペースへ同期し戻します。
- ファイルツールは引き続きサンドボックスブリッジ経由で動作しますが、ターン間ではローカルワークスペースが信頼できる情報源のままです。

このモードを使う場面:

- OpenClaw外でローカルにファイルを編集し、その変更を自動的にサンドボックスへ反映させたい
- OpenShellサンドボックスの動作を、できるだけDockerバックエンドに近づけたい
- 各execターン後に、ホストワークスペースへサンドボックスの書き込みを反映させたい

トレードオフ:

- execの前後に追加の同期コストが発生します

##### `remote`

**OpenShellワークスペースを正にしたい**場合は、`plugins.entries.openshell.config.mode: "remote"` を使用します。

動作:

- サンドボックスが最初に作成されるとき、OpenClawはローカルワークスペースからリモートワークスペースへ一度だけseedします。
- その後、`exec`、`read`、`write`、`edit`、`apply_patch` は直接リモートOpenShellワークスペースに対して動作します。
- OpenClawは `exec` 後にリモート変更をローカルワークスペースへ同期し戻し**ません**。
- プロンプト時のメディア読み取りは引き続き動作します。これは、ファイルツールとメディアツールがローカルホストパスを前提にせず、サンドボックスブリッジ経由で読み取るためです。
- トランスポートは、`openshell sandbox ssh-config` が返すOpenShellサンドボックスへのSSHです。

重要な影響:

- seedステップ後にOpenClaw外でホスト上のファイルを編集しても、リモートサンドボックスはそれらの変更を自動では**見ません**。
- サンドボックスを再作成すると、リモートワークスペースは再びローカルワークスペースからseedされます。
- `scope: "agent"` または `scope: "shared"` では、そのリモートワークスペースも同じスコープで共有されます。

このモードを使う場面:

- サンドボックスを主にリモートOpenShell側で存続させたい
- ターンごとの同期オーバーヘッドを下げたい
- ホストローカル編集でリモートサンドボックス状態が黙って上書きされることを避けたい

サンドボックスを一時的な実行環境と考えるなら `mirror` を選んでください。
サンドボックスを実際のワークスペースと考えるなら `remote` を選んでください。

#### OpenShellライフサイクル

OpenShellサンドボックスも、通常のサンドボックスライフサイクルで管理されます:

- `openclaw sandbox list` はDockerランタイムだけでなくOpenShellランタイムも表示します
- `openclaw sandbox recreate` は現在のランタイムを削除し、次回使用時にOpenClawが再作成できるようにします
- pruneロジックもバックエンド対応です

`remote` モードでは、recreateが特に重要です:

- recreateはそのスコープの正となるリモートワークスペースを削除します
- 次回使用時に、ローカルワークスペースから新しいリモートワークスペースをseedします

`mirror` モードでは、ローカルワークスペースが正のままなので、
recreateは主にリモート実行環境をリセットします。

## ワークスペースアクセス

`agents.defaults.sandbox.workspaceAccess` は、**サンドボックスが何を見られるか**を制御します:

- `"none"`（デフォルト）: ツールは `~/.openclaw/sandboxes` 配下のサンドボックスワークスペースを見ます。
- `"ro"`: agentワークスペースを `/agent` に読み取り専用でmountします（`write`/`edit`/`apply_patch` を無効化）。
- `"rw"`: agentワークスペースを `/workspace` に読み書き可能でmountします。

OpenShellバックエンドでは:

- `mirror` モードでは、execターン間でもローカルワークスペースが正のソースのままです
- `remote` モードでは、初回seed後はリモートOpenShellワークスペースが正のソースになります
- `workspaceAccess: "ro"` と `"none"` でも、同様に書き込み動作を制限します

受信メディアはアクティブなサンドボックスワークスペース（`media/inbound/*`）にコピーされます。
Skillsに関する注記: `read` ツールはサンドボックスroot基準です。`workspaceAccess: "none"` では、
OpenClawは対象のSkillsをサンドボックスワークスペース（`.../skills`）にミラーし、
そこから読み取れるようにします。`"rw"` では、ワークスペース内のSkillsは
`/workspace/skills` から読み取れます。

## カスタムBind mounts

`agents.defaults.sandbox.docker.binds` は追加のホストディレクトリをコンテナにmountします。
形式: `host:container:mode`（例: `"/home/user/source:/source:rw"`）。

グローバルbindとagentごとのbindは、**置き換えではなくマージ**されます。`scope: "shared"` では、agentごとのbindは無視されます。

`agents.defaults.sandbox.browser.binds` は追加のホストディレクトリを**サンドボックスブラウザー**コンテナのみにmountします。

- 設定されている場合（`[]` を含む）、ブラウザーコンテナでは `agents.defaults.sandbox.docker.binds` を置き換えます。
- 省略されている場合、ブラウザーコンテナは `agents.defaults.sandbox.docker.binds` にフォールバックします（後方互換）。

例（読み取り専用ソース + 追加データディレクトリ）:

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

- bindはサンドボックスファイルシステムを迂回します: 設定したモード（`:ro` または `:rw`）でホストパスを公開します。
- OpenClawは危険なbindソース（例: `docker.sock`、`/etc`、`/proc`、`/sys`、`/dev`、およびそれらを公開しうる親mount）をブロックします。
- OpenClawは `~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm`、`~/.ssh` などの一般的なホームディレクトリ認証情報rootもブロックします。
- bind検証は単なる文字列一致ではありません。OpenClawはソースパスを正規化し、その後で最も深い既存祖先を通して再解決してから、ブロック対象パスと許可rootを再チェックします。
- つまり、最終リーフがまだ存在しなくても、symlink親を使ったエスケープは安全側で失敗します。例: `run-link` がそこを指している場合、`/workspace/run-link/new-file` は依然として `/var/run/...` として解決されます。
- 許可ソースrootも同じ方法で正規化されるため、symlink解決前はallowlist内に見えるだけのパスでも、`outside allowed roots` として拒否されます。
- 機密性の高いmount（secrets、SSHキー、サービス認証情報）は、絶対に必要でない限り `:ro` にするべきです。
- ワークスペースへの読み取りアクセスだけが必要なら、`workspaceAccess: "ro"` と組み合わせてください。bindモードは独立したままです。
- bindとツールポリシーおよびelevated execの相互作用については、[Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

## イメージ + セットアップ

デフォルトDockerイメージ: `openclaw-sandbox:bookworm-slim`

一度だけビルドします:

```bash
scripts/sandbox-setup.sh
```

注: デフォルトイメージにはNodeが**含まれていません**。SkillにNode（または
ほかのランタイム）が必要な場合は、カスタムイメージを焼くか、
`sandbox.docker.setupCommand` 経由でインストールしてください（ネットワークegress + 書き込み可能なroot +
rootユーザーが必要です）。

`curl`、`jq`、`nodejs`、`python3`、`git` などの一般的なツールを含む、より実用的なサンドボックスイメージが必要な場合は、次をビルドします:

```bash
scripts/sandbox-common-setup.sh
```

次に、`agents.defaults.sandbox.docker.image` を
`openclaw-sandbox-common:bookworm-slim` に設定します。

サンドボックスブラウザーイメージ:

```bash
scripts/sandbox-browser-setup.sh
```

デフォルトでは、Dockerサンドボックスコンテナは**ネットワークなし**で実行されます。
`agents.defaults.sandbox.docker.network` で上書きできます。

同梱のサンドボックスブラウザーイメージは、コンテナ化ワークロード向けに保守的なChromium起動デフォルトも適用します。現在のコンテナデフォルトには次が含まれます:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
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
- `noSandbox` が有効な場合は `--no-sandbox` と `--disable-setuid-sandbox`。
- 3つのgraphics hardeningフラグ（`--disable-3d-apis`、
  `--disable-software-rasterizer`、`--disable-gpu`）は任意であり、
  コンテナにGPUサポートがない場合に有用です。ワークロードでWebGLやその他の3D/ブラウザー機能が必要な場合は、`OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  を設定してください。
- `--disable-extensions` はデフォルトで有効で、拡張機能依存のフローでは
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で無効化できます。
- `--renderer-process-limit=2` は
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で制御され、`0` ではChromiumのデフォルトを維持します。

異なるランタイムプロファイルが必要な場合は、カスタムブラウザーイメージを使い、
独自のentrypointを提供してください。ローカル（非コンテナ）Chromiumプロファイルでは、
`browser.extraArgs` を使って追加の起動フラグを付加します。

セキュリティデフォルト:

- `network: "host"` はブロックされます。
- `network: "container:<id>"` はデフォルトでブロックされます（namespace joinバイパスのリスク）。
- 緊急時のoverride: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

Dockerインストールとコンテナ化されたgatewayはここにあります:
[Docker](/install/docker)

Dockerによるgatewayデプロイでは、`scripts/docker/setup.sh` がサンドボックス設定をブートストラップできます。
この経路を有効にするには `OPENCLAW_SANDBOX=1`（または `true`/`yes`/`on`）を設定します。
ソケット位置は `OPENCLAW_DOCKER_SOCKET` で上書きできます。完全なセットアップとenv
リファレンス: [Docker](/install/docker#agent-sandbox)

## setupCommand（1回限りのコンテナセットアップ）

`setupCommand` は、サンドボックスコンテナ作成後に**1回だけ**実行されます（毎回ではありません）。
コンテナ内で `sh -lc` により実行されます。

パス:

- グローバル: `agents.defaults.sandbox.docker.setupCommand`
- agentごと: `agents.list[].sandbox.docker.setupCommand`

よくある落とし穴:

- デフォルトの `docker.network` は `"none"`（egressなし）なので、パッケージインストールは失敗します。
- `docker.network: "container:<id>"` には `dangerouslyAllowContainerNamespaceJoin: true` が必要で、緊急時専用です。
- `readOnlyRoot: true` は書き込みを防ぎます。`readOnlyRoot: false` にするか、カスタムイメージを焼いてください。
- パッケージインストールには `user` がrootである必要があります（`user` を省略するか、`user: "0:0"` を設定）。
- サンドボックスexecはホストの `process.env` を継承し**ません**。SkillのAPIキーには
  `agents.defaults.sandbox.docker.env`（またはカスタムイメージ）を使ってください。

## ツールポリシー + エスケープハッチ

ツールのallow/denyポリシーは、サンドボックスルールより前に引き続き適用されます。ツールがグローバルまたはagent単位で拒否されている場合、サンドボックス化しても復活しません。

`tools.elevated` は、`exec` をサンドボックス外で実行するための明示的なエスケープハッチです（デフォルトは `gateway`、execターゲットが `node` の場合は `node`）。
`/exec` ディレクティブは認可済み送信者にのみ適用され、sessionごとに永続化されます。`exec` を完全に無効化したい場合は、
ツールポリシーdenyを使ってください（[Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) を参照）。

デバッグ:

- 有効なサンドボックスモード、ツールポリシー、および修正用設定キーを確認するには `openclaw sandbox explain` を使用します。
- 「なぜこれがブロックされるのか？」という理解のために、[Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。
  制限は厳しく保ってください。

## マルチエージェント上書き

各agentはサンドボックスとツールを上書きできます:
`agents.list[].sandbox` と `agents.list[].tools`（加えてサンドボックスツールポリシー用の `agents.list[].tools.sandbox.tools`）。
優先順位については [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) を参照してください。

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

- [OpenShell](/gateway/openshell) -- 管理されたサンドボックスバックエンドのセットアップ、ワークスペースモード、および設定リファレンス
- [Sandbox Configuration](/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- 「なぜこれがブロックされるのか？」のデバッグ
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- agentごとの上書きと優先順位
- [Security](/gateway/security)
