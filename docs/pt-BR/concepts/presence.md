---
read_when:
    - Depurando a aba Instances
    - Investigando linhas de instância duplicadas ou obsoletas
    - Alterando a conexão WS do gateway ou beacons de eventos do sistema
summary: Como as entradas de presença do OpenClaw são produzidas, mescladas e exibidas
title: Presença
x-i18n:
    generated_at: "2026-04-05T12:40:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: a004a1f87be08699c1b2cba97cad8678ce5e27baa425f59eaa18006fdcff26e7
    source_path: concepts/presence.md
    workflow: 15
---

# Presença

A “presença” do OpenClaw é uma visão leve e best-effort de:

- o próprio **Gateway**, e
- **clientes conectados ao Gateway** (app Mac, WebChat, CLI etc.)

A presença é usada principalmente para renderizar a aba **Instances** do app macOS e para
fornecer visibilidade rápida ao operador.

## Campos de presença (o que aparece)

Entradas de presença são objetos estruturados com campos como:

- `instanceId` (opcional, mas fortemente recomendado): identidade estável do cliente (normalmente `connect.client.instanceId`)
- `host`: nome de host amigável para humanos
- `ip`: endereço IP best-effort
- `version`: string da versão do cliente
- `deviceFamily` / `modelIdentifier`: dicas de hardware
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: “segundos desde a última entrada do usuário” (se conhecido)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: timestamp da última atualização (ms desde epoch)

## Produtores (de onde vem a presença)

As entradas de presença são produzidas por várias fontes e **mescladas**.

### 1) Entrada própria do Gateway

O Gateway sempre inicializa uma entrada “self” ao iniciar para que as UIs mostrem o host do gateway
mesmo antes de qualquer cliente se conectar.

### 2) Conexão WebSocket

Todo cliente WS começa com uma solicitação `connect`. Após um handshake bem-sucedido, o
Gateway faz upsert de uma entrada de presença para essa conexão.

#### Por que comandos únicos da CLI não aparecem

A CLI frequentemente se conecta para comandos curtos e pontuais. Para evitar poluir a
lista Instances, `client.mode === "cli"` **não** é transformado em uma entrada de presença.

### 3) Beacons `system-event`

Clientes podem enviar beacons periódicos mais ricos via o método `system-event`. O app Mac
usa isso para informar nome do host, IP e `lastInputSeconds`.

### 4) Conexões de node (papel: node)

Quando um node se conecta pelo WebSocket do Gateway com `role: node`, o Gateway
faz upsert de uma entrada de presença para esse node (o mesmo fluxo de outros clientes WS).

## Regras de mesclagem + deduplicação (por que `instanceId` importa)

As entradas de presença são armazenadas em um único mapa em memória:

- As entradas são indexadas por uma **chave de presença**.
- A melhor chave é um `instanceId` estável (de `connect.client.instanceId`) que sobrevive a reinicializações.
- As chaves não diferenciam maiúsculas de minúsculas.

Se um cliente se reconectar sem um `instanceId` estável, ele pode aparecer como uma
linha **duplicada**.

## TTL e tamanho limitado

A presença é intencionalmente efêmera:

- **TTL:** entradas com mais de 5 minutos são removidas
- **Máximo de entradas:** 200 (as mais antigas são descartadas primeiro)

Isso mantém a lista atualizada e evita crescimento ilimitado de memória.

## Observação sobre remoto/túnel (IPs de loopback)

Quando um cliente se conecta por um túnel SSH / encaminhamento de porta local, o Gateway pode
ver o endereço remoto como `127.0.0.1`. Para evitar sobrescrever um IP válido informado pelo cliente,
endereços remotos de loopback são ignorados.

## Consumidores

### Aba Instances do macOS

O app macOS renderiza a saída de `system-presence` e aplica um pequeno indicador
de status (Active/Idle/Stale) com base na idade da última atualização.

## Dicas de depuração

- Para ver a lista bruta, chame `system-presence` no Gateway.
- Se você vir duplicatas:
  - confirme que os clientes enviam um `client.instanceId` estável no handshake
  - confirme que os beacons periódicos usam o mesmo `instanceId`
  - verifique se a entrada derivada da conexão está sem `instanceId` (duplicatas são esperadas)
