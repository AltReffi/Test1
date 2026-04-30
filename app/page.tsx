'use client';

import { useEffect, useMemo, useState } from 'react';
import { BriefType, Tone, buildBriefPrompt } from '@/lib/buildBriefPrompt';

const STORAGE_KEY = 'morning-brief-builder-v1';

const briefTypes: BriefType[] = [
  'Standard morgenbrief',
  'Lederbrief',
  'AI-radar',
  'Familie/weekend-brief',
];

const tones: Tone[] = ['Kort', 'Balanceret', 'Direkte', 'Nysgerrig'];

export default function Home() {
  const [rawNotes, setRawNotes] = useState('');
  const [briefType, setBriefType] = useState<BriefType>('Standard morgenbrief');
  const [tone, setTone] = useState<Tone>('Balanceret');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const persisted = localStorage.getItem(STORAGE_KEY);
    if (!persisted) return;

    try {
      const data = JSON.parse(persisted) as {
        rawNotes?: string;
        briefType?: BriefType;
        tone?: Tone;
      };

      if (data.rawNotes) setRawNotes(data.rawNotes);
      if (data.briefType && briefTypes.includes(data.briefType)) setBriefType(data.briefType);
      if (data.tone && tones.includes(data.tone)) setTone(data.tone);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        rawNotes,
        briefType,
        tone,
      }),
    );
  }, [rawNotes, briefType, tone]);

  const canGenerate = useMemo(() => rawNotes.trim().length > 0, [rawNotes]);

  const handleGenerate = () => {
    setOutput(
      buildBriefPrompt({
        rawNotes,
        briefType,
        tone,
      }),
    );
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
  };

  const handleClear = () => {
    setRawNotes('');
    setBriefType('Standard morgenbrief');
    setTone('Balanceret');
    setOutput('');
    setCopied(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <main className="wrapper">
      <section className="card">
        <h1>Morning Brief Builder</h1>
        <p className="sub">Byg en klar dansk 3-minutters prompt til ChatGPT Voice.</p>

        <label htmlFor="notes">Rå noter</label>
        <textarea
          id="notes"
          value={rawNotes}
          onChange={(e) => setRawNotes(e.target.value)}
          rows={8}
          placeholder="Indsæt dine noter her..."
        />

        <div className="row">
          <div>
            <label htmlFor="briefType">Brief type</label>
            <select id="briefType" value={briefType} onChange={(e) => setBriefType(e.target.value as BriefType)}>
              {briefTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tone">Tone</label>
            <select id="tone" value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
              {tones.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="actions">
          <button onClick={handleGenerate} disabled={!canGenerate}>
            Generér
          </button>
          <button onClick={handleCopy} disabled={!output}>
            {copied ? 'Kopieret' : 'Kopiér'}
          </button>
          <button className="ghost" onClick={handleClear}>
            Nulstil
          </button>
        </div>

        <label htmlFor="output">Genereret prompt</label>
        <textarea id="output" value={output} readOnly rows={12} placeholder="Din prompt vises her..." />
      </section>
    </main>
  );
}
