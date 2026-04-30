export type BriefType =
  | 'Standard morgenbrief'
  | 'Lederbrief'
  | 'AI-radar'
  | 'Familie/weekend-brief';

export type Tone = 'Kort' | 'Balanceret' | 'Direkte' | 'Nysgerrig';

export type BuildBriefInput = {
  rawNotes: string;
  briefType: BriefType;
  tone: Tone;
};

export function buildBriefPrompt({ rawNotes, briefType, tone }: BuildBriefInput): string {
  const cleanedNotes = rawNotes.trim();

  return [
    'Du er min danske briefing-assistent til ChatGPT Voice.',
    `Lav en ${briefType.toLowerCase()} på cirka 3 minutter i tonen: ${tone.toLowerCase()}.`,
    'Brugen skal være mundtlig, let at lytte til og godt struktureret.',
    '',
    'Formatér svaret med følgende sektioner:',
    '1) Kort overblik (2-3 sætninger)',
    '2) Vigtigste punkter (maks 5 bullets)',
    '3) Hvad betyder det for mig i dag? (konkrete handlinger)',
    '4) 1 opfølgende spørgsmål, jeg bør tænke over',
    '',
    'Retningslinjer:',
    '- Skriv på naturligt dansk, klart og uden fyldord.',
    '- Prioritér relevans og tydelige prioriteringer.',
    '- Hold et tempo og sprog, der passer til oplæsning i Voice.',
    '',
    'Rå noter:',
    cleanedNotes || '[Ingen noter indsat endnu]',
  ].join('\n');
}
