---
read_when:
    - คุณต้องการรัน OpenClaw บนคลัสเตอร์ Kubernetes
    - คุณต้องการทดสอบ OpenClaw ในสภาพแวดล้อม Kubernetes
summary: Deploy OpenClaw Gateway ไปยังคลัสเตอร์ Kubernetes ด้วย Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-24T09:18:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw บน Kubernetes

จุดเริ่มต้นแบบขั้นต่ำสำหรับการรัน OpenClaw บน Kubernetes — ยังไม่ใช่ deployment ที่พร้อมสำหรับ production โดยครอบคลุม resource หลัก ๆ และตั้งใจให้คุณนำไปปรับให้เข้ากับสภาพแวดล้อมของตัวเอง

## ทำไมไม่ใช้ Helm?

OpenClaw เป็นคอนเทนเนอร์เดี่ยวที่มีไฟล์ config บางส่วน จุดที่น่าสนใจในการปรับแต่งคือเนื้อหาของเอเจนต์ (ไฟล์ markdown, Skills, config overrides) ไม่ใช่การทำ infrastructure templating Kustomize จัดการ overlays ได้โดยไม่ต้องมีความซับซ้อนของ Helm chart หาก deployment ของคุณซับซ้อนขึ้นภายหลัง ก็สามารถวาง Helm chart ทับบน manifests เหล่านี้ได้

## สิ่งที่คุณต้องมี

- คลัสเตอร์ Kubernetes ที่กำลังทำงานอยู่ (AKS, EKS, GKE, k3s, kind, OpenShift ฯลฯ)
- `kubectl` ที่เชื่อมต่อกับคลัสเตอร์ของคุณแล้ว
- API key สำหรับผู้ให้บริการโมเดลอย่างน้อยหนึ่งราย

## เริ่มต้นอย่างรวดเร็ว

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

ดึง shared secret ที่กำหนดค่าไว้สำหรับ Control UI สคริปต์ deploy นี้
จะสร้าง token auth เป็นค่าเริ่มต้น:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

สำหรับการดีบักแบบโลคัล `./scripts/k8s/deploy.sh --show-token` จะพิมพ์ token หลัง deploy

## การทดสอบแบบโลคัลด้วย Kind

หากคุณยังไม่มีคลัสเตอร์ ให้สร้างคลัสเตอร์แบบโลคัลด้วย [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

จากนั้น deploy ตามปกติด้วย `./scripts/k8s/deploy.sh`

## ทีละขั้นตอน

### 1) Deploy

**ตัวเลือก A** — ใช้ API key ใน environment (ขั้นตอนเดียว):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

สคริปต์จะสร้าง Kubernetes Secret ที่มี API key และ gateway token ที่สร้างอัตโนมัติ จากนั้นทำการ deploy หากมี Secret นี้อยู่แล้ว ระบบจะเก็บ gateway token ปัจจุบันและ provider keys ที่ไม่ได้เปลี่ยนค่าไว้

**ตัวเลือก B** — สร้าง secret แยกก่อน:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

ใช้ `--show-token` ร่วมกับคำสั่งใดก็ได้หากคุณต้องการให้พิมพ์ token ออกทาง stdout เพื่อใช้ในการทดสอบแบบโลคัล

### 2) เข้าถึง gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## สิ่งที่จะถูก deploy

```text
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## การปรับแต่ง

### คำสั่งของเอเจนต์

แก้ไข `AGENTS.md` ใน `scripts/k8s/manifests/configmap.yaml` แล้ว deploy ใหม่:

```bash
./scripts/k8s/deploy.sh
```

### การกำหนดค่า Gateway

แก้ไข `openclaw.json` ใน `scripts/k8s/manifests/configmap.yaml` ดู [การกำหนดค่า Gateway](/th/gateway/configuration) สำหรับข้อมูลอ้างอิงแบบเต็ม

### เพิ่ม providers

รันใหม่โดย export คีย์เพิ่มเติม:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

provider keys เดิมจะยังอยู่ใน Secret เว้นแต่คุณจะเขียนทับ

หรือ patch Secret โดยตรง:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Namespace แบบกำหนดเอง

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Image แบบกำหนดเอง

แก้ไขฟิลด์ `image` ใน `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # or pin to a specific version from https://github.com/openclaw/openclaw/releases
```

### เปิดให้เข้าถึงมากกว่า port-forward

manifests เริ่มต้นจะ bind gateway ไว้กับ loopback ภายใน pod วิธีนี้ใช้ได้กับ `kubectl port-forward` แต่ใช้ไม่ได้กับ `Service` หรือเส้นทาง Ingress ของ Kubernetes ที่ต้องเข้าถึง pod IP

หากคุณต้องการเปิดเผย gateway ผ่าน Ingress หรือ load balancer:

- เปลี่ยนการ bind ของ gateway ใน `scripts/k8s/manifests/configmap.yaml` จาก `loopback` เป็นการ bind แบบ non-loopback ที่ตรงกับรูปแบบ deployment ของคุณ
- คง gateway auth ไว้และใช้ entrypoint ที่มี TLS termination อย่างถูกต้อง
- กำหนดค่า Control UI สำหรับการเข้าถึงระยะไกลโดยใช้โมเดลความปลอดภัยเว็บที่รองรับ (เช่น HTTPS/Tailscale Serve และ allowed origins แบบระบุชัดเมื่อจำเป็น)

## Deploy ใหม่

```bash
./scripts/k8s/deploy.sh
```

คำสั่งนี้จะ apply manifests ทั้งหมดและรีสตาร์ต pod เพื่อให้รับการเปลี่ยนแปลงของ config หรือ secret

## การรื้อถอน

```bash
./scripts/k8s/deploy.sh --delete
```

คำสั่งนี้จะลบ namespace และ resources ทั้งหมดในนั้น รวมถึง PVC

## หมายเหตุด้านสถาปัตยกรรม

- gateway จะ bind กับ loopback ภายใน pod ตามค่าเริ่มต้น ดังนั้นการตั้งค่าที่ให้มานี้เหมาะกับ `kubectl port-forward`
- ไม่มี cluster-scoped resources — ทุกอย่างอยู่ใน namespace เดียว
- ความปลอดภัย: `readOnlyRootFilesystem`, ความสามารถ `drop: ALL`, ผู้ใช้ที่ไม่ใช่ root (UID 1000)
- config เริ่มต้นจะคง Control UI ไว้บนเส้นทางการเข้าถึงแบบโลคัลที่ปลอดภัยกว่า: bind แบบ loopback บวก `kubectl port-forward` ไปยัง `http://127.0.0.1:18789`
- หากคุณจะขยับออกจากการเข้าถึงผ่าน localhost ให้ใช้โมเดลการเข้าถึงระยะไกลที่รองรับ: HTTPS/Tailscale พร้อม gateway bind และการตั้งค่า origin ของ Control UI ที่เหมาะสม
- Secrets ถูกสร้างในไดเรกทอรีชั่วคราวและ apply ตรงเข้าคลัสเตอร์ — ไม่มีการเขียนข้อมูลลับลงใน working tree ของรีโป

## โครงสร้างไฟล์

```text
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

## ที่เกี่ยวข้อง

- [Docker](/th/install/docker)
- [Docker VM runtime](/th/install/docker-vm-runtime)
- [ภาพรวมการติดตั้ง](/th/install)
