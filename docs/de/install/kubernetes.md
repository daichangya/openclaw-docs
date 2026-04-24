---
read_when:
    - Sie möchten OpenClaw in einem Kubernetes-Cluster ausführen.
    - Sie möchten OpenClaw in einer Kubernetes-Umgebung testen.
summary: OpenClaw Gateway mit Kustomize in einem Kubernetes-Cluster bereitstellen
title: Kubernetes
x-i18n:
    generated_at: "2026-04-24T06:44:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw auf Kubernetes

Ein minimaler Ausgangspunkt, um OpenClaw auf Kubernetes auszuführen — keine produktionsreife Bereitstellung. Er deckt die Kernressourcen ab und soll an Ihre Umgebung angepasst werden.

## Warum nicht Helm?

OpenClaw ist ein einzelner Container mit einigen Konfigurationsdateien. Die interessante Anpassung liegt im Agent-Inhalt (Markdown-Dateien, Skills, Konfigurationsüberschreibungen), nicht im Infrastruktur-Templating. Kustomize verarbeitet Overlays ohne den Overhead eines Helm-Charts. Wenn Ihre Bereitstellung komplexer wird, kann ein Helm-Chart auf diese Manifeste aufgesetzt werden.

## Was Sie brauchen

- Einen laufenden Kubernetes-Cluster (AKS, EKS, GKE, k3s, kind, OpenShift usw.)
- `kubectl`, das mit Ihrem Cluster verbunden ist
- Einen API-Key für mindestens einen Modell-Provider

## Schnellstart

```bash
# Durch Ihren Provider ersetzen: ANTHROPIC, GEMINI, OPENAI oder OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Rufen Sie das konfigurierte Shared Secret für die Control UI ab. Dieses Deploy-Skript
erstellt standardmäßig Token-Authentifizierung:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Für lokales Debugging gibt `./scripts/k8s/deploy.sh --show-token` das Token nach der Bereitstellung aus.

## Lokales Testen mit Kind

Wenn Sie keinen Cluster haben, erstellen Sie lokal einen mit [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # erkennt docker oder podman automatisch
./scripts/k8s/create-kind.sh --delete  # abbauen
```

Stellen Sie dann wie gewohnt mit `./scripts/k8s/deploy.sh` bereit.

## Schritt für Schritt

### 1) Bereitstellen

**Option A** — API-Key in der Umgebung (ein Schritt):

```bash
# Durch Ihren Provider ersetzen: ANTHROPIC, GEMINI, OPENAI oder OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Das Skript erstellt ein Kubernetes-Secret mit dem API-Key und einem automatisch generierten Gateway-Token und führt dann die Bereitstellung aus. Wenn das Secret bereits existiert, behält es das aktuelle Gateway-Token und alle Provider-Keys, die nicht geändert werden.

**Option B** — das Secret separat erstellen:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Verwenden Sie bei beiden Befehlen `--show-token`, wenn das Token für lokales Testen nach stdout ausgegeben werden soll.

### 2) Auf das Gateway zugreifen

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Was bereitgestellt wird

```
Namespace: openclaw (konfigurierbar über OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Einzelner Pod, Init-Container + Gateway
├── Service/openclaw           # ClusterIP auf Port 18789
├── PersistentVolumeClaim      # 10Gi für Agent-Status und Konfiguration
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway-Token + API-Keys
```

## Anpassung

### Agent-Anweisungen

Bearbeiten Sie `AGENTS.md` in `scripts/k8s/manifests/configmap.yaml` und stellen Sie erneut bereit:

```bash
./scripts/k8s/deploy.sh
```

### Gateway-Konfiguration

Bearbeiten Sie `openclaw.json` in `scripts/k8s/manifests/configmap.yaml`. Die vollständige Referenz finden Sie unter [Gateway-Konfiguration](/de/gateway/configuration).

### Provider hinzufügen

Führen Sie das Skript erneut aus, nachdem Sie zusätzliche Keys exportiert haben:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Vorhandene Provider-Keys bleiben im Secret, sofern Sie sie nicht überschreiben.

Oder patchen Sie das Secret direkt:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Benutzerdefinierter Namespace

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Benutzerdefiniertes Image

Bearbeiten Sie das Feld `image` in `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # oder auf eine bestimmte Version aus https://github.com/openclaw/openclaw/releases festlegen
```

### Über Port-Forward hinaus exponieren

Die Standard-Manifeste binden das Gateway innerhalb des Pods an loopback. Das funktioniert mit `kubectl port-forward`, aber nicht mit einem Kubernetes-`Service` oder einem Ingress-Pfad, der die Pod-IP erreichen muss.

Wenn Sie das Gateway über einen Ingress oder einen Load Balancer exponieren möchten:

- Ändern Sie den Gateway-Bind in `scripts/k8s/manifests/configmap.yaml` von `loopback` auf einen Nicht-loopback-Bind, der zu Ihrem Bereitstellungsmodell passt
- Lassen Sie Gateway-Authentifizierung aktiviert und verwenden Sie einen geeigneten TLS-terminierten Entry Point
- Konfigurieren Sie die Control UI für Remote-Zugriff mithilfe des unterstützten Web-Sicherheitsmodells (zum Beispiel HTTPS/Tailscale Serve und bei Bedarf explizite erlaubte Origins)

## Neu bereitstellen

```bash
./scripts/k8s/deploy.sh
```

Dadurch werden alle Manifeste angewendet und der Pod neu gestartet, damit Änderungen an Konfiguration oder Secrets übernommen werden.

## Abbau

```bash
./scripts/k8s/deploy.sh --delete
```

Dadurch werden der Namespace und alle darin enthaltenen Ressourcen gelöscht, einschließlich des PVC.

## Hinweise zur Architektur

- Das Gateway bindet standardmäßig innerhalb des Pods an loopback, sodass das enthaltene Setup für `kubectl port-forward` gedacht ist
- Keine clusterweiten Ressourcen — alles lebt in einem einzelnen Namespace
- Sicherheit: `readOnlyRootFilesystem`, `drop: ALL`-Capabilities, Nicht-Root-Benutzer (UID 1000)
- Die Standardkonfiguration hält die Control UI auf dem sichereren Pfad für lokalen Zugriff: loopback-Bind plus `kubectl port-forward` nach `http://127.0.0.1:18789`
- Wenn Sie über Localhost-Zugriff hinausgehen, verwenden Sie das unterstützte Remote-Modell: HTTPS/Tailscale plus den passenden Gateway-Bind und Einstellungen für die Origin der Control UI
- Secrets werden in einem temporären Verzeichnis generiert und direkt auf den Cluster angewendet — kein Secret-Material wird in den Repo-Checkout geschrieben

## Dateistruktur

```
scripts/k8s/
├── deploy.sh                   # Erstellt Namespace + Secret, stellt über kustomize bereit
├── create-kind.sh              # Lokaler Kind-Cluster (erkennt docker/podman automatisch)
└── manifests/
    ├── kustomization.yaml      # Kustomize-Basis
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Pod-Spezifikation mit Sicherheitshärtung
    ├── pvc.yaml                # 10Gi persistenter Speicher
    └── service.yaml            # ClusterIP auf 18789
```

## Verwandt

- [Docker](/de/install/docker)
- [Docker VM runtime](/de/install/docker-vm-runtime)
- [Installationsübersicht](/de/install)
