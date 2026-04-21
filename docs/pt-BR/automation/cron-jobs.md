---
read_when:
    - Agendamento de jobs em segundo plano ou ativações
    - Conectando gatilhos externos (Webhooks, Gmail) ao OpenClaw
    - Decidindo entre Heartbeat e Cron para tarefas agendadas
summary: Jobs agendados, Webhooks e gatilhos PubSub do Gmail para o agendador do Gateway
title: Tarefas agendadas
x-i18n:
    generated_at: "2026-04-21T13:35:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac08f67af43bc85a1713558899a220c935479620f1ef74aa76336259daac2828
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Tarefas agendadas (Cron)

Cron é o agendador integrado do Gateway. Ele persiste jobs, desperta o agente no momento certo e pode entregar a saída de volta para um canal de chat ou endpoint de Webhook.

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
openclaw cron show <job-id>

# Veja o histórico de execuções
openclaw cron runs --id <job-id>
```

## Como o Cron funciona

- O Cron é executado **dentro do processo Gateway** (não dentro do modelo).
- As definições de job persistem em `~/.openclaw/cron/jobs.json`, então reinicializações não perdem agendamentos.
- O estado de execução em tempo de execução persiste ao lado, em `~/.openclaw/cron/jobs-state.json`. Se você rastreia definições de cron no git, rastreie `jobs.json` e adicione `jobs-state.json` ao gitignore.
- Após a divisão, versões mais antigas do OpenClaw conseguem ler `jobs.json`, mas podem tratar jobs como novos, porque os campos de tempo de execução agora ficam em `jobs-state.json`.
- Todas as execuções de cron criam registros de [tarefa em segundo plano](/pt-BR/automation/tasks).
- Jobs de execução única (`--at`) são excluídos automaticamente após sucesso por padrão.
- Execuções de cron isoladas fecham, em modo best-effort, abas/processos de navegador rastreados para sua sessão `cron:<jobId>` quando a execução termina, para que a automação de navegador destacada não deixe processos órfãos para trás.
- Execuções de cron isoladas também se protegem contra respostas de confirmação obsoletas. Se o
  primeiro resultado for apenas uma atualização de status intermediária (`on it`, `pulling everything
together` e dicas semelhantes) e nenhuma execução descendente de subagente ainda
  for responsável pela resposta final, o OpenClaw faz um novo prompt uma vez para obter o resultado
  real antes da entrega.

<a id="maintenance"></a>

A reconciliação de tarefas para cron é de propriedade do runtime: uma tarefa de cron ativa permanece ativa enquanto o
runtime de cron ainda rastrear esse job como em execução, mesmo que uma linha antiga de sessão filha ainda exista.
Assim que o runtime deixar de ser proprietário do job e a janela de tolerância de 5 minutos expirar, a manutenção pode
marcar a tarefa como `lost`.

## Tipos de agendamento

| Tipo    | Flag da CLI | Descrição                                                    |
| ------- | ----------- | ------------------------------------------------------------ |
| `at`    | `--at`      | Timestamp de execução única (ISO 8601 ou relativo como `20m`) |
| `every` | `--every`   | Intervalo fixo                                               |
| `cron`  | `--cron`    | Expressão cron de 5 campos ou 6 campos com `--tz` opcional   |

Timestamps sem fuso horário são tratados como UTC. Adicione `--tz America/New_York` para agendamento por horário local.

Expressões recorrentes no início da hora são automaticamente defasadas em até 5 minutos para reduzir picos de carga. Use `--exact` para forçar temporização precisa ou `--stagger 30s` para uma janela explícita.

### Dia do mês e dia da semana usam lógica OR

Expressões cron são analisadas por [croner](https://github.com/Hexagon/croner). Quando os campos de dia do mês e dia da semana são ambos diferentes de curinga, o croner faz correspondência quando **qualquer um** dos campos corresponde — não ambos. Esse é o comportamento padrão do Vixie cron.

```
# Pretendido: "9h no dia 15, apenas se for uma segunda-feira"
# Real:       "9h em todo dia 15, E 9h em toda segunda-feira"
0 9 15 * 1
```

Isso dispara ~5–6 vezes por mês em vez de 0–1 vez por mês. O OpenClaw usa aqui o comportamento OR padrão do Croner. Para exigir ambas as condições, use o modificador `+` de dia da semana do Croner (`0 9 15 * +1`) ou agende com base em um campo e valide o outro no prompt ou comando do seu job.

## Estilos de execução

| Estilo          | valor de `--session` | Executa em               | Melhor para                    |
| --------------- | -------------------- | ------------------------ | ------------------------------ |
| Sessão principal | `main`               | Próximo turno de Heartbeat | Lembretes, eventos do sistema  |
| Isolado         | `isolated`           | `cron:<jobId>` dedicado  | Relatórios, tarefas em segundo plano |
| Sessão atual    | `current`            | Vinculada na criação     | Trabalho recorrente com contexto |
| Sessão customizada | `session:custom-id` | Sessão nomeada persistente | Fluxos de trabalho baseados em histórico |

Jobs da **sessão principal** enfileiram um evento do sistema e opcionalmente despertam o Heartbeat (`--wake now` ou `--wake next-heartbeat`). Jobs **isolados** executam um turno dedicado do agente com uma sessão nova. **Sessões customizadas** (`session:xxx`) preservam o contexto entre execuções, possibilitando fluxos de trabalho como reuniões diárias que se baseiam em resumos anteriores.

Para jobs isolados, o teardown do runtime agora inclui limpeza de navegador em modo best-effort para essa sessão de cron. Falhas de limpeza são ignoradas para que o resultado real do cron continue prevalecendo.

Quando execuções isoladas de cron orquestram subagentes, a entrega também prioriza a
saída final descendente em vez de texto intermediário obsoleto do pai. Se os descendentes ainda estiverem
em execução, o OpenClaw suprime essa atualização parcial do pai em vez de anunciá-la.

### Opções de payload para jobs isolados

- `--message`: texto do prompt (obrigatório para isolado)
- `--model` / `--thinking`: substituições de modelo e nível de raciocínio
- `--light-context`: ignora a injeção de arquivo de bootstrap do workspace
- `--tools exec,read`: restringe quais ferramentas o job pode usar

`--model` usa o modelo permitido selecionado para esse job. Se o modelo solicitado
não for permitido, o cron registra um aviso e faz fallback para a seleção de modelo
do agente/padrão do job. Cadeias de fallback configuradas ainda se aplicam, mas uma simples
substituição de modelo sem uma lista explícita de fallback por job não adiciona mais o
modelo primário do agente como um destino extra oculto de nova tentativa.

A precedência de seleção de modelo para jobs isolados é:

1. Substituição de modelo do hook do Gmail (quando a execução veio do Gmail e essa substituição é permitida)
2. `model` do payload por job
3. Substituição de modelo de sessão de cron armazenada
4. Seleção de modelo do agente/padrão

O modo rápido também segue a seleção ativa resolvida. Se a configuração do modelo selecionado
tiver `params.fastMode`, o cron isolado usa isso por padrão. Uma substituição armazenada de
sessão para `fastMode` ainda prevalece sobre a configuração em qualquer direção.

Se uma execução isolada atingir uma transferência ativa de troca de modelo, o cron tenta novamente com o
provider/modelo trocado e persiste essa seleção ativa antes de tentar novamente. Quando
a troca também carrega um novo perfil de autenticação, o cron persiste essa substituição de perfil de autenticação também.
As novas tentativas são limitadas: após a tentativa inicial mais 2 tentativas por troca,
o cron aborta em vez de entrar em loop para sempre.

## Entrega e saída

| Modo       | O que acontece                                                      |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Entrega o texto final em fallback para o destino se o agente não enviou |
| `webhook`  | Faz POST do payload de evento concluído para uma URL                |
| `none`     | Sem entrega em fallback pelo runner                                |

Use `--announce --channel telegram --to "-1001234567890"` para entrega em canal. Para tópicos de fórum do Telegram, use `-1001234567890:topic:123`. Destinos do Slack/Discord/Mattermost devem usar prefixos explícitos (`channel:<id>`, `user:<id>`).

Para jobs isolados, a entrega em chat é compartilhada. Se uma rota de chat estiver disponível, o
agente pode usar a ferramenta `message` mesmo quando o job usa `--no-deliver`. Se o
agente enviar para o destino configurado/atual, o OpenClaw ignora o anúncio de fallback.
Caso contrário, `announce`, `webhook` e `none` controlam apenas o que o
runner faz com a resposta final após o turno do agente.

Notificações de falha seguem um caminho de destino separado:

- `cron.failureDestination` define um padrão global para notificações de falha.
- `job.delivery.failureDestination` substitui isso por job.
- Se nenhum dos dois estiver definido e o job já fizer entrega via `announce`, as notificações de falha agora usam fallback para esse destino primário de anúncio.
- `delivery.failureDestination` só é compatível com jobs `sessionTarget="isolated"`, a menos que o modo de entrega primário seja `webhook`.

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

Job recorrente isolado com entrega:

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

Enfileira um evento do sistema para a sessão principal:

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

Nomes de hook personalizados são resolvidos via `hooks.mappings` na configuração. Os mapeamentos podem transformar payloads arbitrários em ações `wake` ou `agent` com templates ou transformações por código.

### Segurança

- Mantenha endpoints de hook por trás de loopback, tailnet ou proxy reverso confiável.
- Use um token de hook dedicado; não reutilize tokens de autenticação do gateway.
- Mantenha `hooks.path` em um subcaminho dedicado; `/` é rejeitado.
- Defina `hooks.allowedAgentIds` para limitar o roteamento explícito por `agentId`.
- Mantenha `hooks.allowRequestSessionKey=false` a menos que você precise de sessões selecionadas pelo chamador.
- Se você habilitar `hooks.allowRequestSessionKey`, também defina `hooks.allowedSessionKeyPrefixes` para restringir os formatos permitidos de chave de sessão.
- Payloads de hook são encapsulados com limites de segurança por padrão.

## Integração com Gmail PubSub

Conecte gatilhos da caixa de entrada do Gmail ao OpenClaw via Google PubSub.

**Pré-requisitos**: CLI `gcloud`, `gog` (gogcli), hooks do OpenClaw habilitados, Tailscale para o endpoint HTTPS público.

### Configuração com assistente (recomendado)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Isso grava a configuração `hooks.gmail`, habilita a predefinição do Gmail e usa Tailscale Funnel para o endpoint de push.

### Inicialização automática do Gateway

Quando `hooks.enabled=true` e `hooks.gmail.account` estiver definido, o Gateway inicia `gog gmail watch serve` na inicialização e renova automaticamente o watch. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desativar isso.

### Configuração manual única

1. Selecione o projeto GCP que possui o cliente OAuth usado por `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Crie o tópico e conceda acesso de push do Gmail:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Inicie o watch:

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

## Gerenciando jobs

```bash
# Liste todos os jobs
openclaw cron list

# Mostre um job, incluindo a rota de entrega resolvida
openclaw cron show <jobId>

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

# Seleção de agente (configurações com múltiplos agentes)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Observação sobre substituição de modelo:

- `openclaw cron add|edit --model ...` altera o modelo selecionado do job.
- Se o modelo for permitido, esse provider/modelo exato chega à execução
  isolada do agente.
- Se não for permitido, o cron emite um aviso e faz fallback para a seleção de modelo
  do agente/padrão do job.
- Cadeias de fallback configuradas ainda se aplicam, mas uma simples substituição com `--model`
  sem lista explícita de fallback por job não faz mais fallback para o
  primário do agente como um destino extra oculto de nova tentativa.

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

O sidecar de estado de runtime é derivado de `cron.store`: um armazenamento `.json`, como
`~/clawd/cron/jobs.json`, usa `~/clawd/cron/jobs-state.json`, enquanto um caminho de armazenamento
sem o sufixo `.json` acrescenta `-state.json`.

Desative o cron: `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

**Nova tentativa de execução única**: erros transitórios (limite de taxa, sobrecarga, rede, erro do servidor) tentam novamente até 3 vezes com backoff exponencial. Erros permanentes desativam imediatamente.

**Nova tentativa recorrente**: backoff exponencial (30s a 60m) entre tentativas. O backoff é redefinido após a próxima execução bem-sucedida.

**Manutenção**: `cron.sessionRetention` (padrão `24h`) remove entradas de sessão de execuções isoladas. `cron.runLog.maxBytes` / `cron.runLog.keepLines` fazem a remoção automática de arquivos de log de execução.

## Solução de problemas

### Escada de comandos

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

### O Cron não está disparando

- Verifique `cron.enabled` e a variável de ambiente `OPENCLAW_SKIP_CRON`.
- Confirme que o Gateway está em execução contínua.
- Para agendamentos `cron`, verifique o fuso horário (`--tz`) em relação ao fuso horário do host.
- `reason: not-due` na saída da execução significa que a execução manual foi verificada com `openclaw cron run <jobId> --due` e o job ainda não estava vencido.

### O Cron disparou, mas não houve entrega

- O modo de entrega `none` significa que não se espera envio de fallback pelo runner. O agente
  ainda pode enviar diretamente com a ferramenta `message` quando uma rota de chat estiver disponível.
- Destino de entrega ausente/inválido (`channel`/`to`) significa que a saída foi ignorada.
- Erros de autenticação do canal (`unauthorized`, `Forbidden`) significam que a entrega foi bloqueada pelas credenciais.
- Se a execução isolada retornar apenas o token silencioso (`NO_REPLY` / `no_reply`),
  o OpenClaw suprime a entrega direta de saída e também suprime o caminho de resumo
  enfileirado de fallback, então nada é publicado de volta no chat.
- Se o agente precisar enviar mensagem ao usuário por conta própria, verifique se o job tem uma
  rota utilizável (`channel: "last"` com um chat anterior, ou um canal/destino explícito).

### Pegadinhas de fuso horário

- Cron sem `--tz` usa o fuso horário do host do gateway.
- Agendamentos `at` sem fuso horário são tratados como UTC.
- `activeHours` do Heartbeat usa a resolução de fuso horário configurada.

## Relacionado

- [Automação e Tasks](/pt-BR/automation) — todos os mecanismos de automação em um relance
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — registro de tarefas para execuções de cron
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos da sessão principal
- [Fuso horário](/pt-BR/concepts/timezone) — configuração de fuso horário
