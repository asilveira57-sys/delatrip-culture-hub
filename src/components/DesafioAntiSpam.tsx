import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type EstadoDesafio = { pergunta: string; resposta: string; correto: boolean };

/**
 * Verificação simples sem serviço externo: soma de dois números sorteados
 * no cliente (nunca no escopo do módulo, para não quebrar a hidratação).
 */
export function useDesafio() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [resposta, setResposta] = useState("");

  const sortear = () => {
    setA(Math.floor(Math.random() * 8) + 2);
    setB(Math.floor(Math.random() * 8) + 2);
    setResposta("");
  };

  useEffect(() => {
    sortear();
  }, []);

  return {
    pergunta: `Quanto é ${a} + ${b}?`,
    resposta,
    setResposta,
    correto: a > 0 && Number(resposta) === a + b,
    sortear,
  };
}

export function DesafioAntiSpam({
  pergunta,
  resposta,
  onChange,
  erro,
}: {
  pergunta: string;
  resposta: string;
  onChange: (v: string) => void;
  erro?: string | undefined;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="desafio">Verificação · {pergunta}</Label>
      <Input
        id="desafio"
        inputMode="numeric"
        autoComplete="off"
        value={resposta}
        maxLength={4}
        onChange={(e) => onChange(e.target.value)}
      />
      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
    </div>
  );
}

/** Campo honeypot invisível para bots. */
export function Armadilha({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Não preencha este campo
        <input
          tabIndex={-1}
          autoComplete="off"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
