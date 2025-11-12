"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createPlayerAction } from "@/app/actions/player-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z
    .string()
    .min(2, "Informe pelo menos 2 caracteres")
    .max(60, "Máximo de 60 caracteres"),
  score: z.coerce.number().min(0, "Use valores positivos"),
  photo: z
    .custom<FileList | undefined>((value) => {
      if (value === undefined || value === null) {
        return true;
      }
      if (typeof FileList === "undefined") {
        return true;
      }
      return value instanceof FileList;
    }, "Arquivo inválido")
    .optional(),
});

type FormValues = z.infer<typeof schema>;

export function PlayerForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    handleSubmit,
    register,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      score: 0,
    },
  });

  const photoWatch = watch("photo");
  const previewUrl = useMemo(() => {
    if (!photoWatch || !(photoWatch instanceof FileList) || photoWatch.length === 0) {
      return null;
    }
    return URL.createObjectURL(photoWatch[0]);
  }, [photoWatch]);

  useEffect(
    () => () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl],
  );

  const onSubmit = (data: FormValues) => {
    setError(null);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("score", String(data.score ?? 0));
    if (data.photo instanceof FileList && data.photo[0]) {
      formData.append("photo", data.photo[0]);
    }

    startTransition(async () => {
      try {
        await createPlayerAction(formData);
        reset();
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao criar jogador.",
        );
      }
    });
  };

  return (
    <div className="glass-panel sticky top-8 flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.45em] text-white/50">
          Novo jogador
        </span>
        <h2 className="font-display text-2xl text-white">
          Adicione para a próxima partida
        </h2>
        <p className="text-sm text-white/60">
          Faça upload de uma foto, defina uma pontuação inicial e mantenha o
          registro da sua equipe sempre atualizado.
        </p>
      </header>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" placeholder="Player G4nk" {...register("name")} />
          {errors.name && (
            <span className="text-xs text-red-300">{errors.name.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="score">Pontuação inicial</Label>
          <Input
            id="score"
            type="number"
            min={0}
            {...register("score", { valueAsNumber: true })}
          />
          {errors.score && (
            <span className="text-xs text-red-300">{errors.score.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="photo">Foto</Label>
          <Input
            id="photo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            {...register("photo")}
          />
          <span className="text-xs text-white/40">
            Use imagens quadradas para melhor resultado. Armazenamos no Supabase
            Storage.
          </span>
          {previewUrl && (
            <div className="relative mt-2 h-32 w-full overflow-hidden rounded-2xl border border-white/10">
              <Image
                src={previewUrl}
                alt="Pré-visualização da foto"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            {error}
          </div>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Adicionando..." : "Salvar jogador"}
        </Button>
      </form>
    </div>
  );
}

