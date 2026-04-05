---
read_when:
    - Editando contratos de IPC ou o IPC do app da barra de menus
summary: Arquitetura de IPC do macOS para o app OpenClaw, transporte de nó do gateway e PeekabooBridge
title: IPC do macOS
x-i18n:
    generated_at: "2026-04-05T12:48:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0211c334a4a59b71afb29dd7b024778172e529fa618985632d3d11d795ced92
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# Arquitetura de IPC do OpenClaw no macOS

**Modelo atual:** um socket Unix local conecta o **serviço host do nó** ao **app macOS** para aprovações de execução e `system.run`. Existe uma CLI de depuração `openclaw-mac` para verificações de descoberta/conexão; as ações do agente ainda fluem pelo WebSocket do Gateway e `node.invoke`. A automação de UI usa PeekabooBridge.

## Objetivos

- Uma única instância do app GUI que controla todo o trabalho voltado para TCC (notificações, gravação de tela, microfone, fala, AppleScript).
- Uma superfície pequena para automação: Gateway + comandos de nó, além do PeekabooBridge para automação de UI.
- Permissões previsíveis: sempre o mesmo ID de bundle assinado, iniciado pelo launchd, para que as concessões do TCC sejam mantidas.

## Como funciona

### Transporte de Gateway + nó

- O app executa o Gateway (modo local) e se conecta a ele como um nó.
- As ações do agente são executadas por `node.invoke` (por exemplo, `system.run`, `system.notify`, `canvas.*`).

### Serviço de nó + IPC do app

- Um serviço host de nó sem interface se conecta ao WebSocket do Gateway.
- As solicitações `system.run` são encaminhadas ao app macOS por um socket Unix local.
- O app executa a ação no contexto da UI, solicita confirmação se necessário e retorna a saída.

Diagrama (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (automação de UI)

- A automação de UI usa um socket UNIX separado chamado `bridge.sock` e o protocolo JSON do PeekabooBridge.
- Ordem de preferência de host (lado do cliente): Peekaboo.app → Claude.app → OpenClaw.app → execução local.
- Segurança: hosts de bridge exigem um TeamID permitido; a exceção DEBUG-only para mesmo UID é protegida por `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convenção do Peekaboo).
- Consulte: [uso do PeekabooBridge](/platforms/mac/peekaboo) para mais detalhes.

## Fluxos operacionais

- Reiniciar/recompilar: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Encerra instâncias existentes
  - Compila em Swift + empacota
  - Escreve/inicializa/ativa o LaunchAgent
- Instância única: o app é encerrado antecipadamente se outra instância com o mesmo ID de bundle estiver em execução.

## Observações de endurecimento

- Prefira exigir correspondência de TeamID para todas as superfícies privilegiadas.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (somente DEBUG) pode permitir chamadores com o mesmo UID para desenvolvimento local.
- Toda a comunicação permanece somente local; nenhum socket de rede é exposto.
- Os prompts do TCC se originam apenas do bundle do app GUI; mantenha o ID de bundle assinado estável entre recompilações.
- Endurecimento de IPC: modo do socket `0600`, token, verificações de UID do peer, desafio/resposta com HMAC, TTL curto.
