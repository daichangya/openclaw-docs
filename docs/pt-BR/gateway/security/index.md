---
read_when:
    - Adicionando recursos que ampliam o acesso ou a automação
summary: Considerações de segurança e modelo de ameaças para executar um Gateway de IA com acesso ao shell
title: Segurança
x-i18n:
    generated_at: "2026-04-21T05:37:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa10d97773a78c43d238aed495e00d83a3e28a50939cbe8941add05874846a86
    source_path: gateway/security/index.md
    workflow: 15
---

# Segurança

<Warning>
**Modelo de confiança de assistente pessoal:** esta orientação pressupõe um limite de operador confiável por Gateway (modelo de assistente pessoal/usuário único).
O OpenClaw **não** é um limite de segurança multi-inquilino hostil para vários usuários adversariais compartilhando um agente/Gateway.
Se você precisar de operação com confiança mista ou usuários adversariais, separe os limites de confiança (Gateway + credenciais separados e, idealmente, usuários/hosts do SO separados).
</Warning>

**Nesta página:** [Modelo de confiança](#scope-first-personal-assistant-security-model) | [Auditoria rápida](#quick-check-openclaw-security-audit) | [Baseline reforçado](#hardened-baseline-in-60-seconds) | [Modelo de acesso por DM](#dm-access-model-pairing-allowlist-open-disabled) | [Reforço de configuração](#configuration-hardening-examples) | [Resposta a incidentes](#incident-response)

## Primeiro o escopo: modelo de segurança de assistente pessoal

A orientação de segurança do OpenClaw pressupõe uma implantação de **assistente pessoal**: um limite de operador confiável, potencialmente com muitos agentes.

- Postura de segurança suportada: um usuário/limite de confiança por Gateway (preferencialmente um usuário do SO/host/VPS por limite).
- Limite de segurança não suportado: um Gateway/agente compartilhado usado por usuários mutuamente não confiáveis ou adversariais.
- Se for necessário isolamento entre usuários adversariais, separe por limite de confiança (Gateway + credenciais separados e, idealmente, usuários/hosts do SO separados).
- Se vários usuários não confiáveis puderem enviar mensagens a um agente com ferramentas habilitadas, trate-os como compartilhando a mesma autoridade delegada de ferramentas para esse agente.

Esta página explica o reforço **dentro desse modelo**. Ela não afirma isolamento hostil multi-inquilino em um único Gateway compartilhado.

## Verificação rápida: `openclaw security audit`

Veja também: [Verificação formal (modelos de segurança)](/pt-BR/security/formal-verification)

Execute isso regularmente (especialmente após alterar a configuração ou expor superfícies de rede):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` permanece intencionalmente limitado: ele troca políticas comuns de grupos abertos por allowlists, restaura `logging.redactSensitive: "tools"`, endurece permissões de estado/configuração/arquivos incluídos e usa redefinições de ACL do Windows em vez de `chmod` POSIX quando executado no Windows.

Ele sinaliza armadilhas comuns (exposição de autenticação do Gateway, exposição de controle do navegador, allowlists elevadas, permissões de sistema de arquivos, aprovações de exec permissivas e exposição de ferramentas em canais abertos).

O OpenClaw é ao mesmo tempo um produto e um experimento: você está conectando o comportamento de modelos de fronteira a superfícies reais de mensagens e ferramentas reais. **Não existe uma configuração “perfeitamente segura”.** O objetivo é ser deliberado sobre:

- quem pode falar com seu bot
- onde o bot pode agir
- no que o bot pode tocar

Comece com o menor acesso que ainda funcione e depois amplie à medida que ganhar confiança.

### Implantação e confiança no host

O OpenClaw pressupõe que o host e o limite de configuração são confiáveis:

- Se alguém puder modificar o estado/configuração do host do Gateway (`~/.openclaw`, incluindo `openclaw.json`), trate essa pessoa como um operador confiável.
- Executar um Gateway para vários operadores mutuamente não confiáveis/adversariais **não é uma configuração recomendada**.
- Para equipes com confiança mista, separe os limites de confiança com Gateways separados (ou no mínimo usuários/hosts do SO separados).
- Padrão recomendado: um usuário por máquina/host (ou VPS), um Gateway para esse usuário e um ou mais agentes nesse Gateway.
- Dentro de uma instância de Gateway, o acesso autenticado do operador é uma função confiável de plano de controle, não uma função de inquilino por usuário.
- Identificadores de sessão (`sessionKey`, IDs de sessão, rótulos) são seletores de roteamento, não tokens de autorização.
- Se várias pessoas puderem enviar mensagens a um agente com ferramentas habilitadas, cada uma delas poderá conduzir esse mesmo conjunto de permissões. O isolamento de sessão/memória por usuário ajuda na privacidade, mas não transforma um agente compartilhado em autorização por usuário no host.

### Workspace compartilhado do Slack: risco real

Se “todos no Slack podem enviar mensagens ao bot”, o risco central é autoridade delegada de ferramentas:

- qualquer remetente permitido pode induzir chamadas de ferramentas (`exec`, navegador, ferramentas de rede/arquivos) dentro da política do agente;
- injeção de prompt/conteúdo de um remetente pode causar ações que afetam estado, dispositivos ou saídas compartilhados;
- se um agente compartilhado tiver credenciais/arquivos sensíveis, qualquer remetente permitido pode potencialmente conduzir exfiltração por uso de ferramentas.

Use agentes/Gateways separados com ferramentas mínimas para fluxos de trabalho em equipe; mantenha agentes com dados pessoais privados.

### Agente compartilhado da empresa: padrão aceitável

Isso é aceitável quando todos que usam esse agente estão no mesmo limite de confiança (por exemplo, uma equipe da empresa) e o agente tem escopo estritamente corporativo.

- execute-o em uma máquina/VM/container dedicado;
- use um usuário do SO + navegador/perfil/contas dedicados para esse runtime;
- não conecte esse runtime a contas pessoais da Apple/Google ou perfis pessoais de gerenciador de senhas/navegador.

Se você misturar identidades pessoais e corporativas no mesmo runtime, você colapsa a separação e aumenta o risco de exposição de dados pessoais.

## Conceito de confiança de Gateway e node

Trate Gateway e node como um único domínio de confiança de operador, com papéis diferentes:

- **Gateway** é o plano de controle e a superfície de política (`gateway.auth`, política de ferramentas, roteamento).
- **Node** é a superfície de execução remota pareada a esse Gateway (comandos, ações em dispositivo, capacidades locais ao host).
- Um chamador autenticado no Gateway é confiável no escopo do Gateway. Após o pareamento, ações do node são ações de operador confiável nesse node.
- `sessionKey` é seleção de roteamento/contexto, não autenticação por usuário.
- Aprovações de exec (allowlist + ask) são proteções para a intenção do operador, não isolamento hostil multi-inquilino.
- O padrão do produto OpenClaw para configurações confiáveis com operador único é que `exec` no host em `gateway`/`node` é permitido sem prompts de aprovação (`security="full"`, `ask="off"` a menos que você aperte isso). Esse padrão é uma UX intencional, não uma vulnerabilidade por si só.
- Aprovações de exec vinculam contexto exato da solicitação e, na melhor tentativa, operandos locais diretos de arquivo; elas não modelam semanticamente todos os caminhos de carregamento de runtime/interpretador. Use sandboxing e isolamento de host para limites fortes.

Se você precisar de isolamento contra usuários hostis, separe os limites de confiança por usuário do SO/host e execute Gateways separados.

## Matriz de limites de confiança

Use isso como modelo rápido ao fazer triagem de risco:

| Limite ou controle                                        | O que significa                                  | Interpretação equivocada comum                                                   |
| --------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| `gateway.auth` (token/senha/proxy confiável/autenticação de dispositivo) | Autentica chamadores para APIs do Gateway        | “Precisa de assinaturas por mensagem em cada frame para ser seguro”              |
| `sessionKey`                                              | Chave de roteamento para seleção de contexto/sessão | “A chave de sessão é um limite de autenticação do usuário”                    |
| Proteções de prompt/conteúdo                              | Reduzem o risco de abuso do modelo               | “Injeção de prompt por si só prova bypass de autenticação”                       |
| `canvas.eval` / avaliação no navegador                    | Capacidade intencional do operador quando habilitada | “Qualquer primitiva de eval JS é automaticamente uma vuln nesse modelo de confiança” |
| Shell local `!` da TUI                                    | Execução local explicitamente acionada pelo operador | “Comando de conveniência de shell local é injeção remota”                    |
| Pareamento de node e comandos do node                     | Execução remota em nível de operador em dispositivos pareados | “Controle remoto de dispositivo deve ser tratado como acesso de usuário não confiável por padrão” |

## Não são vulnerabilidades por design

Esses padrões são frequentemente relatados e normalmente são encerrados sem ação, a menos que um bypass real de limite seja demonstrado:

- Cadeias baseadas apenas em injeção de prompt sem bypass de política/autenticação/sandbox.
- Alegações que presumem operação hostil multi-inquilino em um único host/configuração compartilhado.
- Alegações que classificam acesso normal de leitura do operador (por exemplo `sessions.list`/`sessions.preview`/`chat.history`) como IDOR em uma configuração de Gateway compartilhado.
- Achados de implantação somente localhost (por exemplo HSTS em Gateway apenas de loopback).
- Achados sobre assinatura de Webhook de entrada do Discord para caminhos de entrada que não existem neste repositório.
- Relatórios que tratam metadados de pareamento do node como uma segunda camada oculta de aprovação por comando para `system.run`, quando o limite real de execução ainda é a política global de comandos de node do Gateway mais as aprovações de exec do próprio node.
- Achados de “falta de autorização por usuário” que tratam `sessionKey` como token de autenticação.

## Checklist prévio para pesquisadores

Antes de abrir um GHSA, verifique tudo isso:

1. A reprodução ainda funciona no `main` mais recente ou na versão mais recente.
2. O relatório inclui caminho exato do código (`file`, função, intervalo de linhas) e versão/commit testado.
3. O impacto cruza um limite de confiança documentado (não apenas injeção de prompt).
4. A alegação não está listada em [Fora de escopo](https://github.com/openclaw/openclaw/blob/main/SECURITY.md#out-of-scope).
5. Advisories existentes foram verificados quanto a duplicatas (reutilize o GHSA canônico quando aplicável).
6. As premissas de implantação estão explícitas (loopback/local vs exposto, operadores confiáveis vs não confiáveis).

## Baseline reforçado em 60 segundos

Use primeiro esse baseline e depois reabilite seletivamente ferramentas por agente confiável:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

Isso mantém o Gateway somente local, isola DMs e desabilita ferramentas de plano de controle/runtime por padrão.

## Regra rápida para caixa de entrada compartilhada

Se mais de uma pessoa puder enviar DM ao seu bot:

- Defina `session.dmScope: "per-channel-peer"` (ou `"per-account-channel-peer"` para canais com múltiplas contas).
- Mantenha `dmPolicy: "pairing"` ou allowlists estritas.
- Nunca combine DMs compartilhadas com acesso amplo a ferramentas.
- Isso reforça caixas de entrada cooperativas/compartilhadas, mas não foi projetado como isolamento hostil entre co-inquilinos quando usuários compartilham acesso de escrita no host/configuração.

## Modelo de visibilidade de contexto

O OpenClaw separa dois conceitos:

- **Autorização de acionamento**: quem pode acionar o agente (`dmPolicy`, `groupPolicy`, allowlists, portas de menção).
- **Visibilidade de contexto**: qual contexto suplementar é injetado na entrada do modelo (corpo de resposta, texto citado, histórico de thread, metadados encaminhados).

Allowlists controlam acionamentos e autorização de comandos. A configuração `contextVisibility` controla como o contexto suplementar (respostas citadas, raízes de thread, histórico buscado) é filtrado:

- `contextVisibility: "all"` (padrão) mantém o contexto suplementar como recebido.
- `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes permitidos pelas verificações ativas de allowlist.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, mas ainda mantém uma resposta citada explícita.

Defina `contextVisibility` por canal ou por sala/conversa. Veja [Chats em grupo](/pt-BR/channels/groups#context-visibility-and-allowlists) para detalhes de configuração.

Orientação para triagem de advisory:

- Alegações que mostram apenas “o modelo pode ver texto citado ou histórico de remetentes fora da allowlist” são achados de endurecimento tratáveis com `contextVisibility`, não bypass de autenticação ou sandbox por si só.
- Para ter impacto de segurança, os relatórios ainda precisam demonstrar um bypass de limite de confiança (autenticação, política, sandbox, aprovação ou outro limite documentado).

## O que a auditoria verifica (visão geral)

- **Acesso de entrada** (políticas de DM, políticas de grupo, allowlists): estranhos podem acionar o bot?
- **Raio de impacto das ferramentas** (ferramentas elevadas + salas abertas): a injeção de prompt poderia se transformar em ações de shell/arquivo/rede?
- **Desvio de aprovação de exec** (`security=full`, `autoAllowSkills`, allowlists de interpretador sem `strictInlineEval`): as proteções de exec no host ainda estão fazendo o que você pensa?
  - `security="full"` é um aviso amplo de postura, não prova de um bug. É o padrão escolhido para configurações confiáveis de assistente pessoal; aperte isso apenas quando seu modelo de ameaças exigir aprovações ou proteções de allowlist.
- **Exposição de rede** (bind/auth do Gateway, Tailscale Serve/Funnel, tokens de autenticação fracos/curtos).
- **Exposição de controle do navegador** (nodes remotos, portas de relay, endpoints CDP remotos).
- **Higiene do disco local** (permissões, symlinks, inclusões de configuração, caminhos de “pastas sincronizadas”).
- **Plugins** (extensions existem sem uma allowlist explícita).
- **Desvio/má configuração de política** (configurações de sandbox docker definidas, mas modo sandbox desligado; padrões ineficazes em `gateway.nodes.denyCommands` porque a correspondência é exata apenas no nome do comando — por exemplo `system.run` — e não inspeciona o texto do shell; entradas perigosas em `gateway.nodes.allowCommands`; `tools.profile="minimal"` global sobrescrito por perfis por agente; ferramentas de plugin extension acessíveis sob política de ferramentas permissiva).
- **Desvio de expectativa de runtime** (por exemplo assumir que exec implícito ainda significa `sandbox` quando `tools.exec.host` agora usa `auto` por padrão, ou definir explicitamente `tools.exec.host="sandbox"` enquanto o modo sandbox está desligado).
- **Higiene de modelo** (avisa quando os modelos configurados parecem legados; não é um bloqueio rígido).

Se você executar `--deep`, o OpenClaw também tentará uma sondagem ao vivo do Gateway na melhor tentativa.

## Mapa de armazenamento de credenciais

Use isto ao auditar acesso ou decidir o que fazer backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token de bot do Telegram**: config/env ou `channels.telegram.tokenFile` (apenas arquivo regular; symlinks rejeitados)
- **Token de bot do Discord**: config/env ou SecretRef (provedores env/file/exec)
- **Tokens do Slack**: config/env (`channels.slack.*`)
- **Allowlists de pareamento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (conta padrão)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (contas não padrão)
- **Perfis de autenticação de modelo**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload de secrets com arquivo de apoio (opcional)**: `~/.openclaw/secrets.json`
- **Importação legada de OAuth**: `~/.openclaw/credentials/oauth.json`

## Checklist de auditoria de segurança

Quando a auditoria imprimir achados, trate esta como a ordem de prioridade:

1. **Qualquer coisa “open” + ferramentas habilitadas**: primeiro restrinja DMs/grupos (pareamento/allowlists), depois aperte a política de ferramentas/sandboxing.
2. **Exposição de rede pública** (bind em LAN, Funnel, autenticação ausente): corrija imediatamente.
3. **Exposição remota de controle do navegador**: trate isso como acesso de operador (apenas tailnet, faça o pareamento de nodes deliberadamente, evite exposição pública).
4. **Permissões**: garanta que estado/configuração/credenciais/autenticação não sejam legíveis por grupo/mundo.
5. **Plugins/extensions**: carregue apenas o que você confia explicitamente.
6. **Escolha do modelo**: prefira modelos modernos e reforçados por instruções para qualquer bot com ferramentas.

## Glossário da auditoria de segurança

Valores `checkId` de alto sinal que você provavelmente verá em implantações reais (não exaustivo):

| `checkId`                                                     | Severity      | Por que isso importa                                                                  | Chave/caminho principal de correção                                                                   | Auto-fix |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| `fs.state_dir.perms_world_writable`                           | critical      | Outros usuários/processos podem modificar todo o estado do OpenClaw                   | permissões do sistema de arquivos em `~/.openclaw`                                                    | yes      |
| `fs.state_dir.perms_group_writable`                           | warn          | Usuários do grupo podem modificar todo o estado do OpenClaw                           | permissões do sistema de arquivos em `~/.openclaw`                                                    | yes      |
| `fs.state_dir.perms_readable`                                 | warn          | O diretório de estado é legível por outros                                            | permissões do sistema de arquivos em `~/.openclaw`                                                    | yes      |
| `fs.state_dir.symlink`                                        | warn          | O destino do diretório de estado passa a ser outro limite de confiança                | layout do sistema de arquivos do diretório de estado                                                  | no       |
| `fs.config.perms_writable`                                    | critical      | Outros podem alterar autenticação/política de ferramentas/configuração                | permissões do sistema de arquivos em `~/.openclaw/openclaw.json`                                      | yes      |
| `fs.config.symlink`                                           | warn          | O destino da configuração passa a ser outro limite de confiança                       | layout do sistema de arquivos do arquivo de configuração                                              | no       |
| `fs.config.perms_group_readable`                              | warn          | Usuários do grupo podem ler tokens/configurações da configuração                      | permissões do sistema de arquivos no arquivo de configuração                                          | yes      |
| `fs.config.perms_world_readable`                              | critical      | A configuração pode expor tokens/configurações                                        | permissões do sistema de arquivos no arquivo de configuração                                          | yes      |
| `fs.config_include.perms_writable`                            | critical      | O arquivo incluído na configuração pode ser modificado por outros                     | permissões do arquivo incluído referenciado por `openclaw.json`                                       | yes      |
| `fs.config_include.perms_group_readable`                      | warn          | Usuários do grupo podem ler secrets/configurações incluídos                           | permissões do arquivo incluído referenciado por `openclaw.json`                                       | yes      |
| `fs.config_include.perms_world_readable`                      | critical      | Secrets/configurações incluídos são legíveis por todos                                | permissões do arquivo incluído referenciado por `openclaw.json`                                       | yes      |
| `fs.auth_profiles.perms_writable`                             | critical      | Outros podem injetar ou substituir credenciais de modelo armazenadas                  | permissões de `agents/<agentId>/agent/auth-profiles.json`                                             | yes      |
| `fs.auth_profiles.perms_readable`                             | warn          | Outros podem ler chaves de API e tokens OAuth                                         | permissões de `agents/<agentId>/agent/auth-profiles.json`                                             | yes      |
| `fs.credentials_dir.perms_writable`                           | critical      | Outros podem modificar o estado de pareamento/credenciais do canal                    | permissões do sistema de arquivos em `~/.openclaw/credentials`                                        | yes      |
| `fs.credentials_dir.perms_readable`                           | warn          | Outros podem ler o estado de credenciais do canal                                     | permissões do sistema de arquivos em `~/.openclaw/credentials`                                        | yes      |
| `fs.sessions_store.perms_readable`                            | warn          | Outros podem ler transcrições/metadados de sessão                                     | permissões do armazenamento de sessões                                                                | yes      |
| `fs.log_file.perms_readable`                                  | warn          | Outros podem ler logs redigidos, mas ainda sensíveis                                  | permissões do arquivo de log do Gateway                                                               | yes      |
| `fs.synced_dir`                                               | warn          | Estado/configuração em iCloud/Dropbox/Drive amplia a exposição de tokens/transcrições | mova configuração/estado para fora de pastas sincronizadas                                            | no       |
| `gateway.bind_no_auth`                                        | critical      | Bind remoto sem segredo compartilhado                                                 | `gateway.bind`, `gateway.auth.*`                                                                      | no       |
| `gateway.loopback_no_auth`                                    | critical      | Loopback com proxy reverso pode se tornar não autenticado                             | `gateway.auth.*`, configuração de proxy                                                               | no       |
| `gateway.trusted_proxies_missing`                             | warn          | Cabeçalhos de proxy reverso estão presentes, mas não confiáveis                       | `gateway.trustedProxies`                                                                              | no       |
| `gateway.http.no_auth`                                        | warn/critical | APIs HTTP do Gateway acessíveis com `auth.mode="none"`                                | `gateway.auth.mode`, `gateway.http.endpoints.*`                                                       | no       |
| `gateway.http.session_key_override_enabled`                   | info          | Chamadores da API HTTP podem sobrescrever `sessionKey`                                | `gateway.http.allowSessionKeyOverride`                                                                | no       |
| `gateway.tools_invoke_http.dangerous_allow`                   | warn/critical | Reabilita ferramentas perigosas pela API HTTP                                         | `gateway.tools.allow`                                                                                 | no       |
| `gateway.nodes.allow_commands_dangerous`                      | warn/critical | Habilita comandos de node de alto impacto (câmera/tela/contatos/calendário/SMS)      | `gateway.nodes.allowCommands`                                                                         | no       |
| `gateway.nodes.deny_commands_ineffective`                     | warn          | Entradas de deny no estilo padrão não correspondem a texto de shell nem a grupos      | `gateway.nodes.denyCommands`                                                                          | no       |
| `gateway.tailscale_funnel`                                    | critical      | Exposição à internet pública                                                          | `gateway.tailscale.mode`                                                                              | no       |
| `gateway.tailscale_serve`                                     | info          | A exposição à tailnet está habilitada via Serve                                       | `gateway.tailscale.mode`                                                                              | no       |
| `gateway.control_ui.allowed_origins_required`                 | critical      | Control UI fora de loopback sem allowlist explícita de origem do navegador            | `gateway.controlUi.allowedOrigins`                                                                    | no       |
| `gateway.control_ui.allowed_origins_wildcard`                 | warn/critical | `allowedOrigins=["*"]` desabilita a allowlist de origem do navegador                  | `gateway.controlUi.allowedOrigins`                                                                    | no       |
| `gateway.control_ui.host_header_origin_fallback`              | warn/critical | Habilita fallback de origem por cabeçalho Host (redução de reforço contra DNS rebinding) | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`                                      | no       |
| `gateway.control_ui.insecure_auth`                            | warn          | Alternância de compatibilidade de autenticação insegura habilitada                    | `gateway.controlUi.allowInsecureAuth`                                                                 | no       |
| `gateway.control_ui.device_auth_disabled`                     | critical      | Desabilita a verificação de identidade do dispositivo                                 | `gateway.controlUi.dangerouslyDisableDeviceAuth`                                                      | no       |
| `gateway.real_ip_fallback_enabled`                            | warn/critical | Confiar no fallback `X-Real-IP` pode permitir falsificação de IP de origem por má configuração de proxy | `gateway.allowRealIpFallback`, `gateway.trustedProxies`                             | no       |
| `gateway.token_too_short`                                     | warn          | Token compartilhado curto é mais fácil de forçar                                      | `gateway.auth.token`                                                                                  | no       |
| `gateway.auth_no_rate_limit`                                  | warn          | Autenticação exposta sem limite de taxa aumenta risco de força bruta                  | `gateway.auth.rateLimit`                                                                              | no       |
| `gateway.trusted_proxy_auth`                                  | critical      | A identidade do proxy agora se torna o limite de autenticação                         | `gateway.auth.mode="trusted-proxy"`                                                                   | no       |
| `gateway.trusted_proxy_no_proxies`                            | critical      | Autenticação via proxy confiável sem IPs de proxy confiáveis é insegura               | `gateway.trustedProxies`                                                                              | no       |
| `gateway.trusted_proxy_no_user_header`                        | critical      | A autenticação via proxy confiável não pode resolver a identidade do usuário com segurança | `gateway.auth.trustedProxy.userHeader`                                                            | no       |
| `gateway.trusted_proxy_no_allowlist`                          | warn          | A autenticação via proxy confiável aceita qualquer usuário autenticado a montante      | `gateway.auth.trustedProxy.allowUsers`                                                                | no       |
| `checkId`                                                     | Severity      | Por que isso importa                                                                  | Chave/caminho principal de correção                                                                   | Auto-fix |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| `gateway.probe_auth_secretref_unavailable`                    | warn          | A sondagem profunda não conseguiu resolver SecretRefs de autenticação neste caminho de comando | fonte de autenticação da deep-probe / disponibilidade de SecretRef                              | no       |
| `gateway.probe_failed`                                        | warn/critical | A sondagem ao vivo do Gateway falhou                                                  | alcance/autenticação do Gateway                                                                      | no       |
| `discovery.mdns_full_mode`                                    | warn/critical | O modo completo de mDNS anuncia metadados `cliPath`/`sshPort` na rede local          | `discovery.mdns.mode`, `gateway.bind`                                                                | no       |
| `config.insecure_or_dangerous_flags`                          | warn          | Alguma flag de debug insegura/perigosa está habilitada                               | várias chaves (veja o detalhe do achado)                                                             | no       |
| `config.secrets.gateway_password_in_config`                   | warn          | A senha do Gateway está armazenada diretamente na configuração                        | `gateway.auth.password`                                                                              | no       |
| `config.secrets.hooks_token_in_config`                        | warn          | O token bearer de hooks está armazenado diretamente na configuração                   | `hooks.token`                                                                                        | no       |
| `hooks.token_reuse_gateway_token`                             | critical      | O token de entrada de hooks também desbloqueia a autenticação do Gateway             | `hooks.token`, `gateway.auth.token`                                                                  | no       |
| `hooks.token_too_short`                                       | warn          | Facilita força bruta na entrada de hooks                                              | `hooks.token`                                                                                        | no       |
| `hooks.default_session_key_unset`                             | warn          | O agente de hook em execução faz fanout para sessões geradas por solicitação         | `hooks.defaultSessionKey`                                                                            | no       |
| `hooks.allowed_agent_ids_unrestricted`                        | warn/critical | Chamadores autenticados de hooks podem rotear para qualquer agente configurado        | `hooks.allowedAgentIds`                                                                              | no       |
| `hooks.request_session_key_enabled`                           | warn/critical | O chamador externo pode escolher `sessionKey`                                         | `hooks.allowRequestSessionKey`                                                                       | no       |
| `hooks.request_session_key_prefixes_missing`                  | warn/critical | Não há limite para os formatos de chave de sessão externa                             | `hooks.allowedSessionKeyPrefixes`                                                                    | no       |
| `hooks.path_root`                                             | critical      | O caminho do hook é `/`, o que torna a entrada mais propensa a colisão ou roteamento incorreto | `hooks.path`                                                                                  | no       |
| `hooks.installs_unpinned_npm_specs`                           | warn          | Registros de instalação de hooks não estão fixados em especificações npm imutáveis   | metadados de instalação de hooks                                                                     | no       |
| `hooks.installs_missing_integrity`                            | warn          | Registros de instalação de hooks não têm metadados de integridade                     | metadados de instalação de hooks                                                                     | no       |
| `hooks.installs_version_drift`                                | warn          | Registros de instalação de hooks divergem dos pacotes instalados                      | metadados de instalação de hooks                                                                     | no       |
| `logging.redact_off`                                          | warn          | Valores sensíveis vazam para logs/status                                              | `logging.redactSensitive`                                                                            | yes      |
| `browser.control_invalid_config`                              | warn          | A configuração de controle do navegador é inválida antes do runtime                   | `browser.*`                                                                                          | no       |
| `browser.control_no_auth`                                     | critical      | Controle do navegador exposto sem autenticação por token/senha                        | `gateway.auth.*`                                                                                     | no       |
| `browser.remote_cdp_http`                                     | warn          | CDP remoto por HTTP simples não tem criptografia de transporte                        | `cdpUrl` do perfil de navegador                                                                      | no       |
| `browser.remote_cdp_private_host`                             | warn          | O CDP remoto aponta para um host privado/interno                                      | `cdpUrl` do perfil de navegador, `browser.ssrfPolicy.*`                                              | no       |
| `sandbox.docker_config_mode_off`                              | warn          | A configuração de Sandbox Docker está presente, mas inativa                           | `agents.*.sandbox.mode`                                                                              | no       |
| `sandbox.bind_mount_non_absolute`                             | warn          | Bind mounts relativos podem ser resolvidos de forma imprevisível                      | `agents.*.sandbox.docker.binds[]`                                                                    | no       |
| `sandbox.dangerous_bind_mount`                                | critical      | O destino do bind mount do sandbox aponta para caminhos bloqueados de sistema, credenciais ou socket do Docker | `agents.*.sandbox.docker.binds[]`                                         | no       |
| `sandbox.dangerous_network_mode`                              | critical      | A rede Docker do sandbox usa modo `host` ou `container:*` de junção de namespace     | `agents.*.sandbox.docker.network`                                                                    | no       |
| `sandbox.dangerous_seccomp_profile`                           | critical      | O perfil seccomp do sandbox enfraquece o isolamento do container                      | `agents.*.sandbox.docker.securityOpt`                                                                | no       |
| `sandbox.dangerous_apparmor_profile`                          | critical      | O perfil AppArmor do sandbox enfraquece o isolamento do container                     | `agents.*.sandbox.docker.securityOpt`                                                                | no       |
| `sandbox.browser_cdp_bridge_unrestricted`                     | warn          | A bridge de navegador do sandbox é exposta sem restrição de faixa de origem          | `sandbox.browser.cdpSourceRange`                                                                     | no       |
| `sandbox.browser_container.non_loopback_publish`              | critical      | O container de navegador existente publica CDP em interfaces fora de loopback         | configuração de publicação do container de navegador no sandbox                                      | no       |
| `sandbox.browser_container.hash_label_missing`                | warn          | O container de navegador existente é anterior aos rótulos atuais de hash de configuração | `openclaw sandbox recreate --browser --all`                                                     | no       |
| `sandbox.browser_container.hash_epoch_stale`                  | warn          | O container de navegador existente é anterior à época atual de configuração do navegador | `openclaw sandbox recreate --browser --all`                                                      | no       |
| `tools.exec.host_sandbox_no_sandbox_defaults`                 | warn          | `exec host=sandbox` falha em modo fechado quando o sandbox está desligado             | `tools.exec.host`, `agents.defaults.sandbox.mode`                                                    | no       |
| `tools.exec.host_sandbox_no_sandbox_agents`                   | warn          | `exec host=sandbox` por agente falha em modo fechado quando o sandbox está desligado  | `agents.list[].tools.exec.host`, `agents.list[].sandbox.mode`                                        | no       |
| `tools.exec.security_full_configured`                         | warn/critical | O exec no host está sendo executado com `security="full"`                             | `tools.exec.security`, `agents.list[].tools.exec.security`                                           | no       |
| `tools.exec.auto_allow_skills_enabled`                        | warn          | Aprovações de exec confiam implicitamente em bins de Skills                           | `~/.openclaw/exec-approvals.json`                                                                    | no       |
| `tools.exec.allowlist_interpreter_without_strict_inline_eval` | warn          | Allowlists de interpretador permitem eval inline sem reaprovação forçada              | `tools.exec.strictInlineEval`, `agents.list[].tools.exec.strictInlineEval`, allowlist de aprovações de exec | no       |
| `tools.exec.safe_bins_interpreter_unprofiled`                 | warn          | Bins de interpretador/runtime em `safeBins` sem perfis explícitos ampliam o risco de exec | `tools.exec.safeBins`, `tools.exec.safeBinProfiles`, `agents.list[].tools.exec.*`               | no       |
| `tools.exec.safe_bins_broad_behavior`                         | warn          | Ferramentas de comportamento amplo em `safeBins` enfraquecem o modelo de confiança de baixo risco com filtro de stdin | `tools.exec.safeBins`, `agents.list[].tools.exec.safeBins`                        | no       |
| `tools.exec.safe_bin_trusted_dirs_risky`                      | warn          | `safeBinTrustedDirs` inclui diretórios mutáveis ou arriscados                         | `tools.exec.safeBinTrustedDirs`, `agents.list[].tools.exec.safeBinTrustedDirs`                       | no       |
| `skills.workspace.symlink_escape`                             | warn          | `skills/**/SKILL.md` do workspace resolve para fora da raiz do workspace (desvio por cadeia de symlink) | estado do sistema de arquivos do workspace `skills/**`                                      | no       |
| `plugins.extensions_no_allowlist`                             | warn          | Extensions estão instaladas sem allowlist explícita de plugin                         | `plugins.allowlist`                                                                                  | no       |
| `plugins.installs_unpinned_npm_specs`                         | warn          | Registros de instalação de plugin não estão fixados em especificações npm imutáveis   | metadados de instalação de plugin                                                                    | no       |
| `plugins.installs_missing_integrity`                          | warn          | Registros de instalação de plugin não têm metadados de integridade                   | metadados de instalação de plugin                                                                    | no       |
| `plugins.installs_version_drift`                              | warn          | Registros de instalação de plugin divergem dos pacotes instalados                    | metadados de instalação de plugin                                                                    | no       |
| `plugins.code_safety`                                         | warn/critical | A varredura de código do plugin encontrou padrões suspeitos ou perigosos             | código do plugin / origem da instalação                                                              | no       |
| `plugins.code_safety.entry_path`                              | warn          | O caminho de entrada do plugin aponta para locais ocultos ou `node_modules`          | `entry` do manifesto do plugin                                                                       | no       |
| `plugins.code_safety.entry_escape`                            | critical      | A entrada do plugin escapa do diretório do plugin                                    | `entry` do manifesto do plugin                                                                       | no       |
| `plugins.code_safety.scan_failed`                             | warn          | A varredura de código do plugin não pôde ser concluída                               | caminho da extension de plugin / ambiente de varredura                                               | no       |
| `skills.code_safety`                                          | warn/critical | Metadados/código do instalador de Skills contêm padrões suspeitos ou perigosos       | origem da instalação de Skills                                                                       | no       |
| `skills.code_safety.scan_failed`                              | warn          | A varredura de código de Skills não pôde ser concluída                               | ambiente de varredura de Skills                                                                      | no       |
| `security.exposure.open_channels_with_exec`                   | warn/critical | Salas compartilhadas/públicas podem alcançar agentes com exec habilitado             | `channels.*.dmPolicy`, `channels.*.groupPolicy`, `tools.exec.*`, `agents.list[].tools.exec.*`        | no       |
| `security.exposure.open_groups_with_elevated`                 | critical      | Grupos abertos + ferramentas elevadas criam caminhos de injeção de prompt de alto impacto | `channels.*.groupPolicy`, `tools.elevated.*`                                                    | no       |
| `security.exposure.open_groups_with_runtime_or_fs`            | critical/warn | Grupos abertos podem alcançar ferramentas de comando/arquivo sem proteções de sandbox/workspace | `channels.*.groupPolicy`, `tools.profile/deny`, `tools.fs.workspaceOnly`, `agents.*.sandbox.mode` | no       |
| `security.trust_model.multi_user_heuristic`                   | warn          | A configuração parece multiusuário enquanto o modelo de confiança do Gateway é de assistente pessoal | separe os limites de confiança, ou use reforço para usuário compartilhado (`sandbox.mode`, deny de ferramentas/escopo de workspace) | no       |
| `tools.profile_minimal_overridden`                            | warn          | Substituições por agente contornam o perfil mínimo global                            | `agents.list[].tools.profile`                                                                        | no       |
| `plugins.tools_reachable_permissive_policy`                   | warn          | Ferramentas de extension alcançáveis em contextos permissivos                        | `tools.profile` + allow/deny de ferramentas                                                          | no       |
| `models.legacy`                                               | warn          | Famílias de modelos legados ainda estão configuradas                                 | seleção de modelo                                                                                    | no       |
| `models.weak_tier`                                            | warn          | Os modelos configurados estão abaixo dos níveis atualmente recomendados              | seleção de modelo                                                                                    | no       |
| `models.small_params`                                         | critical/info | Modelos pequenos + superfícies de ferramentas inseguras aumentam o risco de injeção  | escolha de modelo + política de sandbox/ferramentas                                                 | no       |
| `summary.attack_surface`                                      | info          | Resumo consolidado da postura de autenticação, canal, ferramenta e exposição         | várias chaves (veja o detalhe do achado)                                                             | no       |

## Control UI via HTTP

A Control UI precisa de um **contexto seguro** (HTTPS ou localhost) para gerar identidade do dispositivo. `gateway.controlUi.allowInsecureAuth` é uma alternância local de compatibilidade:

- No localhost, ela permite autenticação da Control UI sem identidade do dispositivo quando a página é carregada por HTTP não seguro.
- Ela não ignora verificações de pareamento.
- Ela não afrouxa requisitos remotos (fora de localhost) de identidade do dispositivo.

Prefira HTTPS (Tailscale Serve) ou abra a UI em `127.0.0.1`.

Apenas para cenários de emergência, `gateway.controlUi.dangerouslyDisableDeviceAuth`
desabilita completamente as verificações de identidade do dispositivo. Isso é um rebaixamento severo de segurança;
mantenha desativado, a menos que você esteja depurando ativamente e possa reverter rapidamente.

Separadamente dessas flags perigosas, um `gateway.auth.mode: "trusted-proxy"` bem-sucedido
pode admitir sessões de **operador** da Control UI sem identidade do dispositivo. Esse é um
comportamento intencional do modo de autenticação, não um atalho de `allowInsecureAuth`, e ainda
não se estende a sessões da Control UI com função de node.

`openclaw security audit` avisa quando essa configuração está habilitada.

## Resumo de flags inseguras ou perigosas

`openclaw security audit` inclui `config.insecure_or_dangerous_flags` quando
switches de debug inseguros/perigosos conhecidos estão habilitados. Atualmente essa verificação
agrega:

- `gateway.controlUi.allowInsecureAuth=true`
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`
- `tools.exec.applyPatch.workspaceOnly=false`
- `plugins.entries.acpx.config.permissionMode=approve-all`

Chaves completas de configuração `dangerous*` / `dangerously*` definidas no schema de configuração do OpenClaw:

- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
- `gateway.controlUi.dangerouslyDisableDeviceAuth`
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `channels.discord.dangerouslyAllowNameMatching`
- `channels.discord.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.slack.dangerouslyAllowNameMatching`
- `channels.slack.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.googlechat.dangerouslyAllowNameMatching`
- `channels.googlechat.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.msteams.dangerouslyAllowNameMatching`
- `channels.synology-chat.dangerouslyAllowNameMatching` (canal extension)
- `channels.synology-chat.accounts.<accountId>.dangerouslyAllowNameMatching` (canal extension)
- `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (canal extension)
- `channels.zalouser.dangerouslyAllowNameMatching` (canal extension)
- `channels.zalouser.accounts.<accountId>.dangerouslyAllowNameMatching` (canal extension)
- `channels.irc.dangerouslyAllowNameMatching` (canal extension)
- `channels.irc.accounts.<accountId>.dangerouslyAllowNameMatching` (canal extension)
- `channels.mattermost.dangerouslyAllowNameMatching` (canal extension)
- `channels.mattermost.accounts.<accountId>.dangerouslyAllowNameMatching` (canal extension)
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`
- `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
- `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

## Configuração de proxy reverso

Se você executar o Gateway atrás de um proxy reverso (nginx, Caddy, Traefik etc.), configure
`gateway.trustedProxies` para o tratamento correto do IP do cliente encaminhado.

Quando o Gateway detecta cabeçalhos de proxy vindos de um endereço que **não** está em `trustedProxies`, ele **não** trata conexões como clientes locais. Se a autenticação do Gateway estiver desabilitada, essas conexões serão rejeitadas. Isso evita bypass de autenticação em que conexões com proxy, de outra forma, pareceriam vir do localhost e receber confiança automática.

`gateway.trustedProxies` também alimenta `gateway.auth.mode: "trusted-proxy"`, mas esse modo de autenticação é mais estrito:

- a autenticação por proxy confiável **falha em modo fechado para proxies com origem em loopback**
- proxies reversos em loopback no mesmo host ainda podem usar `gateway.trustedProxies` para detecção de cliente local e tratamento de IP encaminhado
- para proxies reversos em loopback no mesmo host, use autenticação por token/senha em vez de `gateway.auth.mode: "trusted-proxy"`

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # IP do proxy reverso
  # Opcional. Padrão false.
  # Habilite apenas se seu proxy não puder fornecer X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Quando `trustedProxies` está configurado, o Gateway usa `X-Forwarded-For` para determinar o IP do cliente. `X-Real-IP` é ignorado por padrão, a menos que `gateway.allowRealIpFallback: true` esteja explicitamente definido.

Bom comportamento de proxy reverso (sobrescrever cabeçalhos de encaminhamento de entrada):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Mau comportamento de proxy reverso (acrescentar/preservar cabeçalhos de encaminhamento não confiáveis):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Observações sobre HSTS e origem

- O Gateway do OpenClaw é voltado primeiro para local/loopback. Se você terminar TLS em um proxy reverso, defina HSTS no domínio HTTPS voltado ao proxy nesse local.
- Se o próprio Gateway terminar HTTPS, você pode definir `gateway.http.securityHeaders.strictTransportSecurity` para emitir o cabeçalho HSTS nas respostas do OpenClaw.
- Orientações detalhadas de implantação estão em [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Para implantações da Control UI fora de loopback, `gateway.controlUi.allowedOrigins` é exigido por padrão.
- `gateway.controlUi.allowedOrigins: ["*"]` é uma política explícita de permitir todas as origens do navegador, não um padrão reforçado. Evite isso fora de testes locais rigidamente controlados.
- Falhas de autenticação por origem do navegador em loopback ainda estão sujeitas a limite de taxa, mesmo quando a
  isenção geral de loopback está habilitada, mas a chave de bloqueio é delimitada por
  valor `Origin` normalizado, em vez de um bucket único compartilhado de localhost.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita o modo de fallback de origem por cabeçalho Host; trate isso como uma política perigosa selecionada pelo operador.
- Trate rebinding de DNS e o comportamento de cabeçalho Host do proxy como preocupações de reforço de implantação; mantenha `trustedProxies` restrito e evite expor o Gateway diretamente à internet pública.

## Logs de sessão locais ficam no disco

O OpenClaw armazena transcrições de sessão no disco em `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Isso é necessário para continuidade da sessão e, opcionalmente, indexação de memória da sessão, mas também significa
que **qualquer processo/usuário com acesso ao sistema de arquivos pode ler esses logs**. Trate o acesso ao disco como limite de confiança e restrinja permissões em `~/.openclaw` (veja a seção de auditoria abaixo). Se você precisar de
isolamento mais forte entre agentes, execute-os sob usuários do SO separados ou hosts separados.

## Execução em node (`system.run`)

Se um node macOS estiver pareado, o Gateway poderá invocar `system.run` nesse node. Isso é **execução remota de código** no Mac:

- Requer pareamento do node (aprovação + token).
- O pareamento do node no Gateway não é uma superfície de aprovação por comando. Ele estabelece identidade/confiança do node e emissão de token.
- O Gateway aplica uma política global grosseira de comandos de node via `gateway.nodes.allowCommands` / `denyCommands`.
- Controlado no Mac por **Settings → Exec approvals** (security + ask + allowlist).
- A política `system.run` por node é o próprio arquivo local de aprovações de exec do node (`exec.approvals.node.*`), que pode ser mais estrito ou mais flexível do que a política global de ID de comando do Gateway.
- Um node executando com `security="full"` e `ask="off"` está seguindo o modelo padrão de operador confiável. Trate isso como comportamento esperado, a menos que sua implantação exija explicitamente uma postura mais rígida de aprovação ou allowlist.
- O modo de aprovação vincula o contexto exato da solicitação e, quando possível, um operando concreto de script/arquivo local. Se o OpenClaw não puder identificar exatamente um arquivo local direto para um comando de interpretador/runtime, a execução apoiada por aprovação será negada em vez de prometer cobertura semântica total.
- Para `host=node`, execuções apoiadas por aprovação também armazenam um
  `systemRunPlan` preparado canônico; encaminhamentos aprovados posteriormente reutilizam esse plano armazenado, e a
  validação do Gateway rejeita edições do chamador em comando/cwd/contexto de sessão após a criação da solicitação de aprovação.
- Se você não quiser execução remota, defina security como **deny** e remova o pareamento do node desse Mac.

Essa distinção importa para triagem:

- Um node pareado que se reconecta anunciando uma lista de comandos diferente não é, por si só, uma vulnerabilidade se a política global do Gateway e as aprovações locais de exec do node ainda impõem o limite real de execução.
- Relatórios que tratam metadados de pareamento do node como uma segunda camada oculta de aprovação por comando normalmente são confusão de política/UX, não um bypass de limite de segurança.

## Skills dinâmicas (watcher / nodes remotos)

O OpenClaw pode atualizar a lista de Skills no meio da sessão:

- **Watcher de Skills**: alterações em `SKILL.md` podem atualizar o snapshot de Skills no próximo turno do agente.
- **Nodes remotos**: conectar um node macOS pode tornar Skills exclusivas de macOS elegíveis (com base em sondagem de bins).

Trate pastas de Skills como **código confiável** e restrinja quem pode modificá-las.

## O modelo de ameaças

Seu assistente de IA pode:

- Executar comandos arbitrários de shell
- Ler/gravar arquivos
- Acessar serviços de rede
- Enviar mensagens para qualquer pessoa (se você der acesso ao WhatsApp)

Pessoas que enviam mensagens para você podem:

- Tentar enganar sua IA para fazer coisas ruins
- Fazer engenharia social para acessar seus dados
- Sondar detalhes da infraestrutura

## Conceito central: controle de acesso antes da inteligência

A maioria das falhas aqui não são exploits sofisticados — são “alguém mandou mensagem para o bot e o bot fez o que foi pedido”.

A postura do OpenClaw:

- **Identidade primeiro:** decida quem pode falar com o bot (pareamento de DM / allowlists / “open” explícito).
- **Escopo em seguida:** decida onde o bot tem permissão para agir (allowlists de grupo + exigência de menção, ferramentas, sandboxing, permissões de dispositivo).
- **Modelo por último:** assuma que o modelo pode ser manipulado; projete de modo que a manipulação tenha raio de impacto limitado.

## Modelo de autorização de comandos

Comandos slash e diretivas são respeitados apenas para **remetentes autorizados**. A autorização é derivada de
allowlists/pareamento do canal mais `commands.useAccessGroups` (veja [Configuração](/pt-BR/gateway/configuration)
e [Comandos slash](/pt-BR/tools/slash-commands)). Se a allowlist de um canal estiver vazia ou incluir `"*"`,
os comandos ficam efetivamente abertos para esse canal.

`/exec` é uma conveniência apenas de sessão para operadores autorizados. Ele **não** grava configuração nem
altera outras sessões.

## Risco das ferramentas de plano de controle

Duas ferramentas integradas podem fazer alterações persistentes no plano de controle:

- `gateway` pode inspecionar configuração com `config.schema.lookup` / `config.get` e pode fazer alterações persistentes com `config.apply`, `config.patch` e `update.run`.
- `cron` pode criar jobs agendados que continuam em execução após o término do chat/task original.

A ferramenta de runtime `gateway` apenas para proprietário ainda se recusa a reescrever
`tools.exec.ask` ou `tools.exec.security`; aliases legados `tools.bash.*` são
normalizados para os mesmos caminhos protegidos de exec antes da gravação.

Para qualquer agente/superfície que lide com conteúdo não confiável, negue isso por padrão:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` bloqueia apenas ações de reinicialização. Ele não desabilita ações de configuração/atualização de `gateway`.

## Plugins/extensions

Plugins são executados **no mesmo processo** do Gateway. Trate-os como código confiável:

- Instale plugins apenas de fontes em que você confia.
- Prefira allowlists explícitas em `plugins.allow`.
- Revise a configuração do plugin antes de habilitar.
- Reinicie o Gateway após alterações em plugins.
- Se você instalar ou atualizar plugins (`openclaw plugins install <package>`, `openclaw plugins update <id>`), trate isso como executar código não confiável:
  - O caminho de instalação é o diretório por plugin sob a raiz ativa de instalação de plugins.
  - O OpenClaw executa uma varredura integrada de código perigoso antes da instalação/atualização. Achados `critical` bloqueiam por padrão.
  - O OpenClaw usa `npm pack` e então executa `npm install --omit=dev` nesse diretório (scripts de ciclo de vida do npm podem executar código durante a instalação).
  - Prefira versões exatas e fixadas (`@scope/pkg@1.2.3`) e inspecione o código desempacotado em disco antes de habilitar.
  - `--dangerously-force-unsafe-install` é apenas para emergência em caso de falsos positivos da varredura integrada nos fluxos de instalação/atualização de plugin. Ele não ignora bloqueios de política do hook `before_install` do plugin nem falhas de varredura.
  - Instalações de dependências de Skills apoiadas pelo Gateway seguem a mesma divisão entre perigoso/suspeito: achados integrados `critical` bloqueiam, a menos que o chamador defina explicitamente `dangerouslyForceUnsafeInstall`, enquanto achados suspeitos continuam apenas emitindo aviso. `openclaw skills install` continua sendo o fluxo separado do ClawHub para download/instalação de Skills.

Detalhes: [Plugins](/pt-BR/tools/plugin)

<a id="dm-access-model-pairing-allowlist-open-disabled"></a>

## Modelo de acesso por DM (pairing / allowlist / open / disabled)

Todos os canais atuais com capacidade de DM oferecem suporte a uma política de DM (`dmPolicy` ou `*.dm.policy`) que controla DMs recebidas **antes** de a mensagem ser processada:

- `pairing` (padrão): remetentes desconhecidos recebem um código curto de pareamento e o bot ignora a mensagem até que ela seja aprovada. Os códigos expiram após 1 hora; DMs repetidas não reenviam um código até que uma nova solicitação seja criada. Solicitações pendentes são limitadas a **3 por canal** por padrão.
- `allowlist`: remetentes desconhecidos são bloqueados (sem handshake de pareamento).
- `open`: permite que qualquer pessoa envie DM (público). **Requer** que a allowlist do canal inclua `"*"` (opt-in explícito).
- `disabled`: ignora completamente DMs recebidas.

Aprove via CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Detalhes + arquivos em disco: [Pareamento](/pt-BR/channels/pairing)

## Isolamento de sessão de DM (modo multiusuário)

Por padrão, o OpenClaw roteia **todas as DMs para a sessão principal** para que seu assistente tenha continuidade entre dispositivos e canais. Se **várias pessoas** puderem enviar DM ao bot (DMs abertas ou uma allowlist com várias pessoas), considere isolar as sessões de DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Isso evita vazamento de contexto entre usuários, mantendo chats em grupo isolados.

Esse é um limite de contexto de mensagens, não um limite de administração do host. Se os usuários forem mutuamente adversariais e compartilharem o mesmo host/configuração do Gateway, execute Gateways separados por limite de confiança.

### Modo DM seguro (recomendado)

Trate o snippet acima como **modo DM seguro**:

- Padrão: `session.dmScope: "main"` (todas as DMs compartilham uma sessão para continuidade).
- Padrão do onboarding da CLI local: grava `session.dmScope: "per-channel-peer"` quando não definido (mantém valores explícitos existentes).
- Modo DM seguro: `session.dmScope: "per-channel-peer"` (cada par canal+remetente recebe um contexto de DM isolado).
- Isolamento de par entre canais: `session.dmScope: "per-peer"` (cada remetente recebe uma sessão em todos os canais do mesmo tipo).

Se você executar várias contas no mesmo canal, use `per-account-channel-peer` em vez disso. Se a mesma pessoa entrar em contato com você por vários canais, use `session.identityLinks` para colapsar essas sessões de DM em uma identidade canônica única. Veja [Gerenciamento de sessão](/pt-BR/concepts/session) e [Configuração](/pt-BR/gateway/configuration).

## Allowlists (DM + grupos) - terminologia

O OpenClaw tem duas camadas separadas de “quem pode me acionar?”:

- **Allowlist de DM** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; legado: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): quem tem permissão para falar com o bot em mensagens diretas.
  - Quando `dmPolicy="pairing"`, aprovações são gravadas no armazenamento de allowlist de pareamento com escopo de conta em `~/.openclaw/credentials/` (`<channel>-allowFrom.json` para conta padrão, `<channel>-<accountId>-allowFrom.json` para contas não padrão), mescladas com allowlists de configuração.
- **Allowlist de grupo** (específica do canal): de quais grupos/canais/guilds o bot aceitará mensagens.
  - Padrões comuns:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: padrões por grupo como `requireMention`; quando definido, isso também atua como allowlist de grupo (inclua `"*"` para manter o comportamento de permitir tudo).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: restringe quem pode acionar o bot _dentro_ de uma sessão de grupo (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: allowlists por superfície + padrões de menção.
  - Verificações de grupo são executadas nesta ordem: primeiro `groupPolicy`/allowlists de grupo, depois ativação por menção/resposta.
  - Responder a uma mensagem do bot (menção implícita) **não** ignora allowlists de remetente como `groupAllowFrom`.
  - **Observação de segurança:** trate `dmPolicy="open"` e `groupPolicy="open"` como configurações de último recurso. Elas quase não deveriam ser usadas; prefira pairing + allowlists, a menos que você confie totalmente em todos os membros da sala.

Detalhes: [Configuração](/pt-BR/gateway/configuration) e [Grupos](/pt-BR/channels/groups)

## Injeção de prompt (o que é, por que importa)

Injeção de prompt é quando um atacante cria uma mensagem que manipula o modelo para fazer algo inseguro (“ignore suas instruções”, “despeje seu sistema de arquivos”, “siga este link e execute comandos” etc.).

Mesmo com prompts de sistema fortes, **injeção de prompt não está resolvida**. Proteções de prompt de sistema são apenas orientação branda; a imposição rígida vem da política de ferramentas, aprovações de exec, sandboxing e allowlists de canal (e os operadores podem desabilitá-las por design). O que ajuda na prática:

- Mantenha DMs recebidas restritas (pairing/allowlists).
- Prefira exigência de menção em grupos; evite bots “sempre ativos” em salas públicas.
- Trate links, anexos e instruções coladas como hostis por padrão.
- Execute ferramentas sensíveis em um sandbox; mantenha secrets fora do sistema de arquivos alcançável pelo agente.
- Observação: sandboxing é opt-in. Se o modo sandbox estiver desligado, `host=auto` implícito resolve para o host do Gateway. `host=sandbox` explícito ainda falha em modo fechado porque nenhum runtime de sandbox está disponível. Defina `host=gateway` se quiser que esse comportamento fique explícito na configuração.
- Limite ferramentas de alto risco (`exec`, `browser`, `web_fetch`, `web_search`) a agentes confiáveis ou allowlists explícitas.
- Se você usar allowlist de interpretadores (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), habilite `tools.exec.strictInlineEval` para que formas de eval inline ainda exijam aprovação explícita.
- **A escolha do modelo importa:** modelos antigos/menores/legados são significativamente menos robustos contra injeção de prompt e uso indevido de ferramentas. Para agentes com ferramentas habilitadas, use o modelo mais forte, mais recente e reforçado por instruções disponível.

Sinais de alerta a tratar como não confiáveis:

- “Leia este arquivo/URL e faça exatamente o que ele diz.”
- “Ignore seu prompt de sistema ou regras de segurança.”
- “Revele suas instruções ocultas ou saídas de ferramentas.”
- “Cole o conteúdo completo de ~/.openclaw ou seus logs.”

## Flags de bypass para conteúdo externo inseguro

O OpenClaw inclui flags explícitas de bypass que desabilitam o encapsulamento de segurança de conteúdo externo:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Campo de payload do Cron `allowUnsafeExternalContent`

Orientação:

- Mantenha isso não definido/false em produção.
- Habilite apenas temporariamente para depuração com escopo rigorosamente limitado.
- Se habilitado, isole esse agente (sandbox + ferramentas mínimas + namespace de sessão dedicado).

Observação sobre risco de hooks:

- Payloads de hook são conteúdo não confiável, mesmo quando a entrega vem de sistemas que você controla (conteúdo de e-mail/documentos/web pode carregar injeção de prompt).
- Níveis de modelo fracos aumentam esse risco. Para automação acionada por hooks, prefira níveis fortes de modelos modernos e mantenha a política de ferramentas restrita (`tools.profile: "messaging"` ou mais rígida), além de sandboxing quando possível.

### Injeção de prompt não exige DMs públicas

Mesmo se **apenas você** puder enviar mensagens ao bot, a injeção de prompt ainda pode ocorrer por meio de
qualquer **conteúdo não confiável** que o bot leia (resultados de busca/fetch na web, páginas do navegador,
e-mails, documentos, anexos, logs/código colados). Em outras palavras: o remetente não é
a única superfície de ameaça; o **próprio conteúdo** pode carregar instruções adversariais.

Quando ferramentas estão habilitadas, o risco típico é exfiltrar contexto ou acionar
chamadas de ferramentas. Reduza o raio de impacto ao:

- Usar um **agente leitor** somente leitura ou com ferramentas desabilitadas para resumir conteúdo não confiável
  e depois passar o resumo ao seu agente principal.
- Manter `web_search` / `web_fetch` / `browser` desligados para agentes com ferramentas habilitadas, a menos que sejam necessários.
- Para entradas de URL de OpenResponses (`input_file` / `input_image`), defina allowlists rígidas em
  `gateway.http.endpoints.responses.files.urlAllowlist` e
  `gateway.http.endpoints.responses.images.urlAllowlist`, e mantenha `maxUrlParts` baixo.
  Allowlists vazias são tratadas como não definidas; use `files.allowUrl: false` / `images.allowUrl: false`
  se quiser desabilitar totalmente o fetch por URL.
- Para entradas de arquivo de OpenResponses, o texto decodificado de `input_file` ainda é injetado como
  **conteúdo externo não confiável**. Não confie no texto do arquivo só porque
  o Gateway o decodificou localmente. O bloco injetado ainda carrega marcadores explícitos de
  limite `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` mais metadados `Source: External`,
  embora esse caminho omita o banner mais longo `SECURITY NOTICE:`.
- O mesmo encapsulamento baseado em marcadores é aplicado quando a compreensão de mídia extrai texto
  de documentos anexados antes de anexar esse texto ao prompt de mídia.
- Habilitar sandboxing e allowlists rígidas de ferramentas para qualquer agente que lide com entrada não confiável.
- Manter secrets fora de prompts; passe-os por env/config no host do Gateway.

### Força do modelo (observação de segurança)

A resistência à injeção de prompt **não** é uniforme entre níveis de modelo. Modelos menores/mais baratos geralmente são mais suscetíveis a uso indevido de ferramentas e sequestro de instruções, especialmente sob prompts adversariais.

<Warning>
Para agentes com ferramentas habilitadas ou agentes que leem conteúdo não confiável, o risco de injeção de prompt com modelos antigos/menores muitas vezes é alto demais. Não execute essas cargas de trabalho em níveis fracos de modelo.
</Warning>

Recomendações:

- **Use o modelo de última geração e melhor nível** para qualquer bot que possa executar ferramentas ou tocar arquivos/redes.
- **Não use níveis antigos/mais fracos/menores** para agentes com ferramentas habilitadas ou caixas de entrada não confiáveis; o risco de injeção de prompt é alto demais.
- Se você precisar usar um modelo menor, **reduza o raio de impacto** (ferramentas somente leitura, sandboxing forte, acesso mínimo ao sistema de arquivos, allowlists rígidas).
- Ao executar modelos pequenos, **habilite sandboxing para todas as sessões** e **desabilite web_search/web_fetch/browser** a menos que as entradas sejam rigidamente controladas.
- Para assistentes pessoais apenas de chat, com entrada confiável e sem ferramentas, modelos menores geralmente são adequados.

<a id="reasoning-verbose-output-in-groups"></a>

## Raciocínio e saída verbosa em grupos

`/reasoning`, `/verbose` e `/trace` podem expor raciocínio interno, saída de ferramenta ou diagnósticos de plugin que
não eram destinados a um canal público. Em configurações de grupo, trate-os como **apenas depuração**
e mantenha-os desativados, a menos que você realmente precise deles.

Orientação:

- Mantenha `/reasoning`, `/verbose` e `/trace` desabilitados em salas públicas.
- Se você habilitá-los, faça isso apenas em DMs confiáveis ou em salas rigidamente controladas.
- Lembre-se: saídas verbosas e de trace podem incluir argumentos de ferramentas, URLs, diagnósticos de plugin e dados que o modelo viu.

## Reforço de configuração (exemplos)

### 0) Permissões de arquivo

Mantenha a configuração + estado privados no host do Gateway:

- `~/.openclaw/openclaw.json`: `600` (apenas leitura/gravação do usuário)
- `~/.openclaw`: `700` (apenas usuário)

`openclaw doctor` pode avisar e oferecer reforço dessas permissões.

### 0.4) Exposição de rede (bind + porta + firewall)

O Gateway multiplexa **WebSocket + HTTP** em uma única porta:

- Padrão: `18789`
- Configuração/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Essa superfície HTTP inclui a Control UI e o host canvas:

- Control UI (assets SPA) (caminho base padrão `/`)
- Host canvas: `/__openclaw__/canvas/` e `/__openclaw__/a2ui/` (HTML/JS arbitrário; trate como conteúdo não confiável)

Se você carregar conteúdo canvas em um navegador normal, trate-o como qualquer outra página web não confiável:

- Não exponha o host canvas a redes/usuários não confiáveis.
- Não faça o conteúdo canvas compartilhar a mesma origem com superfícies web privilegiadas, a menos que você entenda totalmente as implicações.

O modo de bind controla onde o Gateway escuta:

- `gateway.bind: "loopback"` (padrão): apenas clientes locais podem se conectar.
- Binds fora de loopback (`"lan"`, `"tailnet"`, `"custom"`) ampliam a superfície de ataque. Use-os apenas com autenticação do Gateway (token/senha compartilhados ou um proxy confiável fora de loopback corretamente configurado) e um firewall real.

Regras práticas:

- Prefira Tailscale Serve a binds em LAN (Serve mantém o Gateway em loopback, e o Tailscale cuida do acesso).
- Se precisar fazer bind em LAN, limite a porta no firewall a uma allowlist restrita de IPs de origem; não faça port-forward amplo.
- Nunca exponha o Gateway sem autenticação em `0.0.0.0`.

### 0.4.1) Publicação de portas Docker + UFW (`DOCKER-USER`)

Se você executar o OpenClaw com Docker em um VPS, lembre-se de que portas publicadas do container
(`-p HOST:CONTAINER` ou `ports:` no Compose) são roteadas pelas cadeias de encaminhamento do Docker,
não apenas pelas regras `INPUT` do host.

Para manter o tráfego do Docker alinhado com sua política de firewall, imponha regras em
`DOCKER-USER` (essa cadeia é avaliada antes das próprias regras de aceitação do Docker).
Em muitas distribuições modernas, `iptables`/`ip6tables` usam o frontend `iptables-nft`
e ainda aplicam essas regras ao backend nftables.

Exemplo mínimo de allowlist (IPv4):

```bash
# /etc/ufw/after.rules (anexar como sua própria seção *filter)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

O IPv6 tem tabelas separadas. Adicione uma política correspondente em `/etc/ufw/after6.rules` se
o IPv6 do Docker estiver habilitado.

Evite fixar nomes de interface como `eth0` em snippets de documentação. Nomes de interface
variam entre imagens de VPS (`ens3`, `enp*` etc.), e incompatibilidades podem fazer com que
sua regra de bloqueio seja ignorada acidentalmente.

Validação rápida após recarregar:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

As portas externas esperadas devem ser apenas aquelas que você expôs intencionalmente (na maioria das
configurações: SSH + portas do seu proxy reverso).

### 0.4.2) Descoberta mDNS/Bonjour (divulgação de informações)

O Gateway transmite sua presença via mDNS (`_openclaw-gw._tcp` na porta 5353) para descoberta local de dispositivos. No modo completo, isso inclui registros TXT que podem expor detalhes operacionais:

- `cliPath`: caminho completo do sistema de arquivos para o binário da CLI (revela nome de usuário e local de instalação)
- `sshPort`: anuncia disponibilidade de SSH no host
- `displayName`, `lanHost`: informações de nome do host

**Consideração de segurança operacional:** transmitir detalhes de infraestrutura facilita reconhecimento para qualquer pessoa na rede local. Mesmo informações “inofensivas”, como caminhos do sistema de arquivos e disponibilidade de SSH, ajudam atacantes a mapear seu ambiente.

**Recomendações:**

1. **Modo minimal** (padrão, recomendado para Gateways expostos): omite campos sensíveis das transmissões mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **Desabilite completamente** se você não precisar de descoberta local de dispositivos:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **Modo full** (opt-in): inclui `cliPath` + `sshPort` em registros TXT:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **Variável de ambiente** (alternativa): defina `OPENCLAW_DISABLE_BONJOUR=1` para desabilitar mDNS sem alterar a configuração.

No modo minimal, o Gateway ainda transmite o suficiente para descoberta de dispositivos (`role`, `gatewayPort`, `transport`), mas omite `cliPath` e `sshPort`. Apps que precisarem de informações do caminho da CLI podem buscá-las pela conexão WebSocket autenticada.

### 0.5) Restrinja o WebSocket do Gateway (autenticação local)

A autenticação do Gateway é **obrigatória por padrão**. Se nenhum caminho válido de autenticação do Gateway estiver configurado,
o Gateway recusará conexões WebSocket (falha em modo fechado).

O onboarding gera um token por padrão (mesmo para loopback), então
clientes locais precisam se autenticar.

Defina um token para que **todos** os clientes WS precisem se autenticar:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

O doctor pode gerar um para você: `openclaw doctor --generate-gateway-token`.

Observação: `gateway.remote.token` / `.password` são fontes de credenciais do cliente. Elas
**não** protegem o acesso WS local por si só.
Caminhos de chamada locais podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*`
não estiver definido.
Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via
SecretRef e não resolvido, a resolução falha em modo fechado (sem fallback remoto mascarando).
Opcional: fixe o TLS remoto com `gateway.remote.tlsFingerprint` ao usar `wss://`.
`ws://` em texto simples é apenas para loopback por padrão. Para caminhos
confiáveis de rede privada, defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` no processo cliente como medida de emergência.

Pareamento de dispositivo local:

- O pareamento de dispositivo é autoaprovado para conexões diretas locais em loopback para manter
  a experiência fluida para clientes no mesmo host.
- O OpenClaw também tem um caminho estreito de autoconexão local para backend/container
  para fluxos auxiliares confiáveis com segredo compartilhado.
- Conexões por tailnet e LAN, incluindo binds de tailnet no mesmo host, são tratadas como
  remotas para pareamento e ainda precisam de aprovação.

Modos de autenticação:

- `gateway.auth.mode: "token"`: token bearer compartilhado (recomendado para a maioria das configurações).
- `gateway.auth.mode: "password"`: autenticação por senha (prefira definir por env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: confia em um proxy reverso com reconhecimento de identidade para autenticar usuários e passar identidade via cabeçalhos (veja [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth)).

Checklist de rotação (token/senha):

1. Gere/defina um novo segredo (`gateway.auth.token` ou `OPENCLAW_GATEWAY_PASSWORD`).
2. Reinicie o Gateway (ou reinicie o app macOS se ele supervisionar o Gateway).
3. Atualize quaisquer clientes remotos (`gateway.remote.token` / `.password` em máquinas que chamam o Gateway).
4. Verifique que você não consegue mais se conectar com as credenciais antigas.

### 0.6) Cabeçalhos de identidade do Tailscale Serve

Quando `gateway.auth.allowTailscale` é `true` (padrão para Serve), o OpenClaw
aceita cabeçalhos de identidade do Tailscale Serve (`tailscale-user-login`) para autenticação da
Control UI/WebSocket. O OpenClaw verifica a identidade resolvendo o endereço
`x-forwarded-for` por meio do daemon local do Tailscale (`tailscale whois`)
e comparando-o com o cabeçalho. Isso só é acionado para solicitações que atingem loopback
e incluem `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host` como
injetados pelo Tailscale.
Para esse caminho assíncrono de verificação de identidade, tentativas com falha para o mesmo `{scope, ip}`
são serializadas antes que o limitador registre a falha. Tentativas ruins concorrentes
de um cliente Serve podem, portanto, bloquear a segunda tentativa imediatamente
em vez de passarem em corrida como dois desencontros simples.
Endpoints da API HTTP (por exemplo `/v1/*`, `/tools/invoke` e `/api/channels/*`)
**não** usam autenticação por cabeçalho de identidade do Tailscale. Eles ainda seguem o
modo de autenticação HTTP configurado no Gateway.

Observação importante de limite:

- A autenticação bearer HTTP do Gateway é, na prática, acesso de operador tudo ou nada.
- Trate credenciais que possam chamar `/v1/chat/completions`, `/v1/responses` ou `/api/channels/*` como segredos de operador com acesso total para esse Gateway.
- Na superfície HTTP compatível com OpenAI, a autenticação bearer por segredo compartilhado restaura o conjunto completo padrão de escopos de operador (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) e semântica de proprietário para turns do agente; valores mais estreitos de `x-openclaw-scopes` não reduzem esse caminho de segredo compartilhado.
- A semântica de escopo por solicitação em HTTP só se aplica quando a solicitação vem de um modo com identidade, como autenticação por proxy confiável ou `gateway.auth.mode="none"` em uma entrada privada.
- Nesses modos com identidade, omitir `x-openclaw-scopes` usa como fallback o conjunto normal de escopos padrão de operador; envie o cabeçalho explicitamente quando quiser um conjunto mais estreito.
- `/tools/invoke` segue a mesma regra de segredo compartilhado: autenticação bearer por token/senha também é tratada ali como acesso total de operador, enquanto modos com identidade ainda respeitam os escopos declarados.
- Não compartilhe essas credenciais com chamadores não confiáveis; prefira Gateways separados por limite de confiança.

**Suposição de confiança:** autenticação Serve sem token pressupõe que o host do Gateway é confiável.
Não trate isso como proteção contra processos hostis no mesmo host. Se código local não confiável
puder ser executado no host do Gateway, desabilite `gateway.auth.allowTailscale`
e exija autenticação explícita por segredo compartilhado com `gateway.auth.mode: "token"` ou
`"password"`.

**Regra de segurança:** não encaminhe esses cabeçalhos a partir do seu próprio proxy reverso. Se
você terminar TLS ou fizer proxy na frente do Gateway, desabilite
`gateway.auth.allowTailscale` e use autenticação por segredo compartilhado (`gateway.auth.mode:
"token"` ou `"password"`) ou [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth)
em vez disso.

Proxies confiáveis:

- Se você terminar TLS na frente do Gateway, defina `gateway.trustedProxies` para os IPs do seu proxy.
- O OpenClaw confiará em `x-forwarded-for` (ou `x-real-ip`) desses IPs para determinar o IP do cliente em verificações de pareamento local e autenticação/verificações locais HTTP.
- Garanta que seu proxy **sobrescreva** `x-forwarded-for` e bloqueie acesso direto à porta do Gateway.

Veja [Tailscale](/pt-BR/gateway/tailscale) e [Visão geral da web](/web).

### 0.6.1) Controle de navegador via host de node (recomendado)

Se seu Gateway for remoto, mas o navegador rodar em outra máquina, execute um **host de node**
na máquina do navegador e deixe o Gateway fazer proxy das ações do navegador (veja [Ferramenta de navegador](/pt-BR/tools/browser)).
Trate o pareamento do node como acesso de administrador.

Padrão recomendado:

- Mantenha o Gateway e o host de node na mesma tailnet (Tailscale).
- Faça o pareamento do node deliberadamente; desabilite o roteamento de proxy do navegador se não precisar dele.

Evite:

- Expor portas de relay/controle em LAN ou internet pública.
- Tailscale Funnel para endpoints de controle do navegador (exposição pública).

### 0.7) Secrets em disco (dados sensíveis)

Presuma que qualquer coisa sob `~/.openclaw/` (ou `$OPENCLAW_STATE_DIR/`) possa conter secrets ou dados privados:

- `openclaw.json`: a configuração pode incluir tokens (Gateway, Gateway remoto), configurações de provedor e allowlists.
- `credentials/**`: credenciais de canal (exemplo: credenciais do WhatsApp), allowlists de pareamento, importações legadas de OAuth.
- `agents/<agentId>/agent/auth-profiles.json`: chaves de API, perfis de token, tokens OAuth e opcionais `keyRef`/`tokenRef`.
- `secrets.json` (opcional): payload de secrets com arquivo de apoio usado por provedores `file` de SecretRef (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: arquivo legado de compatibilidade. Entradas estáticas `api_key` são removidas quando descobertas.
- `agents/<agentId>/sessions/**`: transcrições de sessão (`*.jsonl`) + metadados de roteamento (`sessions.json`) que podem conter mensagens privadas e saída de ferramentas.
- pacotes de plugin integrados: plugins instalados (mais seus `node_modules/`).
- `sandboxes/**`: workspaces de sandbox de ferramentas; podem acumular cópias de arquivos que você lê/grava dentro do sandbox.

Dicas de reforço:

- Mantenha permissões restritas (`700` em diretórios, `600` em arquivos).
- Use criptografia de disco completo no host do Gateway.
- Prefira uma conta dedicada de usuário do SO para o Gateway se o host for compartilhado.

### 0.8) Logs + transcrições (redação + retenção)

Logs e transcrições podem vazar informações sensíveis mesmo quando os controles de acesso estão corretos:

- Logs do Gateway podem incluir resumos de ferramentas, erros e URLs.
- Transcrições de sessão podem incluir secrets colados, conteúdo de arquivos, saída de comandos e links.

Recomendações:

- Mantenha a redação de resumo de ferramentas ativada (`logging.redactSensitive: "tools"`; padrão).
- Adicione padrões personalizados para seu ambiente via `logging.redactPatterns` (tokens, nomes de host, URLs internas).
- Ao compartilhar diagnósticos, prefira `openclaw status --all` (colável, com secrets redigidos) em vez de logs brutos.
- Faça limpeza de transcrições de sessão e arquivos de log antigos se você não precisar de retenção longa.

Detalhes: [Logging](/pt-BR/gateway/logging)

### 1) DMs: pairing por padrão

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 2) Grupos: exigir menção em todos os lugares

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

Em chats de grupo, responda apenas quando houver menção explícita.

### 3) Números separados (WhatsApp, Signal, Telegram)

Para canais baseados em número de telefone, considere executar sua IA em um número de telefone separado do seu pessoal:

- Número pessoal: suas conversas permanecem privadas
- Número do bot: a IA lida com elas, com limites apropriados

### 4) Modo somente leitura (via sandbox + ferramentas)

Você pode montar um perfil somente leitura combinando:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (ou `"none"` para nenhum acesso ao workspace)
- listas de allow/deny de ferramentas que bloqueiam `write`, `edit`, `apply_patch`, `exec`, `process` etc.

Opções adicionais de reforço:

- `tools.exec.applyPatch.workspaceOnly: true` (padrão): garante que `apply_patch` não possa gravar/excluir fora do diretório do workspace, mesmo quando o sandboxing estiver desligado. Defina como `false` apenas se você realmente quiser que `apply_patch` toque arquivos fora do workspace.
- `tools.fs.workspaceOnly: true` (opcional): restringe caminhos de `read`/`write`/`edit`/`apply_patch` e caminhos nativos de carregamento automático de imagem de prompt ao diretório do workspace (útil se você permite caminhos absolutos hoje e quer uma única proteção).
- Mantenha raízes do sistema de arquivos estreitas: evite raízes amplas como seu diretório home para workspaces de agente/workspaces de sandbox. Raízes amplas podem expor arquivos locais sensíveis (por exemplo estado/configuração em `~/.openclaw`) a ferramentas de sistema de arquivos.

### 5) Baseline seguro (copiar/colar)

Uma configuração “segura por padrão” que mantém o Gateway privado, exige pairing em DM e evita bots de grupo sempre ativos:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

Se você quiser execução de ferramentas também “mais segura por padrão”, adicione um sandbox + negue ferramentas perigosas para qualquer agente que não seja o proprietário (exemplo abaixo em “Perfis de acesso por agente”).

Baseline integrado para turns de agente acionados por chat: remetentes que não sejam o proprietário não podem usar as ferramentas `cron` nem `gateway`.

## Sandboxing (recomendado)

Documento dedicado: [Sandboxing](/pt-BR/gateway/sandboxing)

Duas abordagens complementares:

- **Executar o Gateway completo em Docker** (limite de container): [Docker](/pt-BR/install/docker)
- **Sandbox de ferramentas** (`agents.defaults.sandbox`, host Gateway + ferramentas isoladas em sandbox; Docker é o backend padrão): [Sandboxing](/pt-BR/gateway/sandboxing)

Observação: para evitar acesso entre agentes, mantenha `agents.defaults.sandbox.scope` em `"agent"` (padrão)
ou `"session"` para isolamento mais rígido por sessão. `scope: "shared"` usa um
único container/workspace.

Considere também o acesso ao workspace do agente dentro do sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (padrão) mantém o workspace do agente fora de alcance; as ferramentas executam em um workspace de sandbox sob `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` monta o workspace do agente como somente leitura em `/agent` (desabilita `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` monta o workspace do agente com leitura/gravação em `/workspace`
- `sandbox.docker.binds` extras são validados em relação a caminhos de origem normalizados e canonizados. Truques com symlink do diretório pai e aliases canônicos da home ainda falham em modo fechado se resolverem para raízes bloqueadas, como `/etc`, `/var/run` ou diretórios de credenciais sob a home do SO.

Importante: `tools.elevated` é a escotilha global de escape da baseline que executa exec fora do sandbox. O host efetivo é `gateway` por padrão, ou `node` quando o destino de exec está configurado como `node`. Mantenha `tools.elevated.allowFrom` restrito e não o habilite para estranhos. Você pode restringir ainda mais o elevated por agente via `agents.list[].tools.elevated`. Veja [Modo Elevated](/pt-BR/tools/elevated).

### Proteção para delegação a subagente

Se você permitir ferramentas de sessão, trate execuções delegadas de subagente como outra decisão de limite:

- Negue `sessions_spawn` a menos que o agente realmente precise de delegação.
- Mantenha `agents.defaults.subagents.allowAgents` e quaisquer substituições por agente em `agents.list[].subagents.allowAgents` restritas a agentes de destino conhecidos como seguros.
- Para qualquer fluxo de trabalho que precise permanecer em sandbox, chame `sessions_spawn` com `sandbox: "require"` (o padrão é `inherit`).
- `sandbox: "require"` falha rapidamente quando o runtime filho de destino não está em sandbox.

## Riscos do controle de navegador

Habilitar controle de navegador dá ao modelo a capacidade de operar um navegador real.
Se esse perfil de navegador já contiver sessões autenticadas, o modelo pode
acessar essas contas e dados. Trate perfis de navegador como **estado sensível**:

- Prefira um perfil dedicado para o agente (o perfil padrão `openclaw`).
- Evite apontar o agente para seu perfil pessoal de uso diário.
- Mantenha o controle de navegador no host desabilitado para agentes em sandbox, a menos que você confie neles.
- A API independente de controle de navegador em loopback honra apenas autenticação por segredo compartilhado
  (autenticação bearer com token do Gateway ou senha do Gateway). Ela não consome
  cabeçalhos de identidade de proxy confiável nem do Tailscale Serve.
- Trate downloads do navegador como entrada não confiável; prefira um diretório de downloads isolado.
- Desabilite sincronização do navegador/gerenciadores de senha no perfil do agente, se possível (reduz o raio de impacto).
- Para Gateways remotos, assuma que “controle de navegador” é equivalente a “acesso de operador” a tudo que esse perfil puder alcançar.
- Mantenha o Gateway e os hosts de node apenas na tailnet; evite expor portas de controle do navegador à LAN ou à internet pública.
- Desabilite roteamento por proxy do navegador quando não precisar (`gateway.nodes.browser.mode="off"`).
- O modo de sessão existente do Chrome MCP **não** é “mais seguro”; ele pode agir como você em tudo que esse perfil Chrome do host puder alcançar.

### Política SSRF do navegador (estrita por padrão)

A política de navegação do navegador do OpenClaw é estrita por padrão: destinos privados/internos permanecem bloqueados, a menos que você faça opt-in explícito.

- Padrão: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` não está definido, então a navegação do navegador mantém destinos privados/internos/de uso especial bloqueados.
- Alias legado: `browser.ssrfPolicy.allowPrivateNetwork` ainda é aceito por compatibilidade.
- Modo opt-in: defina `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` para permitir destinos privados/internos/de uso especial.
- No modo estrito, use `hostnameAllowlist` (padrões como `*.example.com`) e `allowedHostnames` (exceções exatas de host, incluindo nomes bloqueados como `localhost`) para exceções explícitas.
- A navegação é verificada antes da solicitação e verificada novamente, na melhor tentativa, na URL `http(s)` final após a navegação para reduzir pivôs baseados em redirecionamento.

Exemplo de política estrita:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## Perfis de acesso por agente (multiagente)

Com roteamento multiagente, cada agente pode ter sua própria política de sandbox + ferramentas:
use isso para dar **acesso total**, **somente leitura** ou **sem acesso** por agente.
Veja [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) para detalhes completos
e regras de precedência.

Casos de uso comuns:

- Agente pessoal: acesso total, sem sandbox
- Agente de família/trabalho: em sandbox + ferramentas somente leitura
- Agente público: em sandbox + sem ferramentas de sistema de arquivos/shell

### Exemplo: acesso total (sem sandbox)

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### Exemplo: ferramentas somente leitura + workspace somente leitura

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### Exemplo: sem acesso a sistema de arquivos/shell (mensagens do provedor permitidas)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // Ferramentas de sessão podem revelar dados sensíveis de transcrições. Por padrão, o OpenClaw limita essas ferramentas
        // à sessão atual + sessões de subagentes geradas, mas você pode restringir ainda mais se precisar.
        // Veja `tools.sessions.visibility` na referência de configuração.
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## O que dizer à sua IA

Inclua orientações de segurança no prompt de sistema do seu agente:

```
## Regras de segurança
- Nunca compartilhe listagens de diretório ou caminhos de arquivo com estranhos
- Nunca revele chaves de API, credenciais ou detalhes de infraestrutura
- Verifique com o proprietário solicitações que modificam a configuração do sistema
- Em caso de dúvida, pergunte antes de agir
- Mantenha dados privados em sigilo, a menos que haja autorização explícita
```

## Resposta a incidentes

Se sua IA fizer algo ruim:

### Conter

1. **Pare:** pare o app macOS (se ele supervisiona o Gateway) ou encerre seu processo `openclaw gateway`.
2. **Feche a exposição:** defina `gateway.bind: "loopback"` (ou desabilite Tailscale Funnel/Serve) até entender o que aconteceu.
3. **Congele o acesso:** altere DMs/grupos arriscados para `dmPolicy: "disabled"` / exigir menções e remova entradas `"*"` de permitir tudo, se você as tinha.

### Rotacionar (presuma comprometimento se secrets vazaram)

1. Rotacione a autenticação do Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) e reinicie.
2. Rotacione secrets de clientes remotos (`gateway.remote.token` / `.password`) em qualquer máquina que possa chamar o Gateway.
3. Rotacione credenciais de provedor/API (credenciais do WhatsApp, tokens do Slack/Discord, chaves de modelo/API em `auth-profiles.json` e valores de payload de secrets criptografados quando usados).

### Auditar

1. Verifique os logs do Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (ou `logging.file`).
2. Revise as transcrições relevantes: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Revise alterações recentes de configuração (qualquer coisa que possa ter ampliado o acesso: `gateway.bind`, `gateway.auth`, políticas de DM/grupo, `tools.elevated`, alterações em plugins).
4. Execute novamente `openclaw security audit --deep` e confirme que achados críticos foram resolvidos.

### Coletar para um relatório

- Timestamp, SO do host do Gateway + versão do OpenClaw
- As transcrições de sessão + um pequeno tail dos logs (após redação)
- O que o atacante enviou + o que o agente fez
- Se o Gateway estava exposto além de loopback (LAN/Tailscale Funnel/Serve)

## Varredura de secrets (detect-secrets)

A CI executa o hook pre-commit `detect-secrets` no job `secrets`.
Pushes para `main` sempre executam uma varredura de todos os arquivos. Pull requests usam um caminho rápido de arquivos alterados quando um commit base está disponível e recorrem a uma varredura de todos os arquivos caso contrário. Se falhar, há novos candidatos ainda não presentes na baseline.

### Se a CI falhar

1. Reproduza localmente:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. Entenda as ferramentas:
   - `detect-secrets` no pre-commit executa `detect-secrets-hook` com a baseline e as exclusões do repositório.
   - `detect-secrets audit` abre uma revisão interativa para marcar cada item da baseline como real ou falso positivo.
3. Para secrets reais: rotacione/remova-os e depois execute novamente a varredura para atualizar a baseline.
4. Para falsos positivos: execute a auditoria interativa e marque-os como falsos:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. Se você precisar de novas exclusões, adicione-as a `.detect-secrets.cfg` e regenere a
   baseline com flags correspondentes `--exclude-files` / `--exclude-lines` (o arquivo de configuração
   é apenas de referência; o detect-secrets não o lê automaticamente).

Faça commit da `.secrets.baseline` atualizada quando ela refletir o estado pretendido.

## Relatando problemas de segurança

Encontrou uma vulnerabilidade no OpenClaw? Faça um relato responsável:

1. E-mail: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Não publique publicamente até que seja corrigida
3. Daremos crédito a você (a menos que prefira anonimato)
