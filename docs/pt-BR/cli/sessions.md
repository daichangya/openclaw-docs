---
read_when:
    - Você quer listar sessões armazenadas e ver a atividade recente
summary: Referência da CLI para `openclaw sessions` (listar sessões armazenadas + uso)
title: sessions
x-i18n:
    generated_at: "2026-04-05T12:38:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47eb55d90bd0681676283310cfa50dcacc95dff7d9a39bf2bb188788c6e5e5ba
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

Liste sessões de conversa armazenadas.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Seleção de escopo:

- padrão: armazenamento do agente padrão configurado
- `--verbose`: logging detalhado
- `--agent <id>`: armazenamento de um agente configurado
- `--all-agents`: agrega todos os armazenamentos de agentes configurados
- `--store <path>`: caminho explícito do armazenamento (não pode ser combinado com `--agent` ou `--all-agents`)

`openclaw sessions --all-agents` lê os armazenamentos de agentes configurados. A descoberta de sessão do Gateway e do ACP
é mais ampla: também inclui armazenamentos somente em disco encontrados sob
a raiz padrão `agents/` ou uma raiz `session.store` com template. Esses
armazenamentos descobertos devem ser resolvidos para arquivos `sessions.json` regulares dentro da
raiz do agente; links simbólicos e caminhos fora da raiz são ignorados.

Exemplos de JSON:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Manutenção de limpeza

Execute a manutenção agora (em vez de esperar pelo próximo ciclo de gravação):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` usa as configurações de `session.maintenance` da configuração:

- Observação de escopo: `openclaw sessions cleanup` faz manutenção apenas de armazenamentos/transcrições de sessão. Não remove logs de execução do cron (`cron/runs/<jobId>.jsonl`), que são gerenciados por `cron.runLog.maxBytes` e `cron.runLog.keepLines` em [Configuração do Cron](/automation/cron-jobs#configuration) e explicados em [Manutenção do Cron](/automation/cron-jobs#maintenance).

- `--dry-run`: visualiza quantas entradas seriam removidas/limitadas sem gravar.
  - No modo de texto, `dry-run` imprime uma tabela de ações por sessão (`Action`, `Key`, `Age`, `Model`, `Flags`) para que você veja o que seria mantido versus removido.
- `--enforce`: aplica a manutenção mesmo quando `session.maintenance.mode` é `warn`.
- `--fix-missing`: remove entradas cujos arquivos de transcrição estão ausentes, mesmo que normalmente ainda não estivessem fora do limite por idade/contagem.
- `--active-key <key>`: protege uma chave ativa específica contra remoção por orçamento de disco.
- `--agent <id>`: executa a limpeza para o armazenamento de um agente configurado.
- `--all-agents`: executa a limpeza para todos os armazenamentos de agentes configurados.
- `--store <path>`: executa em relação a um arquivo `sessions.json` específico.
- `--json`: imprime um resumo em JSON. Com `--all-agents`, a saída inclui um resumo por armazenamento.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Relacionado:

- Configuração de sessão: [Referência de configuração](/gateway/configuration-reference#session)
