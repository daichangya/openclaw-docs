---
read_when:
    - Gateway のネットワークモデルを簡潔に把握したい
summary: Gateway、ノード、canvas host の接続方法。
title: ネットワークモデル
x-i18n:
    generated_at: "2026-04-05T12:44:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d02d87f38ee5a9fae228f5028892b192c50b473ab4441bbe0b40ee85a1dd402
    source_path: gateway/network-model.md
    workflow: 15
---

# ネットワークモデル

> この内容は [Network](/network#core-model) に統合されました。最新のガイドはそのページを参照してください。

ほとんどの操作は Gateway（`openclaw gateway`）を経由します。これは、チャンネル接続と WebSocket コントロールプレーンを管理する、単一の長時間実行プロセスです。

## コアルール

- ホストごとに 1 つの Gateway を推奨します。WhatsApp Web セッションを所有できる唯一のプロセスです。レスキューボットや厳密な分離が必要な場合は、分離されたプロファイルとポートで複数の Gateway を実行してください。[Multiple gateways](/gateway/multiple-gateways) を参照してください。
- まず loopback: Gateway WS のデフォルトは `ws://127.0.0.1:18789` です。ウィザードはデフォルトで shared-secret 認証を作成し、loopback であっても通常はトークンを生成します。loopback 以外からアクセスする場合は、有効な Gateway 認証パスを使用してください。shared-secret の token / password 認証、または正しく設定された loopback 以外の `trusted-proxy` デプロイです。tailnet / モバイル環境では、生の tailnet `ws://` よりも、通常は Tailscale Serve や別の `wss://` エンドポイントを経由するほうが適しています。
- ノードは、必要に応じて LAN、tailnet、または SSH 経由で Gateway WS に接続します。
  レガシー TCP bridge は削除されました。
- canvas host は Gateway HTTP サーバーによって、Gateway と**同じポート**（デフォルト `18789`）で提供されます:
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    `gateway.auth` が設定されていて、Gateway が loopback の外にバインドされる場合、これらのルートは Gateway 認証で保護されます。ノードクライアントは、自身のアクティブな WS セッションに結び付いたノードスコープの capability URL を使います。[Gateway configuration](/gateway/configuration)（`canvasHost`、`gateway`）を参照してください。
- リモート利用は通常、SSH トンネルまたは tailnet VPN です。[Remote access](/gateway/remote) と [Discovery](/gateway/discovery) を参照してください。
