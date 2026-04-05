---
read_when:
    - Você quer uma visão concisa do modelo de rede do Gateway
summary: Como o Gateway, os nodes e o canvas host se conectam.
title: Modelo de rede
x-i18n:
    generated_at: "2026-04-05T12:41:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d02d87f38ee5a9fae228f5028892b192c50b473ab4441bbe0b40ee85a1dd402
    source_path: gateway/network-model.md
    workflow: 15
---

# Modelo de rede

> Este conteúdo foi incorporado em [Network](/network#core-model). Consulte essa página para ver o guia atual.

A maioria das operações passa pelo Gateway (`openclaw gateway`), um único processo de longa duração
que é proprietário das conexões de canal e do plano de controle WebSocket.

## Regras principais

- Recomenda-se um Gateway por host. É o único processo autorizado a ser proprietário da sessão do WhatsApp Web. Para bots de recuperação ou isolamento rígido, execute vários gateways com perfis e portas isolados. Consulte [Multiple gateways](/gateway/multiple-gateways).
- Loopback primeiro: o WS do Gateway usa por padrão `ws://127.0.0.1:18789`. O assistente cria autenticação por segredo compartilhado por padrão e normalmente gera um token, mesmo para loopback. Para acesso fora de loopback, use um caminho válido de autenticação do gateway: autenticação por token/senha com segredo compartilhado ou uma implantação `trusted-proxy` fora de loopback configurada corretamente. Configurações de tailnet/mobile geralmente funcionam melhor por meio de Tailscale Serve ou outro endpoint `wss://`, em vez de `ws://` bruto pela tailnet.
- Os nodes se conectam ao WS do Gateway por LAN, tailnet ou SSH, conforme necessário. A
  bridge TCP legada foi removida.
- O canvas host é servido pelo servidor HTTP do Gateway na **mesma porta** do Gateway (padrão `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Quando `gateway.auth` está configurado e o Gateway faz bind além de loopback, essas rotas são protegidas pela autenticação do Gateway. Clientes node usam URLs de capacidade com escopo de node vinculadas à sessão WS ativa. Consulte [Gateway configuration](/gateway/configuration) (`canvasHost`, `gateway`).
- O uso remoto normalmente é feito por túnel SSH ou VPN de tailnet. Consulte [Remote access](/gateway/remote) e [Discovery](/gateway/discovery).
