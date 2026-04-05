---
read_when:
    - Configurando ou depurando o controle remoto no macOS
summary: Fluxo do app macOS para controlar um gateway OpenClaw remoto por SSH
title: Controle remoto
x-i18n:
    generated_at: "2026-04-05T12:48:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96e46e603c2275d04596b5d1ae0fb6858bd1a102a727dc13924ffcd9808fdf7e
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw remoto (macOS ⇄ host remoto)

Este fluxo permite que o app macOS atue como um controle remoto completo para um gateway OpenClaw em execução em outro host (desktop/servidor). Esse é o recurso **Remote over SSH** (execução remota) do app. Todos os recursos — verificações de integridade, encaminhamento do Voice Wake e Web Chat — reutilizam a mesma configuração remota de SSH em _Settings → General_.

## Modos

- **Local (este Mac)**: Tudo é executado no laptop. Não há SSH envolvido.
- **Remote over SSH (padrão)**: Os comandos do OpenClaw são executados no host remoto. O app macOS abre uma conexão SSH com `-o BatchMode`, além da identidade/chave escolhida e um encaminhamento de porta local.
- **Remote direct (ws/wss)**: Sem túnel SSH. O app macOS se conecta diretamente à URL do gateway (por exemplo, via Tailscale Serve ou um proxy reverso HTTPS público).

## Transportes remotos

O modo remoto oferece suporte a dois transportes:

- **Túnel SSH** (padrão): Usa `ssh -N -L ...` para encaminhar a porta do gateway para localhost. O gateway verá o IP do nó como `127.0.0.1` porque o túnel usa loopback.
- **Direto (ws/wss)**: Conecta diretamente à URL do gateway. O gateway vê o IP real do cliente.

## Pré-requisitos no host remoto

1. Instale Node + pnpm e compile/instale a CLI do OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Garanta que `openclaw` esteja no PATH para shells não interativos (crie um symlink em `/usr/local/bin` ou `/opt/homebrew/bin`, se necessário).
3. Habilite SSH com autenticação por chave. Recomendamos IPs do **Tailscale** para alcance estável fora da LAN.

## Configuração do app macOS

1. Abra _Settings → General_.
2. Em **OpenClaw runs**, escolha **Remote over SSH** e configure:
   - **Transport**: **SSH tunnel** ou **Direct (ws/wss)**.
   - **SSH target**: `user@host` (`:port` opcional).
     - Se o gateway estiver na mesma LAN e anunciar Bonjour, escolha-o na lista detectada para preencher esse campo automaticamente.
   - **Gateway URL** (somente Direct): `wss://gateway.example.ts.net` (ou `ws://...` para local/LAN).
   - **Identity file** (avançado): caminho para sua chave.
   - **Project root** (avançado): caminho do checkout remoto usado nos comandos.
   - **CLI path** (avançado): caminho opcional para um entrypoint/binário `openclaw` executável (preenchido automaticamente quando anunciado).
3. Clique em **Test remote**. O sucesso indica que `openclaw status --json` é executado corretamente no host remoto. As falhas geralmente significam problemas de PATH/CLI; saída 127 significa que a CLI não foi encontrada remotamente.
4. As verificações de integridade e o Web Chat agora serão executados automaticamente por esse túnel SSH.

## Web Chat

- **Túnel SSH**: O Web Chat se conecta ao gateway pela porta de controle WebSocket encaminhada (padrão 18789).
- **Direto (ws/wss)**: O Web Chat se conecta diretamente à URL do gateway configurada.
- Não existe mais um servidor HTTP separado para WebChat.

## Permissões

- O host remoto precisa das mesmas aprovações de TCC que o modo local (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Execute o onboarding nessa máquina para concedê-las uma vez.
- Os nós anunciam o estado de suas permissões via `node.list` / `node.describe` para que os agentes saibam o que está disponível.

## Observações de segurança

- Prefira binds em loopback no host remoto e conecte-se via SSH ou Tailscale.
- O túnel SSH usa verificação estrita da chave do host; confie primeiro na chave do host para que ela exista em `~/.ssh/known_hosts`.
- Se você fizer bind do Gateway em uma interface diferente de loopback, exija autenticação válida do Gateway: token, senha ou um proxy reverso com reconhecimento de identidade com `gateway.auth.mode: "trusted-proxy"`.
- Consulte [Security](/pt-BR/gateway/security) e [Tailscale](/pt-BR/gateway/tailscale).

## Fluxo de login do WhatsApp (remoto)

- Execute `openclaw channels login --verbose` **no host remoto**. Escaneie o QR com o WhatsApp no seu telefone.
- Execute o login novamente nesse host se a autenticação expirar. A verificação de integridade mostrará problemas de vínculo.

## Solução de problemas

- **exit 127 / not found**: `openclaw` não está no PATH para shells não interativos. Adicione-o a `/etc/paths`, ao rc do seu shell ou crie um symlink em `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: verifique a conectividade SSH, o PATH e se o Baileys está conectado (`openclaw status --json`).
- **Web Chat travado**: confirme que o gateway está em execução no host remoto e que a porta encaminhada corresponde à porta WS do gateway; a UI requer uma conexão WS íntegra.
- **O IP do nó mostra 127.0.0.1**: isso é esperado com o túnel SSH. Mude **Transport** para **Direct (ws/wss)** se você quiser que o gateway veja o IP real do cliente.
- **Voice Wake**: as frases de ativação são encaminhadas automaticamente no modo remoto; não é necessário um encaminhador separado.

## Sons de notificação

Escolha sons por notificação a partir de scripts com `openclaw` e `node.invoke`, por exemplo:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Não existe mais um botão global de “som padrão” no app; quem chama escolhe um som (ou nenhum) por solicitação.
