---
read_when:
    - Configurar o OpenClaw em um Raspberry Pi
    - Executar o OpenClaw em dispositivos ARM
    - Montar uma IA pessoal barata e sempre ativa
summary: OpenClaw no Raspberry Pi (configuração self-hosted econômica)
title: Raspberry Pi (plataforma)
x-i18n:
    generated_at: "2026-04-05T12:48:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07f34e91899b7e0a31d9b944f3cb0cfdd4ecdeba58b619ae554379abdbf37eaf
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# OpenClaw no Raspberry Pi

## Objetivo

Executar um OpenClaw Gateway persistente e sempre ativo em um Raspberry Pi por um custo único de **~US$ 35-80** (sem taxas mensais).

Perfeito para:

- Assistente pessoal de IA 24/7
- Hub de automação residencial
- Bot de Telegram/WhatsApp de baixo consumo e sempre disponível

## Requisitos de hardware

| Modelo do Pi     | RAM     | Funciona? | Observações                         |
| ---------------- | ------- | --------- | ----------------------------------- |
| **Pi 5**         | 4GB/8GB | ✅ Melhor | Mais rápido, recomendado            |
| **Pi 4**         | 4GB     | ✅ Bom    | Ponto ideal para a maioria dos usuários |
| **Pi 4**         | 2GB     | ✅ OK     | Funciona, adicione swap             |
| **Pi 4**         | 1GB     | ⚠️ Limitado | Possível com swap, configuração mínima |
| **Pi 3B+**       | 1GB     | ⚠️ Lento  | Funciona, mas é lento               |
| **Pi Zero 2 W**  | 512MB   | ❌        | Não recomendado                     |

**Especificações mínimas:** 1GB de RAM, 1 núcleo, 500MB de disco  
**Recomendado:** 2GB+ de RAM, SO 64 bits, cartão SD de 16GB+ (ou SSD USB)

## O que você precisa

- Raspberry Pi 4 ou 5 (2GB+ recomendado)
- Cartão MicroSD (16GB+) ou SSD USB (melhor desempenho)
- Fonte de alimentação (a fonte oficial do Pi é recomendada)
- Conexão de rede (Ethernet ou Wi‑Fi)
- ~30 minutos

## 1) Grave o SO

Use **Raspberry Pi OS Lite (64-bit)** — não é necessário desktop para um servidor headless.

1. Baixe o [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Escolha o SO: **Raspberry Pi OS Lite (64-bit)**
3. Clique no ícone de engrenagem (⚙️) para pré-configurar:
   - Defina o hostname: `gateway-host`
   - Ative o SSH
   - Defina nome de usuário/senha
   - Configure o Wi‑Fi (se não estiver usando Ethernet)
4. Grave no seu cartão SD / unidade USB
5. Insira e inicialize o Pi

## 2) Conecte-se via SSH

```bash
ssh user@gateway-host
# ou use o endereço IP
ssh user@192.168.x.x
```

## 3) Configuração do sistema

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar pacotes essenciais
sudo apt install -y git curl build-essential

# Definir fuso horário (importante para cron/lembretes)
sudo timedatectl set-timezone America/Chicago  # Altere para seu fuso horário
```

## 4) Instale o Node.js 24 (ARM64)

```bash
# Instalar o Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version  # Deve mostrar v24.x.x
npm --version
```

## 5) Adicione swap (importante para 2GB ou menos)

O swap evita falhas por falta de memória:

```bash
# Criar arquivo de swap de 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tornar permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Otimizar para pouca RAM (reduzir swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Instale o OpenClaw

### Opção A: instalação padrão (recomendada)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Opção B: instalação hackeável (para mexer)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

A instalação hackeável dá acesso direto aos logs e ao código — útil para depurar problemas específicos de ARM.

## 7) Execute o onboarding

```bash
openclaw onboard --install-daemon
```

Siga o assistente:

1. **Modo do Gateway:** Local
2. **Auth:** chaves de API recomendadas (OAuth pode ser instável em Pi headless)
3. **Canais:** Telegram é o mais fácil para começar
4. **Daemon:** Sim (systemd)

## 8) Verifique a instalação

```bash
# Verificar status
openclaw status

# Verificar serviço (instalação padrão = unidade de usuário systemd)
systemctl --user status openclaw-gateway.service

# Ver logs
journalctl --user -u openclaw-gateway.service -f
```

## 9) Acesse o painel do OpenClaw

Substitua `user@gateway-host` pelo seu nome de usuário do Pi e pelo hostname ou endereço IP.

No seu computador, peça ao Pi para imprimir uma URL nova do painel:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

O comando imprime `Dashboard URL:`. Dependendo de como `gateway.auth.token`
está configurado, a URL pode ser um link simples `http://127.0.0.1:18789/` ou um
link que inclui `#token=...`.

Em outro terminal no seu computador, crie o túnel SSH:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Depois, abra a URL do painel impressa no seu navegador local.

Se a interface pedir autenticação por segredo compartilhado, cole o token ou a senha configurados
nas configurações da Control UI. Para autenticação por token, use `gateway.auth.token` (ou
`OPENCLAW_GATEWAY_TOKEN`).

Para acesso remoto sempre ativo, consulte [Tailscale](/pt-BR/gateway/tailscale).

---

## Otimizações de desempenho

### Use um SSD USB (grande melhoria)

Cartões SD são lentos e se desgastam. Um SSD USB melhora o desempenho de forma significativa:

```bash
# Verificar se está inicializando via USB
lsblk
```

Consulte o [guia de boot por USB no Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) para a configuração.

### Acelere a inicialização da CLI (cache de compilação de módulos)

Em hosts Pi de menor potência, ative o cache de compilação de módulos do Node para tornar execuções repetidas da CLI mais rápidas:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Observações:

- `NODE_COMPILE_CACHE` acelera execuções subsequentes (`status`, `health`, `--help`).
- `/var/tmp` sobrevive melhor a reinicializações do que `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` evita custo extra de inicialização causado pelo self-respawn da CLI.
- A primeira execução aquece o cache; as execuções posteriores são as que mais se beneficiam.

### Ajuste de inicialização do systemd (opcional)

Se este Pi for usado principalmente para executar o OpenClaw, adicione um drop-in do serviço para reduzir
a instabilidade de reinicialização e manter o ambiente de inicialização estável:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Depois aplique:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Se possível, mantenha o estado/cache do OpenClaw em armazenamento com SSD para evitar
gargalos de E/S aleatória de cartão SD durante inicializações a frio.

Se este for um Pi headless, ative lingering uma vez para que o serviço de usuário sobreviva
ao logout:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Como as políticas `Restart=` ajudam na recuperação automatizada:
[o systemd pode automatizar a recuperação de serviços](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Reduza o uso de memória

```bash
# Desabilitar alocação de memória para GPU (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Desabilitar Bluetooth se não for necessário
sudo systemctl disable bluetooth
```

### Monitore recursos

```bash
# Verificar memória
free -h

# Verificar temperatura da CPU
vcgencmd measure_temp

# Monitoramento em tempo real
htop
```

---

## Observações específicas de ARM

### Compatibilidade binária

A maioria dos recursos do OpenClaw funciona em ARM64, mas alguns binários externos podem precisar de builds ARM:

| Ferramenta         | Status ARM64 | Observações                         |
| ------------------ | ------------ | ----------------------------------- |
| Node.js            | ✅           | Funciona muito bem                  |
| WhatsApp (Baileys) | ✅           | JavaScript puro, sem problemas      |
| Telegram           | ✅           | JavaScript puro, sem problemas      |
| gog (Gmail CLI)    | ⚠️           | Verifique se há release para ARM    |
| Chromium (browser) | ✅           | `sudo apt install chromium-browser` |

Se uma Skill falhar, verifique se o binário dela tem uma build ARM. Muitas ferramentas Go/Rust têm; algumas não.

### 32 bits vs 64 bits

**Sempre use SO 64 bits.** O Node.js e muitas ferramentas modernas exigem isso. Verifique com:

```bash
uname -m
# Deve mostrar: aarch64 (64-bit), não armv7l (32-bit)
```

---

## Configuração de modelo recomendada

Como o Pi é apenas o Gateway (os modelos são executados na nuvem), use modelos baseados em API:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

**Não tente executar LLMs locais em um Pi** — até modelos pequenos são lentos demais. Deixe Claude/GPT fazer o trabalho pesado.

---

## Inicialização automática no boot

O onboarding configura isso, mas para verificar:

```bash
# Verificar se o serviço está ativado
systemctl --user is-enabled openclaw-gateway.service

# Ativar, se não estiver
systemctl --user enable openclaw-gateway.service

# Iniciar no boot
systemctl --user start openclaw-gateway.service
```

---

## Solução de problemas

### Falta de memória (OOM)

```bash
# Verificar memória
free -h

# Adicione mais swap (veja a Etapa 5)
# Ou reduza os serviços em execução no Pi
```

### Desempenho lento

- Use SSD USB em vez de cartão SD
- Desative serviços não usados: `sudo systemctl disable cups bluetooth avahi-daemon`
- Verifique limitação da CPU: `vcgencmd get_throttled` (deve retornar `0x0`)

### O serviço não inicia

```bash
# Verificar logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Correção comum: reconstruir
cd ~/openclaw  # se estiver usando a instalação hackeável
npm run build
systemctl --user restart openclaw-gateway.service
```

### Problemas com binários ARM

Se uma Skill falhar com "exec format error":

1. Verifique se o binário tem uma build ARM64
2. Tente compilar a partir do código-fonte
3. Ou use um contêiner Docker com suporte a ARM

### Quedas de Wi‑Fi

Para Pis headless em Wi‑Fi:

```bash
# Desabilitar gerenciamento de energia do Wi‑Fi
sudo iwconfig wlan0 power off

# Tornar permanente
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Comparação de custo

| Configuração    | Custo único | Custo mensal | Observações                |
| --------------- | ----------- | ------------ | -------------------------- |
| **Pi 4 (2GB)**  | ~US$ 45     | $0           | + energia (~US$ 5/ano)     |
| **Pi 4 (4GB)**  | ~US$ 55     | $0           | Recomendado                |
| **Pi 5 (4GB)**  | ~US$ 60     | $0           | Melhor desempenho          |
| **Pi 5 (8GB)**  | ~US$ 80     | $0           | Exagero, mas preparado para o futuro |
| DigitalOcean    | $0          | $6/mês       | $72/ano                    |
| Hetzner         | $0          | €3,79/mês    | ~US$ 50/ano                |

**Ponto de equilíbrio:** um Pi se paga em ~6-12 meses em comparação com uma VPS em nuvem.

---

## Veja também

- [Guia para Linux](/pt-BR/platforms/linux) — configuração geral no Linux
- [Guia para DigitalOcean](/pt-BR/install/digitalocean) — alternativa em nuvem
- [Guia para Hetzner](/pt-BR/install/hetzner) — configuração com Docker
- [Tailscale](/pt-BR/gateway/tailscale) — acesso remoto
- [Nós](/pt-BR/nodes) — emparelhe seu laptop/telefone com o Gateway do Pi
