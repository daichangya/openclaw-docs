---
read_when:
    - 再現可能でロールバック可能なインストールが必要な場合
    - すでにNix/NixOS/Home Managerを使っている場合
    - すべてをピン留めして宣言的に管理したい場合
summary: NixでOpenClawを宣言的にインストールする
title: Nix
x-i18n:
    generated_at: "2026-04-25T13:50:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
    source_path: install/nix.md
    workflow: 15
---

**[nix-openclaw](https://github.com/openclaw/nix-openclaw)** を使って、OpenClawを宣言的にインストールします。これは、必要なものが一式そろったHome Managerモジュールです。

<Info>
Nixインストールの信頼できる情報源は [nix-openclaw](https://github.com/openclaw/nix-openclaw) リポジトリです。このページは簡単な概要です。
</Info>

## できること

- Gateway + macOS app + ツール（whisper、spotify、cameras）-- すべてピン留め済み
- 再起動後も維持されるlaunchdサービス
- 宣言的な設定を持つPluginシステム
- 即時ロールバック: `home-manager switch --rollback`

## クイックスタート

<Steps>
  <Step title="Determinate Nixをインストール">
    Nixがまだインストールされていない場合は、[Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer) の手順に従ってください。
  </Step>
  <Step title="ローカルflakeを作成">
    nix-openclawリポジトリのagent-firstテンプレートを使います:
    ```bash
    mkdir -p ~/code/openclaw-local
    # nix-openclawリポジトリから templates/agent-first/flake.nix をコピー
    ```
  </Step>
  <Step title="シークレットを設定">
    メッセージングbotトークンとモデルプロバイダーAPIキーを設定します。`~/.secrets/` にあるプレーンファイルで問題ありません。
  </Step>
  <Step title="テンプレートのプレースホルダーを埋めて切り替え">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="確認">
    launchdサービスが実行中であり、botがメッセージに応答することを確認します。
  </Step>
</Steps>

完全なモジュールオプションと例については、[nix-openclaw README](https://github.com/openclaw/nix-openclaw) を参照してください。

## Nixモードのランタイム挙動

`OPENCLAW_NIX_MODE=1`が設定されていると（nix-openclawでは自動）、OpenClawは自動インストールフローを無効にする決定論的モードに入ります。

手動で設定することもできます:

```bash
export OPENCLAW_NIX_MODE=1
```

macOSでは、GUI appはシェルの環境変数を自動では継承しません。代わりにdefaults経由でNixモードを有効にしてください:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nixモードで変わること

- 自動インストールおよび自己変更フローが無効になります
- 依存関係不足時に、Nix固有の対処メッセージが表示されます
- UIに読み取り専用のNixモードバナーが表示されます

### 設定と状態のパス

OpenClawはJSON5設定を`OPENCLAW_CONFIG_PATH`から読み取り、可変データを`OPENCLAW_STATE_DIR`に保存します。Nix配下で実行する場合は、ランタイム状態と設定が不変ストア外に保たれるよう、これらをNix管理の場所に明示的に設定してください。

| 変数 | デフォルト |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### サービスPATH検出

launchd/systemdのgatewayサービスは、Nixプロファイルのバイナリを自動検出するため、
`nix`でインストールされた実行ファイルをシェル実行するPluginやツールが、手動のPATH設定なしで動作します。

- `NIX_PROFILES`が設定されている場合、各エントリが右から左への優先順位でサービスPATHに追加されます（Nixシェルの優先順位と一致し、いちばん右が優先されます）。
- `NIX_PROFILES`が未設定の場合は、フォールバックとして`~/.nix-profile/bin`が追加されます。

これはmacOSのlaunchdとLinuxのsystemdサービス環境の両方に適用されます。

## 関連

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- 完全なセットアップガイド
- [ウィザード](/ja-JP/start/wizard) -- 非NixのCLIセットアップ
- [Docker](/ja-JP/install/docker) -- コンテナ化セットアップ
