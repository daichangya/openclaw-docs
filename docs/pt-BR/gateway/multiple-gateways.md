---
read_when:
    - Executando mais de um Gateway na mesma máquina
    - Você precisa de configuração/estado/portas isolados para cada Gateway
summary: Executar vários Gateways do OpenClaw em um único host (isolamento, portas e perfis)
title: Vários Gateways
x-i18n:
    generated_at: "2026-04-21T17:45:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c3fcb921bc6596040e9249467964bd9dcd40ea7c16e958bb378247b0f994a7b
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Vários Gateways (mesmo host)

A maioria das configurações deve usar um Gateway, porque um único Gateway pode lidar com várias conexões de mensageria e agents. Se você precisar de isolamento mais forte ou redundância (por exemplo, um bot de resgate), execute Gateways separados com perfis/portas isolados.

## Lista de verificação de isolamento (obrigatória)

- `OPENCLAW_CONFIG_PATH` — arquivo de configuração por instância
- `OPENCLAW_STATE_DIR` — sessões, credenciais e caches por instância
- `agents.defaults.workspace` — raiz de workspace por instância
- `gateway.port` (ou `--port`) — exclusivo por instância
- As portas derivadas (browser/canvas) não devem se sobrepor

Se eles forem compartilhados, você terá condições de corrida de configuração e conflitos de porta.

## Recomendado: use o perfil padrão para o principal e um perfil nomeado para o resgate

Os perfis aplicam escopo automaticamente a `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` e adicionam sufixos aos nomes de serviço. Para a maioria das configurações com bot de resgate, mantenha o bot principal no perfil padrão e dê apenas ao bot de resgate um perfil nomeado, como `rescue`.

```bash
# principal (perfil padrão)
openclaw setup
openclaw gateway --port 18789

# resgate
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Serviços:

```bash
openclaw gateway install
openclaw --profile rescue gateway install
```

Se você quiser que ambos os Gateways usem perfis nomeados, isso também funciona, mas não é obrigatório.

## Guia do bot de resgate

Configuração recomendada:

- mantenha o bot principal no perfil padrão
- execute o bot de resgate em `--profile rescue`
- use um bot do Telegram completamente separado para a conta de resgate
- mantenha o bot de resgate em uma porta base diferente, como `19001`

Isso mantém o bot de resgate isolado do bot principal, para que ele possa depurar ou aplicar alterações de configuração se o bot principal estiver fora do ar. Deixe pelo menos 20 portas entre as portas base para que as portas derivadas de browser/canvas/CDP nunca colidam.

### Canal/conta de resgate recomendado

Para a maioria das configurações, use um bot do Telegram completamente separado para o perfil de resgate.

Por que Telegram:

- fácil de manter apenas para operadores
- token e identidade de bot separados
- independente do canal/da instalação do app do bot principal
- caminho de recuperação simples baseado em DM quando o bot principal estiver com problema

A parte importante é a independência total: conta de bot separada, credenciais separadas, perfil do OpenClaw separado, workspace separado e porta separada.

### Fluxo de instalação recomendado

Use isto como configuração padrão, a menos que você tenha um motivo forte para fazer algo diferente:

```bash
# Bot principal (perfil padrão, porta 18789)
openclaw onboard
openclaw gateway install

# Bot de resgate (bot do Telegram separado, perfil separado, porta 19001)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install
```

Durante `openclaw --profile rescue onboard`:

- use o token do bot do Telegram separado
- mantenha o perfil `rescue`
- use uma porta base pelo menos 20 acima da do bot principal
- aceite o workspace de resgate padrão, a menos que você já gerencie um por conta própria

Se o onboarding já tiver instalado o serviço de resgate para você, o `gateway install` final não será necessário.

### O que o onboarding altera

`openclaw --profile rescue onboard` usa o fluxo normal de onboarding, mas grava tudo em um perfil separado.

Na prática, isso significa que o bot de resgate recebe seu próprio:

- arquivo de configuração
- diretório de estado
- workspace (por padrão `~/.openclaw/workspace-rescue`)
- nome de serviço gerenciado

Fora isso, os prompts são os mesmos do onboarding normal.

## Mapeamento de portas (derivado)

Porta base = `gateway.port` (ou `OPENCLAW_GATEWAY_PORT` / `--port`).

- porta do serviço de controle do browser = base + 2 (apenas loopback local)
- o host do canvas é servido no servidor HTTP do Gateway (mesma porta que `gateway.port`)
- as portas CDP do perfil do browser são alocadas automaticamente a partir de `browser.controlPort + 9 .. + 108`

Se você substituir qualquer um deles em config ou env, deve mantê-los exclusivos por instância.

## Observações sobre browser/CDP (armadilha comum)

- **Não** fixe `browser.cdpUrl` nos mesmos valores em várias instâncias.
- Cada instância precisa de sua própria porta de controle do browser e de sua própria faixa de CDP (derivadas da porta do Gateway).
- Se você precisar de portas CDP explícitas, defina `browser.profiles.<name>.cdpPort` por instância.
- Chrome remoto: use `browser.profiles.<name>.cdpUrl` (por perfil, por instância).

## Exemplo manual com env

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## Verificações rápidas

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretação:

- `gateway status --deep` ajuda a detectar serviços launchd/systemd/schtasks antigos de instalações anteriores.
- O texto de aviso de `gateway probe`, como `multiple reachable gateways detected`, é esperado apenas quando você executa intencionalmente mais de um gateway isolado.
