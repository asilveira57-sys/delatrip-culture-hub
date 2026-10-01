import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import type { Linha, Nivel } from "@/config/guia-perfis";
import { registrarEventoGuia, type Foco, type Formato, type Peso } from "@/lib/guia-publico";

type Resp = { nivel?: Nivel; foco?: Foco; peso?: Peso; linha?: Linha; formato?: Formato };

const PASSOS: {
  chave: keyof Resp;
  pergunta: string;
  opcoes: { valor: string; rotulo: string }[];
}[] = [
  {
    chave: "nivel",
    pergunta: "Quanto você conhece de acessórios?",
    opcoes: [
      { valor: "explorador", rotulo: "Estou começando" },
      { valor: "familiarizado", rotulo: "Conheço o básico" },
      { valor: "entusiasta", rotulo: "Conheço bem e tenho preferências" },
      { valor: "especialista", rotulo: "Sei exatamente o que quero" },
    ],
  },
  {
    chave: "foco",
    pergunta: "O que você quer resolver primeiro?",
    opcoes: [
      { valor: "kit", rotulo: "Montar um kit do zero" },
      { valor: "melhorar", rotulo: "Trocar ou melhorar um item" },
      { valor: "organizar", rotulo: "Organizar e transportar" },
      { valor: "presente", rotulo: "Presentear alguém" },
    ],
  },
  {
    chave: "peso",
    pergunta: "O que pesa mais na escolha?",
    opcoes: [
      { valor: "praticidade", rotulo: "Praticidade" },
      { valor: "durabilidade", rotulo: "Durabilidade" },
      { valor: "visual", rotulo: "Visual e acabamento" },
    ],
  },
  {
    chave: "linha",
    pergunta: "Qual linha combina com você?",
    opcoes: [
      { valor: "entrada", rotulo: "Econômica" },
      { valor: "normal", rotulo: "Equilibrada" },
      { valor: "premium", rotulo: "Premium" },
    ],
  },
  {
    chave: "formato",
    pergunta: "Tem preferência de formato de seda?",
    opcoes: [
      { valor: "1-14", rotulo: "1 1/4" },
      { valor: "king-size", rotulo: "King size" },
      { valor: "cone", rotulo: "Cone" },
      { valor: "nao-sei", rotulo: "Ainda não sei" },
    ],
  },
];

export function QuizGuia() {
  const navigate = useNavigate();
  const [maior, setMaior] = useState(false);
  const [passo, setPasso] = useState(-1);
  const [resp, setResp] = useState<Resp>({});

  function escolher(valor: string) {
    const atual = PASSOS[passo]!;
    const novo = { ...resp, [atual.chave]: valor } as Resp;
    setResp(novo);
    if (passo < PASSOS.length - 1) {
      setPasso(passo + 1);
      return;
    }
    registrarEventoGuia("quiz_concluido", { nivel: novo.nivel, linha: novo.linha });
    void navigate({
      to: "/comece-aqui",
      search: {
        nivel: novo.nivel,
        linha: novo.linha,
        foco: novo.foco,
        peso: novo.peso,
        formato: novo.formato,
      },
      hash: "resultado",
    });
  }

  if (passo < 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          5 perguntas rápidas para indicar um conjunto de acessórios para você.
        </p>
        <label className="mt-4 flex items-start gap-3 text-sm">
          <Checkbox checked={maior} onCheckedChange={(v) => setMaior(v === true)} className="mt-0.5" />
          <span>
            Confirmo que tenho 18 anos ou mais.{" "}
            <Link to="/maiores-de-18" className="text-primary underline">
              Saiba mais
            </Link>
          </span>
        </label>
        <Button
          className="mt-5 w-full sm:w-auto"
          disabled={!maior}
          onClick={() => {
            registrarEventoGuia("quiz_iniciado");
            setPasso(0);
          }}
        >
          Começar
        </Button>
      </div>
    );
  }

  const atual = PASSOS[passo]!;
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Passo {passo + 1} de {PASSOS.length}
        </span>
        {passo > 0 && (
          <button type="button" onClick={() => setPasso(passo - 1)} className="flex items-center gap-1 hover:text-primary">
            <ArrowLeft className="size-3" /> Voltar
          </button>
        )}
      </div>
      <Progress value={((passo + 1) / PASSOS.length) * 100} className="mt-2" aria-label="Progresso do quiz" />
      <h3 className="mt-6 text-xl font-semibold">{atual.pergunta}</h3>
      <div className="mt-4 grid gap-3">
        {atual.opcoes.map((o) => (
          <Button
            key={o.valor}
            variant={resp[atual.chave] === o.valor ? "default" : "outline"}
            className="h-auto justify-start whitespace-normal py-3 text-left"
            onClick={() => escolher(o.valor)}
          >
            {o.rotulo}
          </Button>
        ))}
      </div>
    </div>
  );
}
