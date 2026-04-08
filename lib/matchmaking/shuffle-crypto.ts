/** Embaralhamento sem viés de módulo (crypto.getRandomValues). */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const max = Math.floor(0xffffffff / (i + 1)) * (i + 1);
    let randomValue = randomBuffer[0]!;

    while (randomValue >= max) {
      crypto.getRandomValues(randomBuffer);
      randomValue = randomBuffer[0]!;
    }

    const j = randomValue % (i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}
