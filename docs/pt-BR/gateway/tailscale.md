---
read_when:
    - Expondo a Control UI do Gateway fora do localhost
    - Automatizando acesso ao painel pela tailnet ou público
summary: Tailscale Serve/Funnel integrado para o painel do Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-05T12:42:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ca5316e804e089c31a78ae882b3082444e082fb2b36b73679ffede20590cb2e
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (painel do Gateway)

O OpenClaw pode configurar automaticamente o Tailscale **Serve** (tailnet) ou **Funnel** (público) para o
painel do Gateway e a porta WebSocket. Isso mantém o Gateway vinculado ao loopback enquanto
o Tailscale fornece HTTPS, roteamento e (no caso do Serve) cabeçalhos de identidade.

## Modos

- `serve`: Serve apenas para tailnet via `tailscale serve`. O gateway permanece em `127.0.0.1`.
- `funnel`: HTTPS público via `tailscale funnel`. O OpenClaw exige uma senha compartilhada.
- `off`: padrão (sem automação do Tailscale).

## Autenticação

Defina `gateway.auth.mode` para controlar o handshake:

- `none` (apenas para ingresso privado)
- `token` (padrão quando `OPENCLAW_GATEWAY_TOKEN` está definido)
- `password` (segredo compartilhado via `OPENCLAW_GATEWAY_PASSWORD` ou configuração)
- `trusted-proxy` (proxy reverso com reconhecimento de identidade; consulte [Trusted Proxy Auth](/gateway/trusted-proxy-auth))

Quando `tailscale.mode = "serve"` e `gateway.auth.allowTailscale` é `true`,
a autenticação da Control UI/WebSocket pode usar cabeçalhos de identidade do Tailscale
(`tailscale-user-login`) sem fornecer token/senha. O OpenClaw verifica
a identidade resolvendo o endereço `x-forwarded-for` via o daemon local do Tailscale
(`tailscale whois`) e comparando-o com o cabeçalho antes de aceitá-lo.
O OpenClaw só trata uma requisição como Serve quando ela chega do loopback com
os cabeçalhos `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host` do
Tailscale.
Endpoints da API HTTP (por exemplo `/v1/*`, `/tools/invoke` e `/api/channels/*`)
**não** usam autenticação por cabeçalho de identidade do Tailscale. Eles ainda seguem o
modo normal de autenticação HTTP do gateway: autenticação por segredo compartilhado por padrão, ou uma configuração intencional de `trusted-proxy` / `none` para ingresso privado.
Esse fluxo sem token assume que o host do gateway é confiável. Se código local não confiável
puder ser executado no mesmo host, desative `gateway.auth.allowTailscale` e exija autenticação por token/senha.
Para exigir credenciais explícitas por segredo compartilhado, defina `gateway.auth.allowTailscale: false`
e use `gateway.auth.mode: "token"` ou `"password"`.

## Exemplos de configuração

### Apenas tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Abra: `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

### Apenas tailnet (bind ao IP da Tailnet)

Use isso quando quiser que o Gateway escute diretamente no IP da Tailnet (sem Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Conecte-se a partir de outro dispositivo na Tailnet:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Observação: loopback (`http://127.0.0.1:18789`) **não** funcionará nesse modo.

### Internet pública (Funnel + senha compartilhada)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Prefira `OPENCLAW_GATEWAY_PASSWORD` em vez de gravar uma senha em disco.

## Exemplos de CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Observações

- O Tailscale Serve/Funnel exige que a CLI `tailscale` esteja instalada e autenticada.
- `tailscale.mode: "funnel"` se recusa a iniciar, a menos que o modo de autenticação seja `password`, para evitar exposição pública.
- Defina `gateway.tailscale.resetOnExit` se quiser que o OpenClaw desfaça a configuração de `tailscale serve`
  ou `tailscale funnel` ao encerrar.
- `gateway.bind: "tailnet"` é um bind direto na Tailnet (sem HTTPS, sem Serve/Funnel).
- `gateway.bind: "auto"` prefere loopback; use `tailnet` se quiser apenas Tailnet.
- Serve/Funnel expõem apenas a **UI de controle + WS do Gateway**. Os Nodes se conectam pelo
  mesmo endpoint WS do Gateway, então o Serve pode funcionar para acesso de node.

## Controle do navegador (Gateway remoto + navegador local)

Se você executar o Gateway em uma máquina, mas quiser controlar um navegador em outra máquina,
execute um **host de node** na máquina do navegador e mantenha ambos na mesma tailnet.
O Gateway fará proxy das ações do navegador para o node; não é necessário um servidor de controle separado nem uma URL Serve.

Evite Funnel para controle do navegador; trate o pareamento de node como acesso de operador.

## Pré-requisitos + limites do Tailscale

- O Serve exige HTTPS ativado para sua tailnet; a CLI solicitará isso se estiver ausente.
- O Serve injeta cabeçalhos de identidade do Tailscale; o Funnel não.
- O Funnel exige Tailscale v1.38.3+, MagicDNS, HTTPS ativado e um atributo de nó funnel.
- O Funnel oferece suporte apenas às portas `443`, `8443` e `10000` sobre TLS.
- O Funnel no macOS exige a variante de aplicativo Tailscale de código aberto.

## Saiba mais

- Visão geral do Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Visão geral do Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
