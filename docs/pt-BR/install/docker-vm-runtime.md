---
read_when:
    - Você está implantando o OpenClaw em uma VM em nuvem com Docker
    - Você precisa do fluxo compartilhado de bake binário, persistência e atualização
summary: Etapas compartilhadas de runtime de VM Docker para hosts de Gateway OpenClaw de longa duração
title: Runtime de VM Docker
x-i18n:
    generated_at: "2026-04-05T12:44:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854403a48fe15a88cc9befb9bebe657f1a7c83f1df2ebe2346fac9a6e4b16992
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

# Runtime de VM Docker

Etapas de runtime compartilhadas para instalações Docker em VM, como GCP, Hetzner e provedores VPS semelhantes.

## Faça o bake dos binários necessários na imagem

Instalar binários dentro de um contêiner em execução é uma armadilha.
Tudo o que for instalado em runtime será perdido no reinício.

Todos os binários externos exigidos por Skills devem ser instalados no momento do build da imagem.

Os exemplos abaixo mostram apenas três binários comuns:

- `gog` para acesso ao Gmail
- `goplaces` para Google Places
- `wacli` para WhatsApp

Esses são exemplos, não uma lista completa.
Você pode instalar quantos binários forem necessários usando o mesmo padrão.

Se mais tarde você adicionar novas Skills que dependam de binários adicionais, será necessário:

1. Atualizar o Dockerfile
2. Recompilar a imagem
3. Reiniciar os contêineres

**Exemplo de Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
As URLs de download acima são para x86_64 (amd64). Para VMs baseadas em ARM (por exemplo, Hetzner ARM, GCP Tau T2A), substitua as URLs de download pelas variantes ARM64 apropriadas na página de releases de cada ferramenta.
</Note>

## Build e inicialização

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Se o build falhar com `Killed` ou `exit code 137` durante `pnpm install --frozen-lockfile`, a VM está sem memória.
Use uma classe de máquina maior antes de tentar novamente.

Verifique os binários:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Saída esperada:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Verifique o Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Saída esperada:

```
[gateway] listening on ws://0.0.0.0:18789
```

## O que persiste e onde

O OpenClaw é executado no Docker, mas o Docker não é a fonte de verdade.
Todo estado de longa duração deve sobreviver a reinicializações, rebuilds e reboots.

| Componente           | Localização                      | Mecanismo de persistência | Observações                                                   |
| -------------------- | -------------------------------- | ------------------------- | ------------------------------------------------------------- |
| Config do Gateway    | `/home/node/.openclaw/`          | Montagem de volume do host | Inclui `openclaw.json`, `.env`                               |
| Perfis de autenticação de modelo | `/home/node/.openclaw/agents/` | Montagem de volume do host | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API keys) |
| Configs de Skills    | `/home/node/.openclaw/skills/`   | Montagem de volume do host | Estado no nível de Skill                                      |
| Workspace do agente  | `/home/node/.openclaw/workspace/` | Montagem de volume do host | Código e artifacts do agente                                  |
| Sessão do WhatsApp   | `/home/node/.openclaw/`          | Montagem de volume do host | Preserva o login por QR                                       |
| Keyring do Gmail     | `/home/node/.openclaw/`          | Volume do host + senha    | Exige `GOG_KEYRING_PASSWORD`                                  |
| Binários externos    | `/usr/local/bin/`                | Imagem Docker             | Devem ser incluídos no build                                  |
| Runtime do Node      | Sistema de arquivos do contêiner | Imagem Docker             | Recompilado a cada build de imagem                            |
| Pacotes do SO        | Sistema de arquivos do contêiner | Imagem Docker             | Não instale em runtime                                        |
| Contêiner Docker     | Efêmero                          | Reiniciável               | Seguro para destruir                                          |

## Atualizações

Para atualizar o OpenClaw na VM:

```bash
git pull
docker compose build
docker compose up -d
```
