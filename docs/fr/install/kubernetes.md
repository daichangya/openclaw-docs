---
read_when:
    - Vous souhaitez exécuter OpenClaw sur un cluster Kubernetes
    - Vous souhaitez tester OpenClaw dans un environnement Kubernetes
summary: Déployer OpenClaw Gateway sur un cluster Kubernetes avec Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-24T07:17:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw sur Kubernetes

Un point de départ minimal pour exécuter OpenClaw sur Kubernetes — pas un déploiement prêt pour la production. Il couvre les ressources principales et doit être adapté à votre environnement.

## Pourquoi pas Helm ?

OpenClaw est un conteneur unique avec quelques fichiers de configuration. La personnalisation intéressante se situe dans le contenu des agents (fichiers markdown, Skills, surcharges de configuration), pas dans le templating de l’infrastructure. Kustomize gère les overlays sans la surcharge d’un chart Helm. Si votre déploiement devient plus complexe, un chart Helm peut être ajouté par-dessus ces manifestes.

## Ce dont vous avez besoin

- Un cluster Kubernetes en fonctionnement (AKS, EKS, GKE, k3s, kind, OpenShift, etc.)
- `kubectl` connecté à votre cluster
- Une clé API pour au moins un provider de modèle

## Démarrage rapide

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Récupérez le secret partagé configuré pour l’interface de contrôle. Ce script de déploiement
crée par défaut une authentification par jeton :

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Pour le débogage local, `./scripts/k8s/deploy.sh --show-token` affiche le jeton après le déploiement.

## Tests locaux avec Kind

Si vous n’avez pas de cluster, créez-en un localement avec [Kind](https://kind.sigs.k8s.io/) :

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Déployez ensuite normalement avec `./scripts/k8s/deploy.sh`.

## Étape par étape

### 1) Déployer

**Option A** — clé API dans l’environnement (une seule étape) :

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Le script crée un Secret Kubernetes avec la clé API et un jeton gateway généré automatiquement, puis déploie. Si le Secret existe déjà, il conserve le jeton gateway actuel et les clés provider qui ne sont pas modifiées.

**Option B** — créer le secret séparément :

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Utilisez `--show-token` avec l’une ou l’autre commande si vous voulez que le jeton soit affiché sur stdout pour les tests locaux.

### 2) Accéder au gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Ce qui est déployé

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Personnalisation

### Instructions d’agent

Modifiez `AGENTS.md` dans `scripts/k8s/manifests/configmap.yaml` puis redéployez :

```bash
./scripts/k8s/deploy.sh
```

### Configuration du Gateway

Modifiez `openclaw.json` dans `scripts/k8s/manifests/configmap.yaml`. Consultez [Configuration du Gateway](/fr/gateway/configuration) pour la référence complète.

### Ajouter des providers

Relancez avec des clés supplémentaires exportées :

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Les clés provider existantes restent dans le Secret à moins que vous ne les écrasiez.

Ou patcher directement le Secret :

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Namespace personnalisé

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Image personnalisée

Modifiez le champ `image` dans `scripts/k8s/manifests/deployment.yaml` :

```yaml
image: ghcr.io/openclaw/openclaw:latest # or pin to a specific version from https://github.com/openclaw/openclaw/releases
```

### Exposer au-delà de port-forward

Les manifestes par défaut lient le gateway à loopback à l’intérieur du pod. Cela fonctionne avec `kubectl port-forward`, mais pas avec un `Service` Kubernetes ou un chemin Ingress qui doit atteindre l’IP du pod.

Si vous voulez exposer le gateway via un Ingress ou un load balancer :

- Changez le bind du gateway dans `scripts/k8s/manifests/configmap.yaml` de `loopback` vers un bind non loopback correspondant à votre modèle de déploiement
- Gardez l’authentification gateway activée et utilisez un point d’entrée correctement terminé en TLS
- Configurez l’interface de contrôle pour l’accès distant à l’aide du modèle de sécurité web pris en charge (par exemple HTTPS/Tailscale Serve et origines autorisées explicites si nécessaire)

## Redéployer

```bash
./scripts/k8s/deploy.sh
```

Cela applique tous les manifestes et redémarre le pod afin de prendre en compte tout changement de configuration ou de secret.

## Suppression

```bash
./scripts/k8s/deploy.sh --delete
```

Cela supprime le namespace et toutes les ressources qu’il contient, y compris le PVC.

## Notes d’architecture

- Le gateway se lie par défaut à loopback à l’intérieur du pod, donc la configuration incluse est destinée à `kubectl port-forward`
- Aucune ressource à portée cluster — tout vit dans un seul namespace
- Sécurité : `readOnlyRootFilesystem`, capacités `drop: ALL`, utilisateur non root (UID 1000)
- La configuration par défaut maintient l’interface de contrôle sur le chemin d’accès local le plus sûr : bind loopback plus `kubectl port-forward` vers `http://127.0.0.1:18789`
- Si vous allez au-delà de l’accès localhost, utilisez le modèle distant pris en charge : HTTPS/Tailscale plus le bind gateway approprié et les paramètres d’origine de l’interface de contrôle
- Les secrets sont générés dans un répertoire temporaire et appliqués directement au cluster — aucun secret n’est écrit dans le checkout du dépôt

## Structure des fichiers

```
scripts/k8s/
├── deploy.sh                   # Creates namespace + secret, deploys via kustomize
├── create-kind.sh              # Local Kind cluster (auto-detects docker/podman)
└── manifests/
    ├── kustomization.yaml      # Kustomize base
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Pod spec with security hardening
    ├── pvc.yaml                # 10Gi persistent storage
    └── service.yaml            # ClusterIP on 18789
```

## Lié

- [Docker](/fr/install/docker)
- [Runtime Docker VM](/fr/install/docker-vm-runtime)
- [Vue d’ensemble de l’installation](/fr/install)
