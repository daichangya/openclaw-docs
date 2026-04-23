---
read_when:
    - Ajanın hangi oturum araçlarına sahip olduğunu anlamak istiyorsunuz
    - Oturumlar arası erişimi veya alt ajan oluşturmayı yapılandırmak istiyorsunuz
    - Durumu incelemek veya oluşturulan alt ajanları denetlemek istiyorsunuz
summary: Oturumlar arası durum, hatırlama, mesajlaşma ve alt ajan orkestrasyonu için ajan araçları
title: Oturum Araçları
x-i18n:
    generated_at: "2026-04-23T09:02:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd8b545429726d0880e6086ba7190497861bf3f3e1e88d53cb38ef9e5e4468c6
    source_path: concepts/session-tool.md
    workflow: 15
---

# Oturum Araçları

OpenClaw, ajanlara oturumlar arasında çalışma, durumu inceleme ve alt ajanları düzenleme araçları verir.

## Kullanılabilir araçlar

| Araç               | Ne yapar                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | İsteğe bağlı filtrelerle oturumları listeler (tür, etiket, ajan, yakınlık, önizleme) |
| `sessions_history` | Belirli bir oturumun transkriptini okur                                     |
| `sessions_send`    | Başka bir oturuma mesaj gönderir ve isteğe bağlı olarak bekler              |
| `sessions_spawn`   | Arka plan çalışması için yalıtılmış bir alt ajan oturumu oluşturur          |
| `sessions_yield`   | Geçerli dönüşü sonlandırır ve takip eden alt ajan sonuçlarını bekler        |
| `subagents`        | Bu oturum için oluşturulmuş alt ajanları listeler, yönlendirir veya sonlandırır |
| `session_status`   | `/status` benzeri bir kart gösterir ve isteğe bağlı olarak oturum başına model geçersiz kılması ayarlar |

## Oturumları listeleme ve okuma

`sessions_list`, oturumları anahtarları, agentId, tür, kanal, model, token sayıları ve zaman damgaları ile döndürür. Tür (`main`, `group`, `cron`, `hook`, `node`), tam `label`, tam `agentId`, arama metni veya yakınlık (`activeMinutes`) ile filtreleyin. Posta kutusu tarzı triyaj gerektiğinde, görünürlük kapsamlı türetilmiş bir başlık, son mesaj önizleme kesiti veya her satırda sınırlı yakın tarihli mesajlar da isteyebilir. Türetilmiş başlıklar ve önizlemeler yalnızca çağıranın yapılandırılmış oturum aracı görünürlük politikası altında zaten görebildiği oturumlar için üretilir; böylece ilgisiz oturumlar gizli kalır.

`sessions_history`, belirli bir oturum için konuşma transkriptini getirir. Varsayılan olarak araç sonuçları hariç tutulur -- bunları görmek için `includeTools: true` geçin. Döndürülen görünüm kasıtlı olarak sınırlanmış ve güvenlik filtrelidir:

- ajan metni hatırlamadan önce normalize edilir:
  - thinking etiketleri kaldırılır
  - `<relevant-memories>` / `<relevant_memories>` iskele blokları kaldırılır
  - `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` ve `<function_calls>...</function_calls>` gibi düz metin araç çağrısı XML payload blokları, temiz kapanmayan kesilmiş payload'lar dahil kaldırılır
  - `[Tool Call: ...]`, `[Tool Result ...]` ve `[Historical context ...]` gibi düşürülmüş araç çağrısı/sonuç iskeleleri kaldırılır
  - `<|assistant|>`, diğer ASCII `<|...|>` belirteçleri ve tam genişlikli `<｜...｜>` varyantları gibi sızmış model denetim belirteçleri kaldırılır
  - `<invoke ...>` / `</minimax:tool_call>` gibi bozuk MiniMax araç çağrısı XML'i kaldırılır
- kimlik bilgisi/belirteç benzeri metin döndürülmeden önce redakte edilir
- uzun metin blokları kısaltılır
- çok büyük geçmişler daha eski satırları düşürebilir veya aşırı büyük bir satırı `[sessions_history omitted: message too large]` ile değiştirebilir
- araç `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted` ve `bytes` gibi özet bayrakları bildirir

Her iki araç da bir **oturum anahtarı** (`"main"` gibi) veya önceki bir liste çağrısından gelen **oturum kimliği** kabul eder.

Tam bayt bayt transkripte ihtiyacınız varsa, `sessions_history` değerini ham döküm gibi değerlendirmek yerine diskteki transkript dosyasını inceleyin.

## Oturumlar arası mesaj gönderme

`sessions_send`, başka bir oturuma mesaj teslim eder ve isteğe bağlı olarak yanıtı bekler:

- **Gönder ve unut:** Kuyruğa alıp hemen dönmek için `timeoutSeconds: 0` ayarlayın.
- **Yanıtı bekle:** Bir zaman aşımı ayarlayın ve yanıtı satır içi alın.

Hedef yanıt verdikten sonra OpenClaw, ajanların dönüşümlü mesajlaştığı bir **geri yanıt döngüsü** çalıştırabilir (en fazla 5 dönüş). Hedef ajan erken durdurmak için `REPLY_SKIP` ile yanıt verebilir.

## Durum ve orkestrasyon yardımcıları

`session_status`, geçerli veya başka bir görünür oturum için hafif `/status` eşdeğeri araçtır. Kullanımı, zamanı, model/çalışma zamanı durumunu ve mevcut olduğunda bağlantılı arka plan görevi bağlamını raporlar. `/status` gibi, en son transkript kullanım girdisinden seyrek token/önbellek sayaçlarını geri doldurabilir ve `model=default` oturum başına geçersiz kılmayı temizler.

`sessions_yield`, beklediğiniz takip olayının sonraki mesaj olabilmesi için geçerli dönüşü kasıtlı olarak sonlandırır. Sonuçların yoklama döngüleri kurmak yerine sonraki mesaj olarak gelmesini istediğinizde, alt ajanlar oluşturduktan sonra bunu kullanın.

`subagents`, zaten oluşturulmuş OpenClaw alt ajanları için denetim düzlemi yardımcısıdır. Şunları destekler:

- etkin/son çalıştırmaları incelemek için `action: "list"`
- çalışan bir alt sürece takip rehberliği göndermek için `action: "steer"`
- tek bir alt süreci veya `all` değerini durdurmak için `action: "kill"`

## Alt ajan oluşturma

`sessions_spawn`, arka plan görevi için yalıtılmış bir oturum oluşturur. Her zaman engellemesizdir -- `runId` ve `childSessionKey` ile hemen döner.

Temel seçenekler:

- Harici harness ajanları için `runtime: "subagent"` (varsayılan) veya `"acp"`.
- Alt oturum için `model` ve `thinking` geçersiz kılmaları.
- Oluşturmayı bir sohbet iş parçacığına bağlamak için `thread: true` (Discord, Slack vb.).
- Alt süreçte sandbox zorlamak için `sandbox: "require"`.

Varsayılan yaprak alt ajanlar oturum araçları almaz. `maxSpawnDepth >= 2` olduğunda, derinlik-1 orkestratör alt ajanlar ayrıca kendi alt süreçlerini yönetebilmeleri için `sessions_spawn`, `subagents`, `sessions_list` ve `sessions_history` alır. Yaprak çalıştırmalar yine de özyinelemeli orkestrasyon araçları almaz.

Tamamlandıktan sonra bir duyuru adımı sonucu isteği yapanın kanalına gönderir. Tamamlanma teslimatı, mevcut olduğunda bağlı iş parçacığı/konu yönlendirmesini korur ve tamamlanma kaynağı yalnızca bir kanal tanımlasa bile OpenClaw doğrudan teslimat için isteği yapan oturumun saklanan rotasını (`lastChannel` / `lastTo`) yeniden kullanabilir.

ACP'ye özgü davranış için bkz. [ACP Agents](/tr/tools/acp-agents).

## Görünürlük

Oturum araçları, ajanın görebileceği şeyleri sınırlamak için kapsamlandırılmıştır:

| Düzey   | Kapsam                                |
| ------- | ------------------------------------- |
| `self`  | Yalnızca geçerli oturum               |
| `tree`  | Geçerli oturum + oluşturulan alt ajanlar |
| `agent` | Bu ajan için tüm oturumlar            |
| `all`   | Tüm oturumlar (yapılandırıldıysa ajanlar arası) |

Varsayılan `tree` düzeyidir. Sandbox'lı oturumlar, yapılandırmadan bağımsız olarak `tree` düzeyine sıkıştırılır.

## Daha fazla okuma

- [Oturum Yönetimi](/tr/concepts/session) -- yönlendirme, yaşam döngüsü, bakım
- [ACP Agents](/tr/tools/acp-agents) -- harici harness oluşturma
- [Çok ajanlı](/tr/concepts/multi-agent) -- çok ajanlı mimari
- [Gateway Yapılandırması](/tr/gateway/configuration) -- oturum aracı yapılandırma ayarları
