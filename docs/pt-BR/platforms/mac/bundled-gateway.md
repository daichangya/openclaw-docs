---
read_when:
    - Empacotando o OpenClaw.app
    - Depurando o serviço launchd do gateway no macOS
    - Instalando a CLI do gateway para macOS
summary: Runtime do Gateway no macOS (serviço launchd externo)
title: Gateway no macOS
x-i18n:
    generated_at: "2026-04-05T12:47:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e41528b35d69c13608cb9a34b39a7f02e1134204d1b496cbdd191798f39607
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

# Gateway no macOS (launchd externo)

O OpenClaw.app não inclui mais Node/Bun nem o runtime do Gateway. O app do macOS
espera uma instalação **externa** da CLI `openclaw`, não inicia o Gateway como
processo filho e gerencia um serviço launchd por usuário para manter o Gateway
em execução (ou se conecta a um Gateway local já existente, se ele já estiver em execução).

## Instale a CLI (obrigatória para o modo local)

O Node 24 é o runtime padrão no Mac. O Node 22 LTS, atualmente `22.14+`, ainda funciona por compatibilidade. Depois instale `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

O botão **Install CLI** do app do macOS executa o mesmo fluxo de instalação global que o app
usa internamente: ele prefere npm primeiro, depois pnpm, depois bun se esse for o único
gerenciador de pacotes detectado. O Node continua sendo o runtime recomendado do Gateway.

## Launchd (Gateway como LaunchAgent)

Rótulo:

- `ai.openclaw.gateway` (ou `ai.openclaw.<profile>`; o legado `com.openclaw.*` pode permanecer)

Local do plist (por usuário):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (ou `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gerenciador:

- O app do macOS controla a instalação/atualização do LaunchAgent no modo Local.
- A CLI também pode instalá-lo: `openclaw gateway install`.

Comportamento:

- “OpenClaw Active” ativa/desativa o LaunchAgent.
- Fechar o app **não** interrompe o gateway (o launchd o mantém ativo).
- Se um Gateway já estiver em execução na porta configurada, o app se conecta
  a ele em vez de iniciar um novo.

Logging:

- stdout/err do launchd: `/tmp/openclaw/openclaw-gateway.log`

## Compatibilidade de versão

O app do macOS verifica a versão do gateway em relação à sua própria versão. Se elas
forem incompatíveis, atualize a CLI global para corresponder à versão do app.

## Verificação rápida

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Depois:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```
