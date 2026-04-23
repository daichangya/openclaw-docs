---
read_when:
    - Diagnosticando a rotação de perfis de autenticação, períodos de resfriamento ou comportamento de fallback de modelo
    - Atualizando regras de failover para perfis de autenticação ou modelos
    - Entendendo como substituições de modelo de sessão interagem com novas tentativas de fallback
summary: Como o OpenClaw alterna perfis de autenticação e recorre a fallback entre modelos
title: Failover de modelo
x-i18n:
    generated_at: "2026-04-23T05:38:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1f06d5371379cc59998e1cd6f52d250e8c4eba4e7dbfef776a090899b8d3c4
    source_path: concepts/model-failover.md
    workflow: 15
---

# Failover de modelo

O OpenClaw lida com falhas em dois estágios:

1. **Rotação de perfis de autenticação** dentro do provedor atual.
2. **Failover de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

Esta documentação explica as regras de runtime e os dados que as sustentam.

## Fluxo de runtime

Para uma execução normal de texto, o OpenClaw avalia os candidatos nesta ordem:

1. O modelo de sessão atualmente selecionado.
2. `agents.defaults.model.fallbacks` configurados em ordem.
3. O modelo primário configurado ao final quando a execução começou a partir de um override.

Dentro de cada candidato, o OpenClaw tenta failover de perfil de autenticação antes de avançar para o próximo candidato de modelo.

Sequência de alto nível:

1. Resolver o modelo de sessão ativo e a preferência de perfil de autenticação.
2. Construir a cadeia de candidatos de modelo.
3. Tentar o provedor atual com regras de rotação/resfriamento de perfil de autenticação.
4. Se esse provedor se esgotar com um erro elegível para failover, passar para o próximo candidato de modelo.
5. Persistir o override de fallback selecionado antes de a nova tentativa começar, para que outros leitores da sessão vejam o mesmo provedor/modelo que o executor está prestes a usar.
6. Se o candidato de fallback falhar, reverter apenas os campos de override de sessão pertencentes ao fallback quando eles ainda corresponderem àquele candidato com falha.
7. Se todos os candidatos falharem, lançar um `FallbackSummaryError` com detalhes por tentativa e a expiração de resfriamento mais próxima quando conhecida.

Isso é intencionalmente mais restrito do que "salvar e restaurar a sessão inteira". O executor de resposta persiste apenas os campos de seleção de modelo que ele controla para fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Isso impede que uma nova tentativa de fallback com falha sobrescreva mutações mais recentes e não relacionadas na sessão, como mudanças manuais com `/model` ou atualizações de rotação da sessão que aconteceram enquanto a tentativa estava em execução.

## Armazenamento de autenticação (chaves + OAuth)

O OpenClaw usa **perfis de autenticação** tanto para chaves de API quanto para tokens OAuth.

- Os segredos ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legado: `~/.openclaw/agent/auth-profiles.json`).
- O estado de runtime do roteamento de autenticação fica em `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- A configuração `auth.profiles` / `auth.order` é **apenas metadados + roteamento** (sem segredos).
- Arquivo OAuth legado apenas para importação: `~/.openclaw/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso).

Mais detalhes: [/concepts/oauth](/pt-BR/concepts/oauth)

Tipos de credencial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para alguns provedores)

## IDs de perfil

Logins OAuth criam perfis distintos para que várias contas possam coexistir.

- Padrão: `provider:default` quando nenhum email está disponível.
- OAuth com email: `provider:<email>` (por exemplo `google-antigravity:user@gmail.com`).

Os perfis ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` em `profiles`.

## Ordem de rotação

Quando um provedor tem vários perfis, o OpenClaw escolhe uma ordem assim:

1. **Configuração explícita**: `auth.order[provider]` (se definido).
2. **Perfis configurados**: `auth.profiles` filtrados por provedor.
3. **Perfis armazenados**: entradas em `auth-profiles.json` para o provedor.

Se nenhuma ordem explícita estiver configurada, o OpenClaw usa uma ordem round-robin:

- **Chave primária:** tipo de perfil (**OAuth antes de chaves de API**).
- **Chave secundária:** `usageStats.lastUsed` (mais antigo primeiro, dentro de cada tipo).
- **Perfis em resfriamento/desativados** são movidos para o final, ordenados pela expiração mais próxima.

### Persistência na sessão (amigável ao cache)

O OpenClaw **fixa o perfil de autenticação escolhido por sessão** para manter os caches do provedor aquecidos.
Ele **não** faz rotação a cada solicitação. O perfil fixado é reutilizado até que:

- a sessão seja redefinida (`/new` / `/reset`)
- uma Compaction seja concluída (a contagem de compactação aumenta)
- o perfil entre em resfriamento/seja desativado

A seleção manual via `/model …@<profileId>` define um **override do usuário** para aquela sessão e não entra em rotação automática até que uma nova sessão comece.

Perfis fixados automaticamente (selecionados pelo roteador de sessão) são tratados como uma **preferência**:
eles são tentados primeiro, mas o OpenClaw pode alternar para outro perfil em limites de taxa/timeouts.
Perfis fixados pelo usuário permanecem bloqueados naquele perfil; se ele falhar e fallbacks de modelo estiverem configurados, o OpenClaw passa para o próximo modelo em vez de trocar de perfil.

### Por que o OAuth pode "parecer perdido"

Se você tiver tanto um perfil OAuth quanto um perfil de chave de API para o mesmo provedor, o round-robin pode alternar entre eles entre mensagens, a menos que estejam fixados. Para forçar um único perfil:

- Fixe com `auth.order[provider] = ["provider:profileId"]`, ou
- Use um override por sessão via `/model …` com um override de perfil (quando compatível com sua interface/superfície de chat).

## Resfriamentos

Quando um perfil falha devido a erros de autenticação/limite de taxa (ou um timeout que parece limitação de taxa), o OpenClaw o marca em resfriamento e passa para o próximo perfil.
Esse grupo de limite de taxa é mais amplo que apenas `429`: ele também inclui mensagens do provedor como `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` e limites periódicos de janela de uso como
`weekly/monthly limit reached`.
Erros de formato/solicitação inválida (por exemplo, falhas de validação de ID de chamada de ferramenta do Cloud Code Assist) são tratados como elegíveis para failover e usam os mesmos resfriamentos.
Erros de motivo de parada compatíveis com OpenAI, como `Unhandled stop reason: error`,
`stop reason: error` e `reason: error`, são classificados como sinais de timeout/failover.
Texto genérico de erro de servidor no escopo do provedor também pode cair nesse grupo de timeout quando a origem corresponde a um padrão transitório conhecido. Por exemplo, em Anthropic, `An unknown error occurred` sem contexto e payloads JSON `api_error` com texto transitório de servidor como `internal server error`, `unknown error, 520`, `upstream error`,
ou `backend error` são tratados como elegíveis para failover por timeout. Texto genérico de upstream específico do OpenRouter, como `Provider returned error` sem contexto, também é tratado como timeout apenas quando o contexto do provedor é de fato OpenRouter. Texto genérico interno de fallback, como `LLM request failed with an unknown error.`, permanece conservador e não aciona failover por si só.

Alguns SDKs de provedores podem, de outra forma, aguardar por uma janela longa de `Retry-After` antes de devolver o controle ao OpenClaw. Para SDKs baseados em Stainless, como Anthropic e OpenAI, o OpenClaw limita esperas internas do SDK de `retry-after-ms` / `retry-after` a 60 segundos por padrão e expõe imediatamente respostas repetíveis mais longas para que esse caminho de failover possa ser executado. Ajuste ou desative o limite com
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; veja [/concepts/retry](/pt-BR/concepts/retry).

Resfriamentos por limite de taxa também podem ter escopo por modelo:

- O OpenClaw registra `cooldownModel` para falhas por limite de taxa quando o id do modelo com falha é conhecido.
- Um modelo irmão no mesmo provedor ainda pode ser tentado quando o resfriamento está restrito a um modelo diferente.
- Janelas de cobrança/desativação ainda bloqueiam o perfil inteiro em todos os modelos.

Os resfriamentos usam backoff exponencial:

- 1 minuto
- 5 minutos
- 25 minutos
- 1 hora (limite)

O estado é armazenado em `auth-state.json` em `usageStats`:

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

## Desativações por cobrança

Falhas de cobrança/crédito (por exemplo, "insufficient credits" / "credit balance too low") são tratadas como elegíveis para failover, mas geralmente não são transitórias. Em vez de um resfriamento curto, o OpenClaw marca o perfil como **desativado** (com um backoff mais longo) e alterna para o próximo perfil/provedor.

Nem toda resposta com aparência de cobrança é `402`, e nem todo HTTP `402` cai aqui. O OpenClaw mantém texto explícito de cobrança na faixa de cobrança mesmo quando um provedor retorna `401` ou `403`, mas matchers específicos do provedor permanecem restritos ao provedor ao qual pertencem (por exemplo, OpenRouter `403 Key limit
exceeded`). Enquanto isso, erros temporários `402` de janela de uso e
limite de gasto de organização/workspace são classificados como `rate_limit` quando
a mensagem parece repetível (por exemplo, `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` ou `organization spending limit exceeded`).
Eles permanecem no caminho de resfriamento/failover curto em vez do caminho longo
de desativação por cobrança.

O estado é armazenado em `auth-state.json`:

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

- O backoff de cobrança começa em **5 horas**, dobra a cada falha de cobrança e atinge o limite em **24 horas**.
- Os contadores de backoff são redefinidos se o perfil não falhar por **24 horas** (configurável).
- Novas tentativas por sobrecarga permitem **1 rotação de perfil no mesmo provedor** antes do fallback de modelo.
- Novas tentativas por sobrecarga usam backoff de **0 ms** por padrão.

## Failover de modelo

Se todos os perfis de um provedor falharem, o OpenClaw passa para o próximo modelo em
`agents.defaults.model.fallbacks`. Isso se aplica a falhas de autenticação, limites de taxa e
timeouts que esgotaram a rotação de perfis (outros erros não avançam o fallback).

Erros de sobrecarga e limite de taxa são tratados de forma mais agressiva do que resfriamentos de cobrança. Por padrão, o OpenClaw permite uma nova tentativa de perfil de autenticação no mesmo provedor e depois muda para o próximo fallback de modelo configurado sem esperar.
Sinais de provedor ocupado, como `ModelNotReadyException`, caem nesse grupo de sobrecarga. Ajuste isso com `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` e
`auth.cooldowns.rateLimitedProfileRotations`.

Quando uma execução começa com um override de modelo (hooks ou CLI), os fallbacks ainda terminam em
`agents.defaults.model.primary` após tentar quaisquer fallbacks configurados.

### Regras da cadeia de candidatos

O OpenClaw constrói a lista de candidatos a partir do `provider/model` solicitado no momento
mais os fallbacks configurados.

Regras:

- O modelo solicitado é sempre o primeiro.
- Fallbacks explicitamente configurados são desduplicados, mas não filtrados pela allowlist do modelo. Eles são tratados como intenção explícita do operador.
- Se a execução atual já estiver em um fallback configurado na mesma família de provedor, o OpenClaw continua usando a cadeia configurada completa.
- Se a execução atual estiver em um provedor diferente da configuração e esse modelo atual não fizer parte da cadeia de fallback configurada, o OpenClaw não acrescenta fallbacks configurados não relacionados de outro provedor.
- Quando a execução começou a partir de um override, o primário configurado é acrescentado ao final para que a cadeia possa voltar ao padrão normal quando os candidatos anteriores se esgotarem.

### Quais erros avançam o fallback

O fallback de modelo continua em:

- falhas de autenticação
- limites de taxa e esgotamento de resfriamento
- erros de sobrecarga/provedor ocupado
- erros de failover com formato de timeout
- desativações por cobrança
- `LiveSessionModelSwitchError`, que é normalizado em um caminho de failover para que um modelo persistido desatualizado não crie um loop externo de nova tentativa
- outros erros não reconhecidos quando ainda restarem candidatos

O fallback de modelo não continua em:

- abortos explícitos que não tenham formato de timeout/failover
- erros de estouro de contexto que devem permanecer dentro da lógica de Compaction/nova tentativa
  (por exemplo `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` ou `ollama error: context
length exceeded`)
- um erro desconhecido final quando não restarem candidatos

### Comportamento de ignorar resfriamento vs testar

Quando todos os perfis de autenticação de um provedor já estão em resfriamento, o OpenClaw não ignora automaticamente esse provedor para sempre. Ele toma uma decisão por candidato:

- Falhas de autenticação persistentes ignoram o provedor inteiro imediatamente.
- Desativações por cobrança normalmente são ignoradas, mas o candidato primário ainda pode ser testado com limitação de frequência para que a recuperação seja possível sem reiniciar.
- O candidato primário pode ser testado perto da expiração do resfriamento, com uma limitação de frequência por provedor.
- Modelos irmãos de fallback no mesmo provedor podem ser tentados apesar do resfriamento quando a falha parece transitória (`rate_limit`, `overloaded` ou desconhecida). Isso é especialmente relevante quando um limite de taxa tem escopo por modelo e um modelo irmão ainda pode se recuperar imediatamente.
- Testes transitórios durante resfriamento são limitados a um por provedor por execução de fallback, para que um único provedor não atrase o fallback entre provedores.

## Overrides de sessão e troca de modelo ao vivo

Mudanças no modelo da sessão são estado compartilhado. O executor ativo, o comando `/model`,
atualizações de Compaction/sessão e a reconciliação de sessão ao vivo leem ou escrevem
partes da mesma entrada de sessão.

Isso significa que novas tentativas de fallback precisam se coordenar com a troca de modelo ao vivo:

- Apenas mudanças explícitas de modelo acionadas pelo usuário marcam uma troca ao vivo pendente. Isso inclui `/model`, `session_status(model=...)` e `sessions.patch`.
- Mudanças de modelo acionadas pelo sistema, como rotação por fallback, overrides de Heartbeat
  ou Compaction, nunca marcam por conta própria uma troca ao vivo pendente.
- Antes de uma nova tentativa de fallback começar, o executor de resposta persiste os campos de override de fallback selecionados na entrada da sessão.
- A reconciliação de sessão ao vivo prefere overrides persistidos na sessão em vez de campos de modelo de runtime desatualizados.
- Se a tentativa de fallback falhar, o executor reverte apenas os campos de override que ele escreveu, e somente se eles ainda corresponderem àquele candidato com falha.

Isso evita a corrida clássica:

1. O primário falha.
2. Um candidato de fallback é escolhido em memória.
3. O armazenamento da sessão ainda indica o primário antigo.
4. A reconciliação de sessão ao vivo lê o estado desatualizado da sessão.
5. A nova tentativa volta para o modelo antigo antes de a tentativa de fallback começar.

O override de fallback persistido fecha essa janela, e a reversão estreita
mantém intactas mudanças mais recentes da sessão, manuais ou de runtime.

## Observabilidade e resumos de falha

`runWithModelFallback(...)` registra detalhes por tentativa que alimentam logs e
mensagens de resfriamento exibidas ao usuário:

- provedor/modelo tentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e
  motivos de failover semelhantes)
- status/código opcional
- resumo do erro legível por humanos

Quando todos os candidatos falham, o OpenClaw lança `FallbackSummaryError`. O executor externo
de resposta pode usar isso para construir uma mensagem mais específica, como "todos os modelos
estão temporariamente limitados por taxa", e incluir a expiração de resfriamento mais próxima quando conhecida.

Esse resumo de resfriamento reconhece o modelo:

- limites de taxa com escopo por modelo e não relacionados são ignorados para a cadeia
  de provedor/modelo tentada
- se o bloqueio restante for um limite de taxa com escopo por modelo correspondente, o OpenClaw
  informa a última expiração correspondente que ainda bloqueia aquele modelo

## Configuração relacionada

Veja [Configuração do Gateway](/pt-BR/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- roteamento de `agents.defaults.imageModel`

Veja [Modelos](/pt-BR/concepts/models) para a visão geral mais ampla de seleção de modelo e fallback.
