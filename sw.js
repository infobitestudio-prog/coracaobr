/* Guarda o que já foi aberto para o guia funcionar sem internet. Rede primeiro; sem rede, usa a cópia. */
const CACHE = "guia-v7";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  if (u.pathname.indexOf("/api/") >= 0) return; // conta e dados da pessoa nunca ficam guardados no aparelho
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
/* Notificações no celular: o aviso chega sem conteúdo; o aparelho busca a mensagem mais recente no servidor */
self.addEventListener("push", e => {
  e.waitUntil(self.registration.pushManager.getSubscription().then(sub => fetch(new URL("api/index.php?acao=push_ultima" + (sub ? "&ep=" + encodeURIComponent(sub.endpoint) : ""), self.registration.scope), { credentials: "omit", cache: "no-store" })).then(r => r.json()).catch(() => null).then(j => {
    const m = (j && j.msg) || { titulo: "CoraçãoBR", texto: "Novidades no guia para você.", url: "./" };
    return self.registration.showNotification(m.titulo || "CoraçãoBR", { body: m.texto || "", icon: "icon-192.png", badge: "icon-192.png", data: { url: m.url || "./" }, tag: "coracaobr" });
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const alvo = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => { for (const w of ws) { if ("focus" in w) { w.navigate(alvo).catch(() => {}); return w.focus(); } } return clients.openWindow(alvo); }));
});
