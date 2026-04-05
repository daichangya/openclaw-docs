---
read_when:
    - Implementando aprovações de pareamento de node sem interface do macOS
    - Adicionando fluxos de CLI para aprovar nodes remotos
    - Estendendo o protocolo do gateway com gerenciamento de nodes
summary: Pareamento de nodes controlado pelo Gateway (Opção B) para iOS e outros nodes remotos
title: Pareamento controlado pelo Gateway
x-i18n:
    generated_at: "2026-04-05T12:42:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f90818c84daeb190f27df7413e23362372806f2c4250e4954295fbf6df70233
    source_path: gateway/pairing.md
    workflow: 15
---

# Pareamento controlado pelo Gateway (Opção B)

No pareamento controlado pelo Gateway, o **Gateway** é a fonte da verdade para quais nodes
têm permissão para entrar. UIs (app do macOS, futuros clientes) são apenas frontends que
aprovam ou rejeitam solicitações pendentes.

**Importante:** nodes WS usam **pareamento de dispositivo** (função `node`) durante `connect`.
`node.pair.*` é um armazenamento de pareamento separado e **não** controla o handshake WS.
Somente clientes que chamam explicitamente `node.pair.*` usam esse fluxo.

## Conceitos

- **Solicitação pendente**: um node pediu para entrar; exige aprovação.
- **Node pareado**: node aprovado com um token de autenticação emitido.
- **Transporte**: o endpoint WS do Gateway encaminha solicitações, mas não decide
  associação. (O suporte legado à bridge TCP foi removido.)

## Como o pareamento funciona

1. Um node se conecta ao WS do Gateway e solicita pareamento.
2. O Gateway armazena uma **solicitação pendente** e emite `node.pair.requested`.
3. Você aprova ou rejeita a solicitação (CLI ou UI).
4. Na aprovação, o Gateway emite um **novo token** (os tokens são rotacionados ao reparar).
5. O node se reconecta usando o token e agora está “pareado”.

Solicitações pendentes expiram automaticamente após **5 minutos**.

## Fluxo de trabalho da CLI (compatível com modo headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra nodes pareados/conectados e seus recursos.

## Superfície da API (protocolo do gateway)

Eventos:

- `node.pair.requested` — emitido quando uma nova solicitação pendente é criada.
- `node.pair.resolved` — emitido quando uma solicitação é aprovada/rejeitada/expira.

Métodos:

- `node.pair.request` — cria ou reutiliza uma solicitação pendente.
- `node.pair.list` — lista nodes pendentes + pareados (`operator.pairing`).
- `node.pair.approve` — aprova uma solicitação pendente (emite token).
- `node.pair.reject` — rejeita uma solicitação pendente.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Observações:

- `node.pair.request` é idempotente por node: chamadas repetidas retornam a mesma
  solicitação pendente.
- Solicitações repetidas para o mesmo node pendente também atualizam os metadados do node
  armazenados e o snapshot mais recente de comandos declarados permitidos pela allowlist para visibilidade do operador.
- A aprovação **sempre** gera um token novo; nenhum token é retornado por
  `node.pair.request`.
- As solicitações podem incluir `silent: true` como dica para fluxos de aprovação automática.
- `node.pair.approve` usa os comandos declarados da solicitação pendente para aplicar
  escopos extras de aprovação:
  - solicitação sem comando: `operator.pairing`
  - solicitação de comando sem exec: `operator.pairing` + `operator.write`
  - solicitação `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Importante:

- O pareamento de node é um fluxo de confiança/identidade mais emissão de token.
- Ele **não** fixa a superfície ativa de comandos do node por node.
- Os comandos ativos do node vêm do que o node declara ao conectar depois que a
  política global de comandos de node do gateway (`gateway.nodes.allowCommands` /
  `denyCommands`) é aplicada.
- A política de permitir/perguntar de `system.run` por node fica no próprio node em
  `exec.approvals.node.*`, não no registro de pareamento.

## Controle de comandos de node (2026.3.31+)

<Warning>
**Mudança incompatível:** a partir de `2026.3.31`, comandos de node ficam desativados até que o pareamento do node seja aprovado. O pareamento de dispositivo sozinho não é mais suficiente para expor comandos de node declarados.
</Warning>

Quando um node se conecta pela primeira vez, o pareamento é solicitado automaticamente. Até que a solicitação de pareamento seja aprovada, todos os comandos de node pendentes desse node são filtrados e não serão executados. Assim que a confiança é estabelecida pela aprovação do pareamento, os comandos declarados do node ficam disponíveis sujeitos à política normal de comandos.

Isso significa:

- Nodes que antes dependiam apenas do pareamento de dispositivo para expor comandos agora devem concluir o pareamento de node.
- Comandos enfileirados antes da aprovação do pareamento são descartados, não adiados.

## Limites de confiança de eventos de node (2026.3.31+)

<Warning>
**Mudança incompatível:** execuções originadas em nodes agora permanecem em uma superfície de confiança reduzida.
</Warning>

Resumos originados em nodes e eventos de sessão relacionados são restritos à superfície de confiança pretendida. Fluxos acionados por notificação ou por node que antes dependiam de acesso mais amplo a ferramentas do host ou da sessão podem precisar de ajustes. Esse reforço garante que eventos de node não possam escalar para acesso a ferramentas em nível de host além do que o limite de confiança do node permite.

## Aprovação automática (app do macOS)

O app do macOS pode opcionalmente tentar uma **aprovação silenciosa** quando:

- a solicitação é marcada como `silent`, e
- o app consegue verificar uma conexão SSH com o host do gateway usando o mesmo usuário.

Se a aprovação silenciosa falhar, ele faz fallback para o prompt normal “Aprovar/Rejeitar”.

## Armazenamento (local, privado)

O estado de pareamento é armazenado no diretório de estado do Gateway (padrão `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Se você substituir `OPENCLAW_STATE_DIR`, a pasta `nodes/` será movida junto.

Observações de segurança:

- Tokens são segredos; trate `paired.json` como sensível.
- Rotacionar um token exige nova aprovação (ou exclusão da entrada do node).

## Comportamento do transporte

- O transporte é **stateless**; ele não armazena associação.
- Se o Gateway estiver offline ou o pareamento estiver desativado, os nodes não poderão parear.
- Se o Gateway estiver em modo remoto, o pareamento ainda acontece no armazenamento do Gateway remoto.
