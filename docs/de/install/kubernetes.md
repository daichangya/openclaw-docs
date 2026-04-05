---
read_when:
    - Sie OpenClaw in einem Kubernetes-Cluster ausführen möchten
    - Sie OpenClaw in einer Kubernetes-Umgebung testen möchten
summary: OpenClaw Gateway mit Kustomize in einem Kubernetes-Cluster bereitstellen
title: Kubernetes
x-i18n:
    generated_at: "2026-04-05T12:46:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa39127de5a5571f117db3a1bfefd5815b5e6b594cc1df553e30fda882b2a408
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw auf Kubernetes

Ein minimaler Ausgangspunkt für das Ausführen von OpenClaw auf Kubernetes — keine produktionsreife Bereitstellung. Er deckt die Kernressourcen ab und soll an Ihre Umgebung angepasst werden.

## Warum nicht Helm?

OpenClaw ist ein einzelner Container mit einigen Konfigurationsdateien. Die interessante Anpassung liegt im Agent-Inhalt (Markdown-Dateien, Skills, Konfigurationsüberschreibungen), nicht im Templating der Infrastruktur. Kustomize verarbeitet Overlays ohne den Overhead eines Helm-Charts. Wenn Ihre Bereitstellung komplexer wird, kann ein Helm-Chart auf diese Manifeste aufgesetzt werden.

## Was Sie brauchen

- Einen laufenden Kubernetes-Cluster (AKS, EKS, GKE, k3s, kind, OpenShift usw.)
- `kubectl`, verbunden mit Ihrem Cluster
- Einen API-Schlüssel für mindestens einen Modell-Provider

## Schnellstart

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Rufen Sie das konfigurierte gemeinsame Geheimnis für die Control UI ab. Dieses Bereitstellungsskript
erstellt standardmäßig Token-Auth:

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

**Option A** — API-Schlüssel in der Umgebung (ein Schritt):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Das Skript erstellt ein Kubernetes-Secret mit dem API-Schlüssel und einem automatisch generierten Gateway-Token und stellt dann bereit. Wenn das Secret bereits existiert, behält es das aktuelle Gateway-Token und alle Provider-Schlüssel bei, die nicht geändert werden.

**Option B** — das Secret separat erstellen:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Verwenden Sie bei beiden Befehlen `--show-token`, wenn das Token für lokales Testen auf stdout ausgegeben werden soll.

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
└── Secret/openclaw-secrets    # Gateway-Token + API-Schlüssel
```

## Anpassung

### Agent-Anweisungen

Bearbeiten Sie `AGENTS.md` in `scripts/k8s/manifests/configmap.yaml` und stellen Sie erneut bereit:

```bash
./scripts/k8s/deploy.sh
```

### Gateway-Konfiguration

Bearbeiten Sie `openclaw.json` in `scripts/k8s/manifests/configmap.yaml`. Die vollständige Referenz finden Sie unter [Gateway-Konfiguration](/gateway/configuration).

### Provider hinzufügen

Führen Sie die Bereitstellung erneut mit zusätzlich exportierten Schlüsseln aus:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Vorhandene Provider-Schlüssel bleiben im Secret, solange Sie sie nicht überschreiben.

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
image: ghcr.io/openclaw/openclaw:latest # oder auf eine bestimmte Version aus https://github.com/openclaw/openclaw/releases fixieren
```

### Über Port-Forwarding hinaus verfügbar machen

Die Standardmanifeste binden das Gateway innerhalb des Pods an Loopback. Das funktioniert mit `kubectl port-forward`, aber nicht mit einem Kubernetes-`Service`- oder Ingress-Pfad, der die Pod-IP erreichen muss.

Wenn Sie das Gateway über einen Ingress oder Load Balancer verfügbar machen möchten:

- Ändern Sie die Gateway-Bindung in `scripts/k8s/manifests/configmap.yaml` von `loopback` auf ein Nicht-Loopback-Binding, das zu Ihrem Bereitstellungsmodell passt
- Lassen Sie Gateway-Auth aktiviert und verwenden Sie einen korrekt TLS-terminierten Einstiegspunkt
- Konfigurieren Sie die Control UI für Remote-Zugriff mit dem unterstützten Web-Sicherheitsmodell (zum Beispiel HTTPS/Tailscale Serve und bei Bedarf explizite erlaubte Origins)

## Erneut bereitstellen

```bash
./scripts/k8s/deploy.sh
```

Dadurch werden alle Manifeste angewendet und der Pod neu gestartet, um Änderungen an Konfiguration oder Secrets zu übernehmen.

## Abbau

```bash
./scripts/k8s/deploy.sh --delete
```

Dadurch werden der Namespace und alle darin enthaltenen Ressourcen gelöscht, einschließlich des PVC.

## Hinweise zur Architektur

- Das Gateway bindet standardmäßig innerhalb des Pods an Loopback, daher ist das enthaltene Setup für `kubectl port-forward` gedacht
- Keine clusterweiten Ressourcen — alles lebt in einem einzigen Namespace
- Sicherheit: `readOnlyRootFilesystem`, Capabilities `drop: ALL`, Nicht-Root-Benutzer (UID 1000)
- Die Standardkonfiguration hält die Control UI auf dem sichereren Pfad für lokalen Zugriff: Loopback-Bindung plus `kubectl port-forward` nach `http://127.0.0.1:18789`
- Wenn Sie über localhost-Zugriff hinausgehen, verwenden Sie das unterstützte Remote-Modell: HTTPS/Tailscale plus die passende Gateway-Bindung und Einstellungen für die Control-UI-Origin
- Secrets werden in einem temporären Verzeichnis erzeugt und direkt auf den Cluster angewendet — kein Secret-Material wird in den Repository-Checkout geschrieben

## Dateistruktur

```
scripts/k8s/
├── deploy.sh                   # Erstellt Namespace + Secret, stellt über kustomize bereit
├── create-kind.sh              # Lokaler Kind-Cluster (erkennt docker/podman automatisch)
└── manifests/
    ├── kustomization.yaml      # Kustomize-Basis
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Pod-Spezifikation mit Sicherheits-Härtung
    ├── pvc.yaml                # 10Gi persistenter Speicher
    └── service.yaml            # ClusterIP auf 18789
```
