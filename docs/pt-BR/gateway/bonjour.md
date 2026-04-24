---
read_when:
    - Depuração de problemas de descoberta do Bonjour no macOS/iOS
    - Alteração de tipos de serviço mDNS, registros TXT ou UX de descoberta
summary: Descoberta e depuração de Bonjour/mDNS (beacons do Gateway, clientes e modos de falha comuns)
title: Descoberta de Bonjour
x-i18n:
    generated_at: "2026-04-24T08:57:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62961714a0c9880be457c254e1cfc1701020ea51b89f2582757cddc8b3dd2113
    source_path: gateway/bonjour.md
    workflow: 15
---

# Descoberta Bonjour / mDNS

O OpenClaw usa Bonjour (mDNS / DNS‑SD) para descobrir um Gateway ativo (endpoint WebSocket).
A navegação multicast `local.` é uma **conveniência apenas para LAN**. O plugin
`bonjour` incluído é responsável pela publicidade na LAN e vem ativado por padrão. Para descoberta entre redes,
o mesmo beacon também pode ser publicado por meio de um domínio DNS-SD de área ampla configurado.
A descoberta continua sendo de melhor esforço e **não** substitui conectividade baseada em SSH ou Tailnet.

## Bonjour de área ampla (Unicast DNS-SD) sobre Tailscale

Se o Node e o Gateway estiverem em redes diferentes, o mDNS multicast não atravessará
esse limite. Você pode manter a mesma UX de descoberta mudando para **unicast DNS‑SD**
("Wide‑Area Bonjour") sobre Tailscale.

Etapas de alto nível:

1. Execute um servidor DNS no host do Gateway (acessível pela Tailnet).
2. Publique registros DNS‑SD para `_openclaw-gw._tcp` sob uma zona dedicada
   (exemplo: `openclaw.internal.`).
3. Configure o **split DNS** do Tailscale para que o domínio escolhido seja resolvido por esse
   servidor DNS para os clientes (incluindo iOS).

O OpenClaw oferece suporte a qualquer domínio de descoberta; `openclaw.internal.` é apenas um exemplo.
Nodes iOS/Android navegam tanto em `local.` quanto no domínio de área ampla configurado.

### Configuração do Gateway (recomendada)

```json5
{
  gateway: { bind: "tailnet" }, // somente tailnet (recomendado)
  discovery: { wideArea: { enabled: true } }, // ativa a publicação DNS-SD de área ampla
}
```

### Configuração única do servidor DNS (host do Gateway)

```bash
openclaw dns setup --apply
```

Isso instala o CoreDNS e o configura para:

- escutar na porta 53 apenas nas interfaces Tailscale do Gateway
- servir o domínio escolhido (exemplo: `openclaw.internal.`) a partir de `~/.openclaw/dns/<domain>.db`

Valide em uma máquina conectada à tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configurações de DNS do Tailscale

No console de administração do Tailscale:

- Adicione um servidor de nomes apontando para o IP tailnet do Gateway (UDP/TCP 53).
- Adicione split DNS para que seu domínio de descoberta use esse servidor de nomes.

Quando os clientes aceitarem o DNS da tailnet, Nodes iOS e a descoberta via CLI poderão navegar por
`_openclaw-gw._tcp` no seu domínio de descoberta sem multicast.

### Segurança do listener do Gateway (recomendada)

A porta WS do Gateway (padrão `18789`) faz bind em loopback por padrão. Para acesso por LAN/tailnet,
faça bind explicitamente e mantenha a autenticação ativada.

Para configurações somente de tailnet:

- Defina `gateway.bind: "tailnet"` em `~/.openclaw/openclaw.json`.
- Reinicie o Gateway (ou reinicie o app da barra de menus do macOS).

## O que anuncia

Apenas o Gateway anuncia `_openclaw-gw._tcp`. A publicidade multicast na LAN é
fornecida pelo plugin `bonjour` incluído; a publicação DNS-SD de área ampla continua
sendo de responsabilidade do Gateway.

## Tipos de serviço

- `_openclaw-gw._tcp` — beacon de transporte do gateway (usado por Nodes macOS/iOS/Android).

## Chaves TXT (dicas não secretas)

O Gateway anuncia pequenas dicas não secretas para tornar os fluxos de UI mais convenientes:

- `role=gateway`
- `displayName=<nome amigável>`
- `lanHost=<hostname>.local`
- `gatewayPort=<porta>` (Gateway WS + HTTP)
- `gatewayTls=1` (somente quando TLS estiver ativado)
- `gatewayTlsSha256=<sha256>` (somente quando TLS estiver ativado e a impressão digital estiver disponível)
- `canvasPort=<porta>` (somente quando o host do canvas estiver ativado; atualmente é a mesma que `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (somente no modo mDNS full, dica opcional quando Tailnet estiver disponível)
- `sshPort=<porta>` (somente no modo mDNS full; DNS-SD de área ampla pode omiti-lo)
- `cliPath=<caminho>` (somente no modo mDNS full; DNS-SD de área ampla ainda o grava como dica de instalação remota)

Observações de segurança:

- Registros TXT de Bonjour/mDNS são **não autenticados**. Os clientes não devem tratar TXT como roteamento autoritativo.
- Os clientes devem rotear usando o endpoint de serviço resolvido (SRV + A/AAAA). Trate `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` apenas como dicas.
- O direcionamento automático de SSH também deve usar o host de serviço resolvido, não dicas somente em TXT.
- O pinning de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado substitua um pin armazenado anteriormente.
- Nodes iOS/Android devem tratar conexões diretas baseadas em descoberta como **somente TLS** e exigir confirmação explícita do usuário antes de confiar em uma impressão digital vista pela primeira vez.

## Depuração no macOS

Ferramentas internas úteis:

- Navegar pelas instâncias:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolver uma instância (substitua `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Se a navegação funciona, mas a resolução falha, normalmente você está enfrentando uma política de LAN ou
um problema no resolvedor mDNS.

## Depuração nos logs do Gateway

O Gateway grava um arquivo de log rotativo (exibido na inicialização como
`gateway log file: ...`). Procure por linhas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Depuração no Node iOS

O Node iOS usa `NWBrowser` para descobrir `_openclaw-gw._tcp`.

Para capturar logs:

- Ajustes → Gateway → Avançado → **Logs de depuração de descoberta**
- Ajustes → Gateway → Avançado → **Logs de descoberta** → reproduza → **Copiar**

O log inclui transições de estado do browser e mudanças no conjunto de resultados.

## Modos de falha comuns

- **Bonjour não atravessa redes**: use Tailnet ou SSH.
- **Multicast bloqueado**: algumas redes Wi‑Fi desativam mDNS.
- **Suspensão / mudança de interface**: o macOS pode remover temporariamente resultados mDNS; tente novamente.
- **A navegação funciona, mas a resolução falha**: mantenha nomes de máquina simples (evite emojis ou
  pontuação) e depois reinicie o Gateway. O nome da instância do serviço deriva do
  nome do host, então nomes excessivamente complexos podem confundir alguns resolvedores.

## Nomes de instância escapados (`\032`)

Bonjour/DNS‑SD costuma escapar bytes em nomes de instância de serviço como sequências decimais `\DDD`
(por exemplo, espaços viram `\032`).

- Isso é normal no nível do protocolo.
- As UIs devem decodificar para exibição (o iOS usa `BonjourEscapes.decode`).

## Desativação / configuração

- `openclaw plugins disable bonjour` desativa a publicidade multicast na LAN ao desativar o plugin incluído.
- `openclaw plugins enable bonjour` restaura o plugin padrão de descoberta na LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` desativa a publicidade multicast na LAN sem alterar a configuração do plugin; valores truthy aceitos são `1`, `true`, `yes` e `on` (legado: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` em `~/.openclaw/openclaw.json` controla o modo de bind do Gateway.
- `OPENCLAW_SSH_PORT` substitui a porta SSH quando `sshPort` é anunciado (legado: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publica uma dica de MagicDNS em TXT quando o modo mDNS full está ativado (legado: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` substitui o caminho anunciado da CLI (legado: `OPENCLAW_CLI_PATH`).

## Documentação relacionada

- Política de descoberta e seleção de transporte: [Discovery](/pt-BR/gateway/discovery)
- Pareamento de Node + aprovações: [Pareamento do Gateway](/pt-BR/gateway/pairing)
