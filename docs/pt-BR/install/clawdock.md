---
read_when:
    - Você executa o OpenClaw com Docker com frequência e quer comandos diários mais curtos
    - Você quer uma camada auxiliar para dashboard, logs, configuração de token e fluxos de pareamento
summary: Helpers de shell do ClawDock para instalações do OpenClaw baseadas em Docker
title: ClawDock
x-i18n:
    generated_at: "2026-04-05T12:44:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93d67d1d979450d8c9c11854d2f40977c958f1c300e75a5c42ce4c31de86735a
    source_path: install/clawdock.md
    workflow: 15
---

# ClawDock

ClawDock é uma pequena camada de helpers de shell para instalações do OpenClaw baseadas em Docker.

Ele fornece comandos curtos como `clawdock-start`, `clawdock-dashboard` e `clawdock-fix-token` em vez de invocações mais longas de `docker compose ...`.

Se você ainda não configurou o Docker, comece por [Docker](/install/docker).

## Instalação

Use o caminho canônico do helper:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se você instalou o ClawDock anteriormente a partir de `scripts/shell-helpers/clawdock-helpers.sh`, reinstale a partir do novo caminho `scripts/clawdock/clawdock-helpers.sh`. O antigo caminho raw do GitHub foi removido.

## O que você recebe

### Operações básicas

| Command            | Description                |
| ------------------ | -------------------------- |
| `clawdock-start`   | Inicia o gateway           |
| `clawdock-stop`    | Para o gateway             |
| `clawdock-restart` | Reinicia o gateway         |
| `clawdock-status`  | Verifica o status do contêiner |
| `clawdock-logs`    | Acompanha os logs do gateway |

### Acesso ao contêiner

| Command                   | Description                                      |
| ------------------------- | ------------------------------------------------ |
| `clawdock-shell`          | Abre um shell dentro do contêiner do gateway     |
| `clawdock-cli <command>`  | Executa comandos da CLI do OpenClaw no Docker    |
| `clawdock-exec <command>` | Executa um comando arbitrário no contêiner       |

### Interface web e pareamento

| Command                 | Description                      |
| ----------------------- | -------------------------------- |
| `clawdock-dashboard`    | Abre a URL da interface de Control |
| `clawdock-devices`      | Lista pareamentos de dispositivo pendentes |
| `clawdock-approve <id>` | Aprova uma solicitação de pareamento |

### Configuração e manutenção

| Command              | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `clawdock-fix-token` | Configura o token do gateway dentro do contêiner     |
| `clawdock-update`    | Faz pull, rebuild e restart                          |
| `clawdock-rebuild`   | Recompila apenas a imagem Docker                     |
| `clawdock-clean`     | Remove contêineres e volumes                         |

### Utilitários

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `clawdock-health`      | Executa uma verificação de integridade do gateway |
| `clawdock-token`       | Imprime o token do gateway                 |
| `clawdock-cd`          | Vai para o diretório do projeto OpenClaw   |
| `clawdock-config`      | Abre `~/.openclaw`                         |
| `clawdock-show-config` | Imprime arquivos de configuração com valores redigidos |
| `clawdock-workspace`   | Abre o diretório do workspace              |

## Fluxo da primeira vez

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Se o navegador disser que o pareamento é necessário:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Configuração e segredos

O ClawDock funciona com a mesma divisão de configuração do Docker descrita em [Docker](/install/docker):

- `<project>/.env` para valores específicos do Docker, como nome da imagem, portas e o token do gateway
- `~/.openclaw/.env` para chaves de provedor e tokens de bot baseados em env
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` para autenticação OAuth/chave de API de provedor armazenada
- `~/.openclaw/openclaw.json` para configuração de comportamento

Use `clawdock-show-config` quando quiser inspecionar rapidamente os arquivos `.env` e `openclaw.json`. Ele redige valores de `.env` na saída impressa.

## Páginas relacionadas

- [Docker](/install/docker)
- [Runtime de VM Docker](/install/docker-vm-runtime)
- [Atualização](/install/updating)
