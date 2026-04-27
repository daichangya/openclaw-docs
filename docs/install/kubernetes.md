---
read_when:
    - 你想在 Kubernetes 集群上运行 OpenClaw
    - 你想在 Kubernetes 环境中测试 OpenClaw
summary: 使用 Kustomize 将 OpenClaw Gateway 网关部署到 Kubernetes 集群
title: Kubernetes
x-i18n:
    generated_at: "2026-04-24T03:17:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 15
---

# 在 Kubernetes 上运行 OpenClaw

这是一个在 Kubernetes 上运行 OpenClaw 的最小起点——不是可直接用于生产环境的部署。它涵盖了核心资源，目的是让你根据自己的环境进行调整。

## 为什么不用 Helm？

OpenClaw 是一个单容器应用，外加一些配置文件。真正有意思的定制点在于智能体内容（markdown 文件、Skills、配置覆盖），而不是基础设施模板化。Kustomize 可以处理 overlays，而不需要引入 Helm chart 的额外开销。如果你的部署变得更复杂，可以在这些清单之上再叠加一个 Helm chart。

## 你需要准备的内容

- 一个正在运行的 Kubernetes 集群（AKS、EKS、GKE、k3s、kind、OpenShift 等）
- 已连接到集群的 `kubectl`
- 至少一个模型提供商的 API key

## 快速开始

```bash
# 替换为你的提供商：ANTHROPIC、GEMINI、OPENAI 或 OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

获取为 Control UI 配置的共享密钥。此部署脚本默认会创建 token 认证：

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

对于本地调试，`./scripts/k8s/deploy.sh --show-token` 会在部署后打印该 token。

## 使用 Kind 进行本地测试

如果你没有集群，可以使用 [Kind](https://kind.sigs.k8s.io/) 在本地创建一个：

```bash
./scripts/k8s/create-kind.sh           # 自动检测 docker 或 podman
./scripts/k8s/create-kind.sh --delete  # 销毁集群
```

然后像平常一样用 `./scripts/k8s/deploy.sh` 部署。

## 分步说明

### 1）部署

**选项 A** — 在环境变量中提供 API key（一步完成）：

```bash
# 替换为你的提供商：ANTHROPIC、GEMINI、OPENAI 或 OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

该脚本会创建一个 Kubernetes Secret，其中包含 API key 和自动生成的 gateway token，然后执行部署。如果 Secret 已存在，它会保留当前 gateway token，以及所有未被更改的提供商 key。

**选项 B** — 单独创建 secret：

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

如果你希望将 token 打印到 stdout 以便本地测试，可在任一命令中使用 `--show-token`。

### 2）访问网关

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## 将部署哪些内容

```
Namespace: openclaw（可通过 OPENCLAW_NAMESPACE 配置）
├── Deployment/openclaw        # 单 Pod，含 init container + gateway
├── Service/openclaw           # 18789 端口上的 ClusterIP
├── PersistentVolumeClaim      # 10Gi，用于智能体状态和配置
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway 网关 token + API keys
```

## 自定义

### 智能体指令

编辑 `scripts/k8s/manifests/configmap.yaml` 中的 `AGENTS.md`，然后重新部署：

```bash
./scripts/k8s/deploy.sh
```

### Gateway 网关配置

编辑 `scripts/k8s/manifests/configmap.yaml` 中的 `openclaw.json`。完整参考请参见 [Gateway 网关配置](/zh-CN/gateway/configuration)。

### 添加提供商

重新运行，并导出更多 key：

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

除非你显式覆盖，现有提供商 key 会保留在 Secret 中。

或者直接 patch Secret：

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### 自定义命名空间

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### 自定义镜像

编辑 `scripts/k8s/manifests/deployment.yaml` 中的 `image` 字段：

```yaml
image: ghcr.io/openclaw/openclaw:latest # 或固定到 https://github.com/openclaw/openclaw/releases 中的特定版本
```

### 暴露到 port-forward 之外

默认清单会让 gateway 在 Pod 内绑定到 loopback。这适用于 `kubectl port-forward`，但不适用于需要访问 Pod IP 的 Kubernetes `Service` 或 Ingress 路径。

如果你希望通过 Ingress 或负载均衡器暴露 gateway：

- 将 `scripts/k8s/manifests/configmap.yaml` 中的 gateway bind 从 `loopback` 改为与你的部署模型匹配的非 loopback 绑定
- 保持 gateway 认证开启，并使用合适的 TLS 终止入口点
- 使用受支持的 Web 安全模型为远程访问配置 Control UI（例如 HTTPS/Tailscale Serve，并在需要时显式设置允许的 origins）

## 重新部署

```bash
./scripts/k8s/deploy.sh
```

这会应用所有清单，并重启 Pod 以加载任何配置或 secret 更改。

## 拆除

```bash
./scripts/k8s/deploy.sh --delete
```

这会删除该命名空间及其中所有资源，包括 PVC。

## 架构说明

- 默认情况下，gateway 在 Pod 内绑定到 loopback，因此附带的设置用于 `kubectl port-forward`
- 没有集群级资源——所有内容都位于单个命名空间中
- 安全性：`readOnlyRootFilesystem`、`drop: ALL` capabilities、非 root 用户（UID 1000）
- 默认配置让 Control UI 保持在更安全的本地访问路径上：loopback 绑定 + `kubectl port-forward` 到 `http://127.0.0.1:18789`
- 如果你要超出 localhost 访问范围，请使用受支持的远程模型：HTTPS/Tailscale，并配合适当的 gateway bind 和 Control UI origin 设置
- Secrets 会在临时目录中生成并直接应用到集群——不会将任何 secret 材料写入仓库检出目录

## 文件结构

```
scripts/k8s/
├── deploy.sh                   # 创建命名空间 + secret，并通过 kustomize 部署
├── create-kind.sh              # 本地 Kind 集群（自动检测 docker/podman）
└── manifests/
    ├── kustomization.yaml      # Kustomize 基础层
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # 带安全加固的 Pod 规格
    ├── pvc.yaml                # 10Gi 持久存储
    └── service.yaml            # 18789 端口上的 ClusterIP
```

## 相关内容

- [Docker](/zh-CN/install/docker)
- [Docker VM 运行时](/zh-CN/install/docker-vm-runtime)
- [安装概览](/zh-CN/install)
