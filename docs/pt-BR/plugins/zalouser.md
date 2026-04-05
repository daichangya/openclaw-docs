---
read_when:
    - Você quer suporte ao Zalo Personal (não oficial) no OpenClaw
    - Você está configurando ou desenvolvendo o plugin zalouser
summary: 'Plugin Zalo Personal: login por QR + mensagens via `zca-js` nativo (instalação do plugin + configuração do canal + ferramenta)'
title: Plugin Zalo Personal
x-i18n:
    generated_at: "2026-04-05T12:50:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3218c3ee34f36466d952aec1b479d451a6235c7c46918beb28698234a7fd0968
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (plugin)

Suporte ao Zalo Personal para o OpenClaw por meio de um plugin, usando `zca-js` nativo para automatizar uma conta comum de usuário do Zalo.

> **Aviso:** Automação não oficial pode levar à suspensão/banimento da conta. Use por sua conta e risco.

## Nomenclatura

O ID do canal é `zalouser` para deixar explícito que isso automatiza uma **conta pessoal de usuário do Zalo** (não oficial). Mantemos `zalo` reservado para uma possível futura integração oficial com a API do Zalo.

## Onde ele é executado

Este plugin é executado **dentro do processo do Gateway**.

Se você usa um Gateway remoto, instale/configure-o na **máquina que executa o Gateway** e depois reinicie o Gateway.

Nenhum binário externo de CLI `zca`/`openzca` é necessário.

## Instalação

### Opção A: instalar pelo npm

```bash
openclaw plugins install @openclaw/zalouser
```

Reinicie o Gateway em seguida.

### Opção B: instalar de uma pasta local (desenvolvimento)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Reinicie o Gateway em seguida.

## Configuração

A configuração do canal fica em `channels.zalouser` (não em `plugins.entries.*`):

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Ferramenta do agente

Nome da ferramenta: `zalouser`

Ações: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

As ações de mensagem do canal também oferecem suporte a `react` para reações a mensagens.
