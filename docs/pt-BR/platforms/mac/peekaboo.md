---
read_when:
    - Hospedar o PeekabooBridge no OpenClaw.app
    - Integrar o Peekaboo via Swift Package Manager
    - Alterar o protocolo/caminhos do PeekabooBridge
summary: Integração do PeekabooBridge para automação de UI no macOS
title: Peekaboo Bridge
x-i18n:
    generated_at: "2026-04-05T12:47:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30961eb502eecd23c017b58b834bd8cb00cab8b17302617d541afdace3ad8dba
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

# Peekaboo Bridge (automação de UI no macOS)

O OpenClaw pode hospedar o **PeekabooBridge** como um broker local de automação
de UI com reconhecimento de permissões. Isso permite que a CLI `peekaboo` conduza a automação de UI reutilizando as permissões TCC
do app macOS.

## O que isso é (e o que não é)

- **Host**: o OpenClaw.app pode atuar como host do PeekabooBridge.
- **Cliente**: use a CLI `peekaboo` (não há uma superfície separada `openclaw ui ...`).
- **UI**: as sobreposições visuais permanecem no Peekaboo.app; o OpenClaw é um host broker fino.

## Ativar a bridge

No app macOS:

- Configurações → **Ativar Peekaboo Bridge**

Quando ativado, o OpenClaw inicia um servidor de socket UNIX local. Se desativado, o host
é interrompido e `peekaboo` recorrerá a outros hosts disponíveis.

## Ordem de descoberta do cliente

Os clientes Peekaboo normalmente tentam os hosts nesta ordem:

1. Peekaboo.app (UX completa)
2. Claude.app (se instalado)
3. OpenClaw.app (broker fino)

Use `peekaboo bridge status --verbose` para ver qual host está ativo e qual
caminho de socket está em uso. Você pode substituir com:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Segurança e permissões

- A bridge valida as **assinaturas de código do chamador**; uma allowlist de TeamIDs é
  aplicada (TeamID do host Peekaboo + TeamID do app OpenClaw).
- As solicitações expiram após ~10 segundos.
- Se permissões obrigatórias estiverem ausentes, a bridge retornará uma mensagem de erro clara
  em vez de abrir os Ajustes do Sistema.

## Comportamento de snapshot (automação)

Os snapshots são armazenados em memória e expiram automaticamente após um curto intervalo.
Se você precisar de retenção mais longa, capture novamente a partir do cliente.

## Solução de problemas

- Se `peekaboo` relatar “bridge client is not authorized”, verifique se o cliente está
  assinado corretamente ou execute o host com `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  no modo **debug** apenas.
- Se nenhum host for encontrado, abra um dos apps host (Peekaboo.app ou OpenClaw.app)
  e confirme que as permissões foram concedidas.
