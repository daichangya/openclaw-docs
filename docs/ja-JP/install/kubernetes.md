---
read_when:
    - OpenClaw を Kubernetes クラスターで実行したい場合
    - Kubernetes 環境で OpenClaw をテストしたい場合
summary: Kustomize を使って OpenClaw Gateway を Kubernetes クラスターにデプロイする
title: Kubernetes
x-i18n:
    generated_at: "2026-04-05T12:48:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa39127de5a5571f117db3a1bfefd5815b5e6b594cc1df553e30fda882b2a408
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw on Kubernetes

Kubernetes 上で OpenClaw を実行するための最小限の出発点です。本番対応のデプロイではありません。中核となるリソースを扱っており、環境に合わせて調整することを前提としています。

## なぜ Helm ではないのか?

OpenClaw は、いくつかの設定ファイルを持つ単一コンテナです。興味深いカスタマイズは、インフラのテンプレート化ではなく、エージェント内容（markdown ファイル、Skills、設定オーバーライド）にあります。Kustomize は、Helm chart のオーバーヘッドなしにオーバーレイを扱えます。デプロイがより複雑になった場合は、これらの manifest の上に Helm chart を重ねることもできます。

## 必要なもの

- 動作中の Kubernetes クラスター（AKS、EKS、GKE、k3s、kind、OpenShift など）
- クラスターに接続された `kubectl`
- 少なくとも 1 つのモデルプロバイダー用 API キー

## クイックスタート

```bash
# 使用するプロバイダーに置き換えてください: ANTHROPIC、GEMINI、OPENAI、または OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Control UI 用に設定された shared secret を取得します。このデプロイスクリプトでは、
デフォルトで token auth を作成します:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

ローカルデバッグ用に、`./scripts/k8s/deploy.sh --show-token` はデプロイ後にトークンを表示します。

## Kind を使ったローカルテスト

クラスターがない場合は、[Kind](https://kind.sigs.k8s.io/) でローカルに作成できます:

```bash
./scripts/k8s/create-kind.sh           # docker または podman を自動検出
./scripts/k8s/create-kind.sh --delete  # 削除
```

その後、通常どおり `./scripts/k8s/deploy.sh` でデプロイします。

## 手順

### 1) デプロイ

**オプション A** — 環境内の API キー（1 ステップ）:

```bash
# 使用するプロバイダーに置き換えてください: ANTHROPIC、GEMINI、OPENAI、または OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

このスクリプトは、API キーと自動生成された Gateway トークンを含む Kubernetes Secret を作成してからデプロイします。Secret がすでに存在する場合は、現在の Gateway トークンと、変更対象でないプロバイダーキーを保持します。

**オプション B** — Secret を別途作成する:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

ローカルテスト用にトークンを stdout へ表示したい場合は、どちらのコマンドでも `--show-token` を使ってください。

### 2) Gateway にアクセスする

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## デプロイされるもの

```
Namespace: openclaw（`OPENCLAW_NAMESPACE` で設定可能）
├── Deployment/openclaw        # 単一 Pod、init container + gateway
├── Service/openclaw           # ポート 18789 の ClusterIP
├── PersistentVolumeClaim      # エージェント状態と設定用の 10Gi
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway トークン + API キー
```

## カスタマイズ

### エージェント指示

`scripts/k8s/manifests/configmap.yaml` の `AGENTS.md` を編集して再デプロイします:

```bash
./scripts/k8s/deploy.sh
```

### Gateway 設定

`scripts/k8s/manifests/configmap.yaml` の `openclaw.json` を編集します。完全なリファレンスは [Gateway configuration](/gateway/configuration) を参照してください。

### プロバイダーを追加する

追加キーを export して再実行します:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

既存のプロバイダーキーは、上書きしない限り Secret に保持されます。

または、Secret を直接 patch します:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### カスタム namespace

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### カスタムイメージ

`scripts/k8s/manifests/deployment.yaml` の `image` フィールドを編集します:

```yaml
image: ghcr.io/openclaw/openclaw:latest # または https://github.com/openclaw/openclaw/releases の特定バージョンに固定
```

### port-forward を超えて公開する

デフォルトの manifest では、Pod 内で Gateway を loopback に bind します。これは `kubectl port-forward` では動作しますが、Pod IP に到達する必要がある Kubernetes の `Service` や Ingress 経路では動作しません。

Ingress またはロードバランサー経由で Gateway を公開したい場合:

- `scripts/k8s/manifests/configmap.yaml` の Gateway bind を `loopback` から、デプロイモデルに合った非 loopback bind に変更する
- Gateway auth を有効のままにし、適切な TLS 終端エントリポイントを使う
- サポートされている Web セキュリティモデルを使って Control UI をリモートアクセス向けに設定する（たとえば HTTPS/Tailscale Serve や、必要に応じた明示的な許可済み origin）

## 再デプロイ

```bash
./scripts/k8s/deploy.sh
```

これにより、すべての manifest が適用され、設定または Secret の変更を反映するために Pod が再起動されます。

## 削除

```bash
./scripts/k8s/deploy.sh --delete
```

これにより、namespace とその中のすべてのリソース（PVC を含む）が削除されます。

## アーキテクチャに関する注意

- Gateway はデフォルトで Pod 内の loopback に bind されるため、付属のセットアップは `kubectl port-forward` 用です
- クラスター全体スコープのリソースはありません。すべて単一 namespace 内にあります
- セキュリティ: `readOnlyRootFilesystem`、`drop: ALL` capabilities、non-root user（UID 1000）
- デフォルト設定では、より安全なローカルアクセス経路に Control UI を維持します: loopback bind と `kubectl port-forward` による `http://127.0.0.1:18789`
- localhost アクセスを超える場合は、サポートされているリモートモデルを使ってください: HTTPS/Tailscale と、適切な Gateway bind および Control UI origin 設定
- Secret は一時ディレクトリで生成され、クラスターに直接適用されます。secret material がリポジトリ checkout に書き込まれることはありません

## ファイル構成

```
scripts/k8s/
├── deploy.sh                   # namespace + secret を作成し、kustomize 経由でデプロイ
├── create-kind.sh              # ローカル Kind クラスター（docker/podman を自動検出）
└── manifests/
    ├── kustomization.yaml      # Kustomize ベース
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # セキュリティ hardening を含む Pod 仕様
    ├── pvc.yaml                # 10Gi 永続ストレージ
    └── service.yaml            # 18789 の ClusterIP
```
