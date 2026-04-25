---
read_when:
    - Modeller CLI'sini ekleme veya değiştirme (models list/set/scan/aliases/fallbacks)
    - Model fallback davranışını veya seçim UX'ini değiştirme
    - Model tarama yoklamalarını güncelleme (araçlar/görseller)
summary: 'Modeller CLI''si: listeleme, ayarlama, takma adlar, fallback''ler, tarama, durum'
title: Modeller CLI'si
x-i18n:
    generated_at: "2026-04-25T13:45:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 370453529596e87e724c4de7d2ae9d20334c29393116059bc01363b47c017d5d
    source_path: concepts/models.md
    workflow: 15
---

Bkz. [/concepts/model-failover](/tr/concepts/model-failover) için kimlik doğrulama profili
rotasyonu, bekleme süreleri ve bunun fallback'lerle nasıl etkileştiği.
Hızlı sağlayıcı genel bakışı + örnekler: [/concepts/model-providers](/tr/concepts/model-providers).
Model başvuruları bir sağlayıcı ve model seçer. Genellikle
düşük seviyeli aracı çalışma zamanını seçmezler. Örneğin `openai/gpt-5.5`,
normal OpenAI sağlayıcı yolu üzerinden veya Codex app-server çalışma zamanı üzerinden çalışabilir;
bu, `agents.defaults.embeddedHarness.runtime` ayarına bağlıdır. Bkz.
[/concepts/agent-runtimes](/tr/concepts/agent-runtimes).

## Model seçimi nasıl çalışır

OpenClaw modelleri şu sırayla seçer:

1. **Birincil** model (`agents.defaults.model.primary` veya `agents.defaults.model`).
2. `agents.defaults.model.fallbacks` içindeki **fallback**'ler (sırayla).
3. **Sağlayıcı kimlik doğrulama failover**'ı, bir sonraki modele geçmeden önce bir sağlayıcının içinde gerçekleşir.

İlgili:

- `agents.defaults.models`, OpenClaw'ın kullanabileceği modellerin izin listesi/kataloğudur (artı takma adlar).
- `agents.defaults.imageModel`, **yalnızca** birincil model görselleri kabul edemediğinde kullanılır.
- `agents.defaults.pdfModel`, `pdf` aracı tarafından kullanılır. Atlanırsa araç
  fallback olarak `agents.defaults.imageModel`, ardından çözümlenen oturum/varsayılan
  modeli kullanır.
- `agents.defaults.imageGenerationModel`, paylaşılan görsel oluşturma yeteneği tarafından kullanılır. Atlanırsa `image_generate`, kimlik doğrulama destekli bir sağlayıcı varsayılanını yine de çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından sağlayıcı kimliği sırasına göre kayıtlı kalan görsel oluşturma sağlayıcılarını dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının kimlik doğrulamasını/API anahtarını da yapılandırın.
- `agents.defaults.musicGenerationModel`, paylaşılan müzik oluşturma yeteneği tarafından kullanılır. Atlanırsa `music_generate`, kimlik doğrulama destekli bir sağlayıcı varsayılanını yine de çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından sağlayıcı kimliği sırasına göre kayıtlı kalan müzik oluşturma sağlayıcılarını dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının kimlik doğrulamasını/API anahtarını da yapılandırın.
- `agents.defaults.videoGenerationModel`, paylaşılan video oluşturma yeteneği tarafından kullanılır. Atlanırsa `video_generate`, kimlik doğrulama destekli bir sağlayıcı varsayılanını yine de çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından sağlayıcı kimliği sırasına göre kayıtlı kalan video oluşturma sağlayıcılarını dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının kimlik doğrulamasını/API anahtarını da yapılandırın.
- Aracı başına varsayılanlar, `agents.list[].model` artı bağlamalar üzerinden `agents.defaults.model` değerini geçersiz kılabilir (bkz. [/concepts/multi-agent](/tr/concepts/multi-agent)).

## Hızlı model ilkesi

- Birincil modelinizi, kullanabildiğiniz en güçlü yeni nesil model olarak ayarlayın.
- Maliyet/gecikmeye duyarlı görevler ve daha düşük önemde sohbetler için fallback'leri kullanın.
- Araç etkin aracılar veya güvenilmeyen girdiler için eski/zayıf model katmanlarından kaçının.

## İlk kurulum (önerilir)

Config'i elle düzenlemek istemiyorsanız, ilk kurulumu çalıştırın:

```bash
openclaw onboard
```

Bu, **OpenAI Code (Codex)
aboneliği** (OAuth) ve **Anthropic** (API anahtarı veya Claude CLI) dahil olmak üzere yaygın sağlayıcılar için model + kimlik doğrulama ayarlayabilir.

## Config anahtarları (genel bakış)

- `agents.defaults.model.primary` ve `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` ve `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` ve `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` ve `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` ve `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (izin listesi + takma adlar + sağlayıcı parametreleri)
- `models.providers` (`models.json` içine yazılan özel sağlayıcılar)

Model başvuruları küçük harfe normalize edilir. `z.ai/*` gibi sağlayıcı takma adları
`zai/*` olarak normalize edilir.

Sağlayıcı yapılandırma örnekleri (OpenCode dahil) şu adreste bulunur:
[/providers/opencode](/tr/providers/opencode).

### Güvenli izin listesi düzenlemeleri

`agents.defaults.models` değerini elle güncellerken eklemeli yazımları kullanın:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set`, model/sağlayıcı eşlemelerini kazara ezilmeye karşı korur. `agents.defaults.models`, `models.providers` veya
`models.providers.<id>.models` için düz bir nesne ataması,
mevcut girdileri kaldıracaksa reddedilir. Eklemeli değişiklikler için `--merge` kullanın; sağlanan değer tam hedef değer olmalıysa yalnızca `--replace` kullanın.

Etkileşimli sağlayıcı kurulumu ve `openclaw configure --section model` da
sağlayıcı kapsamlı seçimleri mevcut izin listesiyle birleştirir; böylece Codex,
Ollama veya başka bir sağlayıcı eklemek ilgisiz model girdilerini düşürmez.
Sağlayıcı kimlik doğrulaması yeniden uygulandığında Configure, mevcut bir
`agents.defaults.model.primary` değerini korur. Şu gibi açık varsayılan ayarlama komutları:
`openclaw models auth login --provider <id> --set-default` ve
`openclaw models set <model>` ise yine `agents.defaults.model.primary` değerini değiştirir.

## "Model is not allowed" (ve neden yanıtlar durur)

`agents.defaults.models` ayarlanmışsa, `/model` ve
oturum geçersiz kılmaları için **izin listesi** haline gelir. Kullanıcı bu izin listesinde olmayan bir model seçtiğinde,
OpenClaw şunu döndürür:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Bu, normal bir yanıt üretilmeden **önce** gerçekleşir; bu yüzden mesaj
“yanıt vermedi” gibi hissedilebilir. Çözüm şunlardan biridir:

- Modeli `agents.defaults.models` içine ekleyin veya
- İzin listesini temizleyin (`agents.defaults.models` değerini kaldırın) veya
- `/model list` içinden bir model seçin.

Örnek izin listesi config'i:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Sohbette model değiştirme (`/model`)

Yeniden başlatmadan geçerli oturum için model değiştirebilirsiniz:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Notlar:

- `/model` (ve `/model list`) kompakt, numaralı bir seçicidir (model ailesi + kullanılabilir sağlayıcılar).
- Discord'da `/model` ve `/models`, sağlayıcı ve model açılır menülerinin yanı sıra bir Gönder adımı içeren etkileşimli bir seçici açar.
- `/models add` kullanımdan kaldırılmıştır ve artık sohbetten model kaydetmek yerine kullanımdan kaldırma mesajı döndürür.
- `/model <#>` bu seçiciden seçim yapar.
- `/model`, yeni oturum seçimini hemen kalıcılaştırır.
- Aracı boşta ise, sonraki çalıştırma yeni modeli hemen kullanır.
- Bir çalıştırma zaten etkinse, OpenClaw canlı geçişi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlatır.
- Araç etkinliği veya yanıt çıktısı zaten başladıysa, bekleyen geçiş daha sonraki bir yeniden deneme fırsatına veya bir sonraki kullanıcı turuna kadar kuyrukta kalabilir.
- `/model status` ayrıntılı görünümdür (kimlik doğrulama adayları ve yapılandırılmışsa sağlayıcı uç noktası `baseUrl` + `api` modu).
- Model başvuruları **ilk** `/` karakterinden bölünerek ayrıştırılır. `/model <ref>` yazarken `provider/model` kullanın.
- Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini eklemelisiniz (örnek: `/model openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız, OpenClaw girdiyi şu sırayla çözümler:
  1. takma ad eşleşmesi
  2. o tam öneksiz model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesi
  3. yapılandırılmış varsayılan sağlayıcıya kullanımdan kaldırılmış fallback
     Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, OpenClaw
     bunun yerine eski, kaldırılmış sağlayıcı varsayılanını göstermemek için ilk yapılandırılmış sağlayıcı/modele fallback yapar.

Tam komut davranışı/config: [Slash commands](/tr/tools/slash-commands).

## CLI komutları

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (alt komut olmadan), `models status` için bir kısayoldur.

### `models list`

Varsayılan olarak yapılandırılmış modelleri gösterir. Yararlı bayraklar:

- `--all`: tam katalog
- `--local`: yalnızca yerel sağlayıcılar
- `--provider <id>`: sağlayıcı kimliğine göre filtrele, örneğin `moonshot`; etkileşimli seçicilerdeki görüntü etiketleri kabul edilmez
- `--plain`: satır başına bir model
- `--json`: makine tarafından okunabilir çıktı

`--all`, kimlik doğrulama yapılandırılmadan önce paketlenmiş sağlayıcıya ait statik katalog satırlarını içerir; böylece yalnızca keşif amaçlı görünümler, eşleşen sağlayıcı kimlik bilgilerini ekleyene kadar kullanılamayan modelleri gösterebilir.

### `models status`

Çözümlenen birincil modeli, fallback'leri, görsel modelini ve yapılandırılmış sağlayıcıların kimlik doğrulama genel görünümünü gösterir. Ayrıca kimlik doğrulama deposunda bulunan profiller için OAuth sona erme durumunu da gösterir (varsayılan olarak 24 saat içinde uyarır). `--plain` yalnızca çözümlenen birincil modeli yazdırır.
OAuth durumu her zaman gösterilir (ve `--json` çıktısına dahil edilir). Yapılandırılmış bir sağlayıcının kimlik bilgileri yoksa,
`models status` bir **Missing auth** bölümü yazdırır.
JSON, `auth.oauth` (uyarı penceresi + profiller) ve `auth.providers`
(sağlayıcı başına etkili kimlik doğrulama, env destekli kimlik bilgileri dahil) içerir. `auth.oauth`
yalnızca kimlik doğrulama deposu profil sağlığı içindir; yalnızca env kullanan sağlayıcılar burada görünmez.
Otomasyon için `--check` kullanın (eksik/süresi dolmuşsa çıkış `1`, süresi dolmak üzereyse `2`).
Canlı kimlik doğrulama kontrolleri için `--probe` kullanın; probe satırları kimlik doğrulama profillerinden, env
kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
Açık `auth.order.<provider>` depolanmış bir profili atlıyorsa, probe bunu denemek yerine
`excluded_by_auth_order` raporlar. Kimlik doğrulama mevcutsa ama bu sağlayıcı için yoklanabilir bir model çözümlenemiyorsa, probe `status: no_model` raporlar.

Kimlik doğrulama seçimi sağlayıcıya/hesaba bağlıdır. Her zaman açık Gateway host'ları için API
anahtarları genellikle en öngörülebilir seçenektir; Claude CLI yeniden kullanımı ve mevcut Anthropic
OAuth/belirteç profilleri de desteklenir.

Örnek (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Tarama (OpenRouter ücretsiz modelleri)

`openclaw models scan`, OpenRouter'ın **ücretsiz model kataloğunu** inceler ve
isteğe bağlı olarak modelleri araç ve görsel desteği açısından yoklayabilir.

Temel bayraklar:

- `--no-probe`: canlı yoklamaları atla (yalnızca meta veri)
- `--min-params <b>`: en düşük parametre boyutu (milyar)
- `--max-age-days <days>`: eski modelleri atla
- `--provider <name>`: sağlayıcı öneki filtresi
- `--max-candidates <n>`: fallback listesi boyutu
- `--set-default`: `agents.defaults.model.primary` değerini ilk seçime ayarla
- `--set-image`: `agents.defaults.imageModel.primary` değerini ilk görsel seçimine ayarla

OpenRouter `/models` kataloğu geneldir, bu yüzden yalnızca meta veriye dayalı taramalar
anahtar olmadan ücretsiz adayları listeleyebilir. Yoklama ve çıkarım yine de bir
OpenRouter API anahtarı gerektirir (kimlik doğrulama profillerinden veya `OPENROUTER_API_KEY` üzerinden). Anahtar yoksa,
`openclaw models scan` yalnızca meta veri çıktısına fallback yapar ve config'i değiştirmez. Yalnızca meta veri modunu açıkça istemek için `--no-probe` kullanın.

Tarama sonuçları şu ölçütlere göre sıralanır:

1. Görsel desteği
2. Araç gecikmesi
3. Bağlam boyutu
4. Parametre sayısı

Girdi

- OpenRouter `/models` listesi (filtre `:free`)
- Canlı yoklamalar için kimlik doğrulama profillerinden veya `OPENROUTER_API_KEY` üzerinden OpenRouter API anahtarı gerekir (bkz. [/environment](/tr/help/environment))
- İsteğe bağlı filtreler: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- İstek/yoklama denetimleri: `--timeout`, `--concurrency`

Canlı yoklamalar bir TTY içinde çalıştığında, fallback'leri etkileşimli olarak seçebilirsiniz. Etkileşimli olmayan modda,
varsayılanları kabul etmek için `--yes` geçin. Yalnızca meta veri sonuçları
bilgilendirme amaçlıdır; `--set-default` ve `--set-image` canlı yoklamalar gerektirir, böylece
OpenClaw kullanılamaz, anahtarsız bir OpenRouter modelini yapılandırmaz.

## Modeller kaydı (`models.json`)

`models.providers` içindeki özel sağlayıcılar, aracı dizini altındaki
`models.json` dosyasına yazılır (varsayılan `~/.openclaw/agents/<agentId>/agent/models.json`). Bu dosya
`models.mode`, `replace` olarak ayarlanmadıkça varsayılan olarak birleştirilir.

Eşleşen sağlayıcı kimlikleri için birleştirme modu önceliği:

- Aracı `models.json` dosyasında zaten bulunan boş olmayan `baseUrl` kazanır.
- Aracı `models.json` dosyasındaki boş olmayan `apiKey`, yalnızca bu sağlayıcı geçerli config/auth-profile bağlamında SecretRef tarafından yönetilmiyorsa kazanır.
- SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenen gizli anahtarları kalıcılaştırmak yerine kaynak işaretçilerinden (`ENV_VAR_NAME` env başvuruları için, `secretref-managed` dosya/exec başvuruları için) yenilenir.
- SecretRef tarafından yönetilen sağlayıcı başlık değerleri, kaynak işaretçilerinden yenilenir (`secretref-env:ENV_VAR_NAME` env başvuruları için, `secretref-managed` dosya/exec başvuruları için).
- Boş veya eksik aracı `apiKey`/`baseUrl` değerleri, config `models.providers` değerine fallback yapar.
- Diğer sağlayıcı alanları config'ten ve normalize edilmiş katalog verilerinden yenilenir.

İşaretçi kalıcılığı, kaynak tarafından yetkilidir: OpenClaw işaretçileri, çözümlenen çalışma zamanı gizli değerlerinden değil, etkin kaynak config anlık görüntüsünden (çözümleme öncesi) yazar.
Bu, OpenClaw `models.json` dosyasını ne zaman yeniden üretirse üretsin geçerlidir; buna `openclaw agent` gibi komut güdümlü yollar da dahildir.

## İlgili

- [Model Sağlayıcıları](/tr/concepts/model-providers) — sağlayıcı yönlendirmesi ve kimlik doğrulama
- [Aracı Çalışma Zamanları](/tr/concepts/agent-runtimes) — PI, Codex ve diğer aracı döngüsü çalışma zamanları
- [Model Failover](/tr/concepts/model-failover) — fallback zincirleri
- [Görsel Oluşturma](/tr/tools/image-generation) — görsel modeli yapılandırması
- [Müzik Oluşturma](/tr/tools/music-generation) — müzik modeli yapılandırması
- [Video Oluşturma](/tr/tools/video-generation) — video modeli yapılandırması
- [Yapılandırma Başvurusu](/tr/gateway/config-agents#agent-defaults) — model config anahtarları
