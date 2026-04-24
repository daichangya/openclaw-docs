---
read_when:
    - Kubernetes 클러스터에서 OpenClaw를 실행하려고 합니다.
    - Kubernetes 환경에서 OpenClaw를 테스트하려고 합니다.
summary: Kustomize로 OpenClaw Gateway를 Kubernetes 클러스터에 배포ിക്കുക
title: Kubernetes
x-i18n:
    generated_at: "2026-04-24T06:21:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 15
---

# Kubernetes에서 OpenClaw

Kubernetes에서 OpenClaw를 실행하기 위한 최소 시작점입니다. 프로덕션 준비 배포는 아니며, 핵심 리소스만 다루고 환경에 맞게 수정하도록 의도되었습니다.

## 왜 Helm이 아닌가요?

OpenClaw는 몇 개의 config 파일이 있는 단일 컨테이너입니다. 진짜 흥미로운 사용자 지정은 인프라 템플릿이 아니라 에이전트 콘텐츠(markdown 파일, Skills, config 재정의)에 있습니다. Kustomize는 Helm chart의 오버헤드 없이 오버레이를 처리할 수 있습니다. 배포가 더 복잡해지면 이 매니페스트 위에 Helm chart를 얹을 수 있습니다.

## 필요한 것

- 실행 중인 Kubernetes 클러스터(AKS, EKS, GKE, k3s, kind, OpenShift 등)
- 클러스터에 연결된 `kubectl`
- 최소 하나의 모델 제공자에 대한 API key

## 빠른 시작

```bash
# 제공자에 맞게 교체: ANTHROPIC, GEMINI, OPENAI, 또는 OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Control UI용 구성된 공유 비밀을 가져오세요. 이 배포 스크립트는
기본적으로 token 인증을 생성합니다.

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

로컬 디버깅용으로는 `./scripts/k8s/deploy.sh --show-token`이 배포 후 token을 출력합니다.

## Kind로 로컬 테스트

클러스터가 없다면 [Kind](https://kind.sigs.k8s.io/)로 로컬에서 생성하세요.

```bash
./scripts/k8s/create-kind.sh           # docker 또는 podman 자동 감지
./scripts/k8s/create-kind.sh --delete  # 삭제
```

그런 다음 평소처럼 `./scripts/k8s/deploy.sh`로 배포하세요.

## 단계별 안내

### 1) 배포

**옵션 A** — 환경 변수에 API key를 넣는 방식(한 단계):

```bash
# 제공자에 맞게 교체: ANTHROPIC, GEMINI, OPENAI, 또는 OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

이 스크립트는 API key와 자동 생성된 gateway token이 들어 있는 Kubernetes Secret을 생성한 다음 배포를 수행합니다. Secret이 이미 존재하면 현재 gateway token과 변경하지 않는 제공자 key는 그대로 유지합니다.

**옵션 B** — Secret을 별도로 생성:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

로컬 테스트를 위해 token을 stdout에 출력하고 싶다면 두 명령 모두에 `--show-token`을 사용할 수 있습니다.

### 2) gateway 접근

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## 무엇이 배포되는가

```
Namespace: openclaw (OPENCLAW_NAMESPACE로 구성 가능)
├── Deployment/openclaw        # 단일 Pod, init container + gateway
├── Service/openclaw           # 포트 18789의 ClusterIP
├── PersistentVolumeClaim      # agent 상태와 config용 10Gi
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## 사용자 지정

### 에이전트 지침

`scripts/k8s/manifests/configmap.yaml`의 `AGENTS.md`를 수정하고 다시 배포하세요.

```bash
./scripts/k8s/deploy.sh
```

### Gateway config

`scripts/k8s/manifests/configmap.yaml`의 `openclaw.json`을 수정하세요. 전체 참조는 [Gateway 구성](/ko/gateway/configuration)을 참조하세요.

### 제공자 추가

추가 key를 export한 뒤 다시 실행하세요.

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

기존 제공자 key는 덮어쓰지 않는 한 Secret에 그대로 유지됩니다.

또는 Secret을 직접 patch하세요.

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### 커스텀 namespace

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### 커스텀 이미지

`scripts/k8s/manifests/deployment.yaml`의 `image` 필드를 수정하세요.

```yaml
image: ghcr.io/openclaw/openclaw:latest # 또는 https://github.com/openclaw/openclaw/releases 의 특정 버전으로 고정
```

### port-forward를 넘어 노출하기

기본 매니페스트는 Pod 내부에서 gateway를 loopback에 바인딩합니다. 이는 `kubectl port-forward`에서는 동작하지만, Pod IP에 도달해야 하는 Kubernetes `Service` 또는 Ingress 경로에서는 동작하지 않습니다.

Ingress 또는 load balancer를 통해 gateway를 노출하고 싶다면:

- `scripts/k8s/manifests/configmap.yaml`에서 gateway bind를 `loopback`에서 배포 모델에 맞는 non-loopback bind로 변경
- gateway 인증은 계속 활성화하고, 적절한 TLS 종료 엔트리포인트 사용
- 지원되는 웹 보안 모델(예: HTTPS/Tailscale Serve 및 필요 시 명시적 allowed origins)을 사용해 원격 액세스용 Control UI 구성

## 재배포

```bash
./scripts/k8s/deploy.sh
```

이렇게 하면 모든 매니페스트가 적용되고 Pod가 재시작되어 config 또는 secret 변경 사항을 반영합니다.

## 제거

```bash
./scripts/k8s/deploy.sh --delete
```

이렇게 하면 namespace와 그 안의 모든 리소스(PVC 포함)가 삭제됩니다.

## 아키텍처 참고

- gateway는 기본적으로 Pod 내부 loopback에 바인딩되므로, 포함된 설정은 `kubectl port-forward`용입니다.
- 클러스터 범위 리소스 없음 — 모든 것이 하나의 namespace 안에 존재
- 보안: `readOnlyRootFilesystem`, `drop: ALL` capability, non-root 사용자(UID 1000)
- 기본 config는 Control UI를 더 안전한 로컬 액세스 경로(127.0.0.1:18789로의 loopback bind + `kubectl port-forward`)에 유지합니다.
- localhost 액세스를 넘어가려면 지원되는 원격 모델(HTTPS/Tailscale + 적절한 gateway bind 및 Control UI origin 설정)을 사용하세요.
- Secret은 임시 디렉터리에서 생성되어 클러스터에 직접 적용되므로, 비밀 정보는 repo 체크아웃에 기록되지 않습니다.

## 파일 구조

```
scripts/k8s/
├── deploy.sh                   # namespace + secret 생성, kustomize로 배포
├── create-kind.sh              # 로컬 Kind 클러스터(docker/podman 자동 감지)
└── manifests/
    ├── kustomization.yaml      # Kustomize base
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # 보안 하드닝이 포함된 Pod spec
    ├── pvc.yaml                # 10Gi 영구 스토리지
    └── service.yaml            # 18789의 ClusterIP
```

## 관련 항목

- [Docker](/ko/install/docker)
- [Docker VM 런타임](/ko/install/docker-vm-runtime)
- [설치 개요](/ko/install)
