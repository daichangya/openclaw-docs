---
read_when:
    - Procurando o status do app complementar para Linux
    - Planejando cobertura de plataforma ou contribuições
summary: Suporte a Linux + status do app complementar
title: App Linux
x-i18n:
    generated_at: "2026-04-05T12:47:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5dbfc89eb65e04347479fc6c9a025edec902fb0c544fb8d5bd09c24558ea03b1
    source_path: platforms/linux.md
    workflow: 15
---

# App Linux

O Gateway tem suporte completo no Linux. **Node é o runtime recomendado**.
Bun não é recomendado para o Gateway (bugs em WhatsApp/Telegram).

Apps complementares nativos para Linux estão planejados. Contribuições são bem-vindas se você quiser ajudar a criar um.

## Caminho rápido para iniciantes (VPS)

1. Instale Node 24 (recomendado; Node 22 LTS, atualmente `22.14+`, ainda funciona por compatibilidade)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. No seu laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Abra `http://127.0.0.1:18789/` e autentique-se com o segredo compartilhado configurado (token por padrão; senha se você definir `gateway.auth.mode: "password"`)

Guia completo para servidor Linux: [Servidor Linux](/vps). Exemplo passo a passo em VPS: [exe.dev](/install/exe-dev)

## Instalação

- [Primeiros passos](/pt-BR/start/getting-started)
- [Instalação e atualizações](/install/updating)
- Fluxos opcionais: [Bun (experimental)](/install/bun), [Nix](/install/nix), [Docker](/install/docker)

## Gateway

- [Runbook do Gateway](/gateway)
- [Configuração](/gateway/configuration)

## Instalação do serviço Gateway (CLI)

Use um destes:

```
openclaw onboard --install-daemon
```

Ou:

```
openclaw gateway install
```

Ou:

```
openclaw configure
```

Selecione **Gateway service** quando solicitado.

Reparar/migrar:

```
openclaw doctor
```

## Controle do sistema (unidade de usuário do systemd)

O OpenClaw instala por padrão um serviço de **usuário** do systemd. Use um serviço de **sistema**
para servidores compartilhados ou sempre ativos. `openclaw gateway install` e
`openclaw onboard --install-daemon` já renderizam para você a unidade canônica atual;
escreva uma manualmente apenas quando precisar de uma configuração personalizada de sistema/gerenciador de serviços.
A orientação completa sobre serviços está no [runbook do Gateway](/gateway).

Configuração mínima:

Crie `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

Ative-o:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```
