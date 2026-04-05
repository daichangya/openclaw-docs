---
read_when:
    - Você quer executar o OpenClaw em um cluster Kubernetes
    - Você quer testar o OpenClaw em um ambiente Kubernetes
summary: Implantar o OpenClaw Gateway em um cluster Kubernetes com Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-05T12:45:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa39127de5a5571f117db3a1bfefd5815b5e6b594cc1df553e30fda882b2a408
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw no Kubernetes

Um ponto de partida mínimo para executar o OpenClaw no Kubernetes — não é uma implantação pronta para produção. Ele cobre os recursos principais e foi pensado para ser adaptado ao seu ambiente.

## Por que não Helm?

O OpenClaw é um único contêiner com alguns arquivos de configuração. A personalização interessante está no conteúdo do agente (arquivos markdown, Skills, substituições de configuração), não em templates de infraestrutura. O Kustomize lida com overlays sem a sobrecarga de um chart Helm. Se a sua implantação ficar mais complexa, um chart Helm pode ser colocado por cima destes manifests.

## O que você precisa

- Um cluster Kubernetes em execução (AKS, EKS, GKE, k3s, kind, OpenShift etc.)
- `kubectl` conectado ao seu cluster
- Uma chave de API para pelo menos um provedor de modelos

## Início rápido

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Recupere o segredo compartilhado configurado para a Control UI. Este script de implantação
cria autenticação por token por padrão:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Para depuração local, `./scripts/k8s/deploy.sh --show-token` imprime o token após a implantação.

## Teste local com Kind

Se você não tiver um cluster, crie um localmente com [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # detecta automaticamente docker ou podman
./scripts/k8s/create-kind.sh --delete  # desmonta
```

Depois, implante normalmente com `./scripts/k8s/deploy.sh`.

## Passo a passo

### 1) Implantar

**Opção A** — chave de API no ambiente (uma etapa):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

O script cria um Secret do Kubernetes com a chave de API e um token do gateway gerado automaticamente, depois faz a implantação. Se o Secret já existir, ele preserva o token atual do gateway e quaisquer chaves de provedor que não estejam sendo alteradas.

**Opção B** — criar o secret separadamente:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Use `--show-token` com qualquer um dos comandos se quiser que o token seja impresso em stdout para testes locais.

### 2) Acessar o gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## O que é implantado

```
Namespace: openclaw (configurável via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Pod único, init container + gateway
├── Service/openclaw           # ClusterIP na porta 18789
├── PersistentVolumeClaim      # 10Gi para estado e configuração do agente
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Token do gateway + chaves de API
```

## Personalização

### Instruções do agente

Edite o `AGENTS.md` em `scripts/k8s/manifests/configmap.yaml` e reimplante:

```bash
./scripts/k8s/deploy.sh
```

### Configuração do gateway

Edite `openclaw.json` em `scripts/k8s/manifests/configmap.yaml`. Consulte [Configuração do Gateway](/gateway/configuration) para a referência completa.

### Adicionar provedores

Execute novamente com chaves adicionais exportadas:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

As chaves de provedores existentes permanecem no Secret, a menos que você as sobrescreva.

Ou faça patch do Secret diretamente:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Namespace personalizado

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Imagem personalizada

Edite o campo `image` em `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # ou fixe em uma versão específica de https://github.com/openclaw/openclaw/releases
```

### Expor além de port-forward

Os manifests padrão vinculam o gateway ao loopback dentro do pod. Isso funciona com `kubectl port-forward`, mas não funciona com um `Service` ou caminho de Ingress do Kubernetes que precise alcançar o IP do pod.

Se você quiser expor o gateway por meio de um Ingress ou load balancer:

- Altere o bind do gateway em `scripts/k8s/manifests/configmap.yaml` de `loopback` para um bind não loopback que corresponda ao seu modelo de implantação
- Mantenha a autenticação do gateway habilitada e use um ponto de entrada com terminação TLS adequado
- Configure a Control UI para acesso remoto usando o modelo de segurança web compatível (por exemplo HTTPS/Tailscale Serve e origens permitidas explícitas quando necessário)

## Reimplantar

```bash
./scripts/k8s/deploy.sh
```

Isso aplica todos os manifests e reinicia o pod para incorporar quaisquer mudanças de configuração ou secret.

## Desmontar

```bash
./scripts/k8s/deploy.sh --delete
```

Isso exclui o namespace e todos os recursos nele, incluindo o PVC.

## Observações de arquitetura

- O gateway é vinculado ao loopback dentro do pod por padrão, então a configuração incluída é para `kubectl port-forward`
- Sem recursos com escopo de cluster — tudo fica em um único namespace
- Segurança: `readOnlyRootFilesystem`, capacidades `drop: ALL`, usuário sem root (UID 1000)
- A configuração padrão mantém a Control UI no caminho mais seguro de acesso local: bind em loopback mais `kubectl port-forward` para `http://127.0.0.1:18789`
- Se você for além do acesso por localhost, use o modelo remoto compatível: HTTPS/Tailscale mais o bind apropriado do gateway e as configurações de origem da Control UI
- Secrets são gerados em um diretório temporário e aplicados diretamente ao cluster — nenhum material secreto é gravado no checkout do repositório

## Estrutura de arquivos

```
scripts/k8s/
├── deploy.sh                   # Cria namespace + secret, implanta via kustomize
├── create-kind.sh              # Cluster Kind local (detecta automaticamente docker/podman)
└── manifests/
    ├── kustomization.yaml      # Base do Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Especificação do pod com reforço de segurança
    ├── pvc.yaml                # 10Gi de armazenamento persistente
    └── service.yaml            # ClusterIP em 18789
```
