---
read_when:
    - Configurando uma nova máquina
    - Você quer a “última e melhor” versão sem quebrar sua configuração pessoal
summary: Fluxos de trabalho avançados de configuração e desenvolvimento para OpenClaw
title: Configuração
x-i18n:
    generated_at: "2026-04-20T05:41:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 773cdbef5f38b069303b5e13fca5fcdc28f082746869f17b8b92aab1610b95a8
    source_path: start/setup.md
    workflow: 15
---

# Configuração

<Note>
Se você estiver configurando pela primeira vez, comece com [Primeiros passos](/pt-BR/start/getting-started).
Para detalhes de onboarding, veja [Onboarding (CLI)](/pt-BR/start/wizard).
</Note>

## Resumo rápido

- **A personalização fica fora do repositório:** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (configuração).
- **Fluxo de trabalho estável:** instale o app do macOS; deixe-o executar o Gateway incluído.
- **Fluxo de trabalho de ponta:** execute o Gateway você mesmo via `pnpm gateway:watch`, depois deixe o app do macOS se conectar no modo Local.

## Pré-requisitos (a partir do código-fonte)

- Node 24 recomendado (Node 22 LTS, atualmente `22.14+`, ainda compatível)
- `pnpm` preferencial (ou Bun, se você estiver usando intencionalmente o [fluxo de trabalho com Bun](/pt-BR/install/bun))
- Docker (opcional; apenas para configuração em contêiner/e2e — veja [Docker](/pt-BR/install/docker))

## Estratégia de personalização (para que as atualizações não prejudiquem)

Se você quer algo “100% personalizado para mim” _e_ atualizações fáceis, mantenha sua personalização em:

- **Configuração:** `~/.openclaw/openclaw.json` (estilo JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompts, memórias; transforme-o em um repositório git privado)

Inicialize uma vez:

```bash
openclaw setup
```

De dentro deste repositório, use a entrada local da CLI:

```bash
openclaw setup
```

Se você ainda não tiver uma instalação global, execute via `pnpm openclaw setup` (ou `bun run openclaw setup` se estiver usando o fluxo de trabalho com Bun).

## Execute o Gateway a partir deste repositório

Depois de `pnpm build`, você pode executar a CLI empacotada diretamente:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Fluxo de trabalho estável (app do macOS primeiro)

1. Instale e abra o **OpenClaw.app** (barra de menus).
2. Conclua a lista de verificação de onboarding/permissões (prompts do TCC).
3. Garanta que o Gateway esteja em **Local** e em execução (o app o gerencia).
4. Vincule as superfícies (exemplo: WhatsApp):

```bash
openclaw channels login
```

5. Verificação rápida:

```bash
openclaw health
```

Se o onboarding não estiver disponível na sua build:

- Execute `openclaw setup`, depois `openclaw channels login`, e então inicie o Gateway manualmente (`openclaw gateway`).

## Fluxo de trabalho de ponta (Gateway em um terminal)

Objetivo: trabalhar no Gateway em TypeScript, obter hot reload e manter a interface do app do macOS conectada.

### 0) (Opcional) Execute também o app do macOS a partir do código-fonte

Se você também quiser o app do macOS na versão de ponta:

```bash
./scripts/restart-mac.sh
```

### 1) Inicie o Gateway de desenvolvimento

```bash
pnpm install
# Apenas na primeira execução (ou após redefinir a configuração/workspace local do OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` executa o gateway em modo watch e recarrega em mudanças relevantes no código-fonte, na configuração e nos metadados de plugins incluídos.
`pnpm openclaw setup` é a etapa única de inicialização da configuração/workspace local para um checkout novo.
`pnpm gateway:watch` não recompila `dist/control-ui`, então execute `pnpm ui:build` novamente após mudanças em `ui/` ou use `pnpm ui:dev` enquanto desenvolve a Control UI.

Se você estiver usando intencionalmente o fluxo de trabalho com Bun, os comandos equivalentes são:

```bash
bun install
# Apenas na primeira execução (ou após redefinir a configuração/workspace local do OpenClaw)
bun run openclaw setup
bun run gateway:watch
```

### 2) Aponte o app do macOS para o Gateway em execução

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
- **Onde o estado fica armazenado:**
  - Estado de canal/provedor: `~/.openclaw/credentials/`
  - Perfis de autenticação de modelo: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessões: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Mapa de armazenamento de credenciais

Use isto ao depurar autenticação ou decidir o que fazer backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token de bot do Telegram**: configuração/env ou `channels.telegram.tokenFile` (apenas arquivo comum; symlinks são rejeitados)
- **Token de bot do Discord**: configuração/env ou SecretRef (provedores env/file/exec)
- **Tokens do Slack**: configuração/env (`channels.slack.*`)
- **Listas de permissão de pareamento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (conta padrão)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (contas não padrão)
- **Perfis de autenticação de modelo**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload de segredos com base em arquivo (opcional)**: `~/.openclaw/secrets.json`
- **Importação legada de OAuth**: `~/.openclaw/credentials/oauth.json`
  Mais detalhes: [Segurança](/pt-BR/gateway/security#credential-storage-map).

## Atualização (sem destruir sua configuração)

- Mantenha `~/.openclaw/workspace` e `~/.openclaw/` como “suas coisas”; não coloque prompts/configurações pessoais no repositório `openclaw`.
- Atualizando o código-fonte: `git pull` + a etapa de instalação do gerenciador de pacotes escolhido (`pnpm install` por padrão; `bun install` para o fluxo de trabalho com Bun) + continue usando o comando `gateway:watch` correspondente.

## Linux (serviço de usuário systemd)

As instalações no Linux usam um serviço **de usuário** do systemd. Por padrão, o systemd interrompe serviços de usuário em logout/inatividade, o que encerra o Gateway. O onboarding tenta ativar o lingering para você (pode solicitar sudo). Se ainda estiver desativado, execute:

```bash
sudo loginctl enable-linger $USER
```

Para servidores sempre ativos ou com múltiplos usuários, considere usar um serviço **de sistema** em vez de um serviço de usuário (sem necessidade de lingering). Veja o [guia operacional do Gateway](/pt-BR/gateway) para as observações sobre systemd.

## Documentação relacionada

- [Guia operacional do Gateway](/pt-BR/gateway) (flags, supervisão, portas)
- [Configuração do Gateway](/pt-BR/gateway/configuration) (schema de configuração + exemplos)
- [Discord](/pt-BR/channels/discord) e [Telegram](/pt-BR/channels/telegram) (tags de resposta + configurações de replyToMode)
- [Configuração do assistente OpenClaw](/pt-BR/start/openclaw)
- [app do macOS](/pt-BR/platforms/macos) (ciclo de vida do gateway)
