---
read_when:
    - Você quer fazer uma pergunta paralela rápida sobre a sessão atual
    - Você está implementando ou depurando o comportamento de BTW entre clientes
summary: Perguntas paralelas efêmeras com /btw
title: Perguntas Paralelas BTW
x-i18n:
    generated_at: "2026-04-05T12:54:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: aeef33ba19eb0561693fecea9dd39d6922df93be0b9a89446ed17277bcee58aa
    source_path: tools/btw.md
    workflow: 15
---

# Perguntas Paralelas BTW

`/btw` permite fazer uma pergunta paralela rápida sobre a **sessão atual** sem
transformar essa pergunta em histórico normal da conversa.

Ele é modelado com base no comportamento de `/btw` do Claude Code, mas adaptado à
arquitetura de Gateway e multicanal do OpenClaw.

## O que ele faz

Quando você envia:

```text
/btw what changed?
```

O OpenClaw:

1. cria um snapshot do contexto da sessão atual,
2. executa uma chamada de modelo separada **sem ferramentas**,
3. responde apenas à pergunta paralela,
4. deixa a execução principal intacta,
5. **não** grava a pergunta nem a resposta do BTW no histórico da sessão,
6. emite a resposta como um **resultado paralelo ao vivo** em vez de uma mensagem normal do assistente.

O modelo mental importante é:

- mesmo contexto de sessão
- consulta paralela separada de uso único
- sem chamadas de ferramenta
- sem poluição de contexto futuro
- sem persistência na transcrição

## O que ele não faz

`/btw` **não**:

- cria uma nova sessão durável,
- continua a tarefa principal inacabada,
- executa ferramentas ou loops de ferramentas do agente,
- grava dados de pergunta/resposta do BTW no histórico da transcrição,
- aparece em `chat.history`,
- sobrevive a um recarregamento.

Ele é intencionalmente **efêmero**.

## Como o contexto funciona

O BTW usa a sessão atual apenas como **contexto de fundo**.

Se a execução principal estiver ativa no momento, o OpenClaw cria um snapshot do
estado atual da mensagem e inclui o prompt principal em andamento como contexto
de fundo, ao mesmo tempo em que informa explicitamente ao modelo:

- responda apenas à pergunta paralela,
- não retome nem conclua a tarefa principal inacabada,
- não emita chamadas de ferramenta nem pseudochamadas de ferramenta.

Isso mantém o BTW isolado da execução principal, ao mesmo tempo em que o torna consciente do que
a sessão trata.

## Modelo de entrega

O BTW **não** é entregue como uma mensagem normal do assistente na transcrição.

No nível do protocolo do Gateway:

- o chat normal do assistente usa o evento `chat`
- o BTW usa o evento `chat.side_result`

Essa separação é intencional. Se o BTW reutilizasse o caminho normal do evento `chat`,
os clientes o tratariam como histórico de conversa regular.

Como o BTW usa um evento ao vivo separado e não é reproduzido a partir de
`chat.history`, ele desaparece após o recarregamento.

## Comportamento da superfície

### TUI

Na TUI, o BTW é renderizado inline na visualização da sessão atual, mas continua
efêmero:

- visivelmente distinto de uma resposta normal do assistente
- dispensável com `Enter` ou `Esc`
- não é reproduzido ao recarregar

### Canais externos

Em canais como Telegram, WhatsApp e Discord, o BTW é entregue como uma
resposta única claramente rotulada porque essas superfícies não têm um conceito local
de sobreposição efêmera.

A resposta ainda é tratada como um resultado paralelo, não como histórico normal da sessão.

### Control UI / web

O Gateway emite o BTW corretamente como `chat.side_result`, e o BTW não é incluído
em `chat.history`, portanto o contrato de persistência já está correto para a web.

A Control UI atual ainda precisa de um consumidor dedicado de `chat.side_result` para
renderizar o BTW ao vivo no navegador. Até que esse suporte do lado do cliente chegue, o BTW é um
recurso no nível do Gateway com comportamento completo na TUI e em canais externos, mas ainda
não é uma UX completa no navegador.

## Quando usar BTW

Use `/btw` quando você quiser:

- um esclarecimento rápido sobre o trabalho atual,
- uma resposta factual paralela enquanto uma execução longa ainda está em andamento,
- uma resposta temporária que não deve se tornar parte do contexto futuro da sessão.

Exemplos:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Quando não usar BTW

Não use `/btw` quando quiser que a resposta se torne parte do
contexto de trabalho futuro da sessão.

Nesse caso, pergunte normalmente na sessão principal em vez de usar BTW.

## Relacionados

- [Comandos slash](/tools/slash-commands)
- [Níveis de Thinking](/tools/thinking)
- [Sessão](/pt-BR/concepts/session)
