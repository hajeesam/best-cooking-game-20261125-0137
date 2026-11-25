// recipes.js — the menu of Broth & Blade: broths, doneness, toppings,
// the layering rule and the spicy combo. Pure data and pure rules;
// nothing here touches the screen or the clock.

export const BROTHS = {
  shoyu: { name: 'Shoyu', color: '#6e3f16', desc: 'clear soy broth' },
  tonkotsu: { name: 'Tonkotsu', color: '#e6d3a3', desc: 'rich pork broth' },
  miso: { name: 'Miso', color: '#9c4a24', desc: 'red miso broth' },
};

export const DONENESS = {
  aldente: { name: 'Al dente', min: 0.32, max: 0.58, center: 0.45 },
  standard: { name: 'Standard', min: 0.52, max: 0.78, center: 0.65 },
  soft: { name: 'Soft', min: 0.72, max: 0.95, center: 0.84 },
};

export const TOPPINGS = {
  chashu: { name: 'Chashu', needsChop: true },
  egg: { name: 'Egg', needsChop: false },
  scallion: { name: 'Scallion', needsChop: true },
  chili: { name: 'Chili Oil', needsChop: false },
  mushroom: { name: 'Mushroom', needsChop: true },
  shallot: { name: 'Shallot', needsChop: true },
  nori: { name: 'Nori', needsChop: false },
};

/** The toppings a recipe can ask for: exactly the ones in the bins. */
export const TOPPING_IDS = ['chashu', 'egg', 'scallion', 'chili', 'mushroom', 'shallot'];
/** The bins on the counter: noodles first, then the toppings. */
export const BIN_IDS = ['noodles', 'chashu', 'egg', 'scallion', 'chili', 'mushroom', 'shallot'];

export const BIN_LABELS = {
  noodles: 'Noodles',
  chashu: 'Chashu',
  egg: 'Egg',
  scallion: 'Scallion',
  chili: 'Chili Oil',
  mushroom: 'Mushroom',
  shallot: 'Shallot',
};

/** A recipe: broth, doneness target, and 2-3 toppings in serving order. */
export function makeRecipe(rng, difficulty) {
  const brothKeys = Object.keys(BROTHS);
  const doneKeys = Object.keys(DONENESS);
  const broth = brothKeys[Math.floor(rng() * brothKeys.length)];
  const doneness = doneKeys[Math.floor(rng() * doneKeys.length)];
  const pool = [...TOPPING_IDS];
  const count = difficulty >= 3 ? 3 : 2;
  const toppings = [];
  for (let i = 0; i < count; i++) {
    const at = Math.floor(rng() * pool.length);
    toppings.push(pool.splice(at, 1)[0]);
  }
  return { broth, doneness, toppings };
}

/**
 * How well a finished bowl matches a recipe, 0..1, with a breakdown.
 * Broth is worth 0.3, noodle doneness 0.3, toppings 0.4 — but toppings
 * only count in the order the recipe lists them: a topping in the wrong
 * slot still lands in the bowl, it just earns nothing.
 */
export function matchBowl(bowl, recipe) {
  let score = 0;
  const parts = { broth: 0, doneness: 0, toppings: 0 };
  if (!bowl || !bowl.noodles) return { score: 0, parts, orderHits: 0 };
  if (bowl.broth === recipe.broth) {
    score += 0.3;
    parts.broth = 0.3;
  }
  const target = DONENESS[recipe.doneness];
  const d = bowl.noodles.doneness;
  if (d >= target.min && d <= target.max) {
    score += 0.3;
    parts.doneness = 0.3;
  } else {
    // Near miss: half credit when close to the window.
    const dist = d < target.min ? target.min - d : d - target.max;
    const partial = Math.max(0, 0.3 * (1 - dist / 0.25));
    score += partial;
    parts.doneness = partial;
  }
  let orderHits = 0;
  recipe.toppings.forEach((id, i) => {
    if (bowl.toppings[i] === id) orderHits += 1;
  });
  const toppingScore = 0.4 * (orderHits / recipe.toppings.length);
  score += toppingScore;
  parts.toppings = toppingScore;
  return { score, parts, orderHits };
}

/** Chili oil + fried shallot in one bowl: the spicy variant, +20 bonus. */
export function isSpicyVariant(bowl) {
  if (!bowl) return false;
  return bowl.toppings.includes('chili') && bowl.toppings.includes('shallot');
}
