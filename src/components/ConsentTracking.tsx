import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { SeoPublico } from "@/lib/site-config.functions";

const KEY = "delatrip_consent";

function ler(): "aceito" | "recusado" | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "aceito" || v === "recusado" ? v : null;
  } catch {
    return null;
  }
}

function injetar(id: string, src: string, inline?: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.async = true;
  if (src) s.src = src;
  if (inline) s.innerHTML = inline;
  document.head.appendChild(s);
}

/** Scripts de rastreamento só carregam DEPOIS do aceite (exigência de LGPD). */
function carregarRastreamento(seo: SeoPublico) {
  if (seo.gtm.ativo && seo.gtm.id) {
    injetar(
      "gtm-loader",
      "",
      `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${seo.gtm.id}');`,
    );
  }
  if (seo.ga4.ativo && seo.ga4.id) {
    injetar("ga4-loader", `https://www.googletagmanager.com/gtag/js?id=${seo.ga4.id}`);
    injetar(
      "ga4-init",
      "",
      `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${seo.ga4.id}');`,
    );
  }
  if (seo.metaPixel.ativo && seo.metaPixel.id) {
    injetar(
      "meta-pixel",
      "",
      `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${seo.metaPixel.id}');fbq('track','PageView');`,
    );
  }
}

export function ConsentTracking({ seo }: { seo: SeoPublico }) {
  const [estado, setEstado] = useState<"aceito" | "recusado" | null | "carregando">(
    "carregando",
  );

  useEffect(() => {
    const atual = ler();
    setEstado(atual);
    if (atual === "aceito") carregarRastreamento(seo);
  }, [seo]);

  function decidir(valor: "aceito" | "recusado") {
    try {
      window.localStorage.setItem(KEY, valor);
    } catch {
      /* ignora */
    }
    setEstado(valor);
    if (valor === "aceito") carregarRastreamento(seo);
  }

  const temRastreamento =
    (seo.ga4.ativo && seo.ga4.id) ||
    (seo.gtm.ativo && seo.gtm.id) ||
    (seo.metaPixel.ativo && seo.metaPixel.id);

  if (estado === "carregando" || estado !== null || !temRastreamento) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-4 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Usamos cookies de medição para entender o uso do site. Nada é carregado antes
          do seu aceite.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => decidir("recusado")}>
            Recusar
          </Button>
          <Button size="sm" onClick={() => decidir("aceito")}>
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
}
