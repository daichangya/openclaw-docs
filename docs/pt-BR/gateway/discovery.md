---
read_when:
    - Implementar ou alterar descoberta/publicidade via Bonjour
    - Ajustar modos de conexão remota (direto vs SSH)
    - Projetar descoberta + emparelhamento de nós para nós remotos
summary: Descoberta de nós e transportes (Bonjour, Tailscale, SSH) para encontrar o gateway
title: Descoberta e transportes
x-i18n:
    generated_at: "2026-04-05T12:41:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e76cca9279ca77b55e30d6e746f6325e5644134ef06b9c58f2cf3d793d092685
    source_path: gateway/discovery.md
    workflow: 15
---

# Descoberta e transportes

O OpenClaw tem dois problemas distintos que parecem semelhantes na superfície:

1. **Controle remoto do operador**: o app da barra de menus do macOS controlando um gateway em execução em outro lugar.
2. **Emparelhamento de nós**: iOS/Android (e futuros nós) encontrando um gateway e emparelhando com segurança.

O objetivo do design é manter toda a descoberta/publicidade de rede no **Node Gateway** (`openclaw gateway`) e manter os clientes (app do Mac, iOS) como consumidores.

## Termos

- **Gateway**: um único processo de gateway de longa duração que controla o estado (sessões, emparelhamento, registro de nós) e executa canais. A maioria das configurações usa um por host; configurações isoladas com múltiplos gateways são possíveis.
- **Gateway WS (plano de controle)**: o endpoint WebSocket em `127.0.0.1:18789` por padrão; pode ser vinculado à LAN/tailnet via `gateway.bind`.
- **Transporte WS direto**: um endpoint Gateway WS voltado para LAN/tailnet (sem SSH).
- **Transporte SSH (fallback)**: controle remoto encaminhando `127.0.0.1:18789` por SSH.
- **Bridge TCP legada (removida)**: transporte de nó mais antigo (consulte
  [Protocolo de bridge](/gateway/bridge-protocol)); não é mais anunciada para
  descoberta e não faz mais parte das compilações atuais.

Detalhes do protocolo:

- [Protocolo do Gateway](/gateway/protocol)
- [Protocolo de bridge (legado)](/gateway/bridge-protocol)

## Por que mantemos tanto o "direto" quanto o SSH

- **WS direto** é a melhor UX na mesma rede e dentro de uma tailnet:
  - descoberta automática na LAN via Bonjour
  - tokens de emparelhamento + ACLs controlados pelo gateway
  - não exige acesso ao shell; a superfície do protocolo pode permanecer restrita e auditável
- **SSH** continua sendo o fallback universal:
  - funciona em qualquer lugar onde você tenha acesso SSH (mesmo em redes não relacionadas)
  - sobrevive a problemas com multicast/mDNS
  - não exige novas portas de entrada além do SSH

## Entradas de descoberta (como clientes aprendem onde está o gateway)

### 1) Descoberta via Bonjour / DNS-SD

O Bonjour multicast é best-effort e não atravessa redes. O OpenClaw também pode navegar pelo
mesmo beacon do gateway por um domínio DNS-SD de área ampla configurado, de modo que a descoberta pode cobrir:

- `local.` na mesma LAN
- um domínio DNS-SD unicast configurado para descoberta entre redes

Direção-alvo:

- O **gateway** anuncia seu endpoint WS via Bonjour.
- Os clientes navegam e mostram uma lista “escolha um gateway”, depois armazenam o endpoint escolhido.

Detalhes do beacon e solução de problemas: [Bonjour](/gateway/bonjour).

#### Detalhes do beacon de serviço

- Tipos de serviço:
  - `_openclaw-gw._tcp` (beacon de transporte do gateway)
- Chaves TXT (não secretas):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nome amigável configurado pelo operador)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (somente quando TLS está habilitado)
  - `gatewayTlsSha256=<sha256>` (somente quando TLS está habilitado e a impressão digital está disponível)
  - `canvasPort=<port>` (porta do host do canvas; atualmente a mesma que `gatewayPort` quando o host do canvas está habilitado)
  - `tailnetDns=<magicdns>` (dica opcional; detectado automaticamente quando Tailscale está disponível)
  - `sshPort=<port>` (somente no modo mDNS completo; DNS-SD de área ampla pode omiti-lo, caso em que os padrões de SSH continuam em `22`)
  - `cliPath=<path>` (somente no modo mDNS completo; DNS-SD de área ampla ainda o grava como dica de instalação remota)

Observações de segurança:

- Registros TXT do Bonjour/mDNS são **não autenticados**. Os clientes devem tratar valores TXT apenas como dicas de UX.
- O roteamento (host/porta) deve preferir o **endpoint de serviço resolvido** (SRV + A/AAAA) em vez de `lanHost`, `tailnetDns` ou `gatewayPort` fornecidos por TXT.
- O pinning de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado substitua um pin armazenado anteriormente.
- Nós iOS/Android devem exigir uma confirmação explícita de “confiar nesta impressão digital” antes de armazenar um pin de primeira vez (verificação fora de banda) sempre que a rota escolhida for segura/baseada em TLS.

Desabilitar/substituir:

- `OPENCLAW_DISABLE_BONJOUR=1` desabilita a publicidade.
- `gateway.bind` em `~/.openclaw/openclaw.json` controla o modo de bind do Gateway.
- `OPENCLAW_SSH_PORT` substitui a porta SSH anunciada quando `sshPort` é emitido.
- `OPENCLAW_TAILNET_DNS` publica uma dica `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` substitui o caminho da CLI anunciado.

### 2) Tailnet (entre redes)

Para configurações no estilo London/Vienna, o Bonjour não ajudará. O alvo “direto” recomendado é:

- nome MagicDNS do Tailscale (preferido) ou um IP de tailnet estável.

Se o gateway puder detectar que está sendo executado sob Tailscale, ele publica `tailnetDns` como uma dica opcional para clientes (incluindo beacons de área ampla).

O app do macOS agora prefere nomes MagicDNS a IPs brutos do Tailscale para descoberta de gateway. Isso melhora a confiabilidade quando os IPs da tailnet mudam (por exemplo, após reinicializações de nós ou reatribuição por CGNAT), porque nomes MagicDNS resolvem automaticamente para o IP atual.

Para emparelhamento de nós móveis, dicas de descoberta não relaxam a segurança do transporte em rotas tailnet/públicas:

- iOS/Android ainda exigem um caminho seguro na primeira conexão tailnet/pública (`wss://` ou Tailscale Serve/Funnel).
- Um IP bruto de tailnet descoberto é uma dica de roteamento, não permissão para usar `ws://` remoto em texto claro.
- `ws://` com conexão direta em LAN privada continua compatível.
- Se você quiser o caminho mais simples do Tailscale para nós móveis, use Tailscale Serve para que a descoberta e o código de configuração resolvam ambos para o mesmo endpoint MagicDNS seguro.

### 3) Destino manual / SSH

Quando não há rota direta (ou a rota direta está desabilitada), os clientes sempre podem se conectar via SSH encaminhando a porta loopback do gateway.

Consulte [Acesso remoto](/gateway/remote).

## Seleção de transporte (política do cliente)

Comportamento recomendado para clientes:

1. Se um endpoint direto emparelhado estiver configurado e acessível, use-o.
2. Caso contrário, se a descoberta encontrar um gateway em `local.` ou no domínio de área ampla configurado, ofereça uma opção de um toque “Usar este gateway” e salve-a como endpoint direto.
3. Caso contrário, se um DNS/IP de tailnet estiver configurado, tente a rota direta.
   Para nós móveis em rotas tailnet/públicas, direto significa um endpoint seguro, não `ws://` remoto em texto claro.
4. Caso contrário, recorra a SSH.

## Emparelhamento + autenticação (transporte direto)

O gateway é a fonte da verdade para admissão de nós/clientes.

- Solicitações de emparelhamento são criadas/aprovadas/rejeitadas no gateway (consulte [Emparelhamento do gateway](/gateway/pairing)).
- O gateway impõe:
  - autenticação (token / par de chaves)
  - escopos/ACLs (o gateway não é um proxy bruto para todos os métodos)
  - limites de taxa

## Responsabilidades por componente

- **Gateway**: anuncia beacons de descoberta, controla decisões de emparelhamento e hospeda o endpoint WS.
- **App do macOS**: ajuda você a escolher um gateway, mostra prompts de emparelhamento e usa SSH apenas como fallback.
- **Nós iOS/Android**: navegam via Bonjour por conveniência e se conectam ao Gateway WS emparelhado.
