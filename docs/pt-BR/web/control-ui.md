---
read_when:
    - Você quer operar o Gateway a partir de um navegador
    - Você quer acesso via Tailnet sem túneis SSH
summary: Interface de controle baseada em navegador para o Gateway (chat, nós, configuração)
title: Interface de controle
x-i18n:
    generated_at: "2026-04-05T12:57:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1568680a07907343352dbb3a2e6a1b896826404a7d8baba62512f03eac28e3d7
    source_path: web/control-ui.md
    workflow: 15
---

# Interface de controle (navegador)

A Interface de controle é um pequeno aplicativo de página única **Vite + Lit** servido pelo Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo, `/openclaw`)

Ela se comunica **diretamente com o WebSocket do Gateway** na mesma porta.

## Abertura rápida (local)

Se o Gateway estiver em execução no mesmo computador, abra:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Se a página não carregar, inicie primeiro o Gateway: `openclaw gateway`.

A autenticação é fornecida durante o handshake do WebSocket por meio de:

- `connect.params.auth.token`
- `connect.params.auth.password`
- cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- cabeçalhos de identidade de proxy confiável quando `gateway.auth.mode: "trusted-proxy"`

O painel de configurações do dashboard mantém um token para a sessão da guia atual do navegador
e a URL do gateway selecionada; senhas não são persistidas. O onboarding geralmente
gera um token do gateway para autenticação por segredo compartilhado na primeira conexão, mas a
autenticação por senha também funciona quando `gateway.auth.mode` é `"password"`.

## Pareamento de dispositivo (primeira conexão)

Quando você se conecta à Interface de controle a partir de um novo navegador ou dispositivo, o Gateway
exige uma **aprovação de pareamento única** — mesmo que você esteja na mesma Tailnet
com `gateway.auth.allowTailscale: true`. Esta é uma medida de segurança para impedir
acesso não autorizado.

**O que você verá:** "disconnected (1008): pairing required"

**Para aprovar o dispositivo:**

```bash
# Listar solicitações pendentes
openclaw devices list

# Aprovar por ID da solicitação
openclaw devices approve <requestId>
```

Se o navegador tentar novamente o pareamento com detalhes de autenticação alterados (papel/escopos/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será
criado. Execute `openclaw devices list` novamente antes da aprovação.

Depois de aprovado, o dispositivo será lembrado e não exigirá nova aprovação, a menos que
você o revogue com `openclaw devices revoke --device <id> --role <role>`. Consulte
[Devices CLI](/cli/devices) para rotação e revogação de tokens.

**Observações:**

- Conexões diretas locais do navegador por local loopback (`127.0.0.1` / `localhost`) são
  aprovadas automaticamente.
- Conexões de navegador por Tailnet e LAN ainda exigem aprovação explícita, mesmo quando
  se originam da mesma máquina.
- Cada perfil de navegador gera um ID de dispositivo único, então trocar de navegador ou
  limpar os dados do navegador exigirá novo pareamento.

## Suporte a idiomas

A Interface de controle pode se localizar automaticamente no primeiro carregamento com base no idioma do seu navegador, e você pode substituí-lo depois no seletor de idiomas no cartão de Acesso.

- Localidades compatíveis: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`
- Traduções que não estão em inglês são carregadas sob demanda no navegador.
- A localidade selecionada é salva no armazenamento do navegador e reutilizada em visitas futuras.
- Chaves de tradução ausentes recorrem ao inglês.

## O que ela pode fazer (hoje)

- Conversar com o modelo via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Transmitir chamadas de ferramentas + cartões de saída de ferramentas ao vivo no Chat (eventos do agente)
- Canais: status de canais integrados e de plugins empacotados/externos, login por QR e configuração por canal (`channels.status`, `web.login.*`, `config.patch`)
- Instâncias: lista de presença + atualização (`system-presence`)
- Sessões: lista + substituições por sessão para modelo/thinking/fast/verbose/reasoning (`sessions.list`, `sessions.patch`)
- Jobs cron: listar/adicionar/editar/executar/habilitar/desabilitar + histórico de execução (`cron.*`)
- Skills: status, habilitar/desabilitar, instalar, atualizações de chave de API (`skills.*`)
- Nós: listar + limites (`node.list`)
- Aprovações de exec: editar listas de permissões do gateway ou nó + política de solicitação para `exec host=gateway/node` (`exec.approvals.*`)
- Configuração: visualizar/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configuração: aplicar + reiniciar com validação (`config.apply`) e ativar a última sessão ativa
- Gravações de configuração incluem uma proteção por hash-base para evitar sobrescrever edições simultâneas
- Gravações de configuração (`config.set`/`config.apply`/`config.patch`) também fazem uma verificação preliminar da resolução ativa de SecretRef para refs na carga de configuração enviada; refs ativos não resolvidos na carga enviada são rejeitados antes da gravação
- Esquema de configuração + renderização de formulário (`config.schema` / `config.schema.lookup`,
  incluindo `title` / `description` do campo, dicas de UI correspondentes, resumos imediatos de filhos,
  metadados de documentação em nós de objeto curinga/aninhado/array/composição,
  além de esquemas de plugins + canais quando disponíveis); o editor JSON bruto está
  disponível apenas quando o snapshot tem um round-trip bruto seguro
- Se um snapshot não puder fazer round-trip de texto bruto com segurança, a Interface de controle força o modo Formulário e desabilita o modo Bruto para esse snapshot
- Valores de objeto SecretRef estruturados são renderizados como somente leitura em entradas de texto de formulário para evitar corrupção acidental de objeto para string
- Depuração: snapshots de status/saúde/modelos + log de eventos + chamadas RPC manuais (`status`, `health`, `models.list`)
- Logs: tail ao vivo dos logs de arquivo do gateway com filtro/exportação (`logs.tail`)
- Atualização: executar uma atualização de pacote/git + reinício (`update.run`) com um relatório de reinício

Observações do painel de jobs cron:

- Para jobs isolados, a entrega usa por padrão resumo de anúncio. Você pode alternar para nenhum se quiser execuções somente internas.
- Os campos de canal/destino aparecem quando anúncio é selecionado.
- O modo webhook usa `delivery.mode = "webhook"` com `delivery.to` definido como uma URL de webhook HTTP(S) válida.
- Para jobs de sessão principal, os modos de entrega webhook e none estão disponíveis.
- Os controles avançados de edição incluem excluir após execução, limpar substituição de agente, opções exatas/escalonadas de cron,
  substituições de modelo/thinking de agente e alternâncias de entrega em regime de melhor esforço.
- A validação do formulário é inline com erros no nível do campo; valores inválidos desabilitam o botão de salvar até serem corrigidos.
- Defina `cron.webhookToken` para enviar um token bearer dedicado; se omitido, o webhook é enviado sem cabeçalho de autenticação.
- Fallback obsoleto: jobs legados armazenados com `notify: true` ainda podem usar `cron.webhook` até serem migrados.

## Comportamento do chat

- `chat.send` é **não bloqueante**: ele confirma imediatamente com `{ runId, status: "started" }` e a resposta é transmitida por eventos `chat`.
- Reenviar com a mesma `idempotencyKey` retorna `{ status: "in_flight" }` durante a execução e `{ status: "ok" }` após a conclusão.
- As respostas de `chat.history` são limitadas em tamanho para segurança da UI. Quando entradas da transcrição são grandes demais, o Gateway pode truncar campos de texto longos, omitir blocos pesados de metadados e substituir mensagens superdimensionadas por um placeholder (`[chat.history omitted: message too large]`).
- `chat.history` também remove tags de diretiva inline apenas de exibição do texto visível do assistente (por exemplo `[[reply_to_*]]` e `[[audio_as_voice]]`), cargas XML de chamada de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta), e tokens de controle do modelo ASCII/largura total vazados, e omite entradas de assistente cujo texto visível inteiro seja apenas o token silencioso exato `NO_REPLY` / `no_reply`.
- `chat.inject` acrescenta uma observação de assistente à transcrição da sessão e transmite um evento `chat` para atualizações somente de UI (sem execução de agente, sem entrega por canal).
- Os seletores de modelo e thinking do cabeçalho do chat aplicam patch na sessão ativa imediatamente por meio de `sessions.patch`; são substituições persistentes da sessão, não opções de envio para apenas um turno.
- Interrupção:
  - Clique em **Stop** (chama `chat.abort`)
  - Digite `/stop` (ou frases autônomas de interrupção como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fora de banda
  - `chat.abort` aceita `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas dessa sessão
- Retenção parcial em abortos:
  - Quando uma execução é abortada, texto parcial do assistente ainda pode ser exibido na UI
  - O Gateway persiste texto parcial abortado do assistente no histórico da transcrição quando existe saída em buffer
  - Entradas persistidas incluem metadados de aborto para que consumidores da transcrição possam distinguir parciais de abortos da saída normal de conclusão

## Acesso Tailnet (recomendado)

### Tailscale Serve integrado (preferido)

Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer o proxy com HTTPS:

```bash
openclaw gateway --tailscale serve
```

Abra:

- `https://<magicdns>/` (ou o `gateway.controlUi.basePath` configurado)

Por padrão, solicitações Serve da Interface de controle/WebSocket podem se autenticar por cabeçalhos de identidade do Tailscale
(`tailscale-user-login`) quando `gateway.auth.allowTailscale` for `true`. O OpenClaw
verifica a identidade resolvendo o endereço `x-forwarded-for` com
`tailscale whois` e comparando-o com o cabeçalho, e aceita isso apenas quando a
solicitação atinge o loopback com os cabeçalhos `x-forwarded-*` do Tailscale. Defina
`gateway.auth.allowTailscale: false` se quiser exigir credenciais explícitas de segredo compartilhado
mesmo para tráfego Serve. Depois use `gateway.auth.mode: "token"` ou
`"password"`.
Para esse caminho assíncrono de identidade do Serve, tentativas de autenticação com falha do mesmo IP de cliente
e escopo de autenticação são serializadas antes das gravações de limite de taxa. Repetições ruins concorrentes
do mesmo navegador podem, portanto, mostrar `retry later` na segunda solicitação
em vez de dois desencontros simples concorrendo em paralelo.
A autenticação Serve sem token assume que o host do gateway é confiável. Se código local não confiável
puder ser executado nesse host, exija autenticação por token/senha.

### Vincular à tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Depois abra:

- `http://<tailscale-ip>:18789/` (ou o `gateway.controlUi.basePath` configurado)

Cole o segredo compartilhado correspondente nas configurações da UI (enviado como
`connect.params.auth.token` ou `connect.params.auth.password`).

## HTTP inseguro

Se você abrir o dashboard em HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`),
o navegador será executado em um **contexto não seguro** e bloqueará o WebCrypto. Por padrão,
o OpenClaw **bloqueia** conexões da Interface de controle sem identidade de dispositivo.

Exceções documentadas:

- compatibilidade de HTTP inseguro somente para localhost com `gateway.controlUi.allowInsecureAuth=true`
- autenticação bem-sucedida da Interface de controle do operador por meio de `gateway.auth.mode: "trusted-proxy"`
- uso emergencial de `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correção recomendada:** use HTTPS (Tailscale Serve) ou abra a UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (no host do gateway)

**Comportamento da alternância de autenticação insegura:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` é apenas uma alternância local de compatibilidade:

- Permite que sessões da Interface de controle em localhost prossigam sem identidade de dispositivo em
  contextos HTTP não seguros.
- Não ignora verificações de pareamento.
- Não flexibiliza requisitos remotos (não localhost) de identidade de dispositivo.

**Somente uso emergencial:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` desabilita verificações de identidade de dispositivo da Interface de controle e é um
rebaixamento severo de segurança. Reverta rapidamente após o uso emergencial.

Observação sobre proxy confiável:

- autenticação bem-sucedida de proxy confiável pode permitir sessões **de operador** da Interface de controle sem
  identidade de dispositivo
- isso **não** se estende a sessões da Interface de controle com papel de nó
- proxies reversos em loopback no mesmo host ainda não satisfazem a autenticação de proxy confiável; consulte
  [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)

Consulte [Tailscale](/pt-BR/gateway/tailscale) para orientação de configuração de HTTPS.

## Como compilar a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Compile-os com:

```bash
pnpm ui:build # instala automaticamente as dependências da UI na primeira execução
```

Base absoluta opcional (quando você quiser URLs de ativos fixas):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desenvolvimento local (servidor de desenvolvimento separado):

```bash
pnpm ui:dev # instala automaticamente as dependências da UI na primeira execução
```

Depois aponte a UI para a URL WS do seu Gateway (por exemplo, `ws://127.0.0.1:18789`).

## Depuração/testes: servidor de desenvolvimento + Gateway remoto

A Interface de controle consiste em arquivos estáticos; o destino do WebSocket é configurável e pode ser
diferente da origem HTTP. Isso é útil quando você quer o servidor de desenvolvimento do Vite
localmente, mas o Gateway é executado em outro lugar.

1. Inicie o servidor de desenvolvimento da UI: `pnpm ui:dev`
2. Abra uma URL como:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Autenticação única opcional (se necessário):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Observações:

- `gatewayUrl` é armazenado em `localStorage` após o carregamento e removido da URL.
- `token` deve ser passado pelo fragmento da URL (`#token=...`) sempre que possível. Fragmentos não são enviados ao servidor, o que evita vazamento em logs de solicitação e Referer. Parâmetros legados de consulta `?token=` ainda são importados uma vez por compatibilidade, mas apenas como fallback, e são removidos imediatamente após o bootstrap.
- `password` é mantido apenas em memória.
- Quando `gatewayUrl` está definido, a UI não recorre a credenciais de configuração ou de ambiente.
  Forneça `token` (ou `password`) explicitamente. A ausência de credenciais explícitas é um erro.
- Use `wss://` quando o Gateway estiver atrás de TLS (Tailscale Serve, proxy HTTPS etc.).
- `gatewayUrl` é aceito apenas em uma janela de nível superior (não incorporada) para evitar clickjacking.
- Implantações não loopback da Interface de controle devem definir `gateway.controlUi.allowedOrigins`
  explicitamente (origens completas). Isso inclui configurações remotas de desenvolvimento.
- Não use `gateway.controlUi.allowedOrigins: ["*"]` exceto em testes locais estritamente controlados.
  Isso significa permitir qualquer origem de navegador, não “corresponder a qualquer host que eu esteja
  usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita
  o modo de fallback de origem por cabeçalho Host, mas é um modo de segurança perigoso.

Exemplo:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Detalhes de configuração de acesso remoto: [Acesso remoto](/pt-BR/gateway/remote).

## Relacionado

- [Dashboard](/web/dashboard) — dashboard do gateway
- [WebChat](/web/webchat) — interface de chat baseada em navegador
- [TUI](/web/tui) — interface de usuário de terminal
- [Verificações de integridade](/pt-BR/gateway/health) — monitoramento de integridade do gateway
