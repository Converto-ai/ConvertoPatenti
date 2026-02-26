import countriesData from "@/data/countries.json";

interface CountryMatch {
  iso: string;
  name_it: string;
  name_en: string;
}

const countries = countriesData.countries as CountryMatch[];

/**
 * Find a country by fuzzy text match.
 * Matches against both Italian and English names (case-insensitive, partial).
 */
export function findCountry(query: string): CountryMatch | null {
  if (!query || query.length < 2) return null;

  const q = query.toLowerCase().trim();

  // Exact match first
  const exact = countries.find(
    (c) => c.name_it.toLowerCase() === q || c.name_en.toLowerCase() === q || c.iso.toLowerCase() === q
  );
  if (exact) return exact;

  // Partial match (starts with)
  const startsWith = countries.find(
    (c) =>
      c.name_it.toLowerCase().startsWith(q) ||
      c.name_en.toLowerCase().startsWith(q)
  );
  if (startsWith) return startsWith;

  // Partial match (contains)
  const contains = countries.find(
    (c) =>
      c.name_it.toLowerCase().includes(q) ||
      c.name_en.toLowerCase().includes(q)
  );
  if (contains) return contains;

  // Try common aliases
  const aliases: Record<string, string> = {
    inghilterra: "GB",
    gran_bretagna: "GB",
    "great britain": "GB",
    england: "GB",
    "stati uniti": "US",
    america: "US",
    usa: "US",
    russia: "RU",
    cina: "CN",
    china: "CN",
    brasile: "BR",
    brazil: "BR",
    marocco: "MA",
    morocco: "MA",
    filippine: "PH",
    philippines: "PH",
    turchia: "TR",
    turkey: "TR",
    ucraina: "UA",
    ukraine: "UA",
    moldavia: "MD",
    corea: "KR",
    "corea del sud": "KR",
    egitto: "EG",
    egypt: "EG",
    svizzera: "CH",
    switzerland: "CH",
    albania: "AL",
    algeria: "DZ",
    tunisia: "TN",
    georgia: "GE",
    giappone: "JP",
    japan: "JP",
    serbia: "RS",
    taiwan: "TW",
    "capo verde": "CV",
    "cape verde": "CV",
  };

  const aliasIso = aliases[q.replace(/\s+/g, "_")] ?? aliases[q];
  if (aliasIso) {
    return countries.find((c) => c.iso === aliasIso) ?? null;
  }

  return null;
}
