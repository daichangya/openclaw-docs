---
read_when:
    - Configurando uma nova máquina
    - Você quer o “mais recente e melhor” sem quebrar sua configuração pessoal
summary: Fluxos avançados de configuração e desenvolvimento para o OpenClaw
title: Configuração
x-i18n:
    generated_at: "2026-04-05T12:53:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: be4e280dde7f3a224345ca557ef2fb35a9c9db8520454ff63794ac6f8d4e71e7
    source_path: start/setup.md
    workflow: 15
---

# Configuração

<Note>
Se você está configurando pela primeira vez, comece com [Primeiros passos](/pt-BR/start/getting-started).
Para detalhes de onboarding, consulte [Onboarding (CLI)](/pt-BR/start/wizard).
</Note>

## Resumo

- **As personalizações ficam fora do repositório:** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (configuração).
- **Fluxo estável:** instale o app macOS; deixe-o executar o Gateway empacotado.
- **Fluxo de ponta:** execute você mesmo o Gateway via `pnpm gateway:watch` e depois deixe o app macOS se conectar no modo Local.

## Pré-requisitos (a partir do código-fonte)

- Node 24 recomendado (Node 22 LTS, atualmente `22.14+`, ainda compatível)
- `pnpm` preferido (ou Bun, se você intencionalmente usar o [fluxo Bun](/pt-BR/install/bun))
- Docker (opcional; apenas para configuração/e2e em contêiner — consulte [Docker](/pt-BR/install/docker))

## Estratégia de personalização (para que atualizações não prejudiquem)

Se você quiser “100% personalizado para mim” _e_ atualizações fáceis, mantenha sua personalização em:

- **Configuração:** `~/.openclaw/openclaw.json` (JSON/estilo JSON5)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompts, memórias; torne-o um repositório git privado)

Inicialize uma vez:

```bash
openclaw setup
```

De dentro deste repositório, use a entrada local da CLI:

```bash
openclaw setup
```

Se você ainda não tiver uma instalação global, execute por meio de `pnpm openclaw setup` (ou `bun run openclaw setup` se estiver usando o fluxo Bun).

## Execute o Gateway a partir deste repositório

Após `pnpm build`, você pode executar a CLI empacotada diretamente:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Fluxo estável (app macOS primeiro)

1. Instale e inicie o **OpenClaw.app** (barra de menu).
2. Conclua a checklist de onboarding/permissões (prompts TCC).
3. Verifique se o Gateway está em **Local** e em execução (o app o gerencia).
4. Vincule superfícies (exemplo: WhatsApp):

```bash
openclaw channels login
```

5. Verificação rápida:

```bash
openclaw health
```

Se o onboarding não estiver disponível no seu build:

- Execute `openclaw setup`, depois `openclaw channels login` e então inicie o Gateway manualmente (`openclaw gateway`).

## Fluxo de ponta (Gateway em um terminal)

Objetivo: trabalhar no Gateway TypeScript, obter hot reload e manter a UI do app macOS conectada.

### 0) (Opcional) Execute também o app macOS a partir do código-fonte

Se você também quiser o app macOS na ponta:

```bash
./scripts/restart-mac.sh
```

### 1) Inicie o Gateway de desenvolvimento

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` executa o gateway em modo watch e recarrega em mudanças relevantes de código-fonte,
configuração e metadados de plugins empacotados.

Se você estiver usando intencionalmente o fluxo Bun, os comandos equivalentes são:

```bash
bun install
bun run gateway:watch
```

### 2) Aponte o app macOS para o Gateway em execução

No **OpenClaw.app**:

- Modo de conexão: **Local**
  O app se conectará ao gateway em execução na porta configurada.

### 3) Verifique

- O status do Gateway no app deve mostrar **“Usando gateway existente …”**
- Ou via CLI:

```bash
openclaw health
```

### Armadilhas comuns

- **Porta errada:** o WS do Gateway usa por padrão `ws://127.0.0.1:18789`; mantenha app + CLI na mesma porta.
- **Onde o estado fica:**
  - Estado de canal/provider: `~/.openclaw/credentials/`
  - Perfis de autenticação de modelo: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessões: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Mapa de armazenamento de credenciais

Use isto ao depurar autenticação ou decidir o que fazer backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token do bot do Telegram**: config/env ou `channels.telegram.tokenFile` (apenas arquivo normal; symlinks rejeitados)
- **Token do bot do Discord**: config/env ou SecretRef (providers env/file/exec)
- **Tokens do Slack**: config/env (`channels.slack.*`)
- **Allowlists de pareamento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (conta padrão)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (contas não padrão)
- **Perfis de autenticação de modelo**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload de segredos com suporte a arquivo (opcional)**: `~/.openclaw/secrets.json`
- **Importação legada de OAuth**: `~/.openclaw/credentials/oauth.json`
  Mais detalhes: [Security](/pt-BR/gateway/security#credential-storage-map).

## Atualização (sem destruir sua configuração)

- Mantenha `~/.openclaw/workspace` e `~/.openclaw/` como “suas coisas”; não coloque prompts/configurações pessoais no repositório `openclaw`.
- Atualizando o código-fonte: `git pull` + a etapa de instalação do gerenciador de pacotes escolhido (`pnpm install` por padrão; `bun install` para o fluxo Bun) + continue usando o comando `gateway:watch` correspondente.

## Linux (serviço de usuário systemd)

Instalações Linux usam um serviço de **usuário** do systemd. Por padrão, o systemd interrompe
serviços de usuário em logout/inatividade, o que derruba o Gateway. O onboarding tenta ativar
o lingering para você (pode solicitar sudo). Se ainda estiver desativado, execute:

```bash
sudo loginctl enable-linger $USER
```

Para servidores sempre ativos ou multiusuário, considere um serviço de **sistema** em vez de um
serviço de usuário (sem necessidade de lingering). Consulte [Runbook do Gateway](/pt-BR/gateway) para observações sobre systemd.

## Documentação relacionada

- [Runbook do Gateway](/pt-BR/gateway) (flags, supervisão, portas)
- [Configuração do Gateway](/pt-BR/gateway/configuration) (schema de configuração + exemplos)
- [Discord](/pt-BR/channels/discord) e [Telegram](/pt-BR/channels/telegram) (tags de resposta + configurações `replyToMode`)
- [Configuração do assistente OpenClaw](/start/openclaw)
- [app macOS](/platforms/macos) (ciclo de vida do gateway)
