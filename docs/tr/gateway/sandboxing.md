---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'OpenClaw sandbox kullanımının nasıl çalıştığı: modlar, kapsamlar, çalışma alanı erişimi ve görseller'
title: Sandbox kullanımı
x-i18n:
    generated_at: "2026-04-21T08:59:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35405c103f37f7f7247462ed5bc54a4b0d2a19ca2a373cf10f7f231a62c2c7c4
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Sandbox kullanımı

OpenClaw, etki alanını azaltmak için **araçları sandbox arka uçları içinde** çalıştırabilir.
Bu **isteğe bağlıdır** ve yapılandırma tarafından denetlenir (`agents.defaults.sandbox` veya
`agents.list[].sandbox`). Sandbox kullanımı kapalıysa araçlar ana makinede çalışır.
Gateway ana makinede kalır; etkin olduğunda araç yürütmesi yalıtılmış bir sandbox
içinde çalışır.

Bu kusursuz bir güvenlik sınırı değildir, ancak model aptalca bir şey yaptığında
dosya sistemi ve süreç erişimini anlamlı ölçüde sınırlar.

## Neyin sandbox içine alındığı

- Araç yürütmesi (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` vb.).
- İsteğe bağlı sandbox'lı tarayıcı (`agents.defaults.sandbox.browser`).
  - Varsayılan olarak, browser aracı ihtiyaç duyduğunda sandbox tarayıcı otomatik başlar (CDP'nin erişilebilir olmasını sağlar).
    `agents.defaults.sandbox.browser.autoStart` ve `agents.defaults.sandbox.browser.autoStartTimeoutMs` ile yapılandırın.
  - Varsayılan olarak, sandbox tarayıcı kapsayıcıları genel `bridge` ağı yerine ayrılmış bir Docker ağı (`openclaw-sandbox-browser`) kullanır.
    `agents.defaults.sandbox.browser.network` ile yapılandırın.
  - İsteğe bağlı `agents.defaults.sandbox.browser.cdpSourceRange`, kapsayıcı kenarındaki CDP girişini bir CIDR izin listesiyle sınırlar (örneğin `172.21.0.1/32`).
  - noVNC gözlemci erişimi varsayılan olarak parola korumalıdır; OpenClaw kısa ömürlü bir belirteç URL'si üretir, bu URL yerel bir önyükleme sayfası sunar ve noVNC'yi URL parçasındaki parolayla açar (sorgu/header günlüklerinde değil).
  - `agents.defaults.sandbox.browser.allowHostControl`, sandbox'lı oturumların ana makine tarayıcısını açıkça hedeflemesine izin verir.
  - İsteğe bağlı izin listeleri `target: "custom"` kullanımını denetler: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Sandbox içine alınmayanlar:

- Gateway sürecinin kendisi.
- Açıkça sandbox dışında çalışmasına izin verilen tüm araçlar (ör. `tools.elevated`).
  - **Yükseltilmiş exec, sandbox kullanımını atlar ve yapılandırılmış kaçış yolunu kullanır (`gateway` varsayılan, exec hedefi `node` olduğunda `node`).**
  - Sandbox kullanımı kapalıysa `tools.elevated` yürütmeyi değiştirmez (zaten ana makinededir). Bkz. [Yükseltilmiş Mod](/tr/tools/elevated).

## Modlar

`agents.defaults.sandbox.mode`, sandbox kullanımının **ne zaman** kullanılacağını denetler:

- `"off"`: sandbox kullanımı yok.
- `"non-main"`: yalnızca **ana olmayan** oturumları sandbox içine alır (normal sohbetleri ana makinede istiyorsanız varsayılan).
- `"all"`: her oturum bir sandbox içinde çalışır.
  Not: `"non-main"`, aracı kimliğine değil `session.mainKey` değerine (varsayılan `"main"`) dayanır.
  Grup/kanal oturumları kendi anahtarlarını kullanır, bu nedenle ana olmayan sayılırlar ve sandbox içine alınırlar.

## Kapsam

`agents.defaults.sandbox.scope`, **kaç kapsayıcı** oluşturulacağını denetler:

- `"agent"` (varsayılan): aracı başına bir kapsayıcı.
- `"session"`: oturum başına bir kapsayıcı.
- `"shared"`: tüm sandbox'lı oturumlar tarafından paylaşılan bir kapsayıcı.

## Arka uç

`agents.defaults.sandbox.backend`, sandbox'ı hangi çalışma zamanının sağlayacağını denetler:

- `"docker"` (sandbox kullanımı etkin olduğunda varsayılan): yerel Docker destekli sandbox çalışma zamanı.
- `"ssh"`: genel SSH destekli uzak sandbox çalışma zamanı.
- `"openshell"`: OpenShell destekli sandbox çalışma zamanı.

SSH'ye özgü yapılandırma `agents.defaults.sandbox.ssh` altında bulunur.
OpenShell'e özgü yapılandırma `plugins.entries.openshell.config` altında bulunur.

### Arka uç seçme

|                     | Docker                           | SSH                            | OpenShell                                                |
| ------------------- | -------------------------------- | ------------------------------ | -------------------------------------------------------- |
| **Çalıştığı yer**   | Yerel kapsayıcı                  | SSH ile erişilebilen herhangi bir ana makine | OpenShell tarafından yönetilen sandbox                   |
| **Kurulum**         | `scripts/sandbox-setup.sh`       | SSH anahtarı + hedef ana makine | OpenShell Plugin'i etkin                                 |
| **Çalışma alanı modeli** | Bind-mount veya kopya       | Uzak-kanonik (bir kez tohumlanır) | `mirror` veya `remote`                                   |
| **Ağ denetimi**     | `docker.network` (varsayılan: yok) | Uzak ana makineye bağlı       | OpenShell'e bağlı                                        |
| **Tarayıcı sandbox'ı** | Desteklenir                 | Desteklenmez                   | Henüz desteklenmez                                       |
| **Bind mount'lar**  | `docker.binds`                   | Yok                            | Yok                                                      |
| **En uygun kullanım** | Yerel geliştirme, tam yalıtım | Uzak bir makineye aktarma      | İsteğe bağlı çift yönlü eşzamanlama ile yönetilen uzak sandbox'lar |

### Docker arka ucu

Sandbox kullanımı varsayılan olarak kapalıdır. Sandbox kullanımını etkinleştirir ve bir
arka uç seçmezseniz, OpenClaw Docker arka ucunu kullanır. Araçları ve sandbox tarayıcılarını
Docker daemon soketi (`/var/run/docker.sock`) aracılığıyla yerel olarak yürütür. Sandbox kapsayıcı
yalıtımı Docker ad alanları tarafından belirlenir.

**Docker-out-of-Docker (DooD) Kısıtları**:
OpenClaw Gateway'i bir Docker kapsayıcısı olarak dağıtırsanız, ana makinenin Docker soketini kullanarak eş düzey sandbox kapsayıcılarını düzenler (DooD). Bu durum belirli bir yol eşleme kısıtı getirir:

- **Yapılandırma Ana Makine Yolları Gerektirir**: `openclaw.json` içindeki `workspace` yapılandırması, iç Gateway kapsayıcı yolunu değil **Ana makinenin mutlak yolunu** içermelidir (ör. `/home/user/.openclaw/workspaces`). OpenClaw, Docker daemon'dan bir sandbox başlatmasını istediğinde, daemon yolları Gateway ad alanına göre değil Ana Makine OS ad alanına göre değerlendirir.
- **FS Köprüsü Eşliği (Aynı Volume Eşlemesi)**: OpenClaw Gateway yerel süreci de heartbeat ve köprü dosyalarını `workspace` dizinine yazar. Gateway kendi kapsayıcılı ortamının içinden tam aynı dizgeyi (ana makine yolunu) değerlendirdiğinden, Gateway dağıtımı ana makine ad alanını yerel olarak bağlayan aynı volume eşlemesini içermelidir (`-v /home/user/.openclaw:/home/user/.openclaw`).

Yolları içeride mutlak ana makine eşliği olmadan eşlerseniz, tam nitelikli yol dizgesi yerel olarak mevcut olmadığı için OpenClaw kapsayıcı ortamı içinde heartbeat yazmaya çalışırken yerel olarak `EACCES` izin hatası verir.

### SSH arka ucu

OpenClaw'ın `exec`, dosya araçlarını ve medya okumalarını
SSH ile erişilebilen herhangi bir makinede sandbox içine almasını istiyorsanız `backend: "ssh"` kullanın.

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
          // Veya yerel dosyalar yerine SecretRefs / satır içi içerik kullanın:
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
- Oluşturma veya yeniden oluşturma sonrasındaki ilk kullanımda OpenClaw, bu uzak çalışma alanını yerel çalışma alanından bir kez tohumlar.
- Bundan sonra `exec`, `read`, `write`, `edit`, `apply_patch`, istem medya okumaları ve gelen medya hazırlığı SSH üzerinden doğrudan uzak çalışma alanına karşı çalışır.
- OpenClaw uzak değişiklikleri otomatik olarak yerel çalışma alanına geri eşzamanlamaz.

Kimlik doğrulama materyali:

- `identityFile`, `certificateFile`, `knownHostsFile`: mevcut yerel dosyaları kullanır ve OpenSSH yapılandırması üzerinden geçirir.
- `identityData`, `certificateData`, `knownHostsData`: satır içi dizgiler veya SecretRefs kullanır. OpenClaw bunları normal secrets çalışma zamanı anlık görüntüsü üzerinden çözümler, `0600` izinleriyle geçici dosyalara yazar ve SSH oturumu bittiğinde siler.
- Aynı öğe için hem `*File` hem `*Data` ayarlanmışsa, bu SSH oturumu için `*Data` kazanır.

Bu bir **uzak-kanonik** modeldir. İlk tohumlamadan sonra uzak SSH çalışma alanı gerçek sandbox durumu haline gelir.

Önemli sonuçlar:

- Tohumlama adımından sonra OpenClaw dışında ana makinede yapılan yerel düzenlemeler, sandbox'ı yeniden oluşturana kadar uzakta görünmez.
- `openclaw sandbox recreate`, kapsam başına uzak kökü siler ve bir sonraki kullanımda yeniden yerelden tohumlar.
- Tarayıcı sandbox kullanımı SSH arka ucunda desteklenmez.
- `sandbox.docker.*` ayarları SSH arka ucuna uygulanmaz.

### OpenShell arka ucu

Araçları OpenShell tarafından yönetilen uzak bir ortamda sandbox içine almak istiyorsanız
`backend: "openshell"` kullanın. Tam kurulum kılavuzu, yapılandırma
başvurusu ve çalışma alanı modu karşılaştırması için ayrılmış
[OpenShell sayfasına](/tr/gateway/openshell) bakın.

OpenShell, genel SSH arka ucuyla aynı çekirdek SSH taşımasını ve uzak dosya sistemi köprüsünü yeniden kullanır
ve buna OpenShell'e özgü yaşam döngüsünü
(`sandbox create/get/delete`, `sandbox ssh-config`) ve isteğe bağlı `mirror`
çalışma alanı modunu ekler.

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

OpenShell modları:

- `mirror` (varsayılan): yerel çalışma alanı kanonik kalır. OpenClaw, exec öncesinde yerel dosyaları OpenShell'e eşzamanlar ve exec sonrasında uzak çalışma alanını geri eşzamanlar.
- `remote`: sandbox oluşturulduktan sonra OpenShell çalışma alanı kanonik olur. OpenClaw uzak çalışma alanını yerel çalışma alanından bir kez tohumlar, sonra dosya araçları ve exec değişiklikleri geri eşzamanlamadan doğrudan uzak sandbox üzerinde çalışır.

Uzak taşıma ayrıntıları:

- OpenClaw, `openshell sandbox ssh-config <name>` aracılığıyla OpenShell'den sandbox'a özgü SSH yapılandırması ister.
- Çekirdek, bu SSH yapılandırmasını geçici bir dosyaya yazar, SSH oturumunu açar ve `backend: "ssh"` tarafından kullanılan aynı uzak dosya sistemi köprüsünü yeniden kullanır.
- Yalnızca `mirror` modunda yaşam döngüsü farklıdır: exec öncesi yerelden uzağa eşzamanla, sonra exec sonrası geri eşzamanla.

Geçerli OpenShell sınırlamaları:

- sandbox tarayıcı henüz desteklenmez
- `sandbox.docker.binds`, OpenShell arka ucunda desteklenmez
- `sandbox.docker.*` altındaki Docker'a özgü çalışma zamanı düğmeleri yalnızca Docker arka ucuna uygulanır

#### Çalışma alanı modları

OpenShell'in iki çalışma alanı modeli vardır. Pratikte en önemli kısım budur.

##### `mirror`

**Yerel çalışma alanının kanonik kalmasını** istiyorsanız `plugins.entries.openshell.config.mode: "mirror"` kullanın.

Davranış:

- `exec` öncesinde OpenClaw yerel çalışma alanını OpenShell sandbox'ına eşzamanlar.
- `exec` sonrasında OpenClaw uzak çalışma alanını tekrar yerel çalışma alanına eşzamanlar.
- Dosya araçları hâlâ sandbox köprüsü üzerinden çalışır, ancak dönüşler arasında doğruluk kaynağı yerel çalışma alanı olarak kalır.

Bunu şu durumlarda kullanın:

- OpenClaw dışında dosyaları yerelde düzenliyor ve bu değişikliklerin sandbox'ta otomatik olarak görünmesini istiyorsanız
- OpenShell sandbox'ının mümkün olduğunca Docker arka ucu gibi davranmasını istiyorsanız
- her exec dönüşünden sonra ana makine çalışma alanının sandbox yazmalarını yansıtmasını istiyorsanız

Ödünleşim:

- exec öncesi ve sonrasında ek eşzamanlama maliyeti

##### `remote`

**OpenShell çalışma alanının kanonik olmasını** istiyorsanız `plugins.entries.openshell.config.mode: "remote"` kullanın.

Davranış:

- Sandbox ilk oluşturulduğunda, OpenClaw uzak çalışma alanını yerel çalışma alanından bir kez tohumlar.
- Bundan sonra `exec`, `read`, `write`, `edit` ve `apply_patch` doğrudan uzak OpenShell çalışma alanına karşı çalışır.
- OpenClaw, `exec` sonrasında uzak değişiklikleri yerel çalışma alanına **geri eşzamanlamaz**.
- İstem zamanındaki medya okumaları yine çalışır; çünkü dosya ve medya araçları yerel ana makine yolunu varsaymak yerine sandbox köprüsü üzerinden okur.
- Taşıma, `openshell sandbox ssh-config` tarafından döndürülen OpenShell sandbox'ına SSH ile yapılır.

Önemli sonuçlar:

- Tohumlama adımından sonra OpenClaw dışında ana makinede dosya düzenlerseniz, uzak sandbox bu değişiklikleri otomatik olarak **görmez**.
- Sandbox yeniden oluşturulursa, uzak çalışma alanı yerel çalışma alanından yeniden tohumlanır.
- `scope: "agent"` veya `scope: "shared"` ile, bu uzak çalışma alanı aynı kapsamda paylaşılır.

Bunu şu durumlarda kullanın:

- sandbox'ın ağırlıklı olarak uzak OpenShell tarafında yaşaması gerekiyorsa
- dönüş başına daha düşük eşzamanlama ek yükü istiyorsanız
- ana makinedeki yerel düzenlemelerin uzak sandbox durumunun üzerine sessizce yazmasını istemiyorsanız

Sandbox'ı geçici bir yürütme ortamı olarak düşünüyorsanız `mirror` seçin.
Sandbox'ı gerçek çalışma alanı olarak düşünüyorsanız `remote` seçin.

#### OpenShell yaşam döngüsü

OpenShell sandbox'ları yine normal sandbox yaşam döngüsü üzerinden yönetilir:

- `openclaw sandbox list`, Docker çalışma zamanlarının yanı sıra OpenShell çalışma zamanlarını da gösterir
- `openclaw sandbox recreate`, geçerli çalışma zamanını siler ve OpenClaw'ın bir sonraki kullanımda onu yeniden oluşturmasına izin verir
- budama mantığı da arka uç farkındalıklıdır

`remote` modu için yeniden oluşturma özellikle önemlidir:

- yeniden oluşturma, o kapsamdaki kanonik uzak çalışma alanını siler
- bir sonraki kullanım, yerel çalışma alanından yeni bir uzak çalışma alanı tohumlar

`mirror` modu için yeniden oluşturma, esas olarak uzak yürütme ortamını sıfırlar
çünkü yerel çalışma alanı zaten kanonik kalır.

## Çalışma alanı erişimi

`agents.defaults.sandbox.workspaceAccess`, sandbox'ın **neyi görebileceğini** denetler:

- `"none"` (varsayılan): araçlar `~/.openclaw/sandboxes` altında bir sandbox çalışma alanı görür.
- `"ro"`: aracı çalışma alanını `/agent` konumuna salt okunur olarak bağlar (`write`/`edit`/`apply_patch` devre dışı kalır).
- `"rw"`: aracı çalışma alanını `/workspace` konumuna okuma/yazma olarak bağlar.

OpenShell arka ucuyla:

- `mirror` modu, `exec` dönüşleri arasında yerel çalışma alanını yine kanonik kaynak olarak kullanır
- `remote` modu, ilk tohumlamadan sonra uzak OpenShell çalışma alanını kanonik kaynak olarak kullanır
- `workspaceAccess: "ro"` ve `"none"` yine yazma davranışını aynı şekilde kısıtlar

Gelen medya, etkin sandbox çalışma alanına kopyalanır (`media/inbound/*`).
Skills notu: `read` aracı sandbox köklüdür. `workspaceAccess: "none"` ile
OpenClaw, okunabilmeleri için uygun skill'leri sandbox çalışma alanına (`.../skills`)
yansıtır. `"rw"` ile çalışma alanı skill'leri
`/workspace/skills` altından okunabilir.

## Özel bind mount'lar

`agents.defaults.sandbox.docker.binds`, ek ana makine dizinlerini kapsayıcıya bağlar.
Biçim: `host:container:mode` (ör. `"/home/user/source:/source:rw"`).

Genel ve aracı başına bind'ler **birleştirilir** (değiştirilmez). `scope: "shared"` altında, aracı başına bind'ler yok sayılır.

`agents.defaults.sandbox.browser.binds`, ek ana makine dizinlerini yalnızca **sandbox tarayıcı** kapsayıcısına bağlar.

- Ayarlandığında (`[]` dahil), tarayıcı kapsayıcısı için `agents.defaults.sandbox.docker.binds` değerini değiştirir.
- Atlandığında, tarayıcı kapsayıcısı geriye dönük uyumluluk için `agents.defaults.sandbox.docker.binds` değerine geri döner.

Örnek (salt okunur kaynak + ek veri dizini):

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

- Bind'ler sandbox dosya sistemini atlar: ayarladığınız modla (`:ro` veya `:rw`) ana makine yollarını görünür kılarlar.
- OpenClaw tehlikeli bind kaynaklarını engeller (örneğin: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` ve bunları açığa çıkaracak üst bağlamalar).
- OpenClaw ayrıca `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` ve `~/.ssh` gibi yaygın ana dizin kimlik bilgisi köklerini de engeller.
- Bind doğrulaması yalnızca dize eşleştirmesi değildir. OpenClaw kaynak yolu normalleştirir, sonra engellenen yolları ve izin verilen kökleri yeniden denetlemeden önce onu mevcut en derin üst öğe üzerinden tekrar çözümler.
- Bu, son yaprak henüz mevcut olmasa bile sembolik bağlantı üst öğesi kaçışlarının yine güvenli şekilde kapalı kalacağı anlamına gelir. Örnek: `run-link` oraya işaret ediyorsa `/workspace/run-link/new-file` yine `/var/run/...` olarak çözülür.
- İzin verilen kaynak kökleri de aynı şekilde kanonikleştirilir, bu nedenle sembolik bağlantı çözümlemesinden önce yalnızca izin listesi içinde görünüyormuş gibi duran bir yol yine `outside allowed roots` olarak reddedilir.
- Hassas bağlamalar (gizli bilgiler, SSH anahtarları, hizmet kimlik bilgileri), kesinlikle gerekmedikçe `:ro` olmalıdır.
- Çalışma alanına yalnızca okuma erişimi gerekiyorsa bunu `workspaceAccess: "ro"` ile birleştirin; bind modları bağımsız kalır.
- Bind'lerin araç ilkesi ve yükseltilmiş exec ile nasıl etkileştiği için bkz. [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated).

## Görseller + kurulum

Varsayılan Docker görseli: `openclaw-sandbox:bookworm-slim`

Bir kez derleyin:

```bash
scripts/sandbox-setup.sh
```

Not: varsayılan görsel **Node** içermez. Bir skill'in Node'a (veya
başka çalışma zamanlarına) ihtiyacı varsa, ya özel bir görsel oluşturun ya da
`sandbox.docker.setupCommand` üzerinden kurun (ağ çıkışı + yazılabilir kök +
root kullanıcı gerektirir).

Yaygın araçlarla daha işlevsel bir sandbox görseli istiyorsanız (örneğin
`curl`, `jq`, `nodejs`, `python3`, `git`), şunu derleyin:

```bash
scripts/sandbox-common-setup.sh
```

Ardından `agents.defaults.sandbox.docker.image` değerini
`openclaw-sandbox-common:bookworm-slim` olarak ayarlayın.

Sandbox'lı tarayıcı görseli:

```bash
scripts/sandbox-browser-setup.sh
```

Varsayılan olarak Docker sandbox kapsayıcıları **ağ olmadan** çalışır.
Bunu `agents.defaults.sandbox.docker.network` ile geçersiz kılın.

Paketlenmiş sandbox tarayıcı görseli ayrıca kapsayıcılı iş yükleri için ihtiyatlı Chromium başlangıç varsayılanları uygular. Geçerli kapsayıcı varsayılanları şunları içerir:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
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
- `noSandbox` etkin olduğunda `--no-sandbox` ve `--disable-setuid-sandbox`.
- Üç grafik sağlamlaştırma bayrağı (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) isteğe bağlıdır ve kapsayıcılarda GPU desteği olmadığında kullanışlıdır. İş yükünüz WebGL veya başka 3D/tarayıcı özellikleri gerektiriyorsa `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  ayarlayın.
- `--disable-extensions` varsayılan olarak etkindir ve
  uzantıya bağımlı akışlar için `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ile devre dışı bırakılabilir.
- `--renderer-process-limit=2`,
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile denetlenir; burada `0`, Chromium'un varsayılanını korur.

Farklı bir çalışma zamanı profiline ihtiyacınız varsa, özel bir tarayıcı görseli kullanın ve
kendi entrypoint'inizi sağlayın. Yerel (kapsayıcı olmayan) Chromium profilleri için,
ek başlangıç bayrakları eklemek üzere `browser.extraArgs` kullanın.

Güvenlik varsayılanları:

- `network: "host"` engellenir.
- `network: "container:<id>"` varsayılan olarak engellenir (ad alanına katılma atlatma riski).
- Acil durum geçersiz kılma: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Docker kurulumları ve kapsayıcılı gateway burada bulunur:
[Docker](/tr/install/docker)

Docker gateway dağıtımları için `scripts/docker/setup.sh`, sandbox yapılandırmasını önyükleyebilir.
Bu yolu etkinleştirmek için `OPENCLAW_SANDBOX=1` (veya `true`/`yes`/`on`) ayarlayın. Soket konumunu
`OPENCLAW_DOCKER_SOCKET` ile geçersiz kılabilirsiniz. Tam kurulum ve ortam
başvurusu: [Docker](/tr/install/docker#agent-sandbox).

## setupCommand (tek seferlik kapsayıcı kurulumu)

`setupCommand`, sandbox kapsayıcısı oluşturulduktan sonra **bir kez** çalışır (her çalıştırmada değil).
Kapsayıcı içinde `sh -lc` üzerinden yürütülür.

Yollar:

- Genel: `agents.defaults.sandbox.docker.setupCommand`
- Aracı başına: `agents.list[].sandbox.docker.setupCommand`

Yaygın tuzaklar:

- Varsayılan `docker.network`, `"none"` değeridir (çıkış yok), bu nedenle paket kurulumları başarısız olur.
- `docker.network: "container:<id>"`, `dangerouslyAllowContainerNamespaceJoin: true` gerektirir ve yalnızca acil durum kullanımı içindir.
- `readOnlyRoot: true`, yazmaları engeller; `readOnlyRoot: false` ayarlayın veya özel bir görsel oluşturun.
- Paket kurulumları için `user` root olmalıdır (`user` değerini atlayın veya `user: "0:0"` ayarlayın).
- Sandbox `exec`, ana makinenin `process.env` değerini devralmaz. Skill API anahtarları için
  `agents.defaults.sandbox.docker.env` (veya özel bir görsel) kullanın.

## Araç ilkesi + kaçış yolları

Araç izin/verme-denetimi ilkeleri, sandbox kurallarından önce yine uygulanır. Bir araç genel olarak
veya aracı başına reddedilmişse, sandbox kullanımı onu geri getirmez.

`tools.elevated`, sandbox dışında `exec` çalıştıran açık bir kaçış yoludur (`gateway` varsayılan, exec hedefi `node` olduğunda `node`).
`/exec` yönergeleri yalnızca yetkili gönderenlere uygulanır ve oturum başına kalıcıdır; `exec` özelliğini kesin olarak devre dışı bırakmak için
araç ilkesi reddetme kullanın (bkz. [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Hata ayıklama:

- Etkin sandbox modunu, araç ilkesini ve düzeltme amaçlı yapılandırma anahtarlarını incelemek için `openclaw sandbox explain` kullanın.
- “Bu neden engellendi?” zihinsel modeli için bkz. [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated).
  Sıkı tutun.

## Çok aracılı geçersiz kılmalar

Her aracı sandbox + araçları geçersiz kılabilir:
`agents.list[].sandbox` ve `agents.list[].tools` (ayrıca sandbox araç ilkesi için `agents.list[].tools.sandbox.tools`).
Öncelik için bkz. [Multi-Agent Sandbox & Tools](/tr/tools/multi-agent-sandbox-tools).

## En küçük etkinleştirme örneği

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

- [OpenShell](/tr/gateway/openshell) -- yönetilen sandbox arka uç kurulumu, çalışma alanı modları ve yapılandırma başvurusu
- [Sandbox Configuration](/tr/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) -- “bu neden engellendi?” hata ayıklaması
- [Multi-Agent Sandbox & Tools](/tr/tools/multi-agent-sandbox-tools) -- aracı başına geçersiz kılmalar ve öncelik
- [Security](/tr/gateway/security)
