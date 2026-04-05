---
read_when:
    - Executando mais de um Gateway na mesma máquina
    - Você precisa de configuração/estado/portas isolados por Gateway
summary: Executar vários Gateways do OpenClaw no mesmo host (isolamento, portas e perfis)
title: Vários Gateways
x-i18n:
    generated_at: "2026-04-05T12:41:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 061f204bf56b28c6bd0e2c9aee6c561a8a162ca219060117fea4d3a007f01899
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Vários Gateways (mesmo host)

A maioria das configurações deve usar um único Gateway, porque um único Gateway pode lidar com várias conexões de mensagens e agentes. Se você precisar de isolamento mais forte ou redundância (por exemplo, um bot de resgate), execute Gateways separados com perfis/portas isolados.

## Checklist de isolamento (obrigatório)

- `OPENCLAW_CONFIG_PATH` — arquivo de configuração por instância
- `OPENCLAW_STATE_DIR` — sessões, credenciais, caches por instância
- `agents.defaults.workspace` — raiz de workspace por instância
- `gateway.port` (ou `--port`) — única por instância
- Portas derivadas (browser/canvas) não podem se sobrepor

Se esses itens forem compartilhados, você terá corridas de configuração e conflitos de porta.

## Recomendado: perfis (`--profile`)

Perfis definem automaticamente o escopo de `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` e adicionam sufixos aos nomes dos serviços.

```bash
# principal
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# resgate
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Serviços por perfil:

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## Guia do bot de resgate

Execute um segundo Gateway no mesmo host com seu próprio:

- perfil/configuração
- diretório de estado
- workspace
- porta base (mais as portas derivadas)

Isso mantém o bot de resgate isolado do bot principal, para que ele possa depurar ou aplicar alterações de configuração se o bot principal estiver fora do ar.

Espaçamento de portas: deixe pelo menos 20 portas entre as portas base para que as portas derivadas de browser/canvas/CDP nunca colidam.

### Como instalar (bot de resgate)

```bash
# Bot principal (existente ou novo, sem parâmetro --profile)
# Executa na porta 18789 + portas do Chrome CDC/Canvas/...
openclaw onboard
openclaw gateway install

# Bot de resgate (perfil + portas isolados)
openclaw --profile rescue onboard
# Observações:
# - o nome do workspace receberá o sufixo -rescue por padrão
# - A porta deve ser pelo menos 18789 + 20 portas,
#   é melhor escolher uma porta base completamente diferente, como 19789,
# - o restante da configuração inicial é igual ao normal

# Para instalar o serviço (se isso não aconteceu automaticamente durante a configuração)
openclaw --profile rescue gateway install
```

## Mapeamento de portas (derivadas)

Porta base = `gateway.port` (ou `OPENCLAW_GATEWAY_PORT` / `--port`).

- porta do serviço de controle do navegador = base + 2 (somente loopback)
- o host de canvas é servido no servidor HTTP do Gateway (mesma porta de `gateway.port`)
- portas CDP do perfil do navegador são alocadas automaticamente a partir de `browser.controlPort + 9 .. + 108`

Se você substituir qualquer uma delas na configuração ou no ambiente, deverá mantê-las exclusivas por instância.

## Observações sobre Browser/CDP (armadilha comum)

- **Não** fixe `browser.cdpUrl` nos mesmos valores em várias instâncias.
- Cada instância precisa de sua própria porta de controle do navegador e intervalo de CDP (derivados da porta do gateway).
- Se você precisar de portas CDP explícitas, defina `browser.profiles.<name>.cdpPort` por instância.
- Chrome remoto: use `browser.profiles.<name>.cdpUrl` (por perfil, por instância).

## Exemplo manual com env

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## Verificações rápidas

```bash
openclaw --profile main gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretação:

- `gateway status --deep` ajuda a detectar serviços launchd/systemd/schtasks desatualizados de instalações mais antigas.
- O texto de aviso de `gateway probe`, como `multiple reachable gateways detected`, é esperado apenas quando você executa intencionalmente mais de um gateway isolado.
