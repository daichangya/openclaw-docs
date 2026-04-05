---
read_when:
    - Você quer entender a autocompactação e `/compact`
    - Você está depurando sessões longas que atingem limites de contexto
summary: Como o OpenClaw resume conversas longas para permanecer dentro dos limites do modelo
title: Compactação
x-i18n:
    generated_at: "2026-04-05T12:39:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c6dbd6ebdcd5f918805aafdc153925efef3e130faa3fab3c630832e938219fc
    source_path: concepts/compaction.md
    workflow: 15
---

# Compactação

Todo modelo tem uma janela de contexto -- o número máximo de tokens que ele pode processar.
Quando uma conversa se aproxima desse limite, o OpenClaw **compacta** mensagens mais antigas
em um resumo para que o chat possa continuar.

## Como funciona

1. Turnos mais antigos da conversa são resumidos em uma entrada compacta.
2. O resumo é salvo na transcrição da sessão.
3. As mensagens recentes são mantidas intactas.

Quando o OpenClaw divide o histórico em blocos de compactação, ele mantém chamadas de
ferramentas do assistente emparelhadas com suas entradas `toolResult` correspondentes. Se um
ponto de divisão cair dentro de um bloco de ferramenta, o OpenClaw move o limite para que o
par permaneça junto e a cauda atual não resumida seja preservada.

O histórico completo da conversa permanece no disco. A compactação altera apenas o que o
modelo vê no próximo turno.

## Autocompactação

A autocompactação fica ativada por padrão. Ela é executada quando a sessão se aproxima do
limite de contexto, ou quando o modelo retorna um erro de estouro de contexto (nesse caso,
o OpenClaw compacta e tenta novamente). Assinaturas típicas de estouro incluem
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` e `ollama error: context length
exceeded`.

<Info>
Antes de compactar, o OpenClaw lembra automaticamente o agente de salvar notas importantes
em arquivos de [memory](/concepts/memory). Isso evita perda de contexto.
</Info>

## Compactação manual

Digite `/compact` em qualquer chat para forçar uma compactação. Adicione instruções para
orientar o resumo:

```
/compact Focus on the API design decisions
```

## Usando um modelo diferente

Por padrão, a compactação usa o modelo principal do seu agente. Você pode usar um modelo
mais capaz para obter resumos melhores:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Aviso de início da compactação

Por padrão, a compactação é executada silenciosamente. Para mostrar um breve aviso quando a compactação
começar, ative `notifyUser`:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

Quando ativado, o usuário vê uma mensagem curta (por exemplo, "Compactando
contexto...") no início de cada execução de compactação.

## Compactação vs poda

|                  | Compactação                    | Poda                             |
| ---------------- | ------------------------------ | -------------------------------- |
| **O que faz**    | Resume a conversa mais antiga  | Remove resultados antigos de ferramentas |
| **É salva?**     | Sim (na transcrição da sessão) | Não (somente em memória, por solicitação) |
| **Escopo**       | Conversa inteira               | Apenas resultados de ferramentas |

A [poda de sessão](/concepts/session-pruning) é um complemento mais leve que
remove a saída de ferramentas sem resumir.

## Solução de problemas

**Compactando com muita frequência?** A janela de contexto do modelo pode ser pequena, ou as
saídas de ferramentas podem ser grandes. Tente ativar a
[poda de sessão](/concepts/session-pruning).

**O contexto parece desatualizado após a compactação?** Use `/compact Focus on <topic>` para
orientar o resumo, ou ative o [memory flush](/concepts/memory) para que as notas
sobrevivam.

**Precisa de um recomeço?** `/new` inicia uma sessão nova sem compactar.

Para configuração avançada (reserva de tokens, preservação de identificadores, mecanismos de
contexto personalizados, compactação no lado do servidor OpenAI), consulte a
[Análise aprofundada do gerenciamento de sessões](/reference/session-management-compaction).

## Relacionado

- [Session](/concepts/session) — gerenciamento e ciclo de vida da sessão
- [Session Pruning](/concepts/session-pruning) — remoção de resultados de ferramentas
- [Context](/concepts/context) — como o contexto é criado para turnos do agente
- [Hooks](/automation/hooks) — hooks do ciclo de vida da compactação (before_compaction, after_compaction)
