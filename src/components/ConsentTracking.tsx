import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getAnonId } from "@/lib/anon-id";
import {
  EVENTO_PREFERENCIAS,
  lerConsentimento,
  salvarConsentimento,
} from "@/lib/consentimento";
import {
  CONSENTIMENTO_VAZIO,
  VERSAO_POLITICA,
  type CategoriasConsentimento,
} from "@/lib/portal-core";
import { registrarConsentimento } from "@/lib/portal.functions";
import type { SeoPublico } from "@/lib/site-config.functions";

function injetar(id: string, src: string, inline?: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.async = true;
  if (src) s.src = src;
  if (inline) s.innerHTML = inline;
  document.head.appendChild(s);
}

type Janela = Window & { dataLayer?: unknown[] };

function gtag(...args: unknown[]) {
  const w = window as Janela;
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push(args);
}

/** Consent Mode v2: tudo negado até a pessoa escolher. */
function consentModePadrao() {
  if (document.getElementById("consent-mode-default")) return;
  const s = document.createElement("script");
  s.id = "consent-mode-default";
  s.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted'});`;
  document.head.appendChild(s);
}

function atualizarConsentMode(c: CategoriasConsentimento) {
  gtag("consent", "update", {
    analytics_storage: c.analise ? "granted" : "denied",
    ad_storage: c.marketing ? "granted" : "denied",
    ad_user_data: c.marketing ? "granted" : "denied",
    ad_personalization: c.marketing ? "granted" : "denied",
    functionality_storage: c.preferencias ? "granted" : "denied",
    personalization_storage: c.preferencias ? "granted" : "denied",
    security_storage: "granted",
  });
}

/** Scripts só carregam conforme a categoria autorizada. */
function carregarRastreamento(seo: SeoPublico, c: CategoriasConsentimento) {
  atualizarConsentMode(c);

  if (c.analise && seo.gtm.ativo && seo.gtm.id) {
    injetar(
      "gtm-loader",
      "",
      `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${seo.gtm.id}');`,
    );
  }
  if (c.analise && seo.ga4.ativo && seo.ga4.id) {
    injetar("ga4-loader", `https://www.googletagmanager.com/gtag/js?id=${seo.ga4.id}`);
    injetar(
      "ga4-init",
      "",
      `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${seo.ga4.id}');`,
    );
  }
  if (c.marketing && seo.metaPixel.ativo && seo.metaPixel.id) {
    injetar(
      "meta-pixel",
      "",
      `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${seo.metaPixel.id}');fbq('track','PageView');`,
    );
  }
}

const CATEGORIAS: {
  chave: keyof Omit<CategoriasConsentimento, "necessarios">;
  titulo: string;
  texto: string;
}[] = [
  {
    chave: "preferencias",
    titulo: "Preferências",
    texto: "Lembram escolhas feitas por você durante a navegação.",
  },
  {
    chave: "analise",
    titulo: "Análise",
    texto: "Medem audiência e uso das páginas (ex.: Google Analytics).",
  },
  {
    chave: "marketing",
    titulo: "Marketing",
    texto: "Tecnologias publicitárias, quando utilizadas (ex.: Meta Pixel).",
  },
];

export function ConsentTracking({ seo }: { seo: SeoPublico }) {
  const [visivel, setVisivel] = useState(false);
  const [detalhes, setDetalhes] = useState(false);
  const [escolha, setEscolha] = useState<CategoriasConsentimento>(CONSENTIMENTO_VAZIO);

  useEffect(() => {
    consentModePadrao();
    const atual = lerConsentimento();
    if (atual) {
      setEscolha(atual.categorias);
      carregarRastreamento(seo, atual.categorias);
    } else {
      setVisivel(true);
    }
  }, [seo]);

  useEffect(() => {
    const abrir = () => {
      setEscolha(lerConsentimento()?.categorias ?? CONSENTIMENTO_VAZIO);
      setDetalhes(true);
      setVisivel(true);
    };
    window.addEventListener(EVENTO_PREFERENCIAS, abrir);
    return () => window.removeEventListener(EVENTO_PREFERENCIAS, abrir);
  }, []);

  const decidir = useCallback(
    (categorias: CategoriasConsentimento) => {
      const registro = salvarConsentimento(categorias);
      setVisivel(false);
      setDetalhes(false);
      carregarRastreamento(seo, registro.categorias);
      const anonId = getAnonId();
      if (anonId) {
        void registrarConsentimento({
          data: {
            anonId,
            versao: VERSAO_POLITICA,
            categorias: {
              necessarios: true,
              preferencias: registro.categorias.preferencias,
              analise: registro.categorias.analise,
              marketing: registro.categorias.marketing,
            },
          },
        }).catch(() => undefined);
      }
    },
    [seo],
  );

  if (!visivel) return null;

  return (
    <div
      role="dialog"
      aria-label="Preferências de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/98 p-4 shadow-lg backdrop-blur"
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-muted-foreground">
          Usamos cookies necessários para o funcionamento do portal e, com sua
          autorização, cookies de análise e marketing para entender a utilização do site.{" "}
          <Link
            to="/politica-de-cookies"
            className="text-primary underline underline-offset-4"
          >
            Política de Cookies
          </Link>
        </p>

        {detalhes ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium">Necessários</p>
                <p className="text-xs text-muted-foreground">
                  Essenciais para funcionamento e segurança. Sempre ativos.
                </p>
              </div>
              <span className="text-xs uppercase text-muted-foreground">Sempre ativos</span>
            </div>
            {CATEGORIAS.map((cat) => (
              <div
                key={cat.chave}
                className="flex items-start justify-between gap-4 rounded-md border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{cat.titulo}</p>
                  <p className="text-xs text-muted-foreground">{cat.texto}</p>
                </div>
                <Switch
                  aria-label={`Cookies de ${cat.titulo.toLowerCase()}`}
                  checked={escolha[cat.chave]}
                  onCheckedChange={(v) => setEscolha((e) => ({ ...e, [cat.chave]: v }))}
                />
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {detalhes ? (
            <Button variant="outline" onClick={() => decidir(escolha)}>
              Salvar preferências
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setDetalhes(true)}>
              Personalizar
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => decidir({ ...CONSENTIMENTO_VAZIO })}
          >
            Rejeitar não essenciais
          </Button>
          <Button
            onClick={() =>
              decidir({
                necessarios: true,
                preferencias: true,
                analise: true,
                marketing: true,
              })
            }
          >
            Aceitar todos
          </Button>
        </div>
      </div>
    </div>
  );
}
