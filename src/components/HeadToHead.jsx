// src/components/HeadToHead.jsx - Compare two managers gameweek-by-gameweek.
// Everything here is reshaped from `standings` and `gameweekTable`, which
// the app already has in state — no extra fetching.
import React, { useMemo, useState } from 'react';
import { Swords, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';
import SectionBanner from './ui/SectionBanner';
import { CornerFlags, Jersey, TrophyCup } from './ui/Doodles';

const getNetPoints = (manager) => {
  const raw = manager?.points ?? manager?.gameweekPoints ?? 0;
  const cost = manager?.transferCost ?? manager?.transfersCost ?? manager?.event_transfers_cost ?? 0;
  return raw - cost;
};

const HeadToHead = ({ standings = [], gameweekTable = [], loading = false }) => {
  const [managerAId, setManagerAId] = useState(standings[0]?.id ?? standings[0]?.entry ?? null);
  const [managerBId, setManagerBId] = useState(standings[1]?.id ?? standings[1]?.entry ?? null);

  const managerA = standings.find((m) => (m.id ?? m.entry) === managerAId);
  const managerB = standings.find((m) => (m.id ?? m.entry) === managerBId);

  const record = useMemo(() => {
    if (!managerAId || !managerBId || managerAId === managerBId) {
      return { weeks: [], aWins: 0, bWins: 0, draws: 0 };
    }

    let aWins = 0, bWins = 0, draws = 0;
    const weeks = gameweekTable
      .map((gw) => {
        const a = gw.managers?.find((m) => m.id === managerAId);
        const b = gw.managers?.find((m) => m.id === managerBId);
        if (!a || !b) return null;

        const aPoints = getNetPoints(a);
        const bPoints = getNetPoints(b);
        if (aPoints > bPoints) aWins++;
        else if (bPoints > aPoints) bWins++;
        else draws++;

        return { gameweek: gw.gameweek, aPoints, bPoints };
      })
      .filter(Boolean);

    return { weeks, aWins, bWins, draws };
  }, [gameweekTable, managerAId, managerBId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-surface-sunk rounded-3xl border-2 border-ink/10 animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (standings.length < 2) {
    return (
      <div className="p-12 text-center">
        <Swords className="w-14 h-14 mx-auto mb-4 text-ink/20" />
        <p className="text-lg font-bold text-ink-soft">Need at least two managers to compare</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <SectionBanner
        tone="coral"
        art={<CornerFlags size={34} />}
        title="Head-to-Head"
        subtitle="Bragging rights, gameweek by gameweek"
      />

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
          <ManagerPicker
            standings={standings}
            value={managerAId}
            onChange={setManagerAId}
            excludeId={managerBId}
          />
          <div className="flex items-center justify-center">
            <span className="w-11 h-11 rounded-full bg-sunflower border-2 border-ink/85 shadow-pop-sm flex items-center justify-center font-display font-bold text-ink text-sm">
              VS
            </span>
          </div>
          <ManagerPicker
            standings={standings}
            value={managerBId}
            onChange={setManagerBId}
            excludeId={managerAId}
          />
        </div>
      </Card>

      {managerA && managerB && managerAId !== managerBId && (
        <>
          <Card>
            <div className="grid grid-cols-3 items-center text-center gap-3">
              <div className="rounded-2xl border-2 border-violet/60 bg-violet/12 p-3">
                <Jersey size={34} tone="fill-violet" className="mx-auto mb-1" />
                <div className="text-3xl font-display font-bold text-violet leading-none">{record.aWins}</div>
                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mt-1 truncate">{managerA.managerName}</div>
              </div>
              <div>
                <Badge variant="warning">{record.draws} draw{record.draws !== 1 ? 's' : ''}</Badge>
                <div className="text-xs font-semibold text-ink-soft mt-2">{record.weeks.length} gameweeks played</div>
              </div>
              <div className="rounded-2xl border-2 border-coral/60 bg-coral/12 p-3">
                <Jersey size={34} tone="fill-coral" className="mx-auto mb-1" />
                <div className="text-3xl font-display font-bold text-coral leading-none">{record.bWins}</div>
                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mt-1 truncate">{managerB.managerName}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t-2 border-dashed border-ink/15">
              <div className="text-center">
                <div className="text-xl font-display font-bold text-ink">{managerA.totalPoints ?? managerA.total ?? 0}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Season Total</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-display font-bold text-ink">{managerB.totalPoints ?? managerB.total ?? 0}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Season Total</div>
              </div>
            </div>
          </Card>

          {record.weeks.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[420px]">
                  <thead>
                    <tr className="border-b-2 border-ink/85 text-left bg-surface-sunk">
                      <th className="p-3 text-ink font-display font-bold">GW</th>
                      <th className="p-3 text-ink font-display font-bold text-right">{managerA.managerName}</th>
                      <th className="p-3"></th>
                      <th className="p-3 text-ink font-display font-bold">{managerB.managerName}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...record.weeks].reverse().map((week) => (
                      <tr key={week.gameweek} className="border-b border-ink/10 last:border-0">
                        <td className="p-3 font-semibold text-ink-soft">GW{week.gameweek}</td>
                        <td className={`p-3 text-right font-display font-bold ${week.aPoints > week.bPoints ? 'text-violet' : 'text-ink'}`}>
                          {week.aPoints}
                        </td>
                        <td className="p-3 text-center text-ink-soft">
                          {week.aPoints === week.bPoints ? <Minus size={14} className="mx-auto" /> : (
                            <TrophyCup
                              size={18}
                              className="mx-auto"
                              tone={week.aPoints > week.bPoints ? 'fill-violet' : 'fill-coral'}
                            />
                          )}
                        </td>
                        <td className={`p-3 font-display font-bold ${week.bPoints > week.aPoints ? 'text-coral' : 'text-ink'}`}>
                          {week.bPoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </motion.div>
  );
};

const ManagerPicker = ({ standings, value, onChange, excludeId }) => (
  <select
    value={value ?? ''}
    onChange={(e) => onChange(Number(e.target.value))}
    className="w-full bg-surface-alt border-2 border-ink/85 rounded-2xl px-4 py-3 text-ink font-bold shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-violet"
  >
    {standings.map((manager) => {
      const id = manager.id ?? manager.entry;
      return (
        <option key={id} value={id} disabled={id === excludeId}>
          {manager.managerName || manager.player_name} {id === excludeId ? '(selected)' : ''}
        </option>
      );
    })}
  </select>
);

export default HeadToHead;
