---
read_when:
    - Birden fazla yalıtılmış agent istiyorsunuz (çalışma alanları + yönlendirme + kimlik doğrulama)
summary: '`openclaw agents` için CLI başvurusu (listele/ekle/sil/bindings/bind/unbind/kimlik ayarla)'
title: Agent’lar
x-i18n:
    generated_at: "2026-04-25T13:43:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd0698f0821f9444e84cd82fe78ee46071447fb4c3cada6d1a98b5130147691
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Yalıtılmış agent’ları yönetin (çalışma alanları + kimlik doğrulama + yönlendirme).

İlgili:

- Çoklu agent yönlendirme: [Multi-Agent Routing](/tr/concepts/multi-agent)
- Agent çalışma alanı: [Agent workspace](/tr/concepts/agent-workspace)
- Skills görünürlüğü yapılandırması: [Skills config](/tr/tools/skills-config)

## Örnekler

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Yönlendirme bağları

Gelen kanal trafiğini belirli bir agent’a sabitlemek için yönlendirme bağlarını kullanın.

Agent başına farklı görünür Skills da istiyorsanız, `openclaw.json` içinde
`agents.defaults.skills` ve `agents.list[].skills` ayarlarını yapılandırın. Bkz.
[Skills config](/tr/tools/skills-config) ve
[Configuration Reference](/tr/gateway/config-agents#agents-defaults-skills).

Bağları listeleyin:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Bağ ekleyin:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

`accountId` değerini çıkarırsanız (`--bind <channel>`), OpenClaw bunu kanal varsayılanlarından ve varsa plugin kurulum hook’larından çözümler.

`bind` veya `unbind` için `--agent` verilmezse, OpenClaw geçerli varsayılan agent’ı hedefler.

### Bağ kapsamı davranışı

- `accountId` içermeyen bir bağ yalnızca kanalın varsayılan hesabıyla eşleşir.
- `accountId: "*"` kanal genelindeki geri dönüş bağdır (tüm hesaplar) ve açık bir hesap bağından daha az özeldir.
- Aynı agent zaten `accountId` içermeyen eşleşen bir kanal bağına sahipse ve daha sonra açık veya çözümlenmiş bir `accountId` ile bağlarsanız, OpenClaw yinelenen bir bağ eklemek yerine mevcut bağı yerinde yükseltir.

Örnek:

```bash
# ilk yalnızca kanal bağı
openclaw agents bind --agent work --bind telegram

# daha sonra hesap kapsamlı bağa yükselt
openclaw agents bind --agent work --bind telegram:ops
```

Yükseltmeden sonra, bu bağ için yönlendirme `telegram:ops` kapsamına alınır. Varsayılan hesap yönlendirmesi de istiyorsanız, bunu açıkça ekleyin (örneğin `--bind telegram:default`).

Bağları kaldırın:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind`, `--all` veya bir ya da daha fazla `--bind` değeri kabul eder; ikisini birden kabul etmez.

## Komut yüzeyi

### `agents`

`openclaw agents` komutunu alt komut olmadan çalıştırmak, `openclaw agents list` ile eşdeğerdir.

### `agents list`

Seçenekler:

- `--json`
- `--bindings`: yalnızca agent başına sayı/özetler değil, tam yönlendirme kurallarını içerir

### `agents add [name]`

Seçenekler:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (tekrarlanabilir)
- `--non-interactive`
- `--json`

Notlar:

- Açık `add` bayraklarından herhangi birini geçirmek, komutu etkileşimsiz yola geçirir.
- Etkileşimsiz mod hem bir agent adı hem de `--workspace` gerektirir.
- `main` ayrılmıştır ve yeni agent kimliği olarak kullanılamaz.

### `agents bindings`

Seçenekler:

- `--agent <id>`
- `--json`

### `agents bind`

Seçenekler:

- `--agent <id>` (varsayılan olarak geçerli varsayılan agent)
- `--bind <channel[:accountId]>` (tekrarlanabilir)
- `--json`

### `agents unbind`

Seçenekler:

- `--agent <id>` (varsayılan olarak geçerli varsayılan agent)
- `--bind <channel[:accountId]>` (tekrarlanabilir)
- `--all`
- `--json`

### `agents delete <id>`

Seçenekler:

- `--force`
- `--json`

Notlar:

- `main` silinemez.
- `--force` olmadan etkileşimli onay gerekir.
- Çalışma alanı, agent durumu ve oturum transcript dizinleri kalıcı olarak silinmez, Çöp’e taşınır.
- Başka bir agent’ın çalışma alanı aynı yolsa, bu çalışma alanının içindeyse veya bu çalışma alanını içeriyorsa,
  çalışma alanı korunur ve `--json`, `workspaceRetained`,
  `workspaceRetainedReason` ve `workspaceSharedWith` değerlerini bildirir.

## Kimlik dosyaları

Her agent çalışma alanı, çalışma alanı kökünde bir `IDENTITY.md` içerebilir:

- Örnek yol: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity`, çalışma alanı kökünden (veya açık bir `--identity-file` yolundan) okur

Avatar yolları çalışma alanı köküne göre çözümlenir.

## Kimlik ayarla

`set-identity`, alanları `agents.list[].identity` içine yazar:

- `name`
- `theme`
- `emoji`
- `avatar` (çalışma alanına göreli yol, http(s) URL’si veya data URI)

Seçenekler:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Notlar:

- Hedef agent’ı seçmek için `--agent` veya `--workspace` kullanılabilir.
- `--workspace` kullanıyorsanız ve birden fazla agent bu çalışma alanını paylaşıyorsa, komut başarısız olur ve `--agent` geçirmenizi ister.
- Açık kimlik alanları verilmediğinde, komut kimlik verilerini `IDENTITY.md` dosyasından okur.

`IDENTITY.md` dosyasından yükleyin:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Alanları açıkça geçersiz kılın:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Yapılandırma örneği:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## İlgili

- [CLI reference](/tr/cli)
- [Multi-agent routing](/tr/concepts/multi-agent)
- [Agent workspace](/tr/concepts/agent-workspace)
