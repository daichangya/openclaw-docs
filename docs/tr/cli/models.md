---
read_when:
    - Varsayılan modelleri değiştirmek veya sağlayıcı kimlik doğrulama durumunu görüntülemek istiyorsunuz
    - Kullanılabilir modelleri/sağlayıcıları taramak ve kimlik doğrulama profillerinde hata ayıklamak istiyorsunuz
summary: '`openclaw models` için CLI başvurusu (durum/listele/ayarla/tara, takma adlar, geri dönüşler, kimlik doğrulama)'
title: modeller
x-i18n:
    generated_at: "2026-04-23T09:01:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4ba72ca8acb7cc31796c119fce3816e6a919eb28a4ed4b03664d3b222498f5a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Model keşfi, tarama ve yapılandırma (varsayılan model, geri dönüşler, kimlik doğrulama profilleri).

İlgili:

- Sağlayıcılar + modeller: [Models](/tr/providers/models)
- Model seçimi kavramları + `/models` eğik çizgi komutu: [Models concept](/tr/concepts/models)
- Sağlayıcı kimlik doğrulama kurulumu: [Başlarken](/tr/start/getting-started)

## Yaygın komutlar

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status`, çözümlenen varsayılan/geri dönüşleri ve kimlik doğrulama genel görünümünü gösterir.
Sağlayıcı kullanım anlık görüntüleri mevcut olduğunda, OAuth/API anahtarı durumu bölümü
sağlayıcı kullanım pencerelerini ve kota anlık görüntülerini içerir.
Mevcut kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi ve z.ai. Kullanım kimlik doğrulaması, mevcut olduğunda
sağlayıcıya özgü kancalardan gelir; aksi halde OpenClaw, auth profilleri, ortam değişkenleri veya yapılandırmadan eşleşen OAuth/API anahtarı
kimlik bilgilerine geri döner.
`--json` çıktısında `auth.providers`, ortam/yapılandırma/depo farkındalığı olan sağlayıcı
genel görünümüdür; `auth.oauth` ise yalnızca auth deposu profil sağlığıdır.
Yapılandırılmış her sağlayıcı profiline karşı canlı kimlik doğrulama sorguları çalıştırmak için `--probe` ekleyin.
Sorgular gerçek isteklerdir (token tüketebilir ve hız sınırlarını tetikleyebilir).
Yapılandırılmış bir aracının model/auth durumunu incelemek için `--agent <id>` kullanın. Belirtilmezse,
komut ayarlıysa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` kullanır; aksi halde
yapılandırılmış varsayılan aracı kullanır.
Sorgu satırları auth profillerinden, ortam kimlik bilgilerinden veya `models.json` dosyasından gelebilir.

Notlar:

- `models set <model-or-alias>`, `provider/model` veya bir takma adı kabul eder.
- `models list --all`, siz henüz o sağlayıcıyla kimlik doğrulaması yapmamış olsanız bile paketlenmiş sağlayıcıya ait statik katalog satırlarını içerir.
  Bu satırlar, eşleşen kimlik doğrulama yapılandırılana kadar hâlâ kullanılamaz olarak görünür.
- `models list --provider <id>`, `moonshot` veya
  `openai-codex` gibi sağlayıcı kimliğine göre filtreler. `Moonshot AI` gibi etkileşimli sağlayıcı
  seçicilerindeki görüntüleme etiketlerini kabul etmez.
- Model başvuruları **ilk** `/` üzerinden bölünerek ayrıştırılır. Model kimliği `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız, OpenClaw girdiyi önce bir takma ad olarak çözümler, ardından
  tam model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesi olarak çözümler ve ancak bundan sonra
  kullanımdan kaldırma uyarısıyla yapılandırılmış varsayılan sağlayıcıya geri döner.
  Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, OpenClaw
  eski, kaldırılmış bir sağlayıcı varsayılanını göstermekte ısrar etmek yerine
  ilk yapılandırılmış sağlayıcı/modele geri döner.
- `models status`, auth çıktısında gizli olmayan yer tutucular için `marker(<value>)` gösterebilir (`OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local` gibi) ve bunları gizli anahtar olarak maskelemez.

### `models status`

Seçenekler:

- `--json`
- `--plain`
- `--check` (çıkış 1=süresi dolmuş/eksik, 2=süresi dolmak üzere)
- `--probe` (yapılandırılmış auth profillerinin canlı sorgusu)
- `--probe-provider <name>` (tek bir sağlayıcıyı sorgula)
- `--probe-profile <id>` (yinelenebilir veya virgülle ayrılmış profil kimlikleri)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (yapılandırılmış aracı kimliği; `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` değerlerini geçersiz kılar)

Sorgu durum grupları:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Beklenebilecek sorgu ayrıntısı/neden kodu durumları:

- `excluded_by_auth_order`: depolanmış bir profil var, ancak açık
  `auth.order.<provider>` bunu dışladı; bu yüzden sorgu bunu denemek yerine
  dışlamayı bildirir.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil mevcut, ancak uygun/çözümlenebilir değil.
- `no_model`: sağlayıcı kimlik doğrulaması mevcut, ancak OpenClaw bu sağlayıcı için
  sorgulanabilir bir model adayı çözemedi.

## Takma adlar + geri dönüşler

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Auth profilleri

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add`, etkileşimli auth yardımcısıdır. Seçtiğiniz sağlayıcıya bağlı olarak
bir sağlayıcı auth akışı (OAuth/API anahtarı) başlatabilir veya sizi elle token
yapıştırmaya yönlendirebilir.

`models auth login`, bir sağlayıcı Plugin'inin auth akışını (OAuth/API anahtarı) çalıştırır. Hangi sağlayıcıların yüklü olduğunu görmek için
`openclaw plugins list` kullanın.

Örnekler:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Notlar:

- `setup-token` ve `paste-token`, token auth yöntemleri sunan sağlayıcılar için
  genel token komutları olarak kalır.
- `setup-token`, etkileşimli bir TTY gerektirir ve sağlayıcının token-auth
  yöntemini çalıştırır (sağlayıcı böyle bir yöntem sunuyorsa varsayılan olarak onun `setup-token` yöntemini kullanır).
- `paste-token`, başka yerde veya otomasyondan üretilmiş bir token dizesini kabul eder.
- `paste-token`, `--provider` gerektirir, token değeri için istem gösterir ve
  `--profile-id` vermediğiniz sürece bunu varsayılan profil kimliği `<provider>:manual` içine yazar.
- `paste-token --expires-in <duration>`, `365d` veya `12h` gibi göreli bir süreden
  mutlak bir token sona erme zamanı saklar.
- Anthropic notu: Anthropic personeli bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi, bu nedenle Anthropic yeni bir ilke yayımlamadığı sürece OpenClaw, Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için onaylı kabul eder.
- Anthropic `setup-token` / `paste-token`, desteklenen bir OpenClaw token yolu olarak kullanılmaya devam eder, ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` komutunu tercih eder.
