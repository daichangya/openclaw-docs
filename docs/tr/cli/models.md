---
read_when:
    - Varsayılan modelleri değiştirmek veya sağlayıcı kimlik doğrulama durumunu görüntülemek istiyorsunuz
    - Kullanılabilir modelleri/sağlayıcıları taramak ve kimlik doğrulama profillerinde hata ayıklamak istiyorsunuz
summary: '`openclaw models` için CLI başvurusu (status/list/set/scan, takma adlar, yedekler, kimlik doğrulama)'
title: Modeller
x-i18n:
    generated_at: "2026-04-25T13:44:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c8040159e23789221357dd60232012759ee540ebfd3e5d192a0a09419d40c9a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Model keşfi, tarama ve yapılandırma (varsayılan model, yedekler, kimlik doğrulama profilleri).

İlgili:

- Sağlayıcılar + modeller: [Modeller](/tr/providers/models)
- Model seçimi kavramları + `/models` slash komutu: [Modeller kavramı](/tr/concepts/models)
- Sağlayıcı kimlik doğrulama kurulumu: [Başlangıç](/tr/start/getting-started)

## Yaygın komutlar

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status`, çözümlenmiş varsayılan/yedekleri ve kimlik doğrulama genel görünümünü gösterir.
Sağlayıcı kullanım anlık görüntüleri mevcut olduğunda, OAuth/API anahtarı durumu bölümü
sağlayıcı kullanım pencerelerini ve kota anlık görüntülerini içerir.
Mevcut kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi ve z.ai. Kullanım kimlik doğrulaması, mümkün olduğunda sağlayıcıya özgü hook'lardan gelir; aksi halde OpenClaw, auth profilleri, env veya config içindeki OAuth/API anahtarı kimlik bilgilerini eşleştirmeye geri döner.
`--json` çıktısında `auth.providers`, env/config/store farkındalığına sahip sağlayıcı genel görünümüdür; `auth.oauth` ise yalnızca auth-store profil sağlığıdır.
Her yapılandırılmış sağlayıcı profiline karşı canlı kimlik doğrulama probu çalıştırmak için `--probe` ekleyin.
Problar gerçek isteklerdir (token tüketebilir ve oran sınırlarını tetikleyebilir).
Yapılandırılmış bir ajanın model/kimlik doğrulama durumunu incelemek için `--agent <id>` kullanın. Atlanırsa,
komut ayarlanmışsa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` kullanır, aksi halde
yapılandırılmış varsayılan ajanı kullanır.
Prob satırları auth profillerinden, env kimlik bilgilerinden veya `models.json` içinden gelebilir.

Notlar:

- `models set <model-or-alias>`, `provider/model` veya bir takma adı kabul eder.
- `models list` salt okunurdur: config, auth profilleri, mevcut katalog
  durumunu ve sağlayıcıya ait katalog satırlarını okur, ancak `models.json`
  dosyasını yeniden yazmaz.
- `models list --all`, o sağlayıcıyla henüz kimlik doğrulaması yapmamış olsanız
  bile paketle gelen sağlayıcıya ait statik katalog satırlarını içerir. Bu satırlar,
  eşleşen kimlik doğrulama yapılandırılana kadar yine de kullanılamaz olarak görünür.
- `models list`, yerel model meta verilerini ve çalışma zamanı sınırlarını ayrı tutar. Tablo çıktısında, etkili bir çalışma zamanı sınırı yerel bağlam penceresinden farklıysa `Ctx`, `contextTokens/contextWindow` olarak gösterilir; JSON satırları, bir sağlayıcı bu sınırı ortaya koyduğunda `contextTokens` içerir.
- `models list --provider <id>`, `moonshot` veya `openai-codex` gibi sağlayıcı kimliğine göre filtreler. `Moonshot AI` gibi etkileşimli sağlayıcı seçicilerdeki görünen etiketleri kabul etmez.
- Model referansları **ilk** `/` karakterinden bölünerek ayrıştırılır. Model kimliği `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız, OpenClaw girdiyi önce bir takma ad olarak çözümler, sonra
  tam model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesi olarak çözümler ve ancak ondan sonra kullanımdan kaldırma uyarısıyla yapılandırılmış varsayılan sağlayıcıya geri döner.
  O sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, OpenClaw
  eski ve kaldırılmış bir sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/modele geri döner.
- `models status`, auth çıktısında gizli olmayan yer tutucular için (örneğin `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) bunları sırlar olarak maskelemek yerine `marker(<value>)` gösterebilir.

### `models scan`

`models scan`, OpenRouter'ın genel `:free` kataloğunu okur ve yedek kullanım için
adayları sıralar. Kataloğun kendisi herkese açıktır, bu nedenle yalnızca meta veri taramaları OpenRouter anahtarı gerektirmez.

Varsayılan olarak OpenClaw, canlı model çağrılarıyla araç ve görsel desteğini yoklamaya çalışır.
Hiçbir OpenRouter anahtarı yapılandırılmamışsa komut yalnızca meta veri çıktısına geri döner ve `:free` modellerinin yoklama ve çıkarım için yine de `OPENROUTER_API_KEY` gerektirdiğini açıklar.

Seçenekler:

- `--no-probe` (yalnızca meta veri; config/secrets araması yok)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (katalog isteği ve prob başına zaman aşımı)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` ve `--set-image` canlı prob gerektirir; yalnızca meta veri tarama
sonuçları bilgilendiricidir ve config'e uygulanmaz.

### `models status`

Seçenekler:

- `--json`
- `--plain`
- `--check` (çıkış 1=süresi dolmuş/eksik, 2=süresi dolmak üzere)
- `--probe` (yapılandırılmış auth profillerinin canlı probu)
- `--probe-provider <name>` (tek sağlayıcıyı probla)
- `--probe-profile <id>` (tekrarlanabilir veya virgülle ayrılmış profil kimlikleri)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (yapılandırılmış ajan kimliği; `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` değerlerini geçersiz kılar)

Prob durum kovaları:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Beklenebilecek prob ayrıntısı/neden kodu durumları:

- `excluded_by_auth_order`: kayıtlı bir profil vardır, ancak açık
  `auth.order.<provider>` bunu atlamıştır; bu yüzden prob denemek yerine
  dışlanmayı bildirir.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil vardır ancak uygun/çözümlenebilir değildir.
- `no_model`: sağlayıcı kimlik doğrulaması vardır, ancak OpenClaw o sağlayıcı için
  problanabilir bir model adayı çözememiştir.

## Takma adlar + yedekler

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Kimlik doğrulama profilleri

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add`, etkileşimli kimlik doğrulama yardımcısıdır. Seçtiğiniz sağlayıcıya bağlı olarak bir sağlayıcı kimlik doğrulama akışını
(OAuth/API anahtarı) başlatabilir veya sizi manuel token yapıştırmaya yönlendirebilir.

`models auth login`, bir sağlayıcı Plugin'inin kimlik doğrulama akışını (OAuth/API anahtarı) çalıştırır. Hangi sağlayıcıların kurulu olduğunu görmek için
`openclaw plugins list` kullanın.

Örnekler:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Notlar:

- `setup-token` ve `paste-token`, token kimlik doğrulama yöntemleri sunan sağlayıcılar için genel token komutları olarak kalır.
- `setup-token`, etkileşimli bir TTY gerektirir ve sağlayıcının token-auth
  yöntemini çalıştırır (bir yöntem sunuyorsa varsayılan olarak o sağlayıcının `setup-token` yöntemini kullanır).
- `paste-token`, başka bir yerde veya otomasyondan üretilmiş bir token dizesini kabul eder.
- `paste-token`, `--provider` gerektirir, token değeri için istem gösterir ve siz
  `--profile-id` geçmezseniz bunu varsayılan profil kimliği `<provider>:manual` içine yazar.
- `paste-token --expires-in <duration>`, `365d` veya `12h` gibi göreli bir süreden
  mutlak bir token sona erme zamanı saklar.
- Anthropic notu: Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi, bu yüzden Anthropic yeni bir ilke yayımlamadığı sürece OpenClaw bu entegrasyon için Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylı kabul eder.
- Anthropic `setup-token` / `paste-token`, desteklenen bir OpenClaw token yolu olarak kullanılmaya devam eder, ancak OpenClaw artık mümkün olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Model seçimi](/tr/concepts/model-providers)
- [Model devralma](/tr/concepts/model-failover)
