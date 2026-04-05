---
read_when:
    - Diagnosticar rotação de perfis de autenticação, cooldowns ou comportamento de fallback de modelo
    - Atualizar regras de failover para perfis de autenticação ou modelos
    - Entender como substituições de modelo de sessão interagem com tentativas de fallback
summary: Como o OpenClaw alterna perfis de autenticação e faz fallback entre modelos
title: Failover de modelo
x-i18n:
    generated_at: "2026-04-05T12:40:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 899041aa0854e4f347343797649fd11140a01e069e88b1fbc0a76e6b375f6c96
    source_path: concepts/model-failover.md
    workflow: 15
---

# Failover de modelo

O OpenClaw lida com falhas em duas etapas:

1. **Rotação de perfil de autenticação** dentro do provedor atual.
2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

Esta documentação explica as regras de runtime e os dados que as sustentam.

## Fluxo de runtime

Para uma execução normal de texto, o OpenClaw avalia candidatos nesta ordem:

1. O modelo de sessão atualmente selecionado.
2. Os `agents.defaults.model.fallbacks` configurados, em ordem.
3. O modelo primário configurado no final, quando a execução começou a partir de uma substituição.

Dentro de cada candidato, o OpenClaw tenta o failover de perfil de autenticação antes de avançar para
o próximo candidato de modelo.

Sequência em alto nível:

1. Resolve o modelo de sessão ativo e a preferência de perfil de autenticação.
2. Constrói a cadeia de candidatos de modelo.
3. Tenta o provedor atual com regras de rotação/cooldown de perfil de autenticação.
4. Se esse provedor se esgotar com um erro elegível para failover, passa para o próximo
   candidato de modelo.
5. Persiste a substituição de fallback selecionada antes de a nova tentativa começar, para que outros
   leitores da sessão vejam o mesmo provedor/modelo que o executor está prestes a usar.
6. Se o candidato de fallback falhar, reverte apenas os campos de substituição da sessão pertencentes
   ao fallback quando eles ainda corresponderem àquele candidato com falha.
7. Se todos os candidatos falharem, lança um `FallbackSummaryError` com detalhes por tentativa
   e o vencimento de cooldown mais próximo, quando conhecido.

Isso é intencionalmente mais restrito do que "salvar e restaurar a sessão inteira". O
executor de resposta persiste apenas os campos de seleção de modelo que ele controla para fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Isso evita que uma nova tentativa de fallback com falha sobrescreva mutações mais recentes e não relacionadas na sessão,
como alterações manuais por `/model` ou atualizações de rotação de sessão que
aconteceram enquanto a tentativa estava em andamento.

## Armazenamento de autenticação (chaves + OAuth)

O OpenClaw usa **perfis de autenticação** tanto para chaves de API quanto para tokens OAuth.

- Os segredos ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legado: `~/.openclaw/agent/auth-profiles.json`).
- A configuração `auth.profiles` / `auth.order` é **apenas metadados + roteamento** (sem segredos).
- Arquivo OAuth legado apenas para importação: `~/.openclaw/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso).

Mais detalhes: [/concepts/oauth](/concepts/oauth)

Tipos de credencial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para alguns provedores)

## IDs de perfil

Logins OAuth criam perfis distintos para que várias contas possam coexistir.

- Padrão: `provider:default` quando nenhum e-mail está disponível.
- OAuth com e-mail: `provider:<email>` (por exemplo `google-antigravity:user@gmail.com`).

Os perfis ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` em `profiles`.

## Ordem de rotação

Quando um provedor tem vários perfis, o OpenClaw escolhe uma ordem assim:

1. **Configuração explícita**: `auth.order[provider]` (se definida).
2. **Perfis configurados**: `auth.profiles` filtrados por provedor.
3. **Perfis armazenados**: entradas em `auth-profiles.json` para o provedor.

Se nenhuma ordem explícita for configurada, o OpenClaw usa uma ordem round-robin:

- **Chave primária:** tipo de perfil (**OAuth antes de chaves de API**).
- **Chave secundária:** `usageStats.lastUsed` (mais antigo primeiro, dentro de cada tipo).
- **Perfis em cooldown/desabilitados** são movidos para o fim, ordenados pelo vencimento mais próximo.

### Persistência por sessão (favorável a cache)

O OpenClaw **fixa o perfil de autenticação escolhido por sessão** para manter caches do provedor aquecidos.
Ele **não** faz rotação a cada solicitação. O perfil fixado é reutilizado até que:

- a sessão seja redefinida (`/new` / `/reset`)
- uma compactação seja concluída (o contador de compactação é incrementado)
- o perfil entre em cooldown/seja desabilitado

A seleção manual via `/model …@<profileId>` define uma **substituição do usuário** para essa sessão
e não é rotacionada automaticamente até que uma nova sessão seja iniciada.

Perfis fixados automaticamente (selecionados pelo roteador da sessão) são tratados como uma **preferência**:
eles são tentados primeiro, mas o OpenClaw pode alternar para outro perfil em limites de taxa/timeouts.
Perfis fixados pelo usuário permanecem travados nesse perfil; se ele falhar e houver fallbacks de modelo
configurados, o OpenClaw passa para o próximo modelo em vez de trocar de perfil.

### Por que o OAuth pode "parecer perdido"

Se você tiver tanto um perfil OAuth quanto um perfil de chave de API para o mesmo provedor, o round-robin pode alternar entre eles de uma mensagem para outra, a menos que estejam fixados. Para forçar um único perfil:

- Fixe com `auth.order[provider] = ["provider:profileId"]`, ou
- Use uma substituição por sessão via `/model …` com uma substituição de perfil (quando compatível com sua UI/superfície de chat).

## Cooldowns

Quando um perfil falha devido a erros de autenticação/limite de taxa (ou a um timeout que
parece limitação de taxa), o OpenClaw o marca em cooldown e passa para o próximo perfil.
Esse bucket de limite de taxa é mais amplo do que apenas `429`: ele também inclui
mensagens do provedor como `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` e limites periódicos de janela de uso como
`weekly/monthly limit reached`.
Erros de formato/solicitação inválida (por exemplo falhas de validação de ID de chamada de ferramenta do Cloud Code Assist)
são tratados como elegíveis para failover e usam os mesmos cooldowns.
Erros de motivo de parada compatíveis com OpenAI, como `Unhandled stop reason: error`,
`stop reason: error` e `reason: error`, são classificados como sinais de timeout/failover.
Texto genérico de servidor com escopo de provedor também pode cair nesse bucket de timeout quando
a origem corresponde a um padrão transitório conhecido. Por exemplo, em Anthropic,
`An unknown error occurred` simples e payloads JSON `api_error` com texto transitório de servidor
como `internal server error`, `unknown error, 520`, `upstream error`
ou `backend error` são tratados como timeouts elegíveis para failover. Texto genérico de upstream específico do OpenRouter, como `Provider returned error`, também é tratado como
timeout somente quando o contexto do provedor é realmente OpenRouter. Texto genérico interno de fallback, como `LLM request failed with an unknown error.`, permanece
conservador e não aciona failover por si só.

Cooldowns de limite de taxa também podem ter escopo por modelo:

- O OpenClaw registra `cooldownModel` para falhas de limite de taxa quando o
  id do modelo com falha é conhecido.
- Um modelo irmão no mesmo provedor ainda pode ser tentado quando o cooldown tiver
  escopo de um modelo diferente.
- Janelas de faturamento/desabilitação ainda bloqueiam o perfil inteiro em todos os modelos.

Cooldowns usam backoff exponencial:

- 1 minuto
- 5 minutos
- 25 minutos
- 1 hora (limite)

O estado é armazenado em `auth-profiles.json` em `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Desabilitações por faturamento

Falhas de faturamento/crédito (por exemplo “insufficient credits” / “credit balance too low”) são tratadas como elegíveis para failover, mas geralmente não são transitórias. Em vez de um cooldown curto, o OpenClaw marca o perfil como **desabilitado** (com um backoff mais longo) e alterna para o próximo perfil/provedor.

Nem toda resposta com aparência de faturamento é `402`, e nem todo `402` HTTP cai
aqui. O OpenClaw mantém texto explícito de faturamento na trilha de faturamento mesmo quando um
provedor retorna `401` ou `403`, mas matchers específicos do provedor permanecem
com escopo do provedor a que pertencem (por exemplo OpenRouter `403 Key limit
exceeded`). Enquanto isso, erros temporários `402` de janela de uso e
limite de gasto de organização/workspace são classificados como `rate_limit` quando
a mensagem parece reutilizável (por exemplo `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` ou `organization spending limit exceeded`).
Eles permanecem no caminho de cooldown/failover curto em vez do caminho longo de
desabilitação por faturamento.

O estado é armazenado em `auth-profiles.json`:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Padrões:

- O backoff de faturamento começa em **5 horas**, dobra a cada falha de faturamento e tem limite de **24 horas**.
- Contadores de backoff são redefinidos se o perfil não falhar por **24 horas** (configurável).
- Novas tentativas por sobrecarga permitem **1 rotação de perfil do mesmo provedor** antes do fallback de modelo.
- Novas tentativas por sobrecarga usam backoff de **0 ms** por padrão.

## Fallback de modelo

Se todos os perfis de um provedor falharem, o OpenClaw passa para o próximo modelo em
`agents.defaults.model.fallbacks`. Isso se aplica a falhas de autenticação, limites de taxa e
timeouts que esgotaram a rotação de perfil (outros erros não avançam o fallback).

Erros de sobrecarga e limite de taxa são tratados de forma mais agressiva do que cooldowns
de faturamento. Por padrão, o OpenClaw permite uma tentativa de perfil de autenticação no mesmo provedor
e então muda para o próximo fallback de modelo configurado sem esperar.
Sinais de provedor ocupado, como `ModelNotReadyException`, caem nesse bucket de sobrecarga.
Ajuste isso com `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` e
`auth.cooldowns.rateLimitedProfileRotations`.

Quando uma execução começa com uma substituição de modelo (hooks ou CLI), os fallbacks ainda terminam em
`agents.defaults.model.primary` depois de tentar quaisquer fallbacks configurados.

### Regras da cadeia de candidatos

O OpenClaw constrói a lista de candidatos a partir do `provider/model` solicitado no momento
mais os fallbacks configurados.

Regras:

- O modelo solicitado vem sempre primeiro.
- Fallbacks configurados explicitamente são deduplicados, mas não filtrados pela lista de permissões
  de modelos. Eles são tratados como intenção explícita do operador.
- Se a execução atual já estiver em um fallback configurado na mesma família de provedor,
  o OpenClaw continua usando a cadeia configurada completa.
- Se a execução atual estiver em um provedor diferente do da configuração e esse
  modelo atual ainda não fizer parte da cadeia de fallback configurada, o OpenClaw não
  anexa fallbacks configurados e não relacionados de outro provedor.
- Quando a execução começou a partir de uma substituição, o primário configurado é anexado ao
  final para que a cadeia possa voltar ao padrão normal depois que os
  candidatos anteriores se esgotarem.

### Quais erros avançam o fallback

O fallback de modelo continua em:

- falhas de autenticação
- limites de taxa e esgotamento de cooldown
- erros de sobrecarga/provedor ocupado
- erros de failover com formato de timeout
- desabilitações por faturamento
- `LiveSessionModelSwitchError`, que é normalizado para um caminho de failover para que um
  modelo persistido obsoleto não crie um loop de nova tentativa externo
- outros erros não reconhecidos quando ainda houver candidatos restantes

O fallback de modelo não continua em:

- abortos explícitos que não tenham formato de timeout/failover
- erros de estouro de contexto que devem permanecer dentro da lógica de compactação/tentativa
  (por exemplo `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` ou `ollama error: context
length exceeded`)
- um erro desconhecido final quando não restarem candidatos

### Comportamento de ignorar cooldown vs testar

Quando todos os perfis de autenticação de um provedor já estão em cooldown, o OpenClaw
não ignora automaticamente esse provedor para sempre. Ele toma uma decisão por candidato:

- Falhas persistentes de autenticação ignoram o provedor inteiro imediatamente.
- Desabilitações por faturamento normalmente são ignoradas, mas o candidato primário ainda pode ser testado
  com throttling para permitir recuperação sem reiniciar.
- O candidato primário pode ser testado perto do vencimento do cooldown, com throttling por provedor.
- Irmãos de fallback no mesmo provedor podem ser tentados apesar do cooldown quando a
  falha parecer transitória (`rate_limit`, `overloaded` ou desconhecida). Isso é
  especialmente relevante quando um limite de taxa tem escopo por modelo e um modelo irmão pode
  ainda se recuperar imediatamente.
- Testes transitórios de cooldown ficam limitados a um por provedor por execução de fallback, para que
  um único provedor não atrase o fallback entre provedores.

## Substituições de sessão e troca de modelo ao vivo

Mudanças no modelo da sessão são estado compartilhado. O executor ativo, o comando `/model`,
atualizações de compactação/sessão e a reconciliação de sessão ao vivo leem ou escrevem
partes da mesma entrada de sessão.

Isso significa que novas tentativas de fallback precisam coordenar com a troca de modelo ao vivo:

- Apenas mudanças explícitas de modelo acionadas pelo usuário marcam uma troca ao vivo pendente. Isso
  inclui `/model`, `session_status(model=...)` e `sessions.patch`.
- Mudanças de modelo conduzidas pelo sistema, como rotação de fallback, substituições de heartbeat
  ou compactação, nunca marcam por si só uma troca ao vivo pendente.
- Antes que uma nova tentativa de fallback comece, o executor de resposta persiste os campos
  de substituição do fallback selecionado na entrada da sessão.
- A reconciliação de sessão ao vivo prefere substituições persistidas da sessão a campos de modelo
  obsoletos do runtime.
- Se a tentativa de fallback falhar, o executor reverte apenas os campos de substituição
  que escreveu, e somente se eles ainda corresponderem àquele candidato com falha.

Isso evita a corrida clássica:

1. O primário falha.
2. O candidato de fallback é escolhido na memória.
3. O armazenamento da sessão ainda indica o primário antigo.
4. A reconciliação de sessão ao vivo lê o estado obsoleto da sessão.
5. A nova tentativa volta ao modelo antigo antes que a tentativa de fallback
   comece.

O fallback persistido fecha essa janela, e a reversão restrita
mantém intactas mudanças mais novas de sessão feitas manualmente ou pelo runtime.

## Observabilidade e resumos de falha

`runWithModelFallback(...)` registra detalhes por tentativa que alimentam logs e
mensagens de cooldown voltadas ao usuário:

- provedor/modelo tentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e
  motivos de failover semelhantes)
- status/código opcional
- resumo de erro legível por humanos

Quando todos os candidatos falham, o OpenClaw lança `FallbackSummaryError`. O executor
de resposta externo pode usá-lo para construir uma mensagem mais específica, como "todos os modelos
estão temporariamente limitados por taxa", e incluir o vencimento de cooldown mais próximo quando conhecido.

Esse resumo de cooldown é sensível ao modelo:

- limites de taxa com escopo de modelo e não relacionados são ignorados para a cadeia
  de provedor/modelo tentada
- se o bloqueio restante for um limite de taxa correspondente com escopo de modelo, o OpenClaw
  informa o último vencimento correspondente que ainda bloqueia esse modelo

## Configuração relacionada

Consulte [Configuração do gateway](/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- roteamento de `agents.defaults.imageModel`

Consulte [Modelos](/concepts/models) para a visão geral mais ampla de seleção de modelo e fallback.
