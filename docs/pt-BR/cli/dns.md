---
read_when:
    - Você quer descoberta de área ampla (DNS-SD) via Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Referência da CLI para `openclaw dns` (auxiliares de descoberta de área ampla)
title: dns
x-i18n:
    generated_at: "2026-04-05T12:37:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4831fbb7791adfed5195bc4ba36bb248d2bc8830958334211d3c96f824617927
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

Auxiliares de DNS para descoberta de área ampla (Tailscale + CoreDNS). Atualmente focado em macOS + CoreDNS via Homebrew.

Relacionado:

- Descoberta do Gateway: [Discovery](/gateway/discovery)
- Configuração de descoberta de área ampla: [Configuration](/gateway/configuration)

## Configuração

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Planeje ou aplique a configuração do CoreDNS para descoberta unicast DNS-SD.

Opções:

- `--domain <domain>`: domínio de descoberta de área ampla (por exemplo `openclaw.internal`)
- `--apply`: instala ou atualiza a configuração do CoreDNS e reinicia o serviço (requer sudo; apenas macOS)

O que ele mostra:

- domínio de descoberta resolvido
- caminho do arquivo de zona
- IPs atuais da tailnet
- configuração de descoberta recomendada para `openclaw.json`
- os valores de nameserver/domínio do Tailscale Split DNS a serem definidos

Observações:

- Sem `--apply`, o comando é apenas um auxiliar de planejamento e imprime a configuração recomendada.
- Se `--domain` for omitido, o OpenClaw usa `discovery.wideArea.domain` da configuração.
- Atualmente, `--apply` oferece suporte apenas a macOS e espera CoreDNS do Homebrew.
- `--apply` inicializa o arquivo de zona, se necessário, garante que o bloco de importação do CoreDNS exista e reinicia o serviço `coredns` do brew.
