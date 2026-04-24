---
read_when:
    - Ви хочете запустити OpenClaw у кластері Kubernetes
    - Ви хочете протестувати OpenClaw у середовищі Kubernetes
summary: Розгорніть Gateway OpenClaw у кластері Kubernetes за допомогою Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-24T03:19:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw у Kubernetes

Мінімальна стартова точка для запуску OpenClaw у Kubernetes — не готове до production розгортання. Вона охоплює основні ресурси й призначена для адаптації до вашого середовища.

## Чому не Helm?

OpenClaw — це один контейнер із кількома конфігураційними файлами. Цікаве налаштування тут полягає у вмісті агентів (markdown-файли, Skills, перевизначення конфігурації), а не в шаблонізації інфраструктури. Kustomize обробляє overlays без накладних витрат Helm chart. Якщо ваше розгортання стане складнішим, поверх цих маніфестів можна додати Helm chart.

## Що вам потрібно

- запущений кластер Kubernetes (AKS, EKS, GKE, k3s, kind, OpenShift тощо)
- `kubectl`, підключений до вашого кластера
- API key принаймні для одного провайдера моделей

## Швидкий старт

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Отримайте налаштований спільний секрет для Control UI. Цей скрипт розгортання
типово створює автентифікацію token:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Для локального налагодження `./scripts/k8s/deploy.sh --show-token` виводить token після розгортання.

## Локальне тестування з Kind

Якщо у вас немає кластера, створіть його локально за допомогою [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Потім розгорніть як зазвичай через `./scripts/k8s/deploy.sh`.

## Покроково

### 1) Розгортання

**Варіант A** — API key у середовищі (один крок):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Скрипт створює Kubernetes Secret з API key і автоматично згенерованим token gateway, а потім виконує розгортання. Якщо Secret уже існує, він зберігає поточний token gateway і всі ключі провайдерів, які не змінюються.

**Варіант B** — створіть secret окремо:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Використовуйте `--show-token` з будь-якою командою, якщо хочете вивести token у stdout для локального тестування.

### 2) Доступ до gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Що буде розгорнуто

```
Namespace: openclaw (можна налаштувати через OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Один pod, init container + gateway
├── Service/openclaw           # ClusterIP на порту 18789
├── PersistentVolumeClaim      # 10Gi для стану агента і конфігурації
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Токен Gateway + API keys
```

## Налаштування

### Інструкції агента

Відредагуйте `AGENTS.md` у `scripts/k8s/manifests/configmap.yaml` і виконайте повторне розгортання:

```bash
./scripts/k8s/deploy.sh
```

### Конфігурація gateway

Відредагуйте `openclaw.json` у `scripts/k8s/manifests/configmap.yaml`. Повний довідник див. у [Конфігурація Gateway](/uk/gateway/configuration).

### Додайте провайдерів

Повторно запустіть, експортувавши додаткові ключі:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Наявні ключі провайдерів залишаються в Secret, якщо ви їх не перезаписуєте.

Або змініть Secret безпосередньо:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Власний namespace

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Власний образ

Відредагуйте поле `image` у `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # or pin to a specific version from https://github.com/openclaw/openclaw/releases
```

### Відкриття доступу за межами port-forward

Типові маніфести прив’язують gateway до loopback усередині pod. Це працює з `kubectl port-forward`, але не працює з Kubernetes `Service` або шляхом Ingress, яким потрібно досягти IP pod.

Якщо ви хочете відкрити gateway через Ingress або балансувальник навантаження:

- Змініть прив’язку gateway у `scripts/k8s/manifests/configmap.yaml` з `loopback` на не-loopback прив’язку, що відповідає вашій моделі розгортання
- Залиште автентифікацію gateway увімкненою та використовуйте належну точку входу з термінацією TLS
- Налаштуйте Control UI для віддаленого доступу, використовуючи підтримувану модель безпеки web (наприклад HTTPS/Tailscale Serve та за потреби явні дозволені origin)

## Повторне розгортання

```bash
./scripts/k8s/deploy.sh
```

Це застосовує всі маніфести та перезапускає pod, щоб підхопити будь-які зміни конфігурації чи secret.

## Видалення

```bash
./scripts/k8s/deploy.sh --delete
```

Це видаляє namespace і всі ресурси в ньому, включно з PVC.

## Примітки щодо архітектури

- gateway типово прив’язується до loopback усередині pod, тому наведена конфігурація призначена для `kubectl port-forward`
- Немає ресурсів рівня кластера — усе живе в одному namespace
- Безпека: `readOnlyRootFilesystem`, можливості `drop: ALL`, користувач без root (UID 1000)
- Типова конфігурація залишає Control UI на безпечнішому шляху локального доступу: прив’язка loopback плюс `kubectl port-forward` до `http://127.0.0.1:18789`
- Якщо ви виходите за межі доступу через localhost, використовуйте підтримувану віддалену модель: HTTPS/Tailscale плюс відповідна прив’язка gateway і налаштування origin для Control UI
- Secrets генеруються в тимчасовому каталозі та застосовуються безпосередньо до кластера — жоден секретний матеріал не записується до checkout репозиторію

## Структура файлів

```
scripts/k8s/
├── deploy.sh                   # Створює namespace + secret, розгортає через kustomize
├── create-kind.sh              # Локальний кластер Kind (автовизначення docker/podman)
└── manifests/
    ├── kustomization.yaml      # База Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Специфікація Pod із посиленим захистом
    ├── pvc.yaml                # 10Gi постійного сховища
    └── service.yaml            # ClusterIP на 18789
```

## Пов’язане

- [Docker](/uk/install/docker)
- [Середовище виконання Docker VM](/uk/install/docker-vm-runtime)
- [Огляд встановлення](/uk/install)
