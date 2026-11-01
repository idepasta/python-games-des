const WORDS = [
  "apple", "brave", "coral", "daisy", "eagle", "frost", "grape", "happy",
  "ivory", "jelly", "koala", "lemon", "mango", "noble", "otter", "panda",
  "queen", "river", "sunny", "tiger", "umbra", "vivid", "whale", "xenon",
  "young", "zebra", "cloud", "peach", "spark", "berry", "coral", "minty",
  "lucky", "swift", "cozy", "pearl", "ocean", "maple", "robin", "cocoa",
];

export function generateReviveCode(random = Math.random): string {
  const picks: string[] = [];
  const pool = [...WORDS];
  while (picks.length < 4 && pool.length) {
    const index = Math.floor(random() * pool.length);
    const [word] = pool.splice(index, 1);
    if (word && !picks.includes(word)) picks.push(word);
  }
  return picks.join("-");
}

export function normalizeReviveCode(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-").replace(/-+/g, "-");
}

export function isReviveCodeFormat(value: string): boolean {
  return /^[a-z]+-[a-z]+-[a-z]+-[a-z]+$/.test(normalizeReviveCode(value));
}
