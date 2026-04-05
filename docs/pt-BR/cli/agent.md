---
read_when:
    - Você quer executar um turno de agente a partir de scripts (com entrega opcional da resposta)
summary: Referência da CLI para `openclaw agent` (executar um turno de agente via o Gateway)
title: agent
x-i18n:
    generated_at: "2026-04-05T12:37:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0627f943bc7f3556318008f76dc6150788cf06927dccdc7d2681acb98f257d56
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Execute um turno de agente via o Gateway (use `--local` para incorporado).
Use `--agent <id>` para direcionar diretamente a um agente configurado.

Passe pelo menos um seletor de sessão:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Relacionado:

- Ferramenta de envio de agente: [Agent send](/tools/agent-send)

## Opções

- `-m, --message <text>`: corpo da mensagem obrigatório
- `-t, --to <dest>`: destinatário usado para derivar a chave da sessão
- `--session-id <id>`: id de sessão explícito
- `--agent <id>`: id do agente; substitui os bindings de roteamento
- `--thinking <off|minimal|low|medium|high|xhigh>`: nível de raciocínio do agente
- `--verbose <on|off>`: persiste o nível detalhado para a sessão
- `--channel <channel>`: canal de entrega; omita para usar o canal da sessão principal
- `--reply-to <target>`: substituição do destino de entrega
- `--reply-channel <channel>`: substituição do canal de entrega
- `--reply-account <id>`: substituição da conta de entrega
- `--local`: executa diretamente o agente incorporado (após o preload do registro de plugins)
- `--deliver`: envia a resposta de volta para o canal/destino selecionado
- `--timeout <seconds>`: substitui o timeout do agente (padrão 600 ou valor da configuração)
- `--json`: gera saída em JSON

## Exemplos

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Observações

- O modo Gateway usa o agente incorporado como fallback quando a solicitação ao Gateway falha. Use `--local` para forçar a execução incorporada desde o início.
- `--local` ainda faz preload do registro de plugins primeiro, para que providers, ferramentas e canais fornecidos por plugins continuem disponíveis durante execuções incorporadas.
- `--channel`, `--reply-channel` e `--reply-account` afetam a entrega da resposta, não o roteamento da sessão.
- Quando este comando aciona a regeneração de `models.json`, as credenciais de provider gerenciadas por SecretRef são persistidas como marcadores não secretos (por exemplo, nomes de variáveis de ambiente, `secretref-env:ENV_VAR_NAME` ou `secretref-managed`), não como texto simples dos segredos resolvidos.
- Gravações de marcadores são autoritativas da fonte: o OpenClaw persiste marcadores a partir do snapshot ativo da configuração de origem, não dos valores secretos resolvidos em runtime.
