---
read_when:
    - Você quer um diagnóstico rápido da integridade dos canais + destinatários recentes da sessão
    - Você quer um status “all” copiável para depuração
summary: Referência da CLI para `openclaw status` (diagnósticos, sondagens, snapshots de uso)
title: status
x-i18n:
    generated_at: "2026-04-05T12:38:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbe9d94fbe9938cd946ee6f293b5bd3b464b75e1ade2eacdd851788c3bffe94e
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnósticos para canais + sessões.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Observações:

- `--deep` executa sondagens ativas (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` imprime janelas de uso normalizadas como `X% left`.
- Os campos brutos `usage_percent` / `usagePercent` do MiniMax representam a cota restante, então o OpenClaw os inverte antes da exibição; campos baseados em contagem têm prioridade quando presentes. Respostas `model_remains` preferem a entrada do modelo de chat, derivam o rótulo da janela a partir de timestamps quando necessário e incluem o nome do modelo no rótulo do plano.
- Quando o snapshot da sessão atual é esparso, `/status` pode preencher contadores de token e cache a partir do log de uso da transcrição mais recente. Valores ativos não nulos existentes ainda têm prioridade sobre o fallback da transcrição.
- O fallback da transcrição também pode recuperar o rótulo do modelo de runtime ativo quando a entrada da sessão ativa não o contém. Se esse modelo da transcrição diferir do modelo selecionado, o status resolve a janela de contexto com base no modelo de runtime recuperado em vez do modelo selecionado.
- Para contabilização do tamanho do prompt, o fallback da transcrição prefere o maior total orientado a prompt quando os metadados da sessão estão ausentes ou são menores, para que sessões de provedor personalizado não colapsem para exibições de token `0`.
- A saída inclui armazenamentos de sessão por agente quando múltiplos agentes estão configurados.
- A visão geral inclui o status de instalação/runtime do Gateway + serviço de host de node, quando disponível.
- A visão geral inclui canal de atualização + SHA do git (para checkouts do código-fonte).
- Informações de atualização aparecem na visão geral; se uma atualização estiver disponível, o status imprime uma dica para executar `openclaw update` (consulte [Atualização](/install/updating)).
- Superfícies de status somente leitura (`status`, `status --json`, `status --all`) resolvem SecretRefs compatíveis para seus caminhos de configuração de destino quando possível.
- Se um SecretRef de canal compatível estiver configurado, mas indisponível no caminho atual do comando, o status permanece somente leitura e relata saída degradada em vez de falhar. A saída para humanos mostra avisos como “configured token unavailable in this command path”, e a saída JSON inclui `secretDiagnostics`.
- Quando a resolução local de SecretRef do comando é bem-sucedida, o status prefere o snapshot resolvido e remove marcadores transitórios de “secret unavailable” dos canais na saída final.
- `status --all` inclui uma linha de visão geral de Segredos e uma seção de diagnóstico que resume diagnósticos de segredo (truncados para legibilidade) sem interromper a geração do relatório.
