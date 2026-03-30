"use client";

import { useState, useTransition } from "react";
import { resetSeasonAction } from "@/app/actions/season-actions";
import { buttonStyles } from "@/components/ui/button-styles";

export function ResetSeasonForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setDone(false);
    startTransition(async () => {
      try {
        await resetSeasonAction(formData);
        setDone(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao reiniciar.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm text-white/70">
        Confirmação (digite exatamente)
        <input
          name="confirm"
          type="text"
          autoComplete="off"
          placeholder="NOVA SEASON"
          className="rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder:text-white/25"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-white/70">
        Token (obrigatório somente se{" "}
        <code className="text-white/50">SEASON_RESET_SECRET</code> estiver no servidor)
        <input
          name="token"
          type="password"
          autoComplete="off"
          className="rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder:text-white/25"
          placeholder="Opcional"
        />
      </label>
      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="text-sm text-emerald-300">
          Season reiniciada: partidas e PDLs zerados. Cadastro de jogadores foi
          mantido.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={buttonStyles({ variant: "destructive", className: "w-fit" })}
      >
        {pending ? "Reiniciando…" : "Zerar season (irreversível)"}
      </button>
    </form>
  );
}
