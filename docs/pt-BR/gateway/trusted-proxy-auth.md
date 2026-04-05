---
read_when:
    - Executando o OpenClaw atrás de um proxy com reconhecimento de identidade
    - Configurando Pomerium, Caddy ou nginx com OAuth na frente do OpenClaw
    - Corrigindo erros WebSocket 1008 unauthorized em configurações com proxy reverso
    - Decidindo onde definir HSTS e outros cabeçalhos de reforço de segurança HTTP
summary: Delegue a autenticação do gateway a um proxy reverso confiável (Pomerium, Caddy, nginx + OAuth)
title: Autenticação por Trusted Proxy
x-i18n:
    generated_at: "2026-04-05T12:43:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccd39736b43e8744de31566d5597b3fbf40ecb6ba9c8ba9d2343e1ab9bb8cd45
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Autenticação por Trusted Proxy

> ⚠️ **Recurso sensível à segurança.** Esse modo delega toda a autenticação ao seu proxy reverso. Uma configuração incorreta pode expor seu Gateway a acesso não autorizado. Leia esta página com atenção antes de ativar.

## Quando usar

Use o modo de autenticação `trusted-proxy` quando:

- Você executa o OpenClaw atrás de um **proxy com reconhecimento de identidade** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Seu proxy lida com toda a autenticação e repassa a identidade do usuário por cabeçalhos
- Você está em um ambiente Kubernetes ou de contêiner em que o proxy é o único caminho para o Gateway
- Você está recebendo erros WebSocket `1008 unauthorized` porque navegadores não conseguem passar tokens no payload de WS

## Quando NÃO usar

- Se seu proxy não autentica usuários (é apenas um terminador TLS ou load balancer)
- Se houver qualquer caminho até o Gateway que contorne o proxy (aberturas no firewall, acesso de rede interna)
- Se você não tiver certeza de que seu proxy remove/sobrescreve corretamente cabeçalhos encaminhados
- Se você só precisa de acesso pessoal para um único usuário (considere Tailscale Serve + loopback para uma configuração mais simples)

## Como funciona

1. Seu proxy reverso autentica usuários (OAuth, OIDC, SAML etc.)
2. O proxy adiciona um cabeçalho com a identidade autenticada do usuário (por exemplo, `x-forwarded-user: nick@example.com`)
3. O OpenClaw verifica se a requisição veio de um **IP de proxy confiável** (configurado em `gateway.trustedProxies`)
4. O OpenClaw extrai a identidade do usuário do cabeçalho configurado
5. Se tudo estiver correto, a requisição é autorizada

## Comportamento de pareamento da Control UI

Quando `gateway.auth.mode = "trusted-proxy"` está ativo e a requisição passa
pelas verificações de trusted-proxy, sessões WebSocket da Control UI podem se conectar sem
identidade de pareamento de dispositivo.

Implicações:

- O pareamento deixa de ser o principal mecanismo de controle de acesso à Control UI nesse modo.
- Sua política de autenticação do proxy reverso e `allowUsers` se tornam o controle de acesso efetivo.
- Mantenha o ingresso do gateway restrito apenas a IPs de proxy confiáveis (`gateway.trustedProxies` + firewall).

## Configuração

```json5
{
  gateway: {
    // A autenticação por trusted-proxy espera requisições de uma origem trusted proxy fora de loopback
    bind: "lan",

    // CRÍTICO: adicione aqui apenas o(s) IP(s) do seu proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Cabeçalho que contém a identidade autenticada do usuário (obrigatório)
        userHeader: "x-forwarded-user",

        // Opcional: cabeçalhos que DEVEM estar presentes (verificação do proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opcional: restringe a usuários específicos (vazio = permite todos)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Regra importante de runtime:

- A autenticação por trusted-proxy rejeita requisições com origem em loopback (`127.0.0.1`, `::1`, CIDRs de loopback).
- Proxies reversos no mesmo host via loopback **não** satisfazem a autenticação por trusted-proxy.
- Para configurações com proxy via loopback no mesmo host, use autenticação por token/senha, ou roteie por um endereço trusted proxy fora de loopback que o OpenClaw possa verificar.
- Implantações da Control UI fora de loopback ainda exigem `gateway.controlUi.allowedOrigins` explícito.

### Referência de configuração

| Campo                                       | Obrigatório | Descrição                                                                 |
| ------------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Sim         | Array de endereços IP de proxies confiáveis. Requisições de outros IPs são rejeitadas. |
| `gateway.auth.mode`                         | Sim         | Deve ser `"trusted-proxy"`                                                |
| `gateway.auth.trustedProxy.userHeader`      | Sim         | Nome do cabeçalho que contém a identidade autenticada do usuário          |
| `gateway.auth.trustedProxy.requiredHeaders` | Não         | Cabeçalhos adicionais que devem estar presentes para que a requisição seja confiável |
| `gateway.auth.trustedProxy.allowUsers`      | Não         | Allowlist de identidades de usuário. Vazio significa permitir todos os usuários autenticados. |

## Terminação TLS e HSTS

Use um único ponto de terminação TLS e aplique HSTS nele.

### Padrão recomendado: terminação TLS no proxy

Quando seu proxy reverso lida com HTTPS para `https://control.example.com`, defina
`Strict-Transport-Security` no proxy para esse domínio.

- É uma boa opção para implantações expostas à internet.
- Mantém certificado + política de reforço de segurança HTTP em um só lugar.
- O OpenClaw pode permanecer em HTTP de loopback atrás do proxy.

Exemplo de valor do cabeçalho:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Terminação TLS no Gateway

Se o próprio OpenClaw servir HTTPS diretamente (sem proxy com terminação TLS), defina:

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

`strictTransportSecurity` aceita um valor de cabeçalho em string, ou `false` para desativar explicitamente.

### Orientação para rollout

- Comece primeiro com um max age curto (por exemplo `max-age=300`) enquanto valida o tráfego.
- Aumente para valores de longa duração (por exemplo `max-age=31536000`) somente depois de ter alta confiança.
- Adicione `includeSubDomains` apenas se todos os subdomínios estiverem prontos para HTTPS.
- Use preload apenas se você atender intencionalmente aos requisitos de preload para todo o conjunto do seu domínio.
- Desenvolvimento local apenas com loopback não se beneficia de HSTS.

## Exemplos de configuração de proxy

### Pomerium

O Pomerium passa a identidade em `x-pomerium-claim-email` (ou outros cabeçalhos de claim) e um JWT em `x-pomerium-jwt-assertion`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP do Pomerium
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

Trecho de configuração do Pomerium:

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### Caddy com OAuth

O Caddy com o plugin `caddy-security` pode autenticar usuários e repassar cabeçalhos de identidade.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP do proxy Caddy/sidecar
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Trecho de Caddyfile:

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

O oauth2-proxy autentica usuários e repassa a identidade em `x-auth-request-email`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP do nginx/oauth2-proxy
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

Trecho de configuração nginx:

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Traefik com Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // IP do contêiner Traefik
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## Configuração mista com token

O OpenClaw rejeita configurações ambíguas em que `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`) e o modo `trusted-proxy` estão ativos ao mesmo tempo. Configurações mistas com token podem fazer com que requisições via loopback sejam autenticadas silenciosamente pelo caminho de autenticação errado.

Se você vir um erro `mixed_trusted_proxy_token` na inicialização:

- Remova o token compartilhado ao usar o modo trusted-proxy, ou
- Mude `gateway.auth.mode` para `"token"` se sua intenção for usar autenticação baseada em token.

A autenticação trusted-proxy via loopback também falha em modo fechado: chamadores no mesmo host precisam fornecer os cabeçalhos de identidade configurados por meio de um trusted proxy em vez de serem autenticados silenciosamente.

## Cabeçalho de escopos de operador

A autenticação trusted-proxy é um modo HTTP **com identidade**, então chamadores podem
opcionalmente declarar escopos de operador com `x-openclaw-scopes`.

Exemplos:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamento:

- Quando o cabeçalho está presente, o OpenClaw respeita o conjunto de escopos declarado.
- Quando o cabeçalho está presente, mas vazio, a requisição declara **nenhum** escopo de operador.
- Quando o cabeçalho está ausente, APIs HTTP normais com identidade recorrem ao conjunto padrão de escopos de operador.
- Rotas HTTP de plugin com **autenticação do gateway** são mais restritas por padrão: quando `x-openclaw-scopes` está ausente, o escopo de runtime delas recorre a `operator.write`.
- Requisições HTTP originadas no navegador ainda precisam passar por `gateway.controlUi.allowedOrigins` (ou modo deliberado de fallback pelo cabeçalho Host) mesmo depois de a autenticação trusted-proxy ser bem-sucedida.

Regra prática:

- Envie `x-openclaw-scopes` explicitamente quando quiser que uma requisição trusted-proxy
  seja mais restrita do que os padrões, ou quando uma rota de plugin com autenticação do gateway precisar
  de algo mais forte do que o escopo de gravação.

## Checklist de segurança

Antes de ativar a autenticação trusted-proxy, verifique:

- [ ] **O proxy é o único caminho**: a porta do Gateway está protegida por firewall de tudo, exceto do seu proxy
- [ ] **trustedProxies é mínimo**: apenas os IPs reais do seu proxy, não sub-redes inteiras
- [ ] **Sem origem de proxy em loopback**: a autenticação trusted-proxy falha em modo fechado para requisições com origem em loopback
- [ ] **O proxy remove cabeçalhos**: seu proxy sobrescreve (não acrescenta) cabeçalhos `x-forwarded-*` vindos dos clientes
- [ ] **Terminação TLS**: seu proxy lida com TLS; usuários se conectam por HTTPS
- [ ] **allowedOrigins é explícito**: Control UI fora de loopback usa `gateway.controlUi.allowedOrigins` explícito
- [ ] **allowUsers está definido** (recomendado): restrinja a usuários conhecidos em vez de permitir qualquer pessoa autenticada
- [ ] **Sem configuração mista com token**: não defina ao mesmo tempo `gateway.auth.token` e `gateway.auth.mode: "trusted-proxy"`

## Auditoria de segurança

`openclaw security audit` marcará a autenticação trusted-proxy com um achado de severidade **critical**. Isso é intencional — é um lembrete de que você está delegando a segurança à configuração do seu proxy.

A auditoria verifica:

- Aviso/lembrete base `gateway.trusted_proxy_auth` warning/critical
- Configuração ausente de `trustedProxies`
- Configuração ausente de `userHeader`
- `allowUsers` vazio (permite qualquer usuário autenticado)
- Política de origem do navegador curinga ou ausente em superfícies expostas da Control UI

## Solução de problemas

### "trusted_proxy_untrusted_source"

A requisição não veio de um IP em `gateway.trustedProxies`. Verifique:

- O IP do proxy está correto? (IPs de contêiner Docker podem mudar)
- Há um load balancer na frente do seu proxy?
- Use `docker inspect` ou `kubectl get pods -o wide` para encontrar os IPs reais

### "trusted_proxy_loopback_source"

O OpenClaw rejeitou uma requisição trusted-proxy com origem em loopback.

Verifique:

- O proxy está se conectando a partir de `127.0.0.1` / `::1`?
- Você está tentando usar autenticação trusted-proxy com um proxy reverso via loopback no mesmo host?

Correção:

- Use autenticação por token/senha em configurações com proxy via loopback no mesmo host, ou
- Roteie por um endereço trusted proxy fora de loopback e mantenha esse IP em `gateway.trustedProxies`.

### "trusted_proxy_user_missing"

O cabeçalho de usuário estava vazio ou ausente. Verifique:

- Seu proxy está configurado para repassar cabeçalhos de identidade?
- O nome do cabeçalho está correto? (não diferencia maiúsculas/minúsculas, mas a grafia importa)
- O usuário está realmente autenticado no proxy?

### "trusted*proxy_missing_header*\*"

Um cabeçalho obrigatório não estava presente. Verifique:

- A configuração do seu proxy para esses cabeçalhos específicos
- Se os cabeçalhos estão sendo removidos em algum ponto da cadeia

### "trusted_proxy_user_not_allowed"

O usuário está autenticado, mas não está em `allowUsers`. Adicione-o ou remova a allowlist.

### "trusted_proxy_origin_not_allowed"

A autenticação trusted-proxy foi bem-sucedida, mas o cabeçalho `Origin` do navegador não passou nas verificações de origem da Control UI.

Verifique:

- `gateway.controlUi.allowedOrigins` inclui a origem exata do navegador
- Você não está usando origens curingas, a menos que queira intencionalmente um comportamento de permitir tudo
- Se você usa intencionalmente o modo fallback por cabeçalho Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` está definido deliberadamente

### O WebSocket ainda falha

Verifique se seu proxy:

- Oferece suporte a upgrades de WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Passa os cabeçalhos de identidade em requisições de upgrade de WebSocket (não apenas em HTTP)
- Não tem um caminho de autenticação separado para conexões WebSocket

## Migração da autenticação por token

Se você estiver migrando de autenticação por token para trusted-proxy:

1. Configure seu proxy para autenticar usuários e repassar cabeçalhos
2. Teste a configuração do proxy de forma independente (curl com cabeçalhos)
3. Atualize a configuração do OpenClaw com autenticação trusted-proxy
4. Reinicie o Gateway
5. Teste conexões WebSocket a partir da Control UI
6. Execute `openclaw security audit` e revise os achados

## Relacionado

- [Security](/gateway/security) — guia completo de segurança
- [Configuration](/gateway/configuration) — referência de configuração
- [Remote Access](/gateway/remote) — outros padrões de acesso remoto
- [Tailscale](/gateway/tailscale) — alternativa mais simples para acesso somente por tailnet
