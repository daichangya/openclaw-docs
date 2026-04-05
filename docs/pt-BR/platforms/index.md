---
read_when:
    - Procurando suporte de SO ou caminhos de instalação
    - Decidindo onde executar o Gateway
summary: Visão geral de suporte a plataformas (Gateway + apps complementares)
title: Plataformas
x-i18n:
    generated_at: "2026-04-05T12:47:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5be4743fd39eca426d65db940f04f3a8fc3ff2c5e10b0e82bc55fc35a7d1399
    source_path: platforms/index.md
    workflow: 15
---

# Plataformas

O núcleo do OpenClaw é escrito em TypeScript. **Node é o runtime recomendado**.
Bun não é recomendado para o Gateway (bugs em WhatsApp/Telegram).

Existem apps complementares para macOS (app de barra de menus) e nós móveis (iOS/Android). Apps complementares para Windows e
Linux estão planejados, mas o Gateway já tem suporte completo hoje.
Apps complementares nativos para Windows também estão planejados; o Gateway é recomendado via WSL2.

## Escolha seu SO

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- Android: [Android](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS e hospedagem

- Hub de VPS: [Hospedagem em VPS](/vps)
- Fly.io: [Fly.io](/install/fly)
- Hetzner (Docker): [Hetzner](/install/hetzner)
- GCP (Compute Engine): [GCP](/install/gcp)
- Azure (Linux VM): [Azure](/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/install/exe-dev)

## Links comuns

- Guia de instalação: [Primeiros passos](/pt-BR/start/getting-started)
- Runbook do Gateway: [Gateway](/gateway)
- Configuração do Gateway: [Configuração](/gateway/configuration)
- Status do serviço: `openclaw gateway status`

## Instalação do serviço Gateway (CLI)

Use um destes (todos compatíveis):

- Assistente (recomendado): `openclaw onboard --install-daemon`
- Direto: `openclaw gateway install`
- Fluxo de configuração: `openclaw configure` → selecione **Gateway service**
- Reparar/migrar: `openclaw doctor` (oferece instalar ou corrigir o serviço)

O alvo do serviço depende do SO:

- macOS: LaunchAgent (`ai.openclaw.gateway` ou `ai.openclaw.<profile>`; legado `com.openclaw.*`)
- Linux/WSL2: serviço systemd de usuário (`openclaw-gateway[-<profile>].service`)
- Windows nativo: Tarefa Agendada (`OpenClaw Gateway` ou `OpenClaw Gateway (<profile>)`), com fallback para um item de login por usuário na pasta Inicializar se a criação da tarefa for negada
