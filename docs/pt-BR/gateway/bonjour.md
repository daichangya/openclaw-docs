---
read_when:
    - Depurando problemas de descoberta Bonjour no macOS/iOS
    - Alterando tipos de serviço mDNS, registros TXT ou UX de descoberta
summary: Descoberta Bonjour/mDNS + depuração (beacons do Gateway, clientes e modos de falha comuns)
title: Descoberta Bonjour
x-i18n:
    generated_at: "2026-04-05T12:41:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f5a7f3211c74d4d10fdc570fc102b3c949c0ded9409c54995ab8820e5787f02
    source_path: gateway/bonjour.md
    workflow: 15
---

# Descoberta Bonjour / mDNS

O OpenClaw usa Bonjour (mDNS / DNS‑SD) para descobrir um Gateway ativo (endpoint WebSocket).
A navegação multicast `local.` é uma **conveniência apenas para LAN**. Para descoberta entre redes, o
mesmo beacon também pode ser publicado por meio de um domínio DNS-SD de ampla área configurado. A descoberta
ainda é best-effort e **não** substitui conectividade baseada em SSH ou Tailnet.

## Bonjour de ampla área (Unicast DNS-SD) sobre Tailscale

Se o nó e o gateway estiverem em redes diferentes, o mDNS multicast não atravessará o
limite. Você pode manter a mesma UX de descoberta mudando para **unicast DNS‑SD**
("Wide‑Area Bonjour") sobre Tailscale.

Etapas em alto nível:

1. Execute um servidor DNS no host do gateway (acessível pela Tailnet).
2. Publique registros DNS‑SD para `_openclaw-gw._tcp` em uma zona dedicada
   (exemplo: `openclaw.internal.`).
3. Configure **split DNS** no Tailscale para que o domínio escolhido resolva por meio desse
   servidor DNS para os clientes (incluindo iOS).

O OpenClaw oferece suporte a qualquer domínio de descoberta; `openclaw.internal.` é apenas um exemplo.
Nós iOS/Android navegam tanto em `local.` quanto no seu domínio de ampla área configurado.

### Configuração do gateway (recomendada)

```json5
{
  gateway: { bind: "tailnet" }, // somente tailnet (recomendado)
  discovery: { wideArea: { enabled: true } }, // ativa publicação DNS-SD de ampla área
}
```

### Configuração única do servidor DNS (host do gateway)

```bash
openclaw dns setup --apply
```

Isso instala o CoreDNS e o configura para:

- escutar na porta 53 apenas nas interfaces Tailscale do gateway
- servir o domínio escolhido (exemplo: `openclaw.internal.`) a partir de `~/.openclaw/dns/<domain>.db`

Valide em uma máquina conectada à tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configurações de DNS do Tailscale

No console de administração do Tailscale:

- Adicione um nameserver apontando para o IP tailnet do gateway (UDP/TCP 53).
- Adicione split DNS para que seu domínio de descoberta use esse nameserver.

Assim que os clientes aceitarem o DNS da tailnet, nós iOS e a descoberta da CLI poderão navegar por
`_openclaw-gw._tcp` no seu domínio de descoberta sem multicast.

### Segurança do listener do gateway (recomendada)

A porta WS do Gateway (padrão `18789`) se vincula ao loopback por padrão. Para acesso por LAN/tailnet,
vincule explicitamente e mantenha a autenticação ativada.

Para configurações somente de tailnet:

- Defina `gateway.bind: "tailnet"` em `~/.openclaw/openclaw.json`.
- Reinicie o Gateway (ou reinicie o app da barra de menus do macOS).

## O que anuncia

Somente o Gateway anuncia `_openclaw-gw._tcp`.

## Tipos de serviço

- `_openclaw-gw._tcp` — beacon de transporte do gateway (usado por nós macOS/iOS/Android).

## Chaves TXT (dicas não sigilosas)

O Gateway anuncia pequenas dicas não sigilosas para tornar os fluxos de UI convenientes:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (somente quando TLS está ativado)
- `gatewayTlsSha256=<sha256>` (somente quando TLS está ativado e a impressão digital está disponível)
- `canvasPort=<port>` (somente quando o host do canvas está ativado; atualmente igual a `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (dica opcional quando a Tailnet está disponível)
- `sshPort=<port>` (somente no modo mDNS full; o DNS-SD de ampla área pode omiti-lo)
- `cliPath=<path>` (somente no modo mDNS full; o DNS-SD de ampla área ainda o grava como dica de instalação remota)

Observações de segurança:

- Registros TXT de Bonjour/mDNS são **não autenticados**. Os clientes não devem tratar TXT como roteamento autoritativo.
- Os clientes devem rotear usando o endpoint do serviço resolvido (SRV + A/AAAA). Trate `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` apenas como dicas.
- O direcionamento automático de SSH também deve usar o host do serviço resolvido, e não dicas somente de TXT.
- O pinning de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado substitua um pin armazenado anteriormente.
- Nós iOS/Android devem tratar conexões diretas baseadas em descoberta como **somente TLS** e exigir confirmação explícita do usuário antes de confiar em uma impressão digital vista pela primeira vez.

## Depuração no macOS

Ferramentas integradas úteis:

- Navegar por instâncias:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolver uma instância (substitua `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Se a navegação funciona mas a resolução falha, normalmente você está enfrentando uma política de LAN ou
um problema do resolvedor mDNS.

## Depuração nos logs do Gateway

O Gateway grava um arquivo de log rotativo (impresso na inicialização como
`gateway log file: ...`). Procure por linhas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Depuração no nó iOS

O nó iOS usa `NWBrowser` para descobrir `_openclaw-gw._tcp`.

Para capturar logs:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduza → **Copy**

O log inclui transições de estado do navegador e mudanças no conjunto de resultados.

## Modos de falha comuns

- **Bonjour não atravessa redes**: use Tailnet ou SSH.
- **Multicast bloqueado**: algumas redes Wi‑Fi desativam mDNS.
- **Suspensão / mudança de interface**: o macOS pode descartar temporariamente resultados mDNS; tente novamente.
- **A navegação funciona, mas a resolução falha**: mantenha os nomes das máquinas simples (evite emojis ou
  pontuação) e então reinicie o Gateway. O nome da instância do serviço deriva do
  nome do host, então nomes excessivamente complexos podem confundir alguns resolvedores.

## Nomes de instância escapados (`\032`)

Bonjour/DNS‑SD frequentemente escapa bytes em nomes de instância de serviço como sequências decimais `\DDD`
(por exemplo, espaços se tornam `\032`).

- Isso é normal no nível de protocolo.
- As UIs devem decodificar para exibição (o iOS usa `BonjourEscapes.decode`).

## Desativação / configuração

- `OPENCLAW_DISABLE_BONJOUR=1` desativa o anúncio (legado: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` em `~/.openclaw/openclaw.json` controla o modo de bind do Gateway.
- `OPENCLAW_SSH_PORT` substitui a porta SSH quando `sshPort` é anunciado (legado: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publica uma dica MagicDNS em TXT (legado: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` substitui o caminho da CLI anunciado (legado: `OPENCLAW_CLI_PATH`).

## Documentação relacionada

- Política de descoberta e seleção de transporte: [Discovery](/gateway/discovery)
- Pairing e aprovações de nós: [Gateway pairing](/gateway/pairing)
