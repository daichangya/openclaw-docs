---
read_when:
    - Um usuário relata que agentes ficam presos repetindo chamadas de ferramenta
    - Você precisa ajustar a proteção contra chamadas repetitivas
    - Você está editando políticas de runtime/ferramentas do agente
summary: Como habilitar e ajustar proteções que detectam loops repetitivos de chamadas de ferramenta
title: Detecção de loop de ferramenta
x-i18n:
    generated_at: "2026-04-05T12:55:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc3c92579b24cfbedd02a286b735d99a259b720f6d9719a9b93902c9fc66137d
    source_path: tools/loop-detection.md
    workflow: 15
---

# Detecção de loop de ferramenta

O OpenClaw pode evitar que agentes fiquem presos em padrões repetidos de chamadas de ferramenta.
A proteção fica **desabilitada por padrão**.

Habilite-a apenas onde necessário, porque ela pode bloquear chamadas repetidas legítimas com configurações rígidas.

## Por que isso existe

- Detectar sequências repetitivas que não fazem progresso.
- Detectar loops de alta frequência sem resultado (mesma ferramenta, mesmas entradas, erros repetidos).
- Detectar padrões específicos de chamadas repetidas para ferramentas de polling conhecidas.

## Bloco de configuração

Padrões globais:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

Substituição por agente (opcional):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### Comportamento dos campos

- `enabled`: Chave principal. `false` significa que nenhuma detecção de loop é executada.
- `historySize`: número de chamadas recentes de ferramenta mantidas para análise.
- `warningThreshold`: limite antes de classificar um padrão apenas como aviso.
- `criticalThreshold`: limite para bloquear padrões repetitivos de loop.
- `globalCircuitBreakerThreshold`: limite global do circuit breaker para falta de progresso.
- `detectors.genericRepeat`: detecta padrões repetidos de mesma ferramenta + mesmos parâmetros.
- `detectors.knownPollNoProgress`: detecta padrões conhecidos semelhantes a polling sem mudança de estado.
- `detectors.pingPong`: detecta padrões alternados de ping-pong.

## Configuração recomendada

- Comece com `enabled: true`, mantendo os padrões inalterados.
- Mantenha os limites ordenados como `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Se ocorrerem falsos positivos:
  - aumente `warningThreshold` e/ou `criticalThreshold`
  - (opcionalmente) aumente `globalCircuitBreakerThreshold`
  - desabilite apenas o detector que estiver causando problemas
  - reduza `historySize` para um contexto histórico menos rígido

## Logs e comportamento esperado

Quando um loop é detectado, o OpenClaw relata um evento de loop e bloqueia ou reduz o próximo ciclo de ferramenta, dependendo da gravidade.
Isso protege os usuários contra gasto descontrolado de tokens e travamentos, preservando o acesso normal a ferramentas.

- Prefira primeiro aviso e supressão temporária.
- Escale apenas quando houver evidência repetida acumulada.

## Observações

- `tools.loopDetection` é mesclado com substituições no nível do agente.
- A configuração por agente substitui ou estende totalmente os valores globais.
- Se não existir configuração, as proteções permanecem desligadas.
