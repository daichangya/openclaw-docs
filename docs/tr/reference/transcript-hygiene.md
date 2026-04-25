---
read_when:
    - Transkript biçimine bağlı sağlayıcı istek reddetmelerinde hata ayıklıyorsunuz
    - Transkript temizleme veya araç çağrısı onarım mantığını değiştiriyorsunuz
    - Sağlayıcılar arasında araç çağrısı kimliği uyuşmazlıklarını araştırıyorsunuz
summary: 'Başvuru: sağlayıcıya özgü transkript temizleme ve onarma kuralları'
title: Transkript hijyeni
x-i18n:
    generated_at: "2026-04-25T13:57:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00cac47fb9a238e3cb8b6ea69b47210685ca6769a31973b4aeef1d18e75d78e6
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Bu belge, bir çalıştırmadan önce transkriptlere uygulanan **sağlayıcıya özgü düzeltmeleri**
(model bağlamı oluşturma) açıklar. Bunlar, katı
sağlayıcı gereksinimlerini karşılamak için kullanılan **bellek içi** ayarlamalardır. Bu hijyen adımları, diskte saklanan JSONL transkriptini
yeniden yazmaz; ancak ayrı bir oturum dosyası onarım geçişi, oturum yüklenmeden önce
geçersiz satırları bırakarak bozuk JSONL dosyalarını yeniden yazabilir. Bir onarım gerçekleştiğinde, özgün
dosya oturum dosyasının yanında yedeklenir.

Kapsam şunları içerir:

- Çalışma zamanı için olan istem bağlamının kullanıcıya görünür transkript turlarının dışında kalması
- Araç çağrısı kimliği temizleme
- Araç çağrısı girdisi doğrulama
- Araç sonucu eşleştirme onarımı
- Tur doğrulama / sıralama
- Düşünce imzası temizleme
- Görsel yükü temizleme
- Kullanıcı girdisi kökeni etiketleme (oturumlar arası yönlendirilen istemler için)

Transkript depolama ayrıntılarına ihtiyacınız varsa bkz.:

- [Oturum yönetimi derin inceleme](/tr/reference/session-management-compaction)

---

## Genel kural: çalışma zamanı bağlamı kullanıcı transkripti değildir

Çalışma zamanı/sistem bağlamı bir tur için model istemine eklenebilir, ancak bu
son kullanıcı tarafından yazılmış içerik değildir. OpenClaw, Gateway yanıtları,
kuyruğa alınmış takipler, ACP, CLI ve gömülü Pi
çalıştırmaları için transkripte dönük ayrı bir istem gövdesi tutar. Saklanan görünür kullanıcı turları,
çalışma zamanı ile zenginleştirilmiş istem yerine bu transkript gövdesini kullanır.

Çalışma zamanı sarmalayıcılarını zaten kalıcı hale getirmiş eski oturumlar için,
Gateway geçmiş yüzeyleri WebChat,
TUI, REST veya SSE istemcilerine iletileri döndürmeden önce bir görüntüleme izdüşümü uygular.

---

## Bunun çalıştığı yer

Tüm transkript hijyeni gömülü çalıştırıcıda merkezileştirilmiştir:

- İlke seçimi: `src/agents/transcript-policy.ts`
- Temizleme/onarım uygulaması: `src/agents/pi-embedded-runner/replay-history.ts` içindeki `sanitizeSessionHistory`

İlke, neyin uygulanacağına karar vermek için `provider`, `modelApi` ve `modelId` kullanır.

Transkript hijyeninden ayrı olarak, oturum dosyaları yüklemeden önce (gerekirse) onarılır:

- `src/agents/session-file-repair.ts` içindeki `repairSessionFileIfNeeded`
- `run/attempt.ts` ve `compact.ts` içinden çağrılır (gömülü çalıştırıcı)

---

## Genel kural: görsel temizleme

Görsel yükleri, boyut
sınırları nedeniyle sağlayıcı tarafında reddi önlemek için her zaman temizlenir (aşırı büyük base64 görseller küçültülür/yeniden sıkıştırılır).

Bu ayrıca görsel destekli modeller için görsel kaynaklı belirteç baskısını denetlemeye yardımcı olur.
Daha düşük azami boyutlar genelde belirteç kullanımını azaltır; daha yüksek boyutlar ayrıntıyı korur.

Uygulama:

- `src/agents/pi-embedded-helpers/images.ts` içindeki `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` içindeki `sanitizeContentBlocksImages`
- Azami görsel kenarı `agents.defaults.imageMaxDimensionPx` ile yapılandırılabilir (varsayılan: `1200`).

---

## Genel kural: bozuk araç çağrıları

Hem `input` hem de `arguments` alanı eksik olan asistan araç çağrısı blokları,
model bağlamı oluşturulmadan önce bırakılır. Bu, kısmen
kalıcı hale getirilmiş araç çağrılarından kaynaklanan sağlayıcı reddini önler (örneğin, hız sınırı hatasından sonra).

Uygulama:

- `src/agents/session-transcript-repair.ts` içindeki `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts` içindeki `sanitizeSessionHistory` içinde uygulanır

---

## Genel kural: oturumlar arası girdi kökeni

Bir aracı `sessions_send` aracılığıyla başka bir oturuma istem gönderdiğinde (
aracıdan aracıya yanıt/duyuru adımları dahil), OpenClaw oluşturulan kullanıcı turunu şu şekilde kalıcı hale getirir:

- `message.provenance.kind = "inter_session"`

Bu meta veri, transkripte ekleme zamanında yazılır ve rolü değiştirmez
(sağlayıcı uyumluluğu için `role: "user"` olarak kalır). Transkript okuyucuları bunu,
yönlendirilmiş iç istemleri son kullanıcı tarafından yazılmış yönergeler gibi değerlendirmemek için kullanabilir.

Bağlam yeniden oluşturma sırasında OpenClaw ayrıca, modelin bunları
harici son kullanıcı yönergelerinden ayırt edebilmesi için bu kullanıcı turlarına bellekte kısa bir `[Inter-session message]`
işaretçisi ekler.

---

## Sağlayıcı matrisi (mevcut davranış)

**OpenAI / OpenAI Codex**

- Yalnızca görsel temizleme.
- OpenAI Responses/Codex transkriptleri için sahipsiz reasoning imzalarını (ardından içerik bloğu gelmeyen bağımsız reasoning öğeleri) bırakır ve model rota değişiminden sonra yeniden oynatılabilir OpenAI reasoning öğelerini bırakır.
- Araç çağrısı kimliği temizleme yok.
- Araç sonucu eşleştirme onarımı gerçek eşleşmiş çıktıları taşıyabilir ve eksik araç çağrıları için Codex tarzı `aborted` çıktıları sentezleyebilir.
- Tur doğrulama veya yeniden sıralama yok.
- Eksik OpenAI Responses ailesi araç çıktıları, Codex yeniden oynatma normalleştirmesiyle eşleşmesi için `aborted` olarak sentezlenir.
- Düşünce imzası ayıklama yok.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Araç çağrısı kimliği temizleme: katı alfasayısal.
- Araç sonucu eşleştirme onarımı ve sentetik araç sonuçları.
- Tur doğrulama (Gemini tarzı tur dönüşümlülüğü).
- Google tur sıralama düzeltmesi (geçmiş asistan ile başlıyorsa küçük bir kullanıcı bootstrap'ı başa ekler).
- Antigravity Claude: düşünme imzalarını normalleştirir; imzasız düşünme bloklarını bırakır.

**Anthropic / Minimax (Anthropic uyumlu)**

- Araç sonucu eşleştirme onarımı ve sentetik araç sonuçları.
- Tur doğrulama (katı dönüşümlülüğü karşılamak için ardışık kullanıcı turlarını birleştirir).

**Mistral (model kimliği tabanlı algılama dahil)**

- Araç çağrısı kimliği temizleme: strict9 (uzunluğu 9 olan alfasayısal).

**OpenRouter Gemini**

- Düşünce imzası temizleme: base64 olmayan `thought_signature` değerlerini ayıklar (base64 korunur).

**Diğer her şey**

- Yalnızca görsel temizleme.

---

## Geçmiş davranış (2026.1.22 öncesi)

2026.1.22 sürümünden önce OpenClaw birden çok katmanlı transkript hijyeni uyguluyordu:

- Her bağlam oluşturmada çalışan bir **transcript-sanitize extension** şunları yapabiliyordu:
  - Araç kullanım/sonuç eşleşmesini onarmak.
  - Araç çağrısı kimliklerini temizlemek (`_`/`-` karakterlerini koruyan katı olmayan mod dahil).
- Çalıştırıcı ayrıca sağlayıcıya özgü temizleme de yapıyordu, bu da işi yineliyordu.
- Sağlayıcı ilkesinin dışında ek mutasyonlar gerçekleşiyordu, örneğin:
  - Kalıcı hale getirmeden önce asistan metninden `<final>` etiketlerini ayıklamak.
  - Boş asistan hata turlarını bırakmak.
  - Araç çağrılarından sonra asistan içeriğini kırpmak.

Bu karmaşıklık, sağlayıcılar arası gerilemelere neden oldu (özellikle `openai-responses`
`call_id|fc_id` eşleşmesi). 2026.1.22 temizliği uzantıyı kaldırdı, mantığı
çalıştırıcıda merkezileştirdi ve OpenAI'ı görsel temizleme dışında **dokunmasız** hale getirdi.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
