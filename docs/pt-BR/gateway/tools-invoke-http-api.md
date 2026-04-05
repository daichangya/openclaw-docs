---
read_when:
    - Chamando ferramentas sem executar um turno completo do agente
    - Criando automações que precisam de aplicação da política de ferramentas
summary: Invocar uma única ferramenta diretamente pelo endpoint HTTP do Gateway
title: API Tools Invoke
x-i18n:
    generated_at: "2026-04-05T12:43:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e924f257ba50b25dea0ec4c3f9eed4c8cac8a53ddef18215f87ac7de330a37fd
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Tools Invoke (HTTP)

O Gateway do OpenClaw expõe um endpoint HTTP simples para invocar diretamente uma única ferramenta. Ele está sempre ativado e usa a autenticação do Gateway mais a política de ferramentas. Assim como a superfície compatível com OpenAI em `/v1/*`, a autenticação bearer com segredo compartilhado é tratada como acesso confiável de operador para todo o gateway.

- `POST /tools/invoke`
- Mesma porta do Gateway (multiplexação WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

O tamanho máximo padrão do payload é 2 MB.

## Autenticação

Usa a configuração de autenticação do Gateway.

Caminhos comuns de autenticação HTTP:

- autenticação por segredo compartilhado (`gateway.auth.mode="token"` ou `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticação HTTP confiável com identidade (`gateway.auth.mode="trusted-proxy"`):
  encaminhe pela proxy com reconhecimento de identidade configurada e deixe que ela injete os
  cabeçalhos de identidade exigidos
- autenticação aberta em ingresso privado (`gateway.auth.mode="none"`):
  nenhum cabeçalho de autenticação é exigido

Observações:

- Quando `gateway.auth.mode="token"`, use `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, use `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, a solicitação HTTP deve vir de uma
  origem confiável não loopback configurada; proxies loopback no mesmo host não
  satisfazem esse modo.
- Se `gateway.auth.rateLimit` estiver configurado e ocorrerem muitas falhas de autenticação, o endpoint retorna `429` com `Retry-After`.

## Limite de segurança (importante)

Trate este endpoint como uma superfície de **acesso completo de operador** para a instância do gateway.

- A autenticação bearer HTTP aqui não é um modelo estreito de escopo por usuário.
- Um token/senha válido do Gateway para este endpoint deve ser tratado como credencial de proprietário/operador.
- Para modos de autenticação com segredo compartilhado (`token` e `password`), o endpoint restaura os padrões normais completos de operador mesmo que o chamador envie um cabeçalho `x-openclaw-scopes` mais restrito.
- A autenticação com segredo compartilhado também trata invocações diretas de ferramentas neste endpoint como turnos de remetente proprietário.
- Modos HTTP confiáveis com identidade (por exemplo, autenticação por trusted proxy ou `gateway.auth.mode="none"` em um ingresso privado) respeitam `x-openclaw-scopes` quando presente e, caso contrário, usam como fallback o conjunto normal de escopos padrão de operador.
- Mantenha este endpoint apenas em loopback/tailnet/ingresso privado; não o exponha diretamente à internet pública.

Matriz de autenticação:

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - comprova posse do segredo compartilhado de operador do gateway
  - ignora `x-openclaw-scopes` mais restritos
  - restaura o conjunto completo padrão de escopos de operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata invocações diretas de ferramentas neste endpoint como turnos de remetente proprietário
- modos HTTP confiáveis com identidade (por exemplo autenticação por trusted proxy, ou `gateway.auth.mode="none"` em ingresso privado)
  - autenticam alguma identidade externa confiável ou limite de implantação
  - respeitam `x-openclaw-scopes` quando o cabeçalho está presente
  - usam como fallback o conjunto normal padrão de escopos de operador quando o cabeçalho está ausente
  - só perdem semântica de proprietário quando o chamador restringe explicitamente os escopos e omite `operator.admin`

## Corpo da solicitação

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Campos:

- `tool` (string, obrigatório): nome da ferramenta a invocar.
- `action` (string, opcional): mapeado para args se o schema da ferramenta oferecer suporte a `action` e o payload de args o tiver omitido.
- `args` (objeto, opcional): argumentos específicos da ferramenta.
- `sessionKey` (string, opcional): chave da sessão de destino. Se omitido ou `"main"`, o Gateway usa a chave principal de sessão configurada (respeita `session.mainKey` e o agente padrão, ou `global` no escopo global).
- `dryRun` (boolean, opcional): reservado para uso futuro; atualmente ignorado.

## Comportamento de política + roteamento

A disponibilidade da ferramenta é filtrada pela mesma cadeia de política usada pelos agentes do Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- políticas de grupo (se a chave da sessão mapear para um grupo ou canal)
- política de subagente (ao invocar com uma chave de sessão de subagente)

Se uma ferramenta não for permitida pela política, o endpoint retorna **404**.

Observações importantes sobre limites:

- Aprovações de exec são guard-rails de operador, não um limite de autorização separado para este endpoint HTTP. Se uma ferramenta for alcançável aqui por autenticação do Gateway + política de ferramentas, `/tools/invoke` não adiciona um prompt extra de aprovação por chamada.
- Não compartilhe credenciais bearer do Gateway com chamadores não confiáveis. Se você precisar de separação entre limites de confiança, execute gateways separados (e idealmente usuários/hosts de SO separados).

O HTTP do Gateway também aplica por padrão uma deny list rígida (mesmo que a política da sessão permita a ferramenta):

- `exec` — execução direta de comandos (superfície RCE)
- `spawn` — criação arbitrária de processos filhos (superfície RCE)
- `shell` — execução de comandos de shell (superfície RCE)
- `fs_write` — mutação arbitrária de arquivos no host
- `fs_delete` — exclusão arbitrária de arquivos no host
- `fs_move` — mover/renomear arquivos arbitrariamente no host
- `apply_patch` — aplicação de patch pode reescrever arquivos arbitrários
- `sessions_spawn` — orquestração de sessão; iniciar agentes remotamente é RCE
- `sessions_send` — injeção de mensagem entre sessões
- `cron` — plano de controle de automação persistente
- `gateway` — plano de controle do gateway; evita reconfiguração via HTTP
- `nodes` — relay de comandos de node pode alcançar `system.run` em hosts pareados
- `whatsapp_login` — configuração interativa que exige leitura de QR code no terminal; trava em HTTP

Você pode personalizar essa deny list via `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

Para ajudar políticas de grupo a resolver o contexto, você pode opcionalmente definir:

- `x-openclaw-message-channel: <channel>` (exemplo: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (quando existem múltiplas contas)

## Respostas

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (solicitação inválida ou erro de entrada da ferramenta)
- `401` → não autorizado
- `429` → autenticação limitada por taxa (`Retry-After` definido)
- `404` → ferramenta não disponível (não encontrada ou não permitida por allowlist)
- `405` → método não permitido
- `500` → `{ ok: false, error: { type, message } }` (erro inesperado de execução da ferramenta; mensagem higienizada)

## Exemplo

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```
