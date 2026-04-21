---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Bir aracın neden engellendiği: sandbox çalışma zamanı, araç izin/verme politikası ve yükseltilmiş yürütme geçitleri'
title: Sandbox ve Araç Politikası ve Yükseltilmiş Yetki
x-i18n:
    generated_at: "2026-04-21T08:59:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a85378343df0594be451212cb4c95b349a0cc7cd1f242b9306be89903a450db1
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox ve Araç Politikası ve Yükseltilmiş Yetki

OpenClaw, birbiriyle ilişkili ama farklı üç denetime sahiptir:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) araçların **nerede çalışacağını** belirler (sandbox arka ucu veya host).
2. **Araç politikası** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) **hangi araçların kullanılabilir/izinli** olduğunu belirler.
3. **Yükseltilmiş** (`tools.elevated.*`, `agents.list[].tools.elevated.*`), sandbox içindeyken sandbox dışında çalıştırmak için **yalnızca `exec` için bir kaçış kapısıdır** (`gateway` varsayılan olarak veya `exec` hedefi `node` olarak yapılandırılmışsa `node`).

## Hızlı hata ayıklama

OpenClaw'un _gerçekte_ ne yaptığını görmek için denetleyiciyi kullanın:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Şunları yazdırır:

- etkin sandbox modu/kapsamı/çalışma alanı erişimi
- oturumun şu anda sandbox içinde olup olmadığı (ana vs ana olmayan)
- etkin sandbox araç izin/verme durumu (ve bunun ajan/genel/varsayılan kaynaktan gelip gelmediği)
- yükseltilmiş geçitler ve düzeltme anahtar yolları

## Sandbox: araçların çalıştığı yer

Sandboxing, `agents.defaults.sandbox.mode` tarafından denetlenir:

- `"off"`: her şey host üzerinde çalışır.
- `"non-main"`: yalnızca ana olmayan oturumlar sandbox içindedir (gruplar/kanallar için yaygın bir “şaşırtıcı durum”).
- `"all"`: her şey sandbox içindedir.

Tam matris için [Sandboxing](/tr/gateway/sandboxing) sayfasına bakın (kapsam, çalışma alanı bağlamaları, imajlar).

### Bağlama bağlantıları (hızlı güvenlik kontrolü)

- `docker.binds`, sandbox dosya sistemini _deler_: bağladığınız her şey, ayarladığınız kipte (`:ro` veya `:rw`) kapsayıcı içinde görünür olur.
- Kipi belirtmezseniz varsayılan okuma-yazmadır; kaynaklar/gizli anahtarlar için `:ro` tercih edin.
- `scope: "shared"`, ajan başına bağlamaları yok sayar (yalnızca genel bağlamalar uygulanır).
- OpenClaw, bağlama kaynaklarını iki kez doğrular: önce normalleştirilmiş kaynak yolda, sonra en derin mevcut üst öğe üzerinden çözümlendikten sonra tekrar. Sembolik bağlantı üst öğe kaçışları, engellenmiş yol veya izinli kök denetimlerini aşamaz.
- Var olmayan yaprak yollar yine de güvenli biçimde denetlenir. `/workspace/alias-out/new-file`, sembolik bağlantılı bir üst öğe üzerinden engellenmiş bir yola veya yapılandırılmış izinli köklerin dışına çözümlenirse bağlama reddedilir.
- `/var/run/docker.sock` bağlamak, sandbox'a fiilen host denetimi verir; bunu yalnızca bilinçli olarak yapın.
- Çalışma alanı erişimi (`workspaceAccess: "ro"`/`"rw"`), bağlama kiplerinden bağımsızdır.

## Araç politikası: hangi araçların var olduğu/çağrılabildiği

İki katman önemlidir:

- **Araç profili**: `tools.profile` ve `agents.list[].tools.profile` (temel izin listesi)
- **Sağlayıcı araç profili**: `tools.byProvider[provider].profile` ve `agents.list[].tools.byProvider[provider].profile`
- **Genel/ajan başına araç politikası**: `tools.allow`/`tools.deny` ve `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Sağlayıcı araç politikası**: `tools.byProvider[provider].allow/deny` ve `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox araç politikası** (yalnızca sandbox içindeyken uygulanır): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` ve `agents.list[].tools.sandbox.tools.*`

Temel kurallar:

- `deny` her zaman kazanır.
- `allow` boş değilse geri kalan her şey engellenmiş kabul edilir.
- Araç politikası kesin durdurmadır: `/exec`, reddedilmiş bir `exec` aracını geçersiz kılamaz.
- `/exec`, yalnızca yetkili göndericiler için oturum varsayılanlarını değiştirir; araç erişimi vermez.
  Sağlayıcı araç anahtarları `provider` (ör. `google-antigravity`) veya `provider/model` (ör. `openai/gpt-5.4`) kabul eder.

### Araç grupları (kısayollar)

Araç politikaları (genel, ajan, sandbox), birden çok araca genişleyen `group:*` girdilerini destekler:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Kullanılabilir gruplar:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash`, `exec` için
  diğer ad olarak kabul edilir)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: tüm yerleşik OpenClaw araçları (sağlayıcı Plugin'leri hariç)

## Yükseltilmiş: yalnızca `exec` için "host üzerinde çalıştır"

Yükseltilmiş mod ek araçlar vermez; yalnızca `exec` aracını etkiler.

- Sandbox içindeyseniz `/elevated on` (veya `elevated: true` ile `exec`) sandbox dışında çalıştırır (onaylar yine de geçerli olabilir).
- Oturum için `exec` onaylarını atlamak üzere `/elevated full` kullanın.
- Zaten doğrudan çalışıyorsanız yükseltilmiş mod fiilen etkisizdir (yine de geçitlerden geçer).
- Yükseltilmiş mod **Skills kapsamlı değildir** ve araç izin/verme durumunu **geçersiz kılmaz**.
- Yükseltilmiş mod, `host=auto` üzerinden keyfi çapraz host geçersiz kılmaları vermez; normal `exec` hedef kurallarını izler ve yalnızca yapılandırılmış/oturum hedefi zaten `node` ise `node` değerini korur.
- `/exec`, yükseltilmiş moddan ayrıdır. Yalnızca yetkili göndericiler için oturum başına `exec` varsayılanlarını ayarlar.

Geçitler:

- Etkinleştirme: `tools.elevated.enabled` (ve isteğe bağlı olarak `agents.list[].tools.elevated.enabled`)
- Gönderici izin listeleri: `tools.elevated.allowFrom.<provider>` (ve isteğe bağlı olarak `agents.list[].tools.elevated.allowFrom.<provider>`)

Bkz. [Yükseltilmiş Mod](/tr/tools/elevated).

## Yaygın "sandbox hapishanesi" düzeltmeleri

### "Araç X, sandbox araç politikası tarafından engellendi"

Düzeltme anahtarları (birini seçin):

- Sandbox'ı devre dışı bırakın: `agents.defaults.sandbox.mode=off` (veya ajan başına `agents.list[].sandbox.mode=off`)
- Araca sandbox içinde izin verin:
  - `tools.sandbox.tools.deny` içinden kaldırın (veya ajan başına `agents.list[].tools.sandbox.tools.deny`)
  - ya da `tools.sandbox.tools.allow` içine ekleyin (veya ajan başına izin listesine)

### "Bunun ana olduğunu sanıyordum, neden sandbox içinde?"

`"non-main"` modunda grup/kanal anahtarları _ana_ değildir. Ana oturum anahtarını kullanın (`sandbox explain` tarafından gösterilir) veya modu `"off"` olarak değiştirin.

## Ayrıca bakın

- [Sandboxing](/tr/gateway/sandboxing) -- tam sandbox başvurusu (kipler, kapsamlar, arka uçlar, imajlar)
- [Çok Ajanlı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) -- ajan başına geçersiz kılmalar ve öncelik
- [Yükseltilmiş Mod](/tr/tools/elevated)
