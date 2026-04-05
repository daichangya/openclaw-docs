---
read_when:
    - Trabalhando em recursos do canal Google Chat
summary: Status de suporte do app Google Chat, capacidades e configuração
title: Google Chat
x-i18n:
    generated_at: "2026-04-05T12:35:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 570894ed798dd0b9ba42806b050927216379a1228fcd2f96de565bc8a4ac7c2c
    source_path: channels/googlechat.md
    workflow: 15
---

# Google Chat (API do Chat)

Status: pronto para DMs + espaços via webhooks da API do Google Chat (somente HTTP).

## Configuração rápida (iniciante)

1. Crie um projeto no Google Cloud e ative a **Google Chat API**.
   - Acesse: [Credenciais da Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Ative a API se ela ainda não estiver ativada.
2. Crie uma **Service Account**:
   - Pressione **Create Credentials** > **Service Account**.
   - Dê o nome que quiser (por exemplo, `openclaw-chat`).
   - Deixe as permissões em branco (pressione **Continue**).
   - Deixe os principais com acesso em branco (pressione **Done**).
3. Crie e baixe a **JSON Key**:
   - Na lista de contas de serviço, clique na que você acabou de criar.
   - Vá até a aba **Keys**.
   - Clique em **Add Key** > **Create new key**.
   - Selecione **JSON** e pressione **Create**.
4. Armazene o arquivo JSON baixado no seu host do gateway (por exemplo, `~/.openclaw/googlechat-service-account.json`).
5. Crie um app do Google Chat na [Configuração do Chat no Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Preencha as **Application info**:
     - **App name**: (por exemplo, `OpenClaw`)
     - **Avatar URL**: (por exemplo, `https://openclaw.ai/logo.png`)
     - **Description**: (por exemplo, `Assistente pessoal de IA`)
   - Ative **Interactive features**.
   - Em **Functionality**, marque **Join spaces and group conversations**.
   - Em **Connection settings**, selecione **HTTP endpoint URL**.
   - Em **Triggers**, selecione **Use a common HTTP endpoint URL for all triggers** e defina-o como a URL pública do seu gateway seguida de `/googlechat`.
     - _Dica: execute `openclaw status` para encontrar a URL pública do seu gateway._
   - Em **Visibility**, marque **Make this Chat app available to specific people and groups in &lt;Your Domain&gt;**.
   - Digite seu endereço de email (por exemplo, `user@example.com`) na caixa de texto.
   - Clique em **Save** na parte inferior.
6. **Ative o status do app**:
   - Após salvar, **atualize a página**.
   - Procure a seção **App status** (geralmente perto do topo ou da parte inferior após salvar).
   - Altere o status para **Live - available to users**.
   - Clique em **Save** novamente.
7. Configure o OpenClaw com o caminho da conta de serviço + audiência do webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Ou config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Defina o tipo + valor da audiência do webhook (corresponde à configuração do seu app do Chat).
9. Inicie o gateway. O Google Chat enviará requisições POST para o caminho do seu webhook.

## Adicionar ao Google Chat

Quando o gateway estiver em execução e seu email tiver sido adicionado à lista de visibilidade:

1. Acesse [Google Chat](https://chat.google.com/).
2. Clique no ícone **+** (mais) ao lado de **Direct Messages**.
3. Na barra de pesquisa (onde você normalmente adiciona pessoas), digite o **App name** que você configurou no Google Cloud Console.
   - **Observação**: o bot _não_ aparecerá na lista de navegação do "Marketplace" porque é um app privado. Você precisa procurá-lo pelo nome.
4. Selecione seu bot nos resultados.
5. Clique em **Add** ou **Chat** para iniciar uma conversa 1:1.
6. Envie "Hello" para acionar o assistente!

## URL pública (somente webhook)

Os webhooks do Google Chat exigem um endpoint HTTPS público. Por segurança, **exponha somente o caminho `/googlechat`** à internet. Mantenha o painel do OpenClaw e outros endpoints sensíveis na sua rede privada.

### Opção A: Tailscale Funnel (recomendado)

Use o Tailscale Serve para o painel privado e o Funnel para o caminho público do webhook. Isso mantém `/` privado enquanto expõe apenas `/googlechat`.

1. **Verifique em qual endereço seu gateway está vinculado:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Observe o endereço IP (por exemplo, `127.0.0.1`, `0.0.0.0` ou seu IP Tailscale como `100.x.x.x`).

2. **Exponha o painel apenas para a tailnet (porta 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Exponha publicamente apenas o caminho do webhook:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autorize o nó para acesso ao Funnel:**
   Se solicitado, visite a URL de autorização mostrada na saída para ativar o Funnel para este nó na política da sua tailnet.

5. **Verifique a configuração:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Sua URL pública do webhook será:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Seu painel privado permanece somente na tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Use a URL pública (sem `:8443`) na configuração do app do Google Chat.

> Observação: essa configuração persiste após reinicializações. Para removê-la depois, execute `tailscale funnel reset` e `tailscale serve reset`.

### Opção B: Proxy reverso (Caddy)

Se você usar um proxy reverso como o Caddy, encaminhe apenas o caminho específico:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Com essa configuração, qualquer solicitação para `your-domain.com/` será ignorada ou retornará 404, enquanto `your-domain.com/googlechat` será roteado com segurança para o OpenClaw.

### Opção C: Cloudflare Tunnel

Configure as regras de ingress do seu túnel para rotear apenas o caminho do webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Como funciona

1. O Google Chat envia requisições POST do webhook para o gateway. Cada solicitação inclui um cabeçalho `Authorization: Bearer <token>`.
   - O OpenClaw verifica a autenticação bearer antes de ler/analisar corpos completos de webhook quando o cabeçalho está presente.
   - Solicitações do Google Workspace Add-on que carregam `authorizationEventObject.systemIdToken` no corpo são compatíveis por meio de um orçamento de corpo pré-autenticação mais rígido.
2. O OpenClaw verifica o token em relação ao `audienceType` + `audience` configurados:
   - `audienceType: "app-url"` → a audiência é sua URL HTTPS do webhook.
   - `audienceType: "project-number"` → a audiência é o número do projeto no Cloud.
3. As mensagens são roteadas por espaço:
   - DMs usam a chave de sessão `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Espaços usam a chave de sessão `agent:<agentId>:googlechat:group:<spaceId>`.
4. O acesso a DMs usa pairing por padrão. Remetentes desconhecidos recebem um código de pairing; aprove com:
   - `openclaw pairing approve googlechat <code>`
5. Espaços em grupo exigem @menção por padrão. Use `botUser` se a detecção de menção precisar do nome de usuário do app.

## Destinos

Use estes identificadores para entrega e listas de permissões:

- Mensagens diretas: `users/<userId>` (recomendado).
- O email bruto `name@example.com` é mutável e só é usado para correspondência direta em lista de permissões quando `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsoleto: `users/<email>` é tratado como um id de usuário, não como uma lista de permissões por email.
- Espaços: `spaces/<spaceId>`.

## Destaques de configuração

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Observações:

- As credenciais da conta de serviço também podem ser passadas inline com `serviceAccount` (string JSON).
- `serviceAccountRef` também é compatível (SecretRef de env/arquivo), incluindo refs por conta em `channels.googlechat.accounts.<id>.serviceAccountRef`.
- O caminho padrão do webhook é `/googlechat` se `webhookPath` não estiver definido.
- `dangerouslyAllowNameMatching` reativa a correspondência de principal por email mutável para listas de permissões (modo de compatibilidade break-glass).
- Reações estão disponíveis via a ferramenta `reactions` e `channels action` quando `actions.reactions` está ativado.
- As ações de mensagem expõem `send` para texto e `upload-file` para envios explícitos de anexos. `upload-file` aceita `media` / `filePath` / `path` mais `message`, `filename` e direcionamento de thread opcionais.
- `typingIndicator` oferece suporte a `none`, `message` (padrão) e `reaction` (reaction requer OAuth do usuário).
- Os anexos são baixados pela API do Chat e armazenados no pipeline de mídia (tamanho limitado por `mediaMaxMb`).

Detalhes de referência de segredos: [Gerenciamento de segredos](/gateway/secrets).

## Solução de problemas

### 405 Method Not Allowed

Se o Google Cloud Logs Explorer mostrar erros como:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Isso significa que o manipulador do webhook não está registrado. Causas comuns:

1. **Canal não configurado**: a seção `channels.googlechat` está ausente da sua configuração. Verifique com:

   ```bash
   openclaw config get channels.googlechat
   ```

   Se retornar "Config path not found", adicione a configuração (consulte [Destaques de configuração](#config-highlights)).

2. **Plugin não ativado**: verifique o status do plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Se mostrar "disabled", adicione `plugins.entries.googlechat.enabled: true` à sua configuração.

3. **Gateway não reiniciado**: após adicionar a configuração, reinicie o gateway:

   ```bash
   openclaw gateway restart
   ```

Verifique se o canal está em execução:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Outros problemas

- Verifique `openclaw channels status --probe` para erros de autenticação ou ausência de configuração de audiência.
- Se nenhuma mensagem chegar, confirme a URL do webhook + as assinaturas de eventos do app do Chat.
- Se o bloqueio por menção impedir respostas, defina `botUser` como o nome do recurso de usuário do app e verifique `requireMention`.
- Use `openclaw logs --follow` enquanto envia uma mensagem de teste para ver se as solicitações chegam ao gateway.

Documentação relacionada:

- [Configuração do gateway](/gateway/configuration)
- [Segurança](/gateway/security)
- [Reactions](/tools/reactions)

## Relacionado

- [Visão geral dos canais](/channels) — todos os canais compatíveis
- [Pairing](/channels/pairing) — autenticação de DM e fluxo de pairing
- [Grupos](/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Roteamento de canais](/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/gateway/security) — modelo de acesso e reforço de segurança
