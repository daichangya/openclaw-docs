---
permalink: /security/formal-verification/
read_when:
    - Revisando garantias ou limites de modelos formais de segurança
    - Reproduzindo ou atualizando verificações de modelos de segurança em TLA+/TLC
summary: Modelos de segurança verificados por máquina para os caminhos de maior risco do OpenClaw.
title: Verificação Formal (Modelos de Segurança)
x-i18n:
    generated_at: "2026-04-05T12:53:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f7cd2461dcc00d320a5210e50279d76a7fa84e0830c440398323d75e262a38a
    source_path: security/formal-verification.md
    workflow: 15
---

# Verificação Formal (Modelos de Segurança)

Esta página acompanha os **modelos formais de segurança** do OpenClaw (TLA+/TLC hoje; mais conforme necessário).

> Observação: alguns links mais antigos podem se referir ao nome anterior do projeto.

**Objetivo (estrela-guia):** fornecer um argumento verificado por máquina de que o OpenClaw aplica sua
política de segurança pretendida (autorização, isolamento de sessão, controle de ferramentas e
segurança contra configurações incorretas), sob suposições explícitas.

**O que isto é (hoje):** uma **suite de regressão de segurança** executável e orientada por atacantes:

- Cada afirmação tem uma verificação de modelo executável sobre um espaço de estados finito.
- Muitas afirmações têm um **modelo negativo** emparelhado que produz um rastro de contraexemplo para uma classe realista de bug.

**O que isto ainda não é:** uma prova de que “o OpenClaw é seguro em todos os aspectos” ou de que a implementação completa em TypeScript está correta.

## Onde os modelos ficam

Os modelos são mantidos em um repositório separado: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Ressalvas importantes

- Estes são **modelos**, não a implementação completa em TypeScript. Pode haver divergência entre modelo e código.
- Os resultados são limitados pelo espaço de estados explorado pelo TLC; um resultado “verde” não implica segurança além das suposições e limites modelados.
- Algumas afirmações dependem de suposições ambientais explícitas (por exemplo, implantação correta, entradas de configuração corretas).

## Reproduzindo resultados

Hoje, os resultados são reproduzidos clonando localmente o repositório de modelos e executando o TLC (veja abaixo). Uma iteração futura poderia oferecer:

- modelos executados em CI com artefatos públicos (rastros de contraexemplo, logs de execução)
- um fluxo hospedado de “executar este modelo” para verificações pequenas e limitadas

Primeiros passos:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ obrigatório (o TLC roda na JVM).
# O repositório inclui um `tla2tools.jar` fixado (ferramentas TLA+) e fornece `bin/tlc` + alvos Make.

make <target>
```

### Exposição do gateway e configuração incorreta de gateway aberto

**Afirmação:** fazer bind além do loopback sem autenticação pode tornar possível o comprometimento remoto / aumentar a exposição; token/senha bloqueia atacantes remotos sem autenticação (segundo as suposições do modelo).

- Execuções verdes:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Vermelho (esperado):
  - `make gateway-exposure-v2-negative`

Consulte também: `docs/gateway-exposure-matrix.md` no repositório de modelos.

### Pipeline de exec do node (capacidade de maior risco)

**Afirmação:** `exec host=node` exige (a) allowlist de comandos do node mais comandos declarados e (b) aprovação ativa quando configurado; aprovações são tokenizadas para evitar replay (no modelo).

- Execuções verdes:
  - `make nodes-pipeline`
  - `make approvals-token`
- Vermelho (esperado):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Armazenamento de pareamento (controle de DM)

**Afirmação:** solicitações de pareamento respeitam TTL e limites de solicitações pendentes.

- Execuções verdes:
  - `make pairing`
  - `make pairing-cap`
- Vermelho (esperado):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Controle de entrada (menções + bypass de comando de controle)

**Afirmação:** em contextos de grupo que exigem menção, um “comando de controle” não autorizado não pode contornar o controle por menção.

- Verde:
  - `make ingress-gating`
- Vermelho (esperado):
  - `make ingress-gating-negative`

### Isolamento de roteamento/chave de sessão

**Afirmação:** DMs de peers distintos não colapsam na mesma sessão, a menos que estejam explicitamente vinculadas/configuradas.

- Verde:
  - `make routing-isolation`
- Vermelho (esperado):
  - `make routing-isolation-negative`

## v1++: modelos limitados adicionais (concorrência, novas tentativas, correção de rastros)

Estes são modelos complementares que aumentam a fidelidade em torno de modos de falha do mundo real (atualizações não atômicas, novas tentativas e fan-out de mensagens).

### Concorrência / idempotência do armazenamento de pareamento

**Afirmação:** um armazenamento de pareamento deve impor `MaxPending` e idempotência mesmo sob entrelaçamentos (ou seja, “verificar e depois gravar” deve ser atômico / bloqueado; refresh não deve criar duplicatas).

O que isso significa:

- Sob solicitações concorrentes, não é possível exceder `MaxPending` para um canal.
- Solicitações/recarregamentos repetidos para o mesmo `(channel, sender)` não devem criar linhas pendentes ativas duplicadas.

- Execuções verdes:
  - `make pairing-race` (verificação de limite atômica/bloqueada)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Vermelho (esperado):
  - `make pairing-race-negative` (corrida de limite begin/commit não atômica)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Correlação / idempotência de rastros de entrada

**Afirmação:** a ingestão deve preservar a correlação de rastros ao longo do fan-out e ser idempotente sob novas tentativas do provedor.

O que isso significa:

- Quando um evento externo se torna várias mensagens internas, cada parte mantém a mesma identidade de rastreio/evento.
- Novas tentativas não resultam em processamento duplicado.
- Se IDs de evento do provedor estiverem ausentes, a deduplicação recorre a uma chave segura (por exemplo, ID de rastreio) para evitar descartar eventos distintos.

- Verde:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Vermelho (esperado):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Precedência de dmScope no roteamento + identityLinks

**Afirmação:** o roteamento deve manter sessões de DM isoladas por padrão e só colapsar sessões quando explicitamente configurado (precedência por canal + vínculos de identidade).

O que isso significa:

- Overrides de dmScope específicos do canal devem prevalecer sobre padrões globais.
- identityLinks devem colapsar apenas dentro de grupos explicitamente vinculados, não entre peers não relacionados.

- Verde:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Vermelho (esperado):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
