---
read_when:
    - Você quer um host Linux barato e sempre ativo para o Gateway
    - Você quer acesso remoto à Control UI sem executar sua própria VPS
summary: Execute o OpenClaw Gateway no exe.dev (VM + proxy HTTPS) para acesso remoto
title: exe.dev
x-i18n:
    generated_at: "2026-04-05T12:44:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff95b6f35b95df35c1b0cae3215647eefe88d2b7f19923868385036cc0dbdbf1
    source_path: install/exe-dev.md
    workflow: 15
---

# exe.dev

Objetivo: OpenClaw Gateway em execução em uma VM do exe.dev, acessível do seu laptop via: `https://<vm-name>.exe.xyz`

Esta página assume a imagem padrão **exeuntu** do exe.dev. Se você escolheu uma distro diferente, adapte os pacotes conforme necessário.

## Caminho rápido para iniciantes

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Preencha sua chave/token de autenticação conforme necessário
3. Clique em "Agent" ao lado da sua VM e aguarde a Shelley terminar o provisionamento
4. Abra `https://<vm-name>.exe.xyz/` e autentique-se com o segredo compartilhado configurado (este guia usa autenticação por token por padrão, mas autenticação por senha também funciona se você mudar `gateway.auth.mode`)
5. Aprove quaisquer solicitações pendentes de pairing de dispositivo com `openclaw devices approve <requestId>`

## O que você precisa

- Conta no exe.dev
- Acesso `ssh exe.dev` às máquinas virtuais do [exe.dev](https://exe.dev) (opcional)

## Instalação automatizada com Shelley

Shelley, o agente do [exe.dev](https://exe.dev), pode instalar o OpenClaw instantaneamente com nosso
prompt. O prompt usado é o seguinte:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Instalação manual

## 1) Criar a VM

No seu dispositivo:

```bash
ssh exe.dev new
```

Depois conecte-se:

```bash
ssh <vm-name>.exe.xyz
```

Dica: mantenha esta VM **com estado persistente**. O OpenClaw armazena `openclaw.json`, `auth-profiles.json`
por agente, sessões e estado de canais/provedores em
`~/.openclaw/`, além do workspace em `~/.openclaw/workspace/`.

## 2) Instalar pré-requisitos (na VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Instalar o OpenClaw

Execute o script de instalação do OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Configurar o nginx para fazer proxy do OpenClaw para a porta 8000

Edite `/etc/nginx/sites-enabled/default` com

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Sobrescreva os cabeçalhos de encaminhamento em vez de preservar cadeias fornecidas pelo cliente.
O OpenClaw confia em metadados de IP encaminhados apenas de proxies explicitamente configurados,
e cadeias `X-Forwarded-For` no estilo append são tratadas como um risco de reforço de segurança.

## 5) Acessar o OpenClaw e conceder privilégios

Acesse `https://<vm-name>.exe.xyz/` (consulte a saída da Control UI do onboarding). Se for solicitada autenticação, cole o
segredo compartilhado configurado da VM. Este guia usa autenticação por token, então recupere `gateway.auth.token`
com `openclaw config get gateway.auth.token` (ou gere um com `openclaw doctor --generate-gateway-token`).
Se você mudou o gateway para autenticação por senha, use `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Aprove dispositivos com `openclaw devices list` e `openclaw devices approve <requestId>`. Em caso de dúvida, use a Shelley no navegador!

## Acesso remoto

O acesso remoto é tratado pela autenticação do [exe.dev](https://exe.dev). Por
padrão, o tráfego HTTP da porta 8000 é encaminhado para `https://<vm-name>.exe.xyz`
com autenticação por email.

## Atualização

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Guia: [Atualização](/install/updating)
