---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'OpenClaw sandboxing''in nasıl çalıştığı: kipler, kapsamlar, çalışma alanı erişimi ve imajlar'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-25T13:48:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f22778690a4d41033c7abf9e97d54e53163418f8d45f1a816ce2be9d124fedf
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw, etki alanını azaltmak için **araçları sandbox arka uçları içinde** çalıştırabilir.
Bu **isteğe bağlıdır** ve yapılandırma ile kontrol edilir (`agents.defaults.sandbox` veya
`agents.list[].sandbox`). Sandboxing kapalıysa araçlar host üzerinde çalışır.
Gateway host üzerinde kalır; etkinleştirildiğinde araç yürütme yalıtılmış bir sandbox
içinde çalışır.

Bu kusursuz bir güvenlik sınırı değildir, ancak model aptalca bir şey yaptığında
dosya sistemi ve süreç erişimini anlamlı ölçüde sınırlar.

## Neler sandbox içine alınır

- Araç yürütme (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` vb.).
- İsteğe bağlı sandbox'lı tarayıcı (`agents.defaults.sandbox.browser`).
  - Varsayılan olarak sandbox tarayıcısı, tarayıcı aracı ihtiyaç duyduğunda otomatik başlar (CDP'nin erişilebilir olmasını sağlar).
    `agents.defaults.sandbox.browser.autoStart` ve `agents.defaults.sandbox.browser.autoStartTimeoutMs` ile yapılandırın.
  - Varsayılan olarak sandbox tarayıcı kapsayıcıları, genel `bridge` ağı yerine ayrılmış bir Docker ağı (`openclaw-sandbox-browser`) kullanır.
    `agents.defaults.sandbox.browser.network` ile yapılandırın.
  - İsteğe bağlı `agents.defaults.sandbox.browser.cdpSourceRange`, kapsayıcı kenarı CDP girişini bir CIDR izin listesiyle kısıtlar (örneğin `172.21.0.1/32`).
  - noVNC gözlemci erişimi varsayılan olarak parola korumalıdır; OpenClaw kısa ömürlü bir token URL üretir, bu URL yerel bir bootstrap sayfası sunar ve noVNC'yi parola URL parçasında açar (sorgu/üst bilgi günlüklerinde değil).
  - `agents.defaults.sandbox.browser.allowHostControl`, sandbox'lı oturumların host tarayıcıyı açıkça hedeflemesine izin verir.
  - İsteğe bağlı izin listeleri `target: "custom"` değerini kapılar: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Sandbox içine alınmayanlar:

- Gateway sürecinin kendisi.
- Açıkça sandbox dışında çalışmasına izin verilen araçlar (ör. `tools.elevated`).
  - **Yükseltilmiş exec, sandboxing'i baypas eder ve yapılandırılmış kaçış yolunu kullanır (`gateway` varsayılan, veya exec hedefi `node` ise `node`).**
  - Sandboxing kapalıysa `tools.elevated` yürütmeyi değiştirmez (zaten host üstündedir). Bkz. [Elevated Mode](/tr/tools/elevated).

## Kipler

`agents.defaults.sandbox.mode`, sandboxing'in **ne zaman** kullanılacağını kontrol eder:

- `"off"`: sandboxing yok.
- `"non-main"`: yalnızca **ana olmayan** oturumları sandbox içine alır (host üzerinde normal sohbetler istiyorsanız varsayılan).
- `"all"`: her oturum bir sandbox içinde çalışır.
  Not: `"non-main"`, ajan kimliğine değil `session.mainKey` değerine (varsayılan `"main"`) dayanır.
  Grup/kanal oturumları kendi anahtarlarını kullanır, bu yüzden ana olmayan sayılır ve sandbox içine alınırlar.

## Kapsam

`agents.defaults.sandbox.scope`, **kaç kapsayıcı** oluşturulacağını kontrol eder:

- `"agent"` (varsayılan): ajan başına bir kapsayıcı.
- `"session"`: oturum başına bir kapsayıcı.
- `"shared"`: tüm sandbox'lı oturumlar tarafından paylaşılan bir kapsayıcı.

## Arka uç

`agents.defaults.sandbox.backend`, sandbox'ı **hangi çalışma zamanının** sağlayacağını kontrol eder:

- `"docker"` (sandboxing etkin olduğunda varsayılan): yerel Docker destekli sandbox çalışma zamanı.
- `"ssh"`: genel SSH destekli uzak sandbox çalışma zamanı.
- `"openshell"`: OpenShell destekli sandbox çalışma zamanı.

SSH'ye özgü yapılandırma `agents.defaults.sandbox.ssh` altında bulunur.
OpenShell'e özgü yapılandırma `plugins.entries.openshell.config` altında bulunur.

### Bir arka uç seçme

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Nerede çalışır**  | Yerel kapsayıcı                  | SSH ile erişilebilen herhangi bir host | OpenShell tarafından yönetilen sandbox              |
| **Kurulum**         | `scripts/sandbox-setup.sh`       | SSH anahtarı + hedef host      | OpenShell Plugin etkin                              |
| **Çalışma alanı modeli** | Bind-mount veya kopya       | Uzak-kanonik (bir kez tohumlanır) | `mirror` veya `remote`                           |
| **Ağ denetimi**     | `docker.network` (varsayılan: yok) | Uzak hosta bağlı            | OpenShell'e bağlı                                   |
| **Tarayıcı sandbox'ı** | Desteklenir                  | Desteklenmez                   | Henüz desteklenmez                                  |
| **Bind mount'lar**  | `docker.binds`                   | Uygulanamaz                    | Uygulanamaz                                         |
| **En uygun olduğu durum** | Yerel geliştirme, tam yalıtım | Uzak bir makineye yük boşaltma | İsteğe bağlı çift yönlü eşzamanlama ile yönetilen uzak sandbox'lar |

### Docker arka ucu

Sandboxing varsayılan olarak kapalıdır. Sandboxing'i etkinleştirir ve bir
arka uç seçmezseniz OpenClaw Docker arka ucunu kullanır. Araçları ve sandbox tarayıcılarını
Docker daemon soketi (`/var/run/docker.sock`) üzerinden yerel olarak çalıştırır. Sandbox kapsayıcı
yalıtımı Docker namespace'leri tarafından belirlenir.

**Docker-out-of-Docker (DooD) Kısıtları**:
OpenClaw Gateway'in kendisini bir Docker kapsayıcısı olarak dağıtırsanız, host Docker soketini kullanarak kardeş sandbox kapsayıcılarını yönetir (DooD). Bu, belirli bir yol eşleme kısıtı getirir:

- **Config Host Yollarını Gerektirir**: `openclaw.json` içindeki `workspace` yapılandırması, Gateway kapsayıcısının iç yolu değil, **Host'un mutlak yolunu** içermelidir (ör. `/home/user/.openclaw/workspaces`). OpenClaw, Docker daemon'undan bir sandbox başlatmasını istediğinde daemon yolları Gateway namespace'ine göre değil Host OS namespace'ine göre değerlendirir.
- **FS Bridge Eşliği (Aynı Volume Haritası)**: OpenClaw Gateway yerel süreci de heartbeat ve köprü dosyalarını `workspace` dizinine yazar. Gateway aynı dizgeyi (host yolu) kendi kapsayıcılı ortamı içinden değerlendirdiği için, Gateway dağıtımı host namespace'ini yerel olarak bağlayan aynı volume haritasını içermelidir (`-v /home/user/.openclaw:/home/user/.openclaw`).

Yolları mutlak host eşliği olmadan dahili olarak eşlerseniz, tam nitelikli yol dizesi yerel olarak var olmadığından OpenClaw kapsayıcı ortamı içinde heartbeat yazmaya çalışırken doğal olarak `EACCES` izin hatası verir.

### SSH arka ucu

OpenClaw'ın `exec`, dosya araçlarını ve medya okumalarını
SSH ile erişilebilen herhangi bir makinede sandbox içine almasını istediğinizde `backend: "ssh"` kullanın.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Veya yerel dosyalar yerine SecretRef'ler / satır içi içerikler kullanın:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Nasıl çalışır:

- OpenClaw, `sandbox.ssh.workspaceRoot` altında kapsam başına bir uzak kök oluşturur.
- Oluşturma veya yeniden oluşturma sonrası ilk kullanımda OpenClaw, yerel çalışma alanından bu uzak çalışma alanını bir kez tohumlar.
- Bundan sonra `exec`, `read`, `write`, `edit`, `apply_patch`, istem medya okumaları ve gelen medya hazırlığı SSH üzerinden doğrudan uzak çalışma alanına karşı çalışır.
- OpenClaw, uzak değişiklikleri otomatik olarak yerel çalışma alanına geri eşzamanlamaz.

Kimlik doğrulama materyali:

- `identityFile`, `certificateFile`, `knownHostsFile`: mevcut yerel dosyaları kullanır ve bunları OpenSSH config üzerinden geçirir.
- `identityData`, `certificateData`, `knownHostsData`: satır içi dizeler veya SecretRef'ler kullanır. OpenClaw bunları normal secrets çalışma zamanı anlık görüntüsü üzerinden çözümler, `0600` izinleriyle geçici dosyalara yazar ve SSH oturumu sona erdiğinde siler.
- Aynı öğe için hem `*File` hem `*Data` ayarlanmışsa, o SSH oturumu için `*Data` kazanır.

Bu bir **uzak-kanonik** modeldir. Başlangıç tohumlamasından sonra uzak SSH çalışma alanı gerçek sandbox durumu olur.

Önemli sonuçlar:

- Tohumlama adımından sonra OpenClaw dışında host üzerinde yapılan yerel düzenlemeler, sandbox'ı yeniden oluşturana kadar uzakta görünmez.
- `openclaw sandbox recreate`, kapsam başına uzak kökü siler ve bir sonraki kullanımda yeniden yerelden tohumlar.
- SSH arka ucunda tarayıcı sandboxing desteklenmez.
- `sandbox.docker.*` ayarları SSH arka ucuna uygulanmaz.

### OpenShell arka ucu

OpenClaw'ın araçları OpenShell tarafından yönetilen uzak bir ortamda sandbox içine almasını istediğinizde `backend: "openshell"` kullanın. Tam kurulum kılavuzu, yapılandırma
başvurusu ve çalışma alanı kipi karşılaştırması için ayrılmış
[OpenShell sayfasına](/tr/gateway/openshell) bakın.

OpenShell, genel SSH arka ucuyla aynı çekirdek SSH taşımasını ve uzak dosya sistemi köprüsünü yeniden kullanır
ve OpenShell'e özgü yaşam döngüsünü
(`sandbox create/get/delete`, `sandbox ssh-config`) ve isteğe bağlı `mirror`
çalışma alanı kipini ekler.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

OpenShell kipleri:

- `mirror` (varsayılan): yerel çalışma alanı kanonik kalır. OpenClaw, exec öncesinde yerel dosyaları OpenShell içine eşzamanlar ve exec sonrasında uzak çalışma alanını geri eşzamanlar.
- `remote`: sandbox oluşturulduktan sonra OpenShell çalışma alanı kanonik olur. OpenClaw uzak çalışma alanını yerel çalışma alanından bir kez tohumlar, ardından dosya araçları ve exec değişiklikleri geri eşzamanlamadan doğrudan uzak sandbox'a karşı çalışır.

Uzak taşıma ayrıntıları:

- OpenClaw, OpenShell'den `openshell sandbox ssh-config <name>` üzerinden sandbox'a özgü SSH config ister.
- Çekirdek bu SSH config'ini geçici bir dosyaya yazar, SSH oturumunu açar ve `backend: "ssh"` tarafından kullanılan aynı uzak dosya sistemi köprüsünü yeniden kullanır.
- Yalnızca `mirror` kipinde yaşam döngüsü farklıdır: exec öncesi yerelden uzağa eşzamanlama, sonra exec sonrası geri eşzamanlama.

Mevcut OpenShell sınırlamaları:

- sandbox tarayıcısı henüz desteklenmez
- `sandbox.docker.binds`, OpenShell arka ucunda desteklenmez
- `sandbox.docker.*` altındaki Docker'a özgü çalışma zamanı ayarları hâlâ yalnızca Docker arka ucuna uygulanır

#### Çalışma alanı kipleri

OpenShell'in iki çalışma alanı modeli vardır. Pratikte en çok önemli olan kısım budur.

##### `mirror`

**Yerel çalışma alanının kanonik kalmasını** istiyorsanız `plugins.entries.openshell.config.mode: "mirror"` kullanın.

Davranış:

- `exec` öncesinde OpenClaw yerel çalışma alanını OpenShell sandbox'ına eşzamanlar.
- `exec` sonrasında OpenClaw uzak çalışma alanını yerel çalışma alanına geri eşzamanlar.
- Dosya araçları yine sandbox köprüsü üzerinden çalışır, ancak dönüşler arasında doğruluk kaynağı yerel çalışma alanı olarak kalır.

Şu durumlarda kullanın:

- OpenClaw dışında yerel olarak dosya düzenliyor ve bu değişikliklerin sandbox içinde otomatik görünmesini istiyorsanız
- OpenShell sandbox'ının mümkün olduğunca Docker arka ucuna benzemesini istiyorsanız
- host çalışma alanının her exec dönüşünden sonra sandbox yazımlarını yansıtmasını istiyorsanız

Karşılığında:

- exec öncesi ve sonrası ek eşzamanlama maliyeti

##### `remote`

**OpenShell çalışma alanının kanonik olmasını** istiyorsanız `plugins.entries.openshell.config.mode: "remote"` kullanın.

Davranış:

- Sandbox ilk oluşturulduğunda OpenClaw, uzak çalışma alanını yerel çalışma alanından bir kez tohumlar.
- Bundan sonra `exec`, `read`, `write`, `edit` ve `apply_patch` doğrudan uzak OpenShell çalışma alanına karşı çalışır.
- OpenClaw, exec sonrasında uzak değişiklikleri yerel çalışma alanına geri **eşzamanlamaz**.
- İstem zamanındaki medya okumaları yine çalışır; çünkü dosya ve medya araçları yerel host yolunu varsaymak yerine sandbox köprüsü üzerinden okur.
- Taşıma, `openshell sandbox ssh-config` tarafından döndürülen OpenShell sandbox'ına SSH ile yapılır.

Önemli sonuçlar:

- Tohumlama adımından sonra host üzerinde OpenClaw dışında dosyaları düzenlerseniz, uzak sandbox bu değişiklikleri otomatik olarak **görmez**.
- Sandbox yeniden oluşturulursa, uzak çalışma alanı yeniden yerel çalışma alanından tohumlanır.
- `scope: "agent"` veya `scope: "shared"` ile bu uzak çalışma alanı aynı kapsamda paylaşılır.

Şu durumlarda kullanın:

- sandbox'ın esas olarak uzak OpenShell tarafında yaşamasını istiyorsanız
- dönüş başına daha düşük eşzamanlama ek yükü istiyorsanız
- host üzerindeki yerel düzenlemelerin uzak sandbox durumunun üzerine sessizce yazmasını istemiyorsanız

Sandbox'ı geçici bir yürütme ortamı olarak düşünüyorsanız `mirror` seçin.
Sandbox'ı gerçek çalışma alanı olarak düşünüyorsanız `remote` seçin.

#### OpenShell yaşam döngüsü

OpenShell sandbox'ları yine de normal sandbox yaşam döngüsü üzerinden yönetilir:

- `openclaw sandbox list`, Docker çalışma zamanlarının yanı sıra OpenShell çalışma zamanlarını da gösterir
- `openclaw sandbox recreate`, mevcut çalışma zamanını siler ve OpenClaw'ın sonraki kullanımda onu yeniden oluşturmasına izin verir
- budama mantığı da arka uç farkındalığına sahiptir

`remote` kipi için recreate özellikle önemlidir:

- recreate, o kapsam için kanonik uzak çalışma alanını siler
- sonraki kullanım, yerel çalışma alanından yeni bir uzak çalışma alanı tohumlar

`mirror` kipi için recreate esas olarak uzak yürütme ortamını sıfırlar;
çünkü yerel çalışma alanı zaten kanonik kalır.

## Çalışma alanı erişimi

`agents.defaults.sandbox.workspaceAccess`, sandbox'ın **neleri görebileceğini** kontrol eder:

- `"none"` (varsayılan): araçlar `~/.openclaw/sandboxes` altında bir sandbox çalışma alanı görür.
- `"ro"`: ajan çalışma alanını `/agent` altında salt okunur bağlar (`write`/`edit`/`apply_patch` devre dışı kalır).
- `"rw"`: ajan çalışma alanını `/workspace` altında okuma/yazma olarak bağlar.

OpenShell arka ucuyla:

- `mirror` kipi, exec dönüşleri arasında yine yerel çalışma alanını kanonik kaynak olarak kullanır
- `remote` kipi, ilk tohumlamadan sonra uzak OpenShell çalışma alanını kanonik kaynak olarak kullanır
- `workspaceAccess: "ro"` ve `"none"` yine aynı şekilde yazma davranışını kısıtlar

Gelen medya, etkin sandbox çalışma alanına kopyalanır (`media/inbound/*`).
Skills notu: `read` aracı sandbox köküne bağlıdır. `workspaceAccess: "none"` ile
OpenClaw, uygun Skills'i sandbox çalışma alanına (`.../skills`) yansıtır;
böylece okunabilir olurlar. `"rw"` ile çalışma alanı Skills'i
`/workspace/skills` içinden okunabilir.

## Özel bind mount'lar

`agents.defaults.sandbox.docker.binds`, kapsayıcı içine ek host dizinleri bağlar.
Biçim: `host:container:mode` (örn. `"/home/user/source:/source:rw"`).

Genel ve ajan başına bind'lar **birleştirilir** (yer değiştirmez). `scope: "shared"` altında ajan başına bind'lar yok sayılır.

`agents.defaults.sandbox.browser.binds`, yalnızca **sandbox tarayıcı** kapsayıcısına ek host dizinleri bağlar.

- Ayarlandığında (`[]` dahil), tarayıcı kapsayıcısı için `agents.defaults.sandbox.docker.binds` değerinin yerini alır.
- Atlandığında, tarayıcı kapsayıcısı geriye dönük uyumlu biçimde `agents.defaults.sandbox.docker.binds` değerine geri döner.

Örnek (salt okunur kaynak + ek bir veri dizini):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

Güvenlik notları:

- Bind'lar sandbox dosya sistemini baypas eder: ayarladığınız kipte (`:ro` veya `:rw`) host yollarını açığa çıkarırlar.
- OpenClaw tehlikeli bind kaynaklarını engeller (örneğin: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` ve bunları açığa çıkaracak üst bağlamalar).
- OpenClaw ayrıca `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` ve `~/.ssh` gibi yaygın home dizini kimlik bilgisi köklerini de engeller.
- Bind doğrulaması yalnızca dize eşleştirmesi değildir. OpenClaw kaynak yolu normalize eder, ardından engellenen yolları ve izin verilen kökleri yeniden kontrol etmeden önce bunu en derin mevcut ata üzerinden tekrar çözümler.
- Bu, son yaprak henüz mevcut olmasa bile sembolik bağlantı-ebeveyn kaçışlarının yine kapalı başarısız olacağı anlamına gelir. Örnek: `run-link` orayı işaret ediyorsa `/workspace/run-link/new-file` yine de `/var/run/...` olarak çözümlenir.
- İzin verilen kaynak kökleri de aynı şekilde kanonikleştirilir; bu yüzden yalnızca sembolik bağlantı çözümlemesinden önce izin listesi içinde görünüyormuş gibi duran bir yol bile `outside allowed roots` olarak reddedilir.
- Hassas bağlamalar (secrets, SSH anahtarları, servis kimlik bilgileri), kesinlikle gerekmedikçe `:ro` olmalıdır.
- Çalışma alanına yalnızca okuma erişimi gerekiyorsa `workspaceAccess: "ro"` ile birleştirin; bind kipleri bağımsız kalır.
- Bind'ların araç ilkesi ve yükseltilmiş exec ile nasıl etkileştiği için [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) bölümüne bakın.

## İmajlar + kurulum

Varsayılan Docker imajı: `openclaw-sandbox:bookworm-slim`

Bir kez oluşturun:

```bash
scripts/sandbox-setup.sh
```

Not: varsayılan imaj Node içermez. Bir Skill'in Node'a (veya
başka çalışma zamanlarına) ihtiyacı varsa ya özel bir imaj oluşturun ya da
`sandbox.docker.setupCommand` ile kurun (ağ çıkışı + yazılabilir kök +
root kullanıcı gerektirir).

`curl`, `jq`, `nodejs`, `python3`, `git` gibi yaygın araçlarla daha işlevsel bir sandbox imajı istiyorsanız şunu oluşturun:

```bash
scripts/sandbox-common-setup.sh
```

Ardından `agents.defaults.sandbox.docker.image` değerini
`openclaw-sandbox-common:bookworm-slim` olarak ayarlayın.

Sandbox'lı tarayıcı imajı:

```bash
scripts/sandbox-browser-setup.sh
```

Varsayılan olarak Docker sandbox kapsayıcıları **ağsız** çalışır.
Bunu `agents.defaults.sandbox.docker.network` ile geçersiz kılın.

Paketle gelen sandbox tarayıcı imajı ayrıca kapsayıcılı iş yükleri için
temkinli Chromium başlangıç varsayılanları uygular. Geçerli kapsayıcı varsayılanları şunları içerir:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<OPENCLAW_BROWSER_CDP_PORT üzerinden türetilir>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `noSandbox` etkinse `--no-sandbox`.
- Üç grafik sertleştirme bayrağı (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) isteğe bağlıdır ve
  kapsayıcıların GPU desteği olmadığı durumlarda faydalıdır. İş yükünüz WebGL veya başka 3D/tarayıcı özellikleri gerektiriyorsa
  `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` ayarlayın.
- `--disable-extensions` varsayılan olarak etkindir ve
  uzantıya bağımlı akışlar için `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
  ile devre dışı bırakılabilir.
- `--renderer-process-limit=2`,
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile kontrol edilir; burada `0`, Chromium'un varsayılanını korur.

Farklı bir çalışma zamanı profiline ihtiyacınız varsa özel bir tarayıcı imajı kullanın ve
kendi entrypoint'inizi sağlayın. Yerel (kapsayıcı olmayan) Chromium profilleri için
ek başlangıç bayrakları eklemek üzere `browser.extraArgs` kullanın.

Güvenlik varsayılanları:

- `network: "host"` engellenir.
- `network: "container:<id>"` varsayılan olarak engellenir (namespace birleştirme baypas riski).
- Acil durum geçersiz kılması: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Docker kurulumları ve kapsayıcılı Gateway burada bulunur:
[Docker](/tr/install/docker)

Docker Gateway dağıtımları için `scripts/docker/setup.sh`, sandbox yapılandırmasını önyükleyebilir.
Bu yolu etkinleştirmek için `OPENCLAW_SANDBOX=1` (veya `true`/`yes`/`on`) ayarlayın.
Soket konumunu `OPENCLAW_DOCKER_SOCKET` ile geçersiz kılabilirsiniz. Tam kurulum ve env
başvurusu: [Docker](/tr/install/docker#agent-sandbox)

## setupCommand (tek seferlik kapsayıcı kurulumu)

`setupCommand`, sandbox kapsayıcısı oluşturulduktan sonra **bir kez** çalışır (her çalıştırmada değil).
Kapsayıcı içinde `sh -lc` ile yürütülür.

Yollar:

- Genel: `agents.defaults.sandbox.docker.setupCommand`
- Ajan başına: `agents.list[].sandbox.docker.setupCommand`

Yaygın tuzaklar:

- Varsayılan `docker.network`, `"none"` değerindedir (çıkış yok), bu nedenle paket kurulumları başarısız olur.
- `docker.network: "container:<id>"`, `dangerouslyAllowContainerNamespaceJoin: true` gerektirir ve yalnızca acil durum kullanım içindir.
- `readOnlyRoot: true`, yazmaları engeller; `readOnlyRoot: false` ayarlayın veya özel bir imaj oluşturun.
- Paket kurulumları için `user` root olmalıdır (`user` alanını atlayın veya `user: "0:0"` ayarlayın).
- Sandbox exec, host `process.env` değerini devralmaz. Skill API anahtarları için
  `agents.defaults.sandbox.docker.env` (veya özel bir imaj) kullanın.

## Araç ilkesi + kaçış kapakları

Araç izin/verme ve reddetme ilkeleri, sandbox kurallarından önce yine uygulanır. Bir araç
genel olarak veya ajan başına reddedilmişse, sandboxing onu geri getirmez.

`tools.elevated`, sandbox dışında `exec` çalıştıran açık bir kaçış kapağıdır (`gateway` varsayılan, veya exec hedefi `node` ise `node`).
`/exec` yönergeleri yalnızca yetkili gönderenler için uygulanır ve oturum başına kalıcı olur; `exec`'i kesin olarak devre dışı bırakmak için
araç ilkesi reddini kullanın (bkz. [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Hata ayıklama:

- Etkin sandbox kipini, araç ilkesini ve düzeltme yapılandırma anahtarlarını incelemek için `openclaw sandbox explain` kullanın.
- “Bu neden engellendi?” zihinsel modeli için [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) bölümüne bakın.
  Bunu sıkı tutun.

## Çok ajanlı geçersiz kılmalar

Her ajan sandbox + araçları geçersiz kılabilir:
`agents.list[].sandbox` ve `agents.list[].tools` (ayrıca sandbox araç ilkesi için `agents.list[].tools.sandbox.tools`).
Öncelik için [Multi-Agent Sandbox & Tools](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

## En düşük etkinleştirme örneği

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## İlgili belgeler

- [OpenShell](/tr/gateway/openshell) -- yönetilen sandbox arka ucu kurulumu, çalışma alanı kipleri ve yapılandırma başvurusu
- [Sandbox Yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) -- “bu neden engellendi?” hata ayıklaması
- [Multi-Agent Sandbox & Tools](/tr/tools/multi-agent-sandbox-tools) -- ajan başına geçersiz kılmalar ve öncelik
- [Güvenlik](/tr/gateway/security)
