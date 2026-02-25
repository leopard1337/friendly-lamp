export function computeHealthScore(
  currentHolders: number,
  previousHolders: number | null,
  top10Concentration: number | null
): number {
  let score = 50;

  if (previousHolders != null && previousHolders > 0) {
    const growthRate = ((currentHolders - previousHolders) / previousHolders) * 100;
    score += Math.min(25, Math.max(-25, growthRate));
  }

  if (top10Concentration != null) {
    const concentrationPenalty = top10Concentration * 0.5;
    score -= Math.min(25, concentrationPenalty);
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}
