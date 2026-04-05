---
read_when:
    - チャンネルの正常性と最近のセッション受信者をすばやく診断したい
    - デバッグ用の貼り付け可能な「all」ステータスが必要
summary: '`openclaw status` のCLIリファレンス（診断、プローブ、使用状況スナップショット）'
title: status
x-i18n:
    generated_at: "2026-04-05T12:40:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbe9d94fbe9938cd946ee6f293b5bd3b464b75e1ade2eacdd851788c3bffe94e
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

チャンネルとセッションの診断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注意:

- `--deep` はライブプローブ（WhatsApp Web + Telegram + Discord + Slack + Signal）を実行します。
- `--usage` は正規化されたプロバイダー使用状況ウィンドウを `X% left` として表示します。
- MiniMax の生の `usage_percent` / `usagePercent` フィールドは残りクォータを示すため、OpenClaw は表示前にそれらを反転します。件数ベースのフィールドが存在する場合はそちらが優先されます。`model_remains` のレスポンスではチャットモデルのエントリーが優先され、必要に応じてタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- 現在のセッションスナップショットの情報が少ない場合、`/status` は最新のトランスクリプト使用状況ログからトークン数とキャッシュカウンターを補完できます。既存のゼロ以外のライブ値は引き続きトランスクリプトのフォールバック値より優先されます。
- トランスクリプトのフォールバックは、ライブセッションエントリーに存在しない場合に、アクティブなランタイムモデルラベルも復元できます。そのトランスクリプトモデルが選択されたモデルと異なる場合、status は選択されたモデルではなく、復元されたランタイムモデルに対してコンテキストウィンドウを解決します。
- プロンプトサイズの集計では、セッションメタデータが存在しないかより小さい場合、トランスクリプトのフォールバックはより大きいプロンプト指向の合計を優先するため、カスタムプロバイダーのセッションが `0` トークン表示に縮退しません。
- 複数のエージェントが設定されている場合、出力にはエージェントごとのセッションストアが含まれます。
- 概要には、利用可能な場合に Gateway とノードホストサービスのインストール / 実行状況が含まれます。
- 概要には、更新チャンネルと git SHA（ソースチェックアウト用）が含まれます。
- 更新情報は概要に表示されます。更新が利用可能な場合、status は `openclaw update` を実行するヒントを表示します（[更新](/install/updating) を参照）。
- 読み取り専用のステータス表示（`status`、`status --json`、`status --all`）は、可能な場合に対象の設定パスに対してサポートされている SecretRef を解決します。
- サポートされているチャンネルの SecretRef が設定されていても、現在のコマンドパスで利用できない場合、status は読み取り専用のままとなり、クラッシュせずに劣化した出力を報告します。人間向け出力には「configured token unavailable in this command path」のような警告が表示され、JSON 出力には `secretDiagnostics` が含まれます。
- コマンドローカルの SecretRef 解決が成功した場合、status は解決済みスナップショットを優先し、最終出力から一時的な「secret unavailable」チャンネルマーカーを消去します。
- `status --all` には Secrets の概要行と、シークレット診断を要約する診断セクション（読みやすさのために切り詰められます）が含まれ、レポート生成は停止しません。
