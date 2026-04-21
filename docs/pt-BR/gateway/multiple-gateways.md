---
read_when:
    - Executar mais de um Gateway na mesma máquina
    - Você precisa de configuração/estado/portas isolados por Gateway
summary: Execute vários Gateways do OpenClaw em um único host (isolamento, portas e perfis)
title: Vários Gateways
x-i18n:
    generated_at: "2026-04-21T19:20:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36796da339d5baea1704a7f42530030ea6ef4fa4bde43452ffec946b917ed4a3
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Vários Gateways (mesmo host)

A maioria das configurações deve usar um Gateway porque um único Gateway pode lidar com várias conexões de mensagens e agentes. Se você precisar de isolamento mais forte ou redundância (por exemplo, um bot de resgate), execute Gateways separados com perfis/portas isolados.

## Melhor configuração recomendada

Para a maioria dos usuários, a configuração mais simples de bot de resgate é:

- manter o bot principal no perfil padrão
- executar o bot de resgate com `--profile rescue`
- usar um bot do Telegram completamente separado para a conta de resgate
- manter o bot de resgate em uma porta base diferente, como `19789`

Isso mantém o bot de resgate isolado do bot principal para que ele possa depurar ou aplicar
alterações de configuração se o bot principal estiver fora do ar. Deixe pelo menos 20 portas entre
as portas base para que as portas derivadas de browser/canvas/CDP nunca entrem em conflito.

## Início rápido do bot de resgate

Use isto como caminho padrão, a menos que você tenha um motivo forte para fazer algo
diferente:

```bash
# Bot de resgate (bot do Telegram separado, perfil separado, porta 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Se o seu bot principal já estiver em execução, normalmente isso é tudo de que você precisa.

Durante `openclaw --profile rescue onboard`:

- use o token separado do bot do Telegram
- mantenha o perfil `rescue`
- use uma porta base pelo menos 20 acima da do bot principal
- aceite o workspace de resgate padrão, a menos que você já gerencie um por conta própria

Se o onboarding já instalou o serviço de resgate para você, o comando final
`gateway install` não é necessário.

## Por que isso funciona

O bot de resgate permanece independente porque tem seu próprio:

- perfil/configuração
- diretório de estado
- workspace
- porta base (mais as portas derivadas)
- token do bot do Telegram

Para a maioria das configurações, use um bot do Telegram completamente separado para o perfil de resgate:

- fácil de manter apenas para operadores
- token e identidade de bot separados
- independente da instalação do canal/aplicativo do bot principal
- caminho simples de recuperação baseado em DM quando o bot principal está com problema

## O que `--profile rescue onboard` altera

`openclaw --profile rescue onboard` usa o fluxo normal de onboarding, mas
grava tudo em um perfil separado.

Na prática, isso significa que o bot de resgate recebe seu próprio:

- arquivo de configuração
- diretório de estado
- workspace (por padrão `~/.openclaw/workspace-rescue`)
- nome de serviço gerenciado

Fora isso, os prompts são os mesmos do onboarding normal.

## Configuração geral com vários Gateways

O layout de bot de resgate acima é o padrão mais fácil, mas o mesmo padrão de
isolamento funciona para qualquer par ou grupo de Gateways em um único host.

Para uma configuração mais geral, dê a cada Gateway extra seu próprio perfil nomeado e sua
própria porta base:

```bash
# principal (perfil padrão)
openclaw setup
openclaw gateway --port 18789

# gateway extra
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Se você quiser que ambos os Gateways usem perfis nomeados, isso também funciona:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Os serviços seguem o mesmo padrão:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Use o início rápido do bot de resgate quando quiser uma via de operador de fallback. Use o
padrão geral de perfis quando quiser vários Gateways de longa duração para
diferentes canais, locatários, workspaces ou papéis operacionais.

## Checklist de isolamento

Mantenha estes itens únicos por instância do Gateway:

- `OPENCLAW_CONFIG_PATH` — arquivo de configuração por instância
- `OPENCLAW_STATE_DIR` — sessões, credenciais e caches por instância
- `agents.defaults.workspace` — raiz de workspace por instância
- `gateway.port` (ou `--port`) — único por instância
- portas derivadas de browser/canvas/CDP

Se eles forem compartilhados, você terá corridas de configuração e conflitos de porta.

## Mapeamento de portas (derivadas)

Porta base = `gateway.port` (ou `OPENCLAW_GATEWAY_PORT` / `--port`).

- porta do serviço de controle do browser = base + 2 (somente loopback local)
- o host canvas é servido no servidor HTTP do Gateway (mesma porta que `gateway.port`)
- as portas CDP do perfil do browser são alocadas automaticamente a partir de `browser.controlPort + 9 .. + 108`

Se você substituir qualquer uma delas em configuração ou env, deverá mantê-las únicas por instância.

## Observações sobre browser/CDP (armadilha comum)

- **Não** fixe `browser.cdpUrl` nos mesmos valores em várias instâncias.
- Cada instância precisa de sua própria porta de controle do browser e de sua própria faixa de CDP (derivada da porta do gateway).
- Se você precisar de portas CDP explícitas, defina `browser.profiles.<name>.cdpPort` por instância.
- Chrome remoto: use `browser.profiles.<name>.cdpUrl` (por perfil, por instância).

## Exemplo manual com env

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
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

- `gateway status --deep` ajuda a detectar serviços launchd/systemd/schtasks obsoletos de instalações antigas.
- O texto de aviso de `gateway probe`, como `multiple reachable gateways detected`, é esperado apenas quando você executa intencionalmente mais de um gateway isolado.
