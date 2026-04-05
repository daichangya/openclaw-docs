---
read_when:
    - Você precisa da visão geral da arquitetura de rede + segurança
    - Você está depurando acesso local vs tailnet ou pareamento
    - Você quer a lista canônica de documentação de rede
summary: 'Hub de rede: superfícies do gateway, pareamento, descoberta e segurança'
title: Rede
x-i18n:
    generated_at: "2026-04-05T12:46:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a5f39d4f40ad19646d372000c85b663770eae412af91e1c175eb27b22208118
    source_path: network.md
    workflow: 15
---

# Hub de rede

Este hub reúne a documentação principal sobre como o OpenClaw conecta, pareia e protege
dispositivos em localhost, LAN e tailnet.

## Modelo principal

A maioria das operações passa pelo Gateway (`openclaw gateway`), um único processo de longa duração que controla conexões de canal e o plano de controle WebSocket.

- **Loopback primeiro**: o WS do Gateway usa `ws://127.0.0.1:18789` por padrão.
  Binds sem loopback exigem um caminho válido de autenticação do gateway: autenticação
  por token/senha com segredo compartilhado ou uma implantação `trusted-proxy`
  sem loopback configurada corretamente.
- **Um Gateway por host** é o recomendado. Para isolamento, execute múltiplos gateways com perfis e portas isolados ([Múltiplos gateways](/gateway/multiple-gateways)).
- **Host de canvas** é servido na mesma porta do Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), protegido pela autenticação do Gateway quando usa bind além de loopback.
- **Acesso remoto** normalmente ocorre por túnel SSH ou VPN Tailscale ([Acesso remoto](/gateway/remote)).

Referências principais:

- [Arquitetura do Gateway](/concepts/architecture)
- [Protocolo do Gateway](/gateway/protocol)
- [Runbook do Gateway](/gateway)
- [Superfícies web + modos de bind](/web)

## Pareamento + identidade

- [Visão geral de pareamento (DM + nodes)](/channels/pairing)
- [Pareamento de nodes controlado pelo Gateway](/gateway/pairing)
- [CLI de dispositivos (pareamento + rotação de token)](/cli/devices)
- [CLI de pareamento (aprovações de DM)](/cli/pairing)

Confiança local:

- Conexões diretas via loopback local podem ser aprovadas automaticamente para pareamento, mantendo a UX no mesmo host fluida.
- O OpenClaw também tem um caminho estreito de autoconnexão local ao backend/contêiner para fluxos auxiliares confiáveis com segredo compartilhado.
- Clientes de tailnet e LAN, incluindo binds de tailnet no mesmo host, ainda exigem aprovação explícita de pareamento.

## Descoberta + transportes

- [Descoberta e transportes](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [Acesso remoto (SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## Nodes + transportes

- [Visão geral de nodes](/nodes)
- [Protocolo de bridge (nodes legados, histórico)](/gateway/bridge-protocol)
- [Runbook de node: iOS](/platforms/ios)
- [Runbook de node: Android](/platforms/android)

## Segurança

- [Visão geral de segurança](/gateway/security)
- [Referência de configuração do Gateway](/gateway/configuration)
- [Solução de problemas](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
