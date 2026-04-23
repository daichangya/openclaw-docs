---
read_when:
    - Birden fazla yalıtılmış agent istiyorsunuz (çalışma alanları + yönlendirme + kimlik doğrulama).
summary: '`openclaw agents` için CLI başvurusu (list/add/delete/bindings/bind/unbind/set identity)'
title: agent'lar
x-i18n:
    generated_at: "2026-04-23T08:59:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: f328d9f4ce636ce27defdcbcc48b1ca041bc25d0888c3e4df0dd79840f44ca8f
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Yalıtılmış agent'ları yönetin (çalışma alanları + kimlik doğrulama + yönlendirme).

İlgili:

- Çok agent'lı yönlendirme: [Çok Agent'lı Yönlendirme](/tr/concepts/multi-agent)
- Agent çalışma alanı: [Agent çalışma alanı](/tr/concepts/agent-workspace)
- Skills görünürlüğü yapılandırması: [Skills yapılandırması](/tr/tools/skills-config)

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

Gelen kanal trafiğini belirli bir agent'a sabitlemek için yönlendirme bağlarını kullanın.

Her agent için farklı görünür Skills de istiyorsanız,
`openclaw.json` içinde `agents.defaults.skills` ve `agents.list[].skills` alanlarını yapılandırın. Bkz.
[Skills yapılandırması](/tr/tools/skills-config) ve
[Yapılandırma Başvurusu](/tr/gateway/configuration-reference#agents-defaults-skills).

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

`accountId` değerini atlayırsanız (`--bind <channel>`), OpenClaw bunu mevcut olduğunda kanal varsayılanları ve Plugin kurulum kancalarından çözer.

`bind` veya `unbind` için `--agent` verilmezse, OpenClaw geçerli varsayılan agent'ı hedefler.

### Bağ kapsamı davranışı

- `accountId` olmayan bir bağ yalnızca kanal varsayılan hesabıyla eşleşir.
- `accountId: "*"` kanal genelindeki geri dönüş değeridir (tüm hesaplar) ve açık bir hesap bağından daha az özeldir.
- Aynı agent zaten `accountId` olmadan eşleşen bir kanal bağına sahipse ve daha sonra açık veya çözülmüş bir `accountId` ile bağ kurarsanız, OpenClaw yinelenen bir bağ eklemek yerine mevcut bağı yerinde yükseltir.

Örnek:

```bash
# ilk yalnızca kanal bağı
openclaw agents bind --agent work --bind telegram

# daha sonra hesap kapsamlı bağa yükseltme
openclaw agents bind --agent work --bind telegram:ops
```

Yükseltmeden sonra, bu bağ için yönlendirme `telegram:ops` kapsamına alınır. Varsayılan hesap yönlendirmesi de istiyorsanız bunu açıkça ekleyin (örneğin `--bind telegram:default`).

Bağları kaldırın:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind`, her ikisini birden değil, ya `--all` ya da bir veya daha fazla `--bind` değeri kabul eder.

## Komut yüzeyi

### `agents`

`openclaw agents` komutunu alt komut olmadan çalıştırmak, `openclaw agents list` ile eşdeğerdir.

### `agents list`

Seçenekler:

- `--json`
- `--bindings`: yalnızca agent başına sayılar/özetler değil, tam yönlendirme kurallarını içerir

### `agents add [name]`

Seçenekler:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (tekrarlanabilir)
- `--non-interactive`
- `--json`

Notlar:

- Herhangi bir açık add bayrağı geçirmek komutu etkileşimsiz yola geçirir.
- Etkileşimsiz mod hem agent adı hem de `--workspace` gerektirir.
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
- Çalışma alanı, agent durumu ve oturum transkript dizinleri kalıcı olarak silinmez, Çöp Kutusu'na taşınır.

## Kimlik dosyaları

Her agent çalışma alanı, çalışma alanı kökünde bir `IDENTITY.md` içerebilir:

- Örnek yol: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity`, çalışma alanı kökünden (veya açık bir `--identity-file` yolundan) okur

Avatar yolları, çalışma alanı köküne göre çözülür.

## Kimliği ayarla

`set-identity`, alanları `agents.list[].identity` içine yazar:

- `name`
- `theme`
- `emoji`
- `avatar` (çalışma alanına göreli yol, http(s) URL'si veya veri URI'si)

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

- Hedef agent'ı seçmek için `--agent` veya `--workspace` kullanılabilir.
- `--workspace` kullanıyorsanız ve birden fazla agent aynı çalışma alanını paylaşıyorsa, komut başarısız olur ve sizden `--agent` geçirmenizi ister.
- Açık kimlik alanları verilmediğinde komut kimlik verilerini `IDENTITY.md` dosyasından okur.

`IDENTITY.md` dosyasından yükleme:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Alanları açıkça geçersiz kılma:

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
