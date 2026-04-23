---
read_when:
    - Transkript şekline bağlı sağlayıcı istek reddetmelerini ayıklıyorsunuz
    - Transkript temizleme veya tool-call onarım mantığını değiştiriyorsunuz
    - Sağlayıcılar arasında tool-call kimliği uyuşmazlıklarını araştırıyorsunuz
summary: 'Başvuru: sağlayıcıya özgü transkript temizleme ve onarım kuralları'
title: Transkript Hijyeni
x-i18n:
    generated_at: "2026-04-23T09:10:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b528099b547155e5cf25be19e64a017d338b6f7b9c7ef51dc3ce2c2963193b8
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Transkript Hijyeni (Sağlayıcı Düzeltmeleri)

Bu belge, bir çalıştırmadan önce transkriptlere uygulanan **sağlayıcıya özgü düzeltmeleri**
açıklar (model bağlamı oluşturulurken). Bunlar, katı
sağlayıcı gereksinimlerini karşılamak için kullanılan **bellek içi** ayarlamalardır. Bu hijyen adımları
diskte depolanan JSONL transkriptini **yeniden yazmaz**; ancak ayrı bir oturum-dosyası onarım geçişi,
oturum yüklenmeden önce geçersiz satırları düşürerek bozuk JSONL dosyalarını yeniden yazabilir. Onarım olduğunda, özgün
dosya oturum dosyasının yanında yedeklenir.

Kapsam şunları içerir:

- Tool call kimliği temizleme
- Tool call girdisi doğrulaması
- Tool result eşleştirme onarımı
- Dönüş doğrulaması / sıralama
- Düşünce imzası temizliği
- Görsel yükü temizleme
- Kullanıcı girdisi köken etiketleme (oturumlar arası yönlendirilmiş istemler için)

Transkript depolama ayrıntılarına ihtiyacınız varsa bkz.:

- [/reference/session-management-compaction](/tr/reference/session-management-compaction)

---

## Bunun çalıştığı yer

Tüm transkript hijyeni gömülü çalıştırıcıda merkezileştirilmiştir:

- İlke seçimi: `src/agents/transcript-policy.ts`
- Temizleme/onarım uygulaması: `src/agents/pi-embedded-runner/replay-history.ts` içindeki `sanitizeSessionHistory`

İlke, ne uygulanacağına karar vermek için `provider`, `modelApi` ve `modelId` kullanır.

Transkript hijyeninden ayrı olarak, oturum dosyaları yüklemeden önce (gerekirse) onarılır:

- `src/agents/session-file-repair.ts` içindeki `repairSessionFileIfNeeded`
- `run/attempt.ts` ve `compact.ts` içinden çağrılır (gömülü çalıştırıcı)

---

## Genel kural: görsel temizleme

Sağlayıcı tarafında boyut
sınırları nedeniyle reddi önlemek için görsel yükleri her zaman temizlenir (aşırı büyük base64 görseller küçültülür/yeniden sıkıştırılır).

Bu ayrıca görsel yetenekli modeller için görsel kaynaklı token baskısını denetlemeye de yardımcı olur.
Daha düşük azami boyutlar genellikle token kullanımını azaltır; daha yüksek boyutlar ayrıntıyı korur.

Uygulama:

- `src/agents/pi-embedded-helpers/images.ts` içindeki `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` içindeki `sanitizeContentBlocksImages`
- Azami görsel kenarı `agents.defaults.imageMaxDimensionPx` ile yapılandırılabilir (varsayılan: `1200`).

---

## Genel kural: bozuk tool call'lar

Hem `input` hem de `arguments` eksik olan assistant tool-call blokları,
model bağlamı oluşturulmadan önce düşürülür. Bu, kısmen
kalıcılaştırılmış tool call'lar nedeniyle sağlayıcı reddini önler (örneğin bir rate limit hatasından sonra).

Uygulama:

- `src/agents/session-transcript-repair.ts` içindeki `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts` içindeki `sanitizeSessionHistory` içinde uygulanır

---

## Genel kural: oturumlar arası girdi kökeni

Bir ajan `sessions_send` üzerinden başka bir oturuma istem gönderdiğinde (
ajanlar arası yanıt/duyuru adımları dahil), OpenClaw oluşturulan kullanıcı dönüşünü şu değerle kalıcılaştırır:

- `message.provenance.kind = "inter_session"`

Bu üst veri, transkript ekleme zamanında yazılır ve rolü değiştirmez
(`role: "user"` sağlayıcı uyumluluğu için korunur). Transkript okuyucuları bunu,
yönlendirilmiş dahili istemleri son kullanıcı tarafından yazılmış yönergeler gibi ele almamak için kullanabilir.

Bağlam yeniden oluşturma sırasında OpenClaw ayrıca bellekte
bu kullanıcı dönüşlerine kısa bir `[Inter-session message]`
işaretleyicisi ekler; böylece model bunları
dış son kullanıcı yönergelerinden ayırt edebilir.

---

## Sağlayıcı matrisi (mevcut davranış)

**OpenAI / OpenAI Codex**

- Yalnızca görsel temizleme.
- OpenAI Responses/Codex transkriptleri için yetim akıl yürütme imzalarını (ardından içerik bloğu gelmeyen bağımsız akıl yürütme öğeleri) düşür.
- Tool call kimliği temizleme yok.
- Tool result eşleştirme onarımı yok.
- Dönüş doğrulaması veya yeniden sıralama yok.
- Sentetik tool result yok.
- Düşünce imzası soyma yok.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Tool call kimliği temizleme: katı alfanümerik.
- Tool result eşleştirme onarımı ve sentetik tool result'lar.
- Dönüş doğrulaması (Gemini tarzı dönüş sıralaması).
- Google dönüş sıralama düzeltmesi (geçmiş assistant ile başlıyorsa küçük bir kullanıcı bootstrap'i öne ekle).
- Antigravity Claude: thinking imzalarını normalleştir; imzasız thinking bloklarını düşür.

**Anthropic / Minimax (Anthropic-uyumlu)**

- Tool result eşleştirme onarımı ve sentetik tool result'lar.
- Dönüş doğrulaması (katı sırayı karşılamak için art arda gelen kullanıcı dönüşlerini birleştir).

**Mistral (model kimliğine dayalı algılama dahil)**

- Tool call kimliği temizleme: strict9 (uzunluğu 9 olan alfanümerik).

**OpenRouter Gemini**

- Düşünce imzası temizliği: base64 olmayan `thought_signature` değerlerini soy (base64 olanları koru).

**Diğer her şey**

- Yalnızca görsel temizleme.

---

## Geçmiş davranış (2026.1.22 öncesi)

2026.1.22 sürümünden önce OpenClaw, çok katmanlı transkript hijyeni uyguluyordu:

- Her bağlam oluşturmada çalışan bir **transcript-sanitize extension** vardı ve şunları yapabiliyordu:
  - Tool use/result eşleştirmesini onarmak.
  - Tool call kimliklerini temizlemek (`_`/`-` karakterlerini koruyan katı olmayan kip dahil).
- Çalıştırıcı ayrıca sağlayıcıya özgü temizleme de yapıyordu; bu da işi yineliyordu.
- Sağlayıcı ilkesinin dışında ek değişiklikler oluyordu, örneğin:
  - Kalıcılaştırmadan önce assistant metninden `<final>` etiketlerini soymak.
  - Boş assistant hata dönüşlerini düşürmek.
  - Tool call'lardan sonra assistant içeriğini kırpmak.

Bu karmaşıklık sağlayıcılar arası regresyonlara yol açtı (`openai-responses`
`call_id|fc_id` eşleştirmesi özellikle). 2026.1.22 temizliği extension'ı kaldırdı, mantığı
çalıştırıcıda merkezileştirdi ve OpenAI'ı görsel temizleme dışında **dokunulmaz** yaptı.
