---
read_when:
    - Agendar jobs em segundo plano ou ativações
    - Integrar gatilhos externos (Webhooks, Gmail) ao OpenClaw
    - Decidir entre Heartbeat e Cron para tarefas agendadas
summary: Jobs agendados, Webhooks e gatilhos do Gmail PubSub para o agendador do Gateway
title: Tarefas agendadas
x-i18n:
    generated_at: "2026-04-21T05:35:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e25f4dc8ee7b8f88e22d5cbc86e4527a9f5ac0ab4921e7874f76b186054682a3
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Tarefas agendadas (Cron)

Cron é o agendador integrado do Gateway. Ele persiste jobs, ativa o agente no momento certo e pode entregar a saída de volta para um canal de chat ou endpoint de Webhook.

## Início rápido

```bash
# Adicione um lembrete de execução única
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Verifique seus jobs
openclaw cron list

# Veja o histórico de execuções
openclaw cron runs --id <job-id>
```

## Como o cron funciona

- O Cron é executado **dentro do processo Gateway** (não dentro do modelo).
- As definições de jobs persistem em `~/.openclaw/cron/jobs.json`, então reinicializações não perdem os agendamentos.
- O estado de execução em runtime persiste ao lado dele em `~/.openclaw/cron/jobs-state.json`. Se você rastrear definições de cron no git, rastreie `jobs.json` e adicione `jobs-state.json` ao gitignore.
- Após a divisão, versões mais antigas do OpenClaw conseguem ler `jobs.json`, mas podem tratar os jobs como novos porque os campos de runtime agora ficam em `jobs-state.json`.
- Todas as execuções de cron criam registros de [tarefa em segundo plano](/pt-BR/automation/tasks).
- Jobs de execução única (`--at`) são excluídos automaticamente após sucesso por padrão.
- Execuções isoladas de cron fecham, em regime de melhor esforço, abas/processos de navegador rastreados para sua sessão `cron:<jobId>` quando a execução termina, para que a automação de navegador destacada não deixe processos órfãos para trás.
- Execuções isoladas de cron também protegem contra respostas de confirmação obsoletas. Se o primeiro resultado for apenas uma atualização de status intermediária (`on it`, `pulling everything together` e dicas semelhantes) e nenhuma execução descendente de subagente ainda for responsável pela resposta final, o OpenClaw faz uma nova solicitação uma vez para obter o resultado real antes da entrega.

<a id="maintenance"></a>

A reconciliação de tarefas para cron é controlada pelo runtime: uma tarefa de cron ativa permanece ativa enquanto o runtime de cron ainda rastrear esse job como em execução, mesmo que uma linha antiga de sessão filha ainda exista.
Quando o runtime deixa de ser responsável pelo job e a janela de tolerância de 5 minutos expira, a manutenção pode marcar a tarefa como `lost`.

## Tipos de agendamento

| Tipo    | Flag da CLI | Descrição                                                  |
| ------- | ----------- | ---------------------------------------------------------- |
| `at`    | `--at`      | Timestamp de execução única (ISO 8601 ou relativo como `20m`) |
| `every` | `--every`   | Intervalo fixo                                             |
| `cron`  | `--cron`    | Expressão cron de 5 ou 6 campos com `--tz` opcional        |

Timestamps sem fuso horário são tratados como UTC. Adicione `--tz America/New_York` para agendamento no horário local.

Expressões recorrentes no topo da hora são automaticamente escalonadas em até 5 minutos para reduzir picos de carga. Use `--exact` para forçar o horário exato ou `--stagger 30s` para uma janela explícita.

### Dia do mês e dia da semana usam lógica OR

Expressões cron são analisadas por [croner](https://github.com/Hexagon/croner). Quando os campos de dia do mês e dia da semana não usam curinga, o croner corresponde quando **qualquer um** dos campos corresponde — não ambos. Esse é o comportamento padrão do Vixie cron.

```
# Pretendido: "9h no dia 15, somente se for uma segunda-feira"
# Real:       "9h em todo dia 15, E 9h em toda segunda-feira"
0 9 15 * 1
```

Isso dispara ~5–6 vezes por mês em vez de 0–1 vez por mês. O OpenClaw usa aqui o comportamento OR padrão do Croner. Para exigir ambas as condições, use o modificador `+` de dia da semana do Croner (`0 9 15 * +1`) ou agende com base em um campo e valide o outro no prompt ou comando do seu job.

## Estilos de execução

| Estilo          | Valor de `--session`  | Executa em               | Melhor para                    |
| --------------- | --------------------- | ------------------------ | ------------------------------ |
| Sessão principal | `main`               | Próximo turno de Heartbeat | Lembretes, eventos de sistema |
| Isolado         | `isolated`            | `cron:<jobId>` dedicado  | Relatórios, tarefas em segundo plano |
| Sessão atual    | `current`             | Vinculada no momento da criação | Trabalho recorrente com contexto |
| Sessão customizada | `session:custom-id` | Sessão nomeada persistente | Fluxos de trabalho que se baseiam no histórico |

Jobs da **sessão principal** enfileiram um evento de sistema e opcionalmente ativam o Heartbeat (`--wake now` ou `--wake next-heartbeat`). Jobs **isolados** executam um turno dedicado do agente com uma sessão nova. **Sessões customizadas** (`session:xxx`) persistem o contexto entre execuções, permitindo fluxos de trabalho como reuniões diárias que se apoiam em resumos anteriores.

Para jobs isolados, o encerramento em runtime agora inclui limpeza de navegador, em regime de melhor esforço, para essa sessão cron. Falhas na limpeza são ignoradas para que o resultado real do cron continue prevalecendo.

Quando execuções isoladas de cron orquestram subagentes, a entrega também prioriza a saída final descendente em vez de texto intermediário obsoleto do pai. Se os descendentes ainda estiverem em execução, o OpenClaw suprime essa atualização parcial do pai em vez de anunciá-la.

### Opções de payload para jobs isolados

- `--message`: texto do prompt (obrigatório para isolado)
- `--model` / `--thinking`: substituições do modelo e do nível de raciocínio
- `--light-context`: ignora a injeção do arquivo bootstrap do workspace
- `--tools exec,read`: restringe quais ferramentas o job pode usar

`--model` usa o modelo permitido selecionado para esse job. Se o modelo solicitado não for permitido, o cron registra um aviso e volta para a seleção de modelo do agente/padrão do job. Cadeias de fallback configuradas continuam sendo aplicadas, mas uma simples substituição de modelo sem lista de fallback explícita por job não acrescenta mais o primário do agente como alvo extra oculto de nova tentativa.

A precedência de seleção de modelo para jobs isolados é:

1. Substituição de modelo do hook do Gmail (quando a execução veio do Gmail e essa substituição é permitida)
2. `model` no payload por job
3. Substituição de modelo armazenada da sessão cron
4. Seleção de modelo do agente/padrão

O modo rápido também segue a seleção ativa resolvida. Se a configuração do modelo selecionado tiver `params.fastMode`, o cron isolado usa isso por padrão. Uma substituição armazenada de `fastMode` da sessão ainda prevalece sobre a configuração em qualquer direção.

Se uma execução isolada atingir uma transferência de controle por troca de modelo ativa, o cron tenta novamente com o provider/modelo alterado e persiste essa seleção ativa antes da nova tentativa. Quando a troca também traz um novo perfil de autenticação, o cron também persiste essa substituição de perfil de autenticação. As novas tentativas são limitadas: após a tentativa inicial mais 2 novas tentativas por troca, o cron aborta em vez de entrar em loop infinito.

## Entrega e saída

| Modo       | O que acontece                                         |
| ---------- | ------------------------------------------------------ |
| `announce` | Entrega o resumo ao canal de destino (padrão para isolado) |
| `webhook`  | Envia um payload de evento concluído por POST para uma URL |
| `none`     | Apenas interno, sem entrega                            |

Use `--announce --channel telegram --to "-1001234567890"` para entrega em canal. Para tópicos de fórum do Telegram, use `-1001234567890:topic:123`. Destinos do Slack/Discord/Mattermost devem usar prefixos explícitos (`channel:<id>`, `user:<id>`).

Para jobs isolados controlados pelo cron, o executor é responsável pelo caminho final de entrega. O agente recebe um prompt para retornar um resumo em texto simples, e esse resumo então é enviado por `announce`, `webhook` ou mantido interno para `none`. `--no-deliver` não devolve a entrega ao agente; ele mantém a execução interna.

Se a tarefa original disser explicitamente para enviar mensagem a algum destinatário externo, o agente deve indicar em sua saída quem/onde essa mensagem deve ir, em vez de tentar enviá-la diretamente.

Notificações de falha seguem um caminho de destino separado:

- `cron.failureDestination` define um padrão global para notificações de falha.
- `job.delivery.failureDestination` substitui isso por job.
- Se nenhum estiver definido e o job já fizer entrega via `announce`, as notificações de falha agora recorrem a esse destino principal de anúncio.
- `delivery.failureDestination` só é compatível com jobs `sessionTarget="isolated"`, a menos que o modo principal de entrega seja `webhook`.

## Exemplos de CLI

Lembrete de execução única (sessão principal):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Job isolado recorrente com entrega:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Job isolado com substituição de modelo e nível de raciocínio:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhooks

O Gateway pode expor endpoints HTTP de Webhook para gatilhos externos. Habilite na configuração:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Autenticação

Toda requisição deve incluir o token do hook via cabeçalho:

- `Authorization: Bearer <token>` (recomendado)
- `x-openclaw-token: <token>`

Tokens na query string são rejeitados.

### POST /hooks/wake

Enfileira um evento de sistema para a sessão principal:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (obrigatório): descrição do evento
- `mode` (opcional): `now` (padrão) ou `next-heartbeat`

### POST /hooks/agent

Executa um turno isolado do agente:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Campos: `message` (obrigatório), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Hooks mapeados (POST /hooks/\<name\>)

Nomes de hook customizados são resolvidos via `hooks.mappings` na configuração. Os mapeamentos podem transformar payloads arbitrários em ações `wake` ou `agent` com templates ou transformações por código.

### Segurança

- Mantenha endpoints de hook atrás de loopback, tailnet ou proxy reverso confiável.
- Use um token de hook dedicado; não reutilize tokens de autenticação do gateway.
- Mantenha `hooks.path` em um subcaminho dedicado; `/` é rejeitado.
- Defina `hooks.allowedAgentIds` para limitar o roteamento explícito por `agentId`.
- Mantenha `hooks.allowRequestSessionKey=false` a menos que você precise de sessões selecionadas pelo chamador.
- Se você habilitar `hooks.allowRequestSessionKey`, também defina `hooks.allowedSessionKeyPrefixes` para restringir os formatos permitidos de chave de sessão.
- Payloads de hook são encapsulados com limites de segurança por padrão.

## Integração com Gmail PubSub

Conecte gatilhos da caixa de entrada do Gmail ao OpenClaw via Google PubSub.

**Pré-requisitos**: CLI `gcloud`, `gog` (gogcli), hooks do OpenClaw habilitados, Tailscale para o endpoint HTTPS público.

### Configuração pelo assistente (recomendada)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Isso grava a configuração `hooks.gmail`, habilita a predefinição do Gmail e usa o Tailscale Funnel para o endpoint de push.

### Inicialização automática do Gateway

Quando `hooks.enabled=true` e `hooks.gmail.account` estiver definido, o Gateway inicia `gog gmail watch serve` na inicialização e renova automaticamente a observação. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desativar isso.

### Configuração manual única

1. Selecione o projeto do GCP que possui o cliente OAuth usado pelo `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Crie o tópico e conceda ao Gmail acesso de push:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Inicie a observação:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Substituição de modelo do Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Gerenciar jobs

```bash
# Liste todos os jobs
openclaw cron list

# Edite um job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force a execução de um job agora
openclaw cron run <jobId>

# Execute apenas se estiver vencido
openclaw cron run <jobId> --due

# Veja o histórico de execuções
openclaw cron runs --id <jobId> --limit 50

# Exclua um job
openclaw cron remove <jobId>

# Seleção de agente (configurações com vários agentes)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Observação sobre substituição de modelo:

- `openclaw cron add|edit --model ...` altera o modelo selecionado do job.
- Se o modelo for permitido, esse provider/modelo exato chega à execução isolada do agente.
- Se não for permitido, o cron emite um aviso e volta para a seleção de modelo do agente/padrão do job.
- Cadeias de fallback configuradas continuam sendo aplicadas, mas uma simples substituição `--model` sem lista explícita de fallback por job não passa mais para o modelo primário do agente como um alvo extra silencioso de nova tentativa.

## Configuração

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

O sidecar de estado de runtime é derivado de `cron.store`: um armazenamento `.json` como `~/clawd/cron/jobs.json` usa `~/clawd/cron/jobs-state.json`, enquanto um caminho de armazenamento sem o sufixo `.json` acrescenta `-state.json`.

Desative o cron: `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

**Nova tentativa para execução única**: erros transitórios (limite de taxa, sobrecarga, rede, erro de servidor) tentam novamente até 3 vezes com backoff exponencial. Erros permanentes desativam imediatamente.

**Nova tentativa recorrente**: backoff exponencial (30s a 60m) entre tentativas. O backoff é redefinido após a próxima execução bem-sucedida.

**Manutenção**: `cron.sessionRetention` (padrão `24h`) remove entradas de sessão de execução isolada. `cron.runLog.maxBytes` / `cron.runLog.keepLines` fazem a poda automática dos arquivos de log de execução.

## Solução de problemas

### Sequência de comandos

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### O Cron não dispara

- Verifique `cron.enabled` e a variável de ambiente `OPENCLAW_SKIP_CRON`.
- Confirme que o Gateway está em execução contínua.
- Para agendamentos `cron`, verifique o fuso horário (`--tz`) em relação ao fuso horário do host.
- `reason: not-due` na saída da execução significa que a execução manual foi verificada com `openclaw cron run <jobId> --due` e o job ainda não estava vencido.

### O Cron disparou, mas não houve entrega

- Modo de entrega `none` significa que nenhuma mensagem externa é esperada.
- Destino de entrega ausente/inválido (`channel`/`to`) significa que a saída foi ignorada.
- Erros de autenticação do canal (`unauthorized`, `Forbidden`) significam que a entrega foi bloqueada pelas credenciais.
- Se a execução isolada retornar apenas o token silencioso (`NO_REPLY` / `no_reply`), o OpenClaw suprime a entrega direta de saída e também suprime o caminho alternativo de resumo enfileirado, então nada é publicado de volta no chat.
- Para jobs isolados controlados pelo cron, não espere que o agente use a ferramenta de mensagem como fallback. O executor é responsável pela entrega final; `--no-deliver` a mantém interna em vez de permitir um envio direto.

### Armadilhas de fuso horário

- Cron sem `--tz` usa o fuso horário do host do gateway.
- Agendamentos `at` sem fuso horário são tratados como UTC.
- `activeHours` do Heartbeat usa a resolução de fuso horário configurada.

## Relacionado

- [Automação e tarefas](/pt-BR/automation) — todos os mecanismos de automação em um relance
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — registro de tarefas para execuções de cron
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos da sessão principal
- [Fuso horário](/pt-BR/concepts/timezone) — configuração de fuso horário
