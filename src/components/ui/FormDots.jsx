import React from 'react';
import { cn } from '../../utils/cn';
import { formLabel } from '../../utils/formGuide';

// Recent-form strip: one dot per played gameweek, oldest → newest, coloured
// by whether that week's net score beat the league average (see
// utils/formGuide.js). Deliberately not a W/D/L strip — this league has no
// opponents to beat week to week, so "above the field" is the honest axis.
//
// The colours are the app's existing semantics, not a new palette: pitch =
// good (the same green the "Managers in" tiles use), coral = bad, ink-soft =
// par. Screen readers get the full sentence; the dots themselves are
// decorative and hidden from the a11y tree.
const TONE_CLASS = {
  up: 'bg-pitch',
  down: 'bg-coral',
  flat: 'bg-ink-soft/40',
};

const FormDots = ({ form = [], className, showLabel = false }) => {
  if (!form.length) return null;

  const summary = form
    .map((f) => `GW${f.gameweek} ${formLabel(f.trend)} (${f.net} pts)`)
    .join('; ');

  return (
    <span className={cn('inline-flex items-center gap-2', className)} title={summary}>
      <span aria-hidden="true" className="inline-flex items-center gap-1">
        {form.map((f) => (
          <span
            key={f.gameweek}
            className={cn('w-2 h-2 rounded-full border border-ink/25', TONE_CLASS[f.trend] || TONE_CLASS.flat)}
          />
        ))}
      </span>
      {showLabel && (
        <span aria-hidden="true" className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">
          Form
        </span>
      )}
      <span className="sr-only">Recent form: {summary}</span>
    </span>
  );
};

export default FormDots;