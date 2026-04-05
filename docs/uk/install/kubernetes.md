---
read_when:
    - Ви хочете запускати OpenClaw у кластері Kubernetes
    - Ви хочете протестувати OpenClaw у середовищі Kubernetes
summary: Розгортання OpenClaw Gateway у кластері Kubernetes за допомогою Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-05T18:07:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa39127de5a5571f117db3a1bfefd5815b5e6b594cc1df553e30fda882b2a408
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw у Kubernetes

Мінімальна стартова точка для запуску OpenClaw у Kubernetes — не production-ready розгортання. Вона охоплює базові ресурси й призначена для адаптації під ваше середовище.

## Чому не Helm?

OpenClaw — це один контейнер із кількома файлами конфігурації. Найцікавіша кастомізація — у вмісті агента (markdown-файли, Skills, перевизначення конфігурації), а не в шаблонізації інфраструктури. Kustomize обробляє overlays без накладних витрат Helm chart. Якщо ваше розгортання стане складнішим, Helm chart можна накласти поверх цих маніфестів.

## Що вам потрібно

- Працюючий кластер Kubernetes (AKS, EKS, GKE, k3s, kind, OpenShift тощо)
- `kubectl`, підключений до вашого кластера
- API-ключ щонайменше для одного провайдера моделей

## Швидкий старт

```bash
# Замініть на свого провайдера: ANTHROPIC, GEMINI, OPENAI або OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Отримайте налаштований спільний секрет для Control UI. Цей скрипт розгортання
типово створює автентифікацію за токеном:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Для локального налагодження `./scripts/k8s/deploy.sh --show-token` друкує токен після розгортання.

## Локальне тестування з Kind

Якщо у вас немає кластера, створіть його локально за допомогою [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # автоматично визначає docker або podman
./scripts/k8s/create-kind.sh --delete  # знищити
```

Після цього розгорніть як звичайно через `./scripts/k8s/deploy.sh`.

## Покроково

### 1) Розгортання

**Варіант A** — API-ключ у змінній середовища (в один крок):

```bash
# Замініть на свого провайдера: ANTHROPIC, GEMINI, OPENAI або OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Скрипт створює Secret Kubernetes з API-ключем і автоматично згенерованим токеном gateway, а потім виконує розгортання. Якщо Secret уже існує, він зберігає поточний токен gateway і всі ключі провайдерів, які не змінюються.

**Варіант B** — створити secret окремо:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Використовуйте `--show-token` з будь-якою командою, якщо хочете вивести токен у stdout для локального тестування.

### 2) Отримайте доступ до gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Що буде розгорнуто

```
Namespace: openclaw (налаштовується через OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Один pod, init container + gateway
├── Service/openclaw           # ClusterIP на порту 18789
├── PersistentVolumeClaim      # 10Gi для стану агента та конфігурації
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Токен Gateway + API-ключі
```

## Кастомізація

### Інструкції агента

Відредагуйте `AGENTS.md` у `scripts/k8s/manifests/configmap.yaml` і повторно розгорніть:

```bash
./scripts/k8s/deploy.sh
```

### Конфігурація Gateway

Відредагуйте `openclaw.json` у `scripts/k8s/manifests/configmap.yaml`. Повний довідник див. в [Конфігурація Gateway](/gateway/configuration).

### Додати провайдерів

Повторно запустіть із додатковими експортованими ключами:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Наявні ключі провайдерів залишаються в Secret, якщо ви їх не перезаписуєте.

Або змініть Secret напряму:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Кастомний namespace

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Кастомний образ

Відредагуйте поле `image` у `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # або зафіксуйте конкретну версію з https://github.com/openclaw/openclaw/releases
```

### Відкрити доступ не лише через port-forward

Типові маніфести прив’язують gateway до loopback усередині pod. Це працює з `kubectl port-forward`, але не працює з `Service` або шляхом Ingress у Kubernetes, яким потрібно дістатися IP pod.

Якщо ви хочете відкрити gateway через Ingress або load balancer:

- Змініть bind gateway у `scripts/k8s/manifests/configmap.yaml` з `loopback` на не-loopback bind, що відповідає вашій моделі розгортання
- Залиште автентифікацію gateway ввімкненою й використовуйте правильну точку входу з TLS termination
- Налаштуйте Control UI для віддаленого доступу за підтримуваною веб-моделлю безпеки (наприклад HTTPS/Tailscale Serve і явні allowed origins, якщо потрібно)

## Повторне розгортання

```bash
./scripts/k8s/deploy.sh
```

Це застосовує всі маніфести й перезапускає pod, щоб підхопити всі зміни конфігурації або secret.

## Видалення

```bash
./scripts/k8s/deploy.sh --delete
```

Це видаляє namespace і всі ресурси в ньому, включно з PVC.

## Примітки щодо архітектури

- Gateway типово прив’язується до loopback усередині pod, тому наведене налаштування призначене для `kubectl port-forward`
- Немає ресурсів рівня кластера — усе живе в одному namespace
- Безпека: `readOnlyRootFilesystem`, `drop: ALL` capabilities, непривілейований користувач (UID 1000)
- Типова конфігурація тримає Control UI на безпечнішому шляху локального доступу: bind до loopback плюс `kubectl port-forward` до `http://127.0.0.1:18789`
- Якщо ви виходите за межі localhost-доступу, використовуйте підтримувану віддалену модель: HTTPS/Tailscale плюс відповідний bind gateway і налаштування origin для Control UI
- Секрети генеруються в тимчасовому каталозі й застосовуються безпосередньо до кластера — жодні секретні дані не записуються в checkout репозиторію

## Структура файлів

```
scripts/k8s/
├── deploy.sh                   # Створює namespace + secret, розгортає через kustomize
├── create-kind.sh              # Локальний кластер Kind (автоматично визначає docker/podman)
└── manifests/
    ├── kustomization.yaml      # База Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Специфікація Pod з посиленням безпеки
    ├── pvc.yaml                # 10Gi сталого сховища
    └── service.yaml            # ClusterIP на 18789
```
