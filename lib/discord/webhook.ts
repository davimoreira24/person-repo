/**
 * Posta conteúdo no canal via Incoming Webhook.
 * Best-effort: sem URL ou falha de rede não lança — só loga.
 */
export async function postDiscordWebhook(content: string): Promise<boolean> {
  const url = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!url) {
    console.warn(
      "[discord] DISCORD_WEBHOOK_URL não configurada — aviso de times não enviado.",
    );
    return false;
  }

  // Discord limita content a 2000 chars
  const body = content.length > 2000 ? `${content.slice(0, 1990)}…` : content;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: body }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[discord] webhook falhou (${res.status}): ${text.slice(0, 300)}`,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("[discord] webhook erro de rede:", error);
    return false;
  }
}
