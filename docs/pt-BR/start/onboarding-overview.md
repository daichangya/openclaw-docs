---
read_when:
    - Escolhendo um caminho de onboarding
    - Configurando um novo ambiente
sidebarTitle: Onboarding Overview
summary: Visão geral das opções e fluxos de onboarding do OpenClaw
title: Visão Geral do Onboarding
x-i18n:
    generated_at: "2026-04-05T12:53:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 374697c1dbe0c3871c43164076fbed7119ef032f4a40d0f6e421051f914806e5
    source_path: start/onboarding-overview.md
    workflow: 15
---

# Visão Geral do Onboarding

O OpenClaw tem dois caminhos de onboarding. Ambos configuram autenticação, o Gateway e
canais de chat opcionais — a diferença está apenas em como você interage com a configuração.

## Qual caminho devo usar?

|                | Onboarding pela CLI                         | Onboarding pelo app macOS      |
| -------------- | -------------------------------------- | ------------------------- |
| **Plataformas**  | macOS, Linux, Windows (nativo ou WSL2) | somente macOS                |
| **Interface**  | Assistente no terminal                        | UI guiada no app      |
| **Melhor para**   | Servidores, headless, controle total        | Mac desktop, configuração visual |
| **Automação** | `--non-interactive` para scripts        | somente manual               |
| **Comando**    | `openclaw onboard`                     | Inicie o app            |

A maioria dos usuários deve começar com o **onboarding pela CLI** — ele funciona em qualquer lugar e dá
a você o maior controle.

## O que o onboarding configura

Independentemente do caminho escolhido, o onboarding configura:

1. **Provider de modelo e autenticação** — chave de API, OAuth ou setup token para o provider escolhido
2. **Workspace** — diretório para arquivos do agente, templates de bootstrap e memória
3. **Gateway** — porta, endereço de bind, modo de autenticação
4. **Canais** (opcional) — canais de chat integrados e empacotados, como
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp e mais
5. **Daemon** (opcional) — serviço em segundo plano para que o Gateway inicie automaticamente

## Onboarding pela CLI

Execute em qualquer terminal:

```bash
openclaw onboard
```

Adicione `--install-daemon` para também instalar o serviço em segundo plano em uma única etapa.

Referência completa: [Onboarding (CLI)](/pt-BR/start/wizard)
Documentação do comando CLI: [`openclaw onboard`](/cli/onboard)

## Onboarding pelo app macOS

Abra o app OpenClaw. O assistente da primeira execução orienta você pelas mesmas etapas
com uma interface visual.

Referência completa: [Onboarding (App macOS)](/start/onboarding)

## Providers personalizados ou não listados

Se o seu provider não estiver listado no onboarding, escolha **Provider Personalizado** e
insira:

- Modo de compatibilidade da API (compatível com OpenAI, compatível com Anthropic ou detecção automática)
- URL base e chave de API
- ID do modelo e alias opcional

Vários endpoints personalizados podem coexistir — cada um recebe seu próprio ID de endpoint.
