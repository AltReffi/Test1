export type PlayerId = string;

/** Påhæng på en trumfmelding. "ingen" er en almindelig melding (fx "8"). */
export type Pahaeng = "ingen" | "vip" | "gode" | "sans" | "halve";

/** Den trumf, der endte med at gælde i spillet. */
export type Trump = "spar" | "hjerter" | "ruder" | "klør" | "sans";

export type SolKind = "sol" | "renSol" | "bordlaegger" | "renBordlaegger";

export interface TrumpBid {
  /** Antal meldte stik, 7–13. */
  level: number;
  pahaeng: Pahaeng;
  /**
   * Antal gange der er vippet. Bruges kun af systemer med pahaengMode "perDoubling"
   * (fx jeberg.eu, hvor hver vip fordobler). Standard: 1 hvis påhæng er "vip", ellers 0.
   */
  vips?: number;
  /**
   * Den trumf, spillet endte i. Bruges kun af "perDoubling"-systemer, hvor klør eller
   * sans som trumf giver en ekstra fordobling (også når trumfen er fundet via vip/halve).
   */
  trump?: Trump;
}

export interface TrumpRound {
  type: "trump";
  /** De fire spillere ved bordet i denne runde. */
  seated: [PlayerId, PlayerId, PlayerId, PlayerId];
  bidder: PlayerId;
  /** Makkeren, eller null hvis melderen er selvmakker (spiller alene mod tre). */
  partner: PlayerId | null;
  bid: TrumpBid;
  /** Antal stik melderens side tog, 0–13. */
  tricks: number;
}

export interface SolDeclaration {
  player: PlayerId;
  kind: SolKind;
  success: boolean;
}

export interface SolRound {
  type: "sol";
  seated: [PlayerId, PlayerId, PlayerId, PlayerId];
  /** Én eller flere solmeldinger i samme spil. Hver afregnes for sig og lægges sammen. */
  sols: SolDeclaration[];
}

export interface PassRound {
  type: "pass";
  seated: [PlayerId, PlayerId, PlayerId, PlayerId];
}

export type Round = TrumpRound | SolRound | PassRound;

/** Pointændring pr. spiller for én runde. Summen er altid 0. */
export type Deltas = Record<PlayerId, number>;

export interface ScoringSystem {
  id: string;
  name: string;
  description: string;
  source?: string;

  /** Point for at melde 7 uden påhæng og tage præcis 7 stik. */
  baseRate: number;
  /** Faktor pr. ekstra meldt stik (2 = fordobling: 7=10, 8=20, 9=40 …). */
  stepFactor: number;

  /**
   * "single": ethvert påhæng ganger med pahaengFactor én gang (whist.dk, hjerteres.dk).
   * "perDoubling": gode/sans (eller klør/sans som trumf), halve og hver vip fordobler hver for sig (jeberg.eu).
   */
  pahaengMode: "single" | "perDoubling";
  pahaengFactor: number;

  /**
   * "flat": en tabt melding koster lossFactor × meldingens værdi uanset antal understik.
   * "perUndertrick": koster lossFactor × værdi × antal manglende stik.
   */
  lossMode: "flat" | "perUndertrick";
  lossFactor: number;

  /** Bonus ved 13 stik (halv ved 12) — og tilsvarende ved 0 (1) stik i tab. 0 = slået fra. */
  slamBonus: number;

  /** Point fra hver modspiller ved vundet sol. null = meldingen findes ikke i systemet. */
  sol: Record<SolKind, number | null>;
  /** En tabt sol koster solLossFactor × værdien til hver modspiller. */
  solLossFactor: number;
}
