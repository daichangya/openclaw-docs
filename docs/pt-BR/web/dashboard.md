---
read_when:
    - Alterando modos de autenticação ou exposição do painel
summary: Acesso e autenticação do painel do Gateway (UI de Controle)
title: Painel
x-i18n:
    generated_at: "2026-04-05T12:56:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 316e082ae4759f710b457487351e30c53b34c7c2b4bf84ad7b091a50538af5cc
    source_path: web/dashboard.md
    workflow: 15
---

# Painel (UI de Controle)

O painel do Gateway é a UI de Controle no navegador servida em `/` por padrão
(substitua com `gateway.controlUi.basePath`).

Abertura rápida (Gateway local):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Referências principais:

- [UI de Controle](/web/control-ui) para uso e recursos da UI.
- [Tailscale](/pt-BR/gateway/tailscale) para automação de Serve/Funnel.
- [Superfícies web](/web) para modos de bind e observações de segurança.

A autenticação é aplicada no handshake do WebSocket por meio do caminho de auth
configurado do gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- Cabeçalhos de identidade de proxy confiável quando `gateway.auth.mode: "trusted-proxy"`

Consulte `gateway.auth` em [Configuração do Gateway](/pt-BR/gateway/configuration).

Observação de segurança: a UI de Controle é uma **superfície de administração** (chat, config, aprovações de exec).
Não a exponha publicamente. A UI mantém tokens de URL do painel em `sessionStorage`
para a sessão atual da aba do navegador e a URL do gateway selecionada, e os remove da URL após o carregamento.
Prefira localhost, Tailscale Serve ou um túnel SSH.

## Caminho rápido (recomendado)

- Após o onboarding, a CLI abre automaticamente o painel e imprime um link limpo (sem token).
- Reabra a qualquer momento: `openclaw dashboard` (copia o link, abre o navegador se possível, mostra uma dica de SSH se estiver sem interface gráfica).
- Se a UI solicitar autenticação por segredo compartilhado, cole o token ou a
  senha configurados nas configurações da UI de Controle.

## Noções básicas de auth (local vs remoto)

- **Localhost**: abra `http://127.0.0.1:18789/`.
- **Origem do token de segredo compartilhado**: `gateway.auth.token` (ou
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` pode passá-lo por fragmento da URL
  para bootstrap único, e a UI de Controle o mantém em `sessionStorage` para a
  sessão atual da aba do navegador e a URL do gateway selecionada em vez de `localStorage`.
- Se `gateway.auth.token` for gerenciado por SecretRef, `openclaw dashboard`
  imprime/copia/abre uma URL sem token por padrão. Isso evita expor
  tokens gerenciados externamente em logs do shell, histórico da área de transferência ou
  argumentos de abertura do navegador.
- Se `gateway.auth.token` estiver configurado como SecretRef e não for resolvido no seu
  shell atual, `openclaw dashboard` ainda imprime uma URL sem token mais
  orientações acionáveis de configuração de auth.
- **Senha de segredo compartilhado**: use a `gateway.auth.password` configurada (ou
  `OPENCLAW_GATEWAY_PASSWORD`). O painel não persiste senhas entre
  recarregamentos.
- **Modos com identidade**: Tailscale Serve pode satisfazer a
  auth da UI de Controle/WebSocket via cabeçalhos de identidade quando `gateway.auth.allowTailscale: true`, e um
  proxy reverso com reconhecimento de identidade fora de loopback pode satisfazer
  `gateway.auth.mode: "trusted-proxy"`. Nesses modos, o painel não
  precisa de um segredo compartilhado colado para o WebSocket.
- **Não localhost**: use Tailscale Serve, um bind fora de loopback com segredo compartilhado, um
  proxy reverso com reconhecimento de identidade fora de loopback com
  `gateway.auth.mode: "trusted-proxy"` ou um túnel SSH. As APIs HTTP ainda usam
  auth por segredo compartilhado, a menos que você execute intencionalmente
  `gateway.auth.mode: "none"` para ingress privado ou auth HTTP via trusted-proxy. Consulte
  [Superfícies web](/web).

<a id="if-you-see-unauthorized-1008"></a>

## Se você vir "unauthorized" / 1008

- Verifique se o gateway está acessível (local: `openclaw status`; remoto: túnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` e depois abra `http://127.0.0.1:18789/`).
- Para `AUTH_TOKEN_MISMATCH`, os clientes podem fazer uma nova tentativa confiável com um token de dispositivo em cache quando o gateway retorna dicas de nova tentativa. Essa nova tentativa com token em cache reutiliza os escopos aprovados em cache do token; chamadores com `deviceToken` explícito / `scopes` explícitos mantêm o conjunto de escopos solicitado. Se a auth ainda falhar após essa nova tentativa, resolva a divergência de token manualmente.
- Fora desse caminho de nova tentativa, a precedência de auth na conexão é token/senha compartilhados explícitos primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado e por fim token de bootstrap.
- No caminho assíncrono da UI de Controle com Tailscale Serve, tentativas com falha para o mesmo
  `{scope, ip}` são serializadas antes que o limitador de auth com falha as registre, então
  a segunda nova tentativa incorreta concorrente já pode mostrar `retry later`.
- Para etapas de reparo de divergência de token, siga a [Checklist de recuperação de divergência de token](/cli/devices#token-drift-recovery-checklist).
- Recupere ou forneça o segredo compartilhado a partir do host do gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Senha: resolva a `gateway.auth.password` configurada ou
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token gerenciado por SecretRef: resolva o provider de segredo externo ou exporte
    `OPENCLAW_GATEWAY_TOKEN` neste shell, depois execute `openclaw dashboard`
    novamente
  - Nenhum segredo compartilhado configurado: `openclaw doctor --generate-gateway-token`
- Nas configurações do painel, cole o token ou a senha no campo de auth
  e depois conecte.
