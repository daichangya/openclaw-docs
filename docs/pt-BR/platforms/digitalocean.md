---
read_when:
    - Configurando o OpenClaw no DigitalOcean
    - Procurando hospedagem VPS barata para OpenClaw
summary: OpenClaw no DigitalOcean (opção simples de VPS paga)
title: DigitalOcean (Plataforma)
x-i18n:
    generated_at: "2026-04-05T12:47:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ee4ad84c421f87064534a4fb433df1f70304502921841ec618318ed862d4092
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw no DigitalOcean

## Objetivo

Executar um OpenClaw Gateway persistente no DigitalOcean por **US$ 6/mês** (ou US$ 4/mês com preço reservado).

Se você quiser uma opção de US$ 0/mês e não se importar com ARM + configuração específica do provedor, consulte o [guia do Oracle Cloud](/platforms/oracle).

## Comparação de custos (2026)

| Provedor     | Plano            | Especificações         | Preço/mês   | Observações                            |
| ------------ | ---------------- | ---------------------- | ----------- | -------------------------------------- |
| Oracle Cloud | Always Free ARM  | até 4 OCPU, 24GB RAM   | $0          | ARM, capacidade limitada / peculiaridades no cadastro |
| Hetzner      | CX22             | 2 vCPU, 4GB RAM        | €3.79 (~$4) | Opção paga mais barata                 |
| DigitalOcean | Basic            | 1 vCPU, 1GB RAM        | $6          | UI simples, boa documentação           |
| Vultr        | Cloud Compute    | 1 vCPU, 1GB RAM        | $6          | Muitas localidades                     |
| Linode       | Nanode           | 1 vCPU, 1GB RAM        | $5          | Agora faz parte da Akamai              |

**Escolhendo um provedor:**

- DigitalOcean: UX mais simples + configuração previsível (este guia)
- Hetzner: boa relação preço/desempenho (consulte [guia da Hetzner](/install/hetzner))
- Oracle Cloud: pode custar US$ 0/mês, mas é mais instável e somente ARM (consulte [guia do Oracle](/platforms/oracle))

---

## Pré-requisitos

- Conta no DigitalOcean ([cadastre-se com US$ 200 em créditos grátis](https://m.do.co/c/signup))
- Par de chaves SSH (ou disposição para usar autenticação por senha)
- ~20 minutos

## 1) Criar um Droplet

<Warning>
Use uma imagem base limpa (Ubuntu 24.04 LTS). Evite imagens 1-click de terceiros do Marketplace, a menos que você tenha revisado os scripts de inicialização e os padrões de firewall.
</Warning>

1. Faça login no [DigitalOcean](https://cloud.digitalocean.com/)
2. Clique em **Create → Droplets**
3. Escolha:
   - **Region:** a mais próxima de você (ou dos seus usuários)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **US$ 6/mês** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Authentication:** chave SSH (recomendado) ou senha
4. Clique em **Create Droplet**
5. Anote o endereço IP

## 2) Conectar via SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Instalar OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) Executar o onboarding

```bash
openclaw onboard --install-daemon
```

O assistente orientará você em:

- Autenticação de modelo (chaves de API ou OAuth)
- Configuração de canal (Telegram, WhatsApp, Discord etc.)
- Token do gateway (gerado automaticamente)
- Instalação do daemon (systemd)

## 5) Verificar o Gateway

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) Acessar o Dashboard

O gateway faz bind em loopback por padrão. Para acessar a Control UI:

**Opção A: túnel SSH (recomendado)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**Opção B: Tailscale Serve (HTTPS, somente loopback)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Abra: `https://<magicdns>/`

Observações:

- Serve mantém o Gateway somente em loopback e autentica o tráfego da Control UI/WebSocket via cabeçalhos de identidade do Tailscale (a autenticação sem token pressupõe um host de gateway confiável; APIs HTTP não usam esses cabeçalhos do Tailscale e, em vez disso, seguem o modo normal de autenticação HTTP do gateway).
- Para exigir credenciais explícitas de segredo compartilhado, defina `gateway.auth.allowTailscale: false` e use `gateway.auth.mode: "token"` ou `"password"`.

**Opção C: bind na tailnet (sem Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Abra: `http://<tailscale-ip>:18789` (token obrigatório).

## 7) Conectar seus canais

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

Consulte [Channels](/channels) para outros provedores.

---

## Otimizações para 1GB de RAM

O droplet de US$ 6 tem apenas 1GB de RAM. Para manter tudo funcionando sem problemas:

### Adicionar swap (recomendado)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Usar um modelo mais leve

Se você estiver enfrentando OOMs, considere:

- Usar modelos baseados em API (Claude, GPT) em vez de modelos locais
- Definir `agents.defaults.model.primary` para um modelo menor

### Monitorar memória

```bash
free -h
htop
```

---

## Persistência

Todo o estado fica em:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` por agente, estado de canal/provedor e dados de sessão
- `~/.openclaw/workspace/` — workspace (`SOUL.md`, memory etc.)

Esses dados sobrevivem a reinicializações. Faça backup periodicamente:

```bash
openclaw backup create
```

---

## Alternativa gratuita com Oracle Cloud

O Oracle Cloud oferece instâncias ARM **Always Free** que são significativamente mais potentes do que qualquer opção paga desta lista — por US$ 0/mês.

| O que você recebe | Especificações        |
| ----------------- | --------------------- |
| **4 OCPUs**       | ARM Ampere A1         |
| **24GB RAM**      | Mais do que suficiente |
| **200GB storage** | Volume em bloco       |
| **Sempre grátis** | Sem cobranças no cartão de crédito |

**Limitações:**

- O cadastro pode ser instável (tente novamente se falhar)
- Arquitetura ARM — a maioria das coisas funciona, mas alguns binários precisam de builds ARM

Para o guia completo de configuração, consulte [Oracle Cloud](/platforms/oracle). Para dicas de cadastro e solução de problemas do processo de inscrição, consulte este [guia da comunidade](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Solução de problemas

### O Gateway não inicia

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Porta já em uso

```bash
lsof -i :18789
kill <PID>
```

### Sem memória

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## Veja também

- [guia da Hetzner](/install/hetzner) — mais barato, mais potente
- [instalação com Docker](/install/docker) — configuração em contêiner
- [Tailscale](/gateway/tailscale) — acesso remoto seguro
- [Configuration](/gateway/configuration) — referência completa de configuração
