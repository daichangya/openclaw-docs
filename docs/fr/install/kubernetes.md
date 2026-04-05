---
read_when:
    - Vous souhaitez exécuter OpenClaw sur un cluster Kubernetes
    - Vous souhaitez tester OpenClaw dans un environnement Kubernetes
summary: Déployer OpenClaw Gateway sur un cluster Kubernetes avec Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-05T12:46:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa39127de5a5571f117db3a1bfefd5815b5e6b594cc1df553e30fda882b2a408
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw sur Kubernetes

Un point de départ minimal pour exécuter OpenClaw sur Kubernetes — pas un déploiement prêt pour la production. Il couvre les ressources principales et doit être adapté à votre environnement.

## Pourquoi pas Helm ?

OpenClaw est un conteneur unique avec quelques fichiers de configuration. La personnalisation intéressante se situe dans le contenu des agents (fichiers markdown, Skills, remplacements de configuration), pas dans le templating d’infrastructure. Kustomize gère les overlays sans le surcoût d’un chart Helm. Si votre déploiement devient plus complexe, un chart Helm peut être ajouté par-dessus ces manifestes.

## Ce dont vous avez besoin

- Un cluster Kubernetes en fonctionnement (AKS, EKS, GKE, k3s, kind, OpenShift, etc.)
- `kubectl` connecté à votre cluster
- Une clé API pour au moins un fournisseur de modèles

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

## Test local avec Kind

Si vous n’avez pas de cluster, créez-en un localement avec [Kind](https://kind.sigs.k8s.io/) :

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Déployez ensuite normalement avec `./scripts/k8s/deploy.sh`.

## Étape par étape

### 1) Déployer

**Option A** — clé API dans l’environnement (une étape) :

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Le script crée un Secret Kubernetes avec la clé API et un jeton de passerelle généré automatiquement, puis déploie. Si le Secret existe déjà, il conserve le jeton de passerelle actuel et toutes les clés de fournisseur qui ne sont pas en cours de modification.

**Option B** — créer le secret séparément :

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Utilisez `--show-token` avec l’une ou l’autre commande si vous voulez que le jeton soit affiché sur stdout pour les tests locaux.

### 2) Accéder à la passerelle

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

### Instructions de l’agent

Modifiez le `AGENTS.md` dans `scripts/k8s/manifests/configmap.yaml` puis redéployez :

```bash
./scripts/k8s/deploy.sh
```

### Configuration de la passerelle

Modifiez `openclaw.json` dans `scripts/k8s/manifests/configmap.yaml`. Consultez [Configuration de la passerelle](/gateway/configuration) pour la référence complète.

### Ajouter des fournisseurs

Relancez avec des clés supplémentaires exportées :

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Les clés de fournisseur existantes restent dans le Secret sauf si vous les écrasez.

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

Les manifestes par défaut lient la passerelle à loopback à l’intérieur du pod. Cela fonctionne avec `kubectl port-forward`, mais pas avec un `Service` Kubernetes ou un chemin Ingress qui doit atteindre l’IP du pod.

Si vous souhaitez exposer la passerelle via un Ingress ou un équilibreur de charge :

- Modifiez la liaison de la passerelle dans `scripts/k8s/manifests/configmap.yaml` de `loopback` vers une liaison non loopback adaptée à votre modèle de déploiement
- Conservez l’authentification de la passerelle activée et utilisez un point d’entrée correctement terminé en TLS
- Configurez l’interface de contrôle pour l’accès distant en utilisant le modèle de sécurité web pris en charge (par exemple HTTPS/Tailscale Serve et origines autorisées explicites si nécessaire)

## Redéployer

```bash
./scripts/k8s/deploy.sh
```

Cela applique tous les manifestes et redémarre le pod afin de prendre en compte toute modification de configuration ou de secret.

## Démontage

```bash
./scripts/k8s/deploy.sh --delete
```

Cela supprime le namespace et toutes les ressources qu’il contient, y compris le PVC.

## Remarques d’architecture

- La passerelle est liée à loopback à l’intérieur du pod par défaut, donc la configuration incluse est prévue pour `kubectl port-forward`
- Aucune ressource à portée cluster — tout vit dans un seul namespace
- Sécurité : `readOnlyRootFilesystem`, capacités `drop: ALL`, utilisateur non root (UID 1000)
- La configuration par défaut garde l’interface de contrôle sur le chemin d’accès local le plus sûr : liaison loopback plus `kubectl port-forward` vers `http://127.0.0.1:18789`
- Si vous dépassez l’accès localhost, utilisez le modèle distant pris en charge : HTTPS/Tailscale plus la liaison de passerelle appropriée et les paramètres d’origine de l’interface de contrôle
- Les secrets sont générés dans un répertoire temporaire puis appliqués directement au cluster — aucun secret n’est écrit dans la copie du dépôt

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
