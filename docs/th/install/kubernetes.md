---
read_when:
    - คุณต้องการรัน OpenClaw บน Kubernetes cluster
    - คุณต้องการทดสอบ OpenClaw ในสภาพแวดล้อม Kubernetes
summary: deploy OpenClaw Gateway ไปยัง Kubernetes cluster ด้วย Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-23T05:40:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa39127de5a5571f117db3a1bfefd5815b5e6b594cc1df553e30fda882b2a408
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw บน Kubernetes

จุดเริ่มต้นขั้นต่ำสำหรับการรัน OpenClaw บน Kubernetes — ยังไม่ใช่ deployment ที่พร้อมสำหรับ production ครอบคลุม resource หลักๆ และออกแบบมาเพื่อให้ปรับใช้กับสภาพแวดล้อมของคุณ

## ทำไมไม่ใช้ Helm?

OpenClaw เป็นคอนเทนเนอร์เดี่ยวพร้อมไฟล์คอนฟิกบางส่วน จุดที่ต้องปรับแต่งจริงๆ คือเนื้อหาของเอเจนต์ (ไฟล์ markdown, Skills, config overrides) ไม่ใช่การทำ infrastructure templating Kustomize จัดการ overlays ได้โดยไม่ต้องมี overhead ของ Helm chart หาก deployment ของคุณซับซ้อนขึ้นในภายหลัง ก็สามารถวาง Helm chart ซ้อนทับบน manifests ชุดนี้ได้

## สิ่งที่คุณต้องมี

- Kubernetes cluster ที่กำลังทำงานอยู่ (AKS, EKS, GKE, k3s, kind, OpenShift ฯลฯ)
- `kubectl` ที่เชื่อมต่อกับ cluster ของคุณ
- API key สำหรับผู้ให้บริการโมเดลอย่างน้อยหนึ่งราย

## เริ่มต้นอย่างรวดเร็ว

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

ดึง shared secret ที่กำหนดไว้สำหรับ Control UI สคริปต์ deploy นี้
จะสร้าง token auth เป็นค่าเริ่มต้น:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

สำหรับการดีบักแบบ local, `./scripts/k8s/deploy.sh --show-token` จะพิมพ์ token หลัง deploy

## การทดสอบแบบ local ด้วย Kind

หากคุณยังไม่มี cluster ให้สร้างแบบ local ด้วย [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # ตรวจจับ docker หรือ podman อัตโนมัติ
./scripts/k8s/create-kind.sh --delete  # ลบออก
```

จากนั้น deploy ตามปกติด้วย `./scripts/k8s/deploy.sh`

## ทีละขั้นตอน

### 1) Deploy

**ตัวเลือก A** — ใส่ API key ในสภาพแวดล้อม (ขั้นตอนเดียว):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

สคริปต์นี้จะสร้าง Kubernetes Secret พร้อม API key และ gateway token ที่สร้างอัตโนมัติ แล้วจึง deploy หาก Secret มีอยู่แล้ว มันจะเก็บ gateway token ปัจจุบันและ provider keys ที่ไม่ได้ถูกเปลี่ยนไว้

**ตัวเลือก B** — สร้าง secret แยกต่างหาก:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

ใช้ `--show-token` ร่วมกับคำสั่งใดก็ได้หากคุณต้องการให้พิมพ์ token ออกทาง stdout สำหรับการทดสอบแบบ local

### 2) เข้าถึง gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## สิ่งที่จะถูก deploy

```
Namespace: openclaw (กำหนดค่าได้ผ่าน OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Pod เดี่ยว, init container + gateway
├── Service/openclaw           # ClusterIP บนพอร์ต 18789
├── PersistentVolumeClaim      # 10Gi สำหรับสถานะและคอนฟิกของเอเจนต์
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## การปรับแต่ง

### คำสั่งของเอเจนต์

แก้ไข `AGENTS.md` ใน `scripts/k8s/manifests/configmap.yaml` แล้ว deploy ใหม่:

```bash
./scripts/k8s/deploy.sh
```

### คอนฟิก Gateway

แก้ไข `openclaw.json` ใน `scripts/k8s/manifests/configmap.yaml` ดู [Gateway configuration](/th/gateway/configuration) สำหรับเอกสารอ้างอิงทั้งหมด

### เพิ่มผู้ให้บริการ

รันใหม่โดย export คีย์เพิ่มเติม:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

provider keys ที่มีอยู่จะยังคงอยู่ใน Secret เว้นแต่คุณจะเขียนทับมัน

หรือ patch Secret โดยตรง:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### namespace แบบกำหนดเอง

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### image แบบกำหนดเอง

แก้ไขฟิลด์ `image` ใน `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # หรือ pin เป็นเวอร์ชันเฉพาะจาก https://github.com/openclaw/openclaw/releases
```

### เปิดใช้งานนอกเหนือจาก port-forward

manifests ค่าเริ่มต้นจะ bind gateway กับ loopback ภายใน pod ซึ่งใช้ได้กับ `kubectl port-forward` แต่จะใช้ไม่ได้กับ `Service` หรือ Ingress path ของ Kubernetes ที่ต้องเข้าถึง pod IP

หากคุณต้องการเปิดเผย gateway ผ่าน Ingress หรือ load balancer:

- เปลี่ยน gateway bind ใน `scripts/k8s/manifests/configmap.yaml` จาก `loopback` เป็น bind แบบ non-loopback ที่ตรงกับรูปแบบ deployment ของคุณ
- เปิดใช้งาน auth ของ gateway ไว้ และใช้ entrypoint ที่มี TLS termination อย่างเหมาะสม
- กำหนดค่า Control UI สำหรับการเข้าถึงจากระยะไกลโดยใช้โมเดลความปลอดภัยบนเว็บที่รองรับ (เช่น HTTPS/Tailscale Serve และ allowed origins แบบ explicit เมื่อจำเป็น)

## Deploy ใหม่

```bash
./scripts/k8s/deploy.sh
```

คำสั่งนี้จะ apply manifests ทั้งหมดและรีสตาร์ต pod เพื่อรับการเปลี่ยนแปลงของคอนฟิกหรือ secret

## การลบทั้งหมด

```bash
./scripts/k8s/deploy.sh --delete
```

คำสั่งนี้จะลบ namespace และ resource ทั้งหมดภายในนั้น รวมถึง PVC

## หมายเหตุด้านสถาปัตยกรรม

- โดยค่าเริ่มต้น gateway จะ bind กับ loopback ภายใน pod ดังนั้นการตั้งค่าที่ให้มาจึงเหมาะกับ `kubectl port-forward`
- ไม่มี resource ระดับ cluster — ทุกอย่างอยู่ใน namespace เดียว
- ความปลอดภัย: `readOnlyRootFilesystem`, ความสามารถ `drop: ALL`, ผู้ใช้ที่ไม่ใช่ root (UID 1000)
- คอนฟิกเริ่มต้นทำให้ Control UI อยู่บนเส้นทางการเข้าถึงแบบ local ที่ปลอดภัยกว่า: loopback bind ร่วมกับ `kubectl port-forward` ไปยัง `http://127.0.0.1:18789`
- หากคุณจะใช้งานนอก localhost ให้ใช้โมเดลระยะไกลที่รองรับ: HTTPS/Tailscale พร้อม gateway bind และการตั้งค่า origin ของ Control UI ที่เหมาะสม
- Secrets ถูกสร้างในไดเรกทอรี temp และ apply เข้าสู่ cluster โดยตรง — ไม่มีการเขียนข้อมูล secret ลงใน repo checkout

## โครงสร้างไฟล์

```
scripts/k8s/
├── deploy.sh                   # สร้าง namespace + secret, deploy ผ่าน kustomize
├── create-kind.sh              # Kind cluster แบบ local (ตรวจจับ docker/podman อัตโนมัติ)
└── manifests/
    ├── kustomization.yaml      # Kustomize base
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Pod spec พร้อมการเสริมความปลอดภัย
    ├── pvc.yaml                # persistent storage ขนาด 10Gi
    └── service.yaml            # ClusterIP บน 18789
```
