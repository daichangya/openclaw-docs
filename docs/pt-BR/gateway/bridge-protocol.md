---
read_when:
    - Criar ou depurar clientes de nó (modo de nó no iOS/Android/macOS)
    - Investigar falhas de emparelhamento ou autenticação da bridge
    - Auditar a superfície de nó exposta pelo gateway
summary: 'Protocolo histórico de bridge (nós legados): TCP JSONL, emparelhamento, RPC com escopo'
title: Protocolo de bridge
x-i18n:
    generated_at: "2026-04-05T12:41:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bc25c388f3d65944167d05ca78f987c84ca480f0213e3485b118ebf4858c50f
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Protocolo de bridge (transporte legado de nó)

<Warning>
A bridge TCP foi **removida**. As compilações atuais do OpenClaw não incluem o listener da bridge e as chaves de configuração `bridge.*` não fazem mais parte do schema. Esta página é mantida apenas para referência histórica. Use o [Protocolo do Gateway](/gateway/protocol) para todos os clientes de nó/operador.
</Warning>

## Por que ele existia

- **Limite de segurança**: a bridge expõe uma pequena lista de permissões em vez de toda a
  superfície da API do gateway.
- **Emparelhamento + identidade do nó**: a admissão de nós é controlada pelo gateway e vinculada
  a um token por nó.
- **UX de descoberta**: nós podem descobrir gateways via Bonjour na LAN ou se conectar
  diretamente por uma tailnet.
- **WS loopback**: todo o plano de controle WS permanece local, a menos que seja tunelado via SSH.

## Transporte

- TCP, um objeto JSON por linha (JSONL).
- TLS opcional (quando `bridge.tls.enabled` é true).
- Historicamente, a porta padrão do listener era `18790` (as compilações atuais não iniciam uma
  bridge TCP).

Quando o TLS está habilitado, os registros TXT de descoberta incluem `bridgeTls=1` mais
`bridgeTlsSha256` como uma dica não secreta. Observe que registros TXT do Bonjour/mDNS não são
autenticados; clientes não devem tratar a impressão digital anunciada como um pin autoritativo sem intenção explícita do usuário ou outra verificação fora de banda.

## Handshake + emparelhamento

1. O cliente envia `hello` com metadados do nó + token (se já estiver emparelhado).
2. Se não estiver emparelhado, o gateway responde `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. O cliente envia `pair-request`.
4. O gateway aguarda aprovação e então envia `pair-ok` e `hello-ok`.

Historicamente, `hello-ok` retornava `serverName` e podia incluir
`canvasHostUrl`.

## Frames

Cliente → Gateway:

- `req` / `res`: RPC do gateway com escopo (chat, sessions, config, health, voicewake, skills.bins)
- `event`: sinais do nó (transcrição de voz, solicitação de agente, assinatura de chat, ciclo de vida de execução)

Gateway → Cliente:

- `invoke` / `invoke-res`: comandos do nó (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: atualizações de chat para sessões assinadas
- `ping` / `pong`: keepalive

A imposição legada de lista de permissões ficava em `src/gateway/server-bridge.ts` (removido).

## Eventos do ciclo de vida de execução

Nós podem emitir eventos `exec.finished` ou `exec.denied` para expor atividade de system.run.
Eles são mapeados para eventos de sistema no gateway. (Nós legados ainda podem emitir `exec.started`.)

Campos do payload (todos opcionais, salvo indicação em contrário):

- `sessionKey` (obrigatório): sessão do agente que receberá o evento de sistema.
- `runId`: id exclusivo de execução para agrupamento.
- `command`: string de comando bruta ou formatada.
- `exitCode`, `timedOut`, `success`, `output`: detalhes de conclusão (apenas finished).
- `reason`: motivo da negação (apenas denied).

## Uso histórico de tailnet

- Vincule a bridge a um IP de tailnet: `bridge.bind: "tailnet"` em
  `~/.openclaw/openclaw.json` (somente histórico; `bridge.*` não é mais válido).
- Clientes se conectam via nome MagicDNS ou IP de tailnet.
- Bonjour **não** atravessa redes; use host/porta manual ou DNS‑SD de área ampla
  quando necessário.

## Versionamento

A bridge era **v1 implícita** (sem negociação min/max). Esta seção é
apenas referência histórica; clientes atuais de nó/operador usam o WebSocket
[Protocolo do Gateway](/gateway/protocol).
