---
read_when:
    - Bir OpenClaw Plugin'ini sürdürüyorsunuz
    - Bir Plugin uyumluluk uyarısı görüyorsunuz
    - Bir Plugin SDK veya manifest geçişi planlıyorsunuz
summary: Plugin uyumluluk sözleşmeleri, kullanımdan kaldırma meta verileri ve geçiş beklentileri
title: Plugin uyumluluğu
x-i18n:
    generated_at: "2026-04-25T13:52:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02e0cdbc763eed5a38b303fc44202ddd36e58bce43dc29b6348db3f5fea66f26
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw, eski Plugin sözleşmelerini kaldırmadan önce bunları adlandırılmış uyumluluk
adaptörleri üzerinden bağlı tutar. Bu, SDK, manifest, kurulum, config ve aracı çalışma zamanı sözleşmeleri
gelişirken mevcut paketli ve harici
Plugin'leri korur.

## Uyumluluk kaydı

Plugin uyumluluk sözleşmeleri çekirdek kayıtta şu adreste izlenir:
`src/plugins/compat/registry.ts`.

Her kayıt şunlara sahiptir:

- kararlı bir uyumluluk kodu
- durum: `active`, `deprecated`, `removal-pending` veya `removed`
- sahip: SDK, config, kurulum, kanal, sağlayıcı, Plugin yürütme, aracı çalışma zamanı
  veya çekirdek
- uygulanabildiğinde tanıtım ve kullanımdan kaldırma tarihleri
- değiştirme rehberi
- eski ve yeni davranışı kapsayan belgeler, tanılamalar ve testler

Kayıt, bakım planlaması ve gelecekteki Plugin inspector
denetimleri için kaynaktır. Plugin'e dönük bir davranış değişirse, adaptörü ekleyen değişiklikte
aynı anda uyumluluk kaydını ekleyin veya güncelleyin.

## Plugin inspector paketi

Plugin inspector, çekirdek OpenClaw reposunun dışında, sürümlenmiş uyumluluk ve manifest
sözleşmeleri tarafından desteklenen ayrı bir paket/repo olarak bulunmalıdır.

İlk gün CLI şu olmalıdır:

```sh
openclaw-plugin-inspector ./my-plugin
```

Şunları üretmelidir:

- manifest/şema doğrulaması
- denetlenen sözleşme uyumluluk sürümü
- kurulum/kaynak meta verisi denetimleri
- cold-path import denetimleri
- kullanımdan kaldırma ve uyumluluk uyarıları

CI notlarında kararlı makine tarafından okunabilir çıktı için `--json` kullanın. OpenClaw
core, inspector'ün tüketebileceği sözleşmeleri ve fixture'ları açığa çıkarmalıdır, ancak
inspector ikili dosyasını ana `openclaw` paketinden yayınlamamalıdır.

## Kullanımdan kaldırma ilkesi

OpenClaw, belgelenmiş bir Plugin sözleşmesini, onun yerine geçeni tanıttığı
aynı sürümde kaldırmamalıdır.

Geçiş sırası şöyledir:

1. Yeni sözleşmeyi ekleyin.
2. Eski davranışı adlandırılmış bir uyumluluk adaptörü üzerinden bağlı tutun.
3. Plugin yazarlarının harekete geçebileceği tanılamalar veya uyarılar yayınlayın.
4. Değiştirme yolunu ve zaman çizelgesini belgeleyin.
5. Hem eski hem yeni yolları test edin.
6. Duyurulan geçiş penceresi boyunca bekleyin.
7. Yalnızca açık breaking-release onayıyla kaldırın.

Kullanımdan kaldırılmış kayıtlar, biliniyorsa bir uyarı başlangıç tarihi, değiştirme bilgisi, belge bağlantısı
ve hedef kaldırma tarihini içermelidir.

## Geçerli uyumluluk alanları

Geçerli uyumluluk kayıtları şunları içerir:

- `openclaw/plugin-sdk/compat` gibi eski geniş SDK import'ları
- eski yalnızca hook tabanlı Plugin şekilleri ve `before_agent_start`
- paketli Plugin izin listesi ve etkinleştirme davranışı
- eski sağlayıcı/kanal ortam değişkeni manifest meta verisi
- manifest katkı sahipliğiyle değiştirilen etkinleştirme ipuçları
- genel adlandırma `agentRuntime` yönüne taşınırken `embeddedHarness` ve `agent-harness` adlandırma takma adları
- kayıt öncelikli `channelConfigs` meta verisi gelirken üretilmiş paketli kanal config meta verisi fallback'i

Yeni Plugin kodu, kayıtta ve belirli geçiş kılavuzunda listelenen
değiştirme yolunu tercih etmelidir. Mevcut Plugin'ler, belgeler, tanılamalar ve sürüm notları
bir kaldırma penceresi duyurana kadar bir uyumluluk yolunu kullanmaya devam edebilir.

## Sürüm notları

Sürüm notları, hedef tarihler ve geçiş belgelerine bağlantılarla birlikte yaklaşan Plugin kullanımdan kaldırmalarını içermelidir. Bu uyarının, bir uyumluluk yolu `removal-pending` veya `removed` durumuna geçmeden önce yapılması gerekir.
