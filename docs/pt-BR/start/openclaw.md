---
read_when:
    - Fazendo onboarding de uma nova instância de assistente
    - Revisando implicações de segurança/permissões
summary: Guia completo para executar o OpenClaw como assistente pessoal, com alertas de segurança
title: Configuração de Assistente Pessoal
x-i18n:
    generated_at: "2026-04-05T12:53:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02f10a9f7ec08f71143cbae996d91cbdaa19897a40f725d8ef524def41cf2759
    source_path: start/openclaw.md
    workflow: 15
---

# Criando um assistente pessoal com OpenClaw

OpenClaw é um gateway self-hosted que conecta Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e muito mais a agentes de IA. Este guia cobre a configuração de "assistente pessoal": um número de WhatsApp dedicado que se comporta como seu assistente de IA sempre ativo.

## ⚠️ Segurança em primeiro lugar

Você está colocando um agente em posição de:

- executar comandos na sua máquina (dependendo da sua política de ferramentas)
- ler/gravar arquivos no seu workspace
- enviar mensagens de volta via WhatsApp/Telegram/Discord/Mattermost e outros canais empacotados

Comece de forma conservadora:

- Sempre defina `channels.whatsapp.allowFrom` (nunca execute aberto para o mundo no seu Mac pessoal).
- Use um número de WhatsApp dedicado para o assistente.
- Heartbeats agora usam como padrão a cada 30 minutos. Desative até confiar na configuração definindo `agents.defaults.heartbeat.every: "0m"`.

## Pré-requisitos

- OpenClaw instalado e com onboarding concluído — consulte [Getting Started](/pt-BR/start/getting-started) se ainda não fez isso
- Um segundo número de telefone (SIM/eSIM/pré-pago) para o assistente

## A configuração com dois celulares (recomendada)

O ideal é isto:

```mermaid
flowchart TB
    A["<b>Seu celular (pessoal)<br></b><br>Seu WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Segundo celular (assistente)<br></b><br>WhatsApp do assistente<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Seu Mac (openclaw)<br></b><br>Agente de IA"]
```

Se você vincular seu WhatsApp pessoal ao OpenClaw, toda mensagem para você vira “entrada do agente”. Raramente é isso que você quer.

## Início rápido de 5 minutos

1. Pareie o WhatsApp Web (mostra QR; escaneie com o celular do assistente):

```bash
openclaw channels login
```

2. Inicie o Gateway (deixe-o em execução):

```bash
openclaw gateway --port 18789
```

3. Coloque uma configuração mínima em `~/.openclaw/openclaw.json`:

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Agora envie uma mensagem para o número do assistente a partir do seu telefone na allowlist.

Quando o onboarding terminar, abrimos automaticamente o dashboard e imprimimos um link limpo (sem token na URL). Se ele pedir autenticação, cole o segredo compartilhado configurado nas configurações da Control UI. O onboarding usa um token por padrão (`gateway.auth.token`), mas autenticação por senha também funciona se você tiver alterado `gateway.auth.mode` para `password`. Para reabrir depois: `openclaw dashboard`.

## Dê ao agente um workspace (AGENTS)

OpenClaw lê instruções operacionais e “memória” a partir do diretório de workspace.

Por padrão, o OpenClaw usa `~/.openclaw/workspace` como workspace do agente e o criará (junto com `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` iniciais) automaticamente na configuração/primeira execução do agente. `BOOTSTRAP.md` é criado apenas quando o workspace é totalmente novo (não deve voltar depois que você o excluir). `MEMORY.md` é opcional (não é criado automaticamente); quando presente, é carregado para sessões normais. Sessões de subagent injetam apenas `AGENTS.md` e `TOOLS.md`.

Dica: trate essa pasta como a “memória” do OpenClaw e transforme-a em um repositório git (de preferência privado) para que `AGENTS.md` + arquivos de memória tenham backup. Se o git estiver instalado, workspaces totalmente novos são inicializados automaticamente.

```bash
openclaw setup
```

Layout completo do workspace + guia de backup: [Agent workspace](/pt-BR/concepts/agent-workspace)
Fluxo de memória: [Memory](/pt-BR/concepts/memory)

Opcional: escolha um workspace diferente com `agents.defaults.workspace` (suporta `~`).

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

Se você já entrega seus próprios arquivos de workspace a partir de um repositório, pode desativar totalmente a criação de arquivos bootstrap:

```json5
{
  agent: {
    skipBootstrap: true,
  },
}
```

## A configuração que o transforma em "um assistente"

OpenClaw já vem com uma boa configuração padrão para assistente, mas normalmente você vai querer ajustar:

- persona/instruções em [`SOUL.md`](/pt-BR/concepts/soul)
- padrões de thinking (se desejar)
- heartbeats (quando já confiar nele)

Exemplo:

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Comece com 0; habilite depois.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## Sessões e memória

- Arquivos de sessão: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- Metadados de sessão (uso de tokens, última rota etc.): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (legado: `~/.openclaw/sessions/sessions.json`)
- `/new` ou `/reset` inicia uma sessão nova para aquele chat (configurável via `resetTriggers`). Se enviado sozinho, o agente responde com uma saudação curta para confirmar o reset.
- `/compact [instructions]` compacta o contexto da sessão e informa o orçamento de contexto restante.

## Heartbeats (modo proativo)

Por padrão, o OpenClaw executa um heartbeat a cada 30 minutos com o prompt:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Defina `agents.defaults.heartbeat.every: "0m"` para desativar.

- Se `HEARTBEAT.md` existir, mas estiver efetivamente vazio (apenas linhas em branco e cabeçalhos Markdown como `# Heading`), o OpenClaw ignora a execução do heartbeat para economizar chamadas de API.
- Se o arquivo estiver ausente, o heartbeat ainda será executado e o modelo decidirá o que fazer.
- Se o agente responder com `HEARTBEAT_OK` (opcionalmente com um pequeno preenchimento; consulte `agents.defaults.heartbeat.ackMaxChars`), o OpenClaw suprime a entrega de saída para esse heartbeat.
- Por padrão, a entrega de heartbeat para destinos estilo DM `user:<id>` é permitida. Defina `agents.defaults.heartbeat.directPolicy: "block"` para suprimir entrega a destinos diretos mantendo as execuções de heartbeat ativas.
- Heartbeats executam turnos completos do agente — intervalos menores consomem mais tokens.

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## Mídia de entrada e saída

Anexos de entrada (imagens/áudio/documentos) podem ser expostos ao seu comando por templates:

- `{{MediaPath}}` (caminho local do arquivo temporário)
- `{{MediaUrl}}` (pseudo-URL)
- `{{Transcript}}` (se a transcrição de áudio estiver habilitada)

Anexos de saída do agente: inclua `MEDIA:<path-or-url>` em sua própria linha (sem espaços). Exemplo:

```
Here’s the screenshot.
MEDIA:https://example.com/screenshot.png
```

O OpenClaw extrai isso e envia como mídia junto com o texto.

O comportamento de caminho local segue o mesmo modelo de confiança de leitura de arquivos do agente:

- Se `tools.fs.workspaceOnly` for `true`, caminhos locais de `MEDIA:` de saída continuam restritos à raiz temporária do OpenClaw, ao cache de mídia, aos caminhos do workspace do agente e a arquivos gerados no sandbox.
- Se `tools.fs.workspaceOnly` for `false`, `MEDIA:` de saída pode usar arquivos locais do host que o agente já tenha permissão para ler.
- Envios locais do host ainda permitem apenas mídia e tipos seguros de documento (imagens, áudio, vídeo, PDF e documentos do Office). Texto simples e arquivos que parecem conter segredos não são tratados como mídia enviável.

Isso significa que imagens/arquivos gerados fora do workspace agora podem ser enviados quando sua política de fs já permite essas leituras, sem reabrir exfiltração arbitrária de anexos de texto do host.

## Checklist operacional

```bash
openclaw status          # status local (credenciais, sessões, eventos em fila)
openclaw status --all    # diagnóstico completo (somente leitura, copiável)
openclaw status --deep   # solicita ao gateway uma sonda ativa de integridade com sondas de canal quando compatível
openclaw health --json   # snapshot de integridade do gateway (WS; o padrão pode retornar um snapshot em cache recém-atualizado)
```

Os logs ficam em `/tmp/openclaw/` (padrão: `openclaw-YYYY-MM-DD.log`).

## Próximos passos

- WebChat: [WebChat](/web/webchat)
- Operações do Gateway: [Gateway runbook](/pt-BR/gateway)
- Cron + ativações: [Cron jobs](/pt-BR/automation/cron-jobs)
- Complemento macOS na barra de menu: [OpenClaw macOS app](/platforms/macos)
- App node para iOS: [iOS app](/platforms/ios)
- App node para Android: [Android app](/platforms/android)
- Status do Windows: [Windows (WSL2)](/platforms/windows)
- Status do Linux: [Linux app](/pt-BR/platforms/linux)
- Segurança: [Security](/pt-BR/gateway/security)
