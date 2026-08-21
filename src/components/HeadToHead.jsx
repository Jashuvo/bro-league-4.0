// src/components/HeadToHead.jsx - Compare two managers gameweek-by-gameweek.
// Everything here is reshaped from `standings` and `gameweekTable`, which
// the app already has in state — no extra fetching.
import React, { useMemo, useState } from 'react';
import { Swords, Trophy, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';

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
          <div key={i} className="h-16 bg-base-200/50 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (standings.length < 2) {
    return (
      <div className="p-12 text-center text-bro-muted">
        <Swords className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p className="text-lg">Need at least two managers to compare</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="bg-gradient-to-r from-bro-primary to-bro-accent border-none">
        <div className="flex items-center gap-4 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
            <Swords size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold">Head-to-Head</h2>
            <p className="text-white/80 text-lg">Bragging rights, gameweek by gameweek</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-4">
          <ManagerPicker
            standings={standings}
            value={managerAId}
            onChange={setManagerAId}
            excludeId={managerBId}
          />
          <div className="text-center text-bro-muted font-bold text-sm uppercase tracking-wider">vs</div>
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
            <div className="grid grid-cols-3 items-center text-center gap-4">
              <div>
                <div className="text-3xl font-bold text-bro-primary">{record.aWins}</div>
                <div className="text-xs text-bro-muted uppercase tracking-wider mt-1 truncate">{managerA.managerName}</div>
              </div>
              <div>
                <Badge variant="warning">{record.draws} draw{record.draws !== 1 ? 's' : ''}</Badge>
                <div className="text-xs text-bro-muted mt-2">{record.weeks.length} gameweeks played</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-bro-accent">{record.bWins}</div>
                <div className="text-xs text-bro-muted uppercase tracking-wider mt-1 truncate">{managerB.managerName}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-base-content/10">
              <div className="text-center">
                <div className="text-xl font-bold text-base-content">{managerA.totalPoints ?? managerA.total ?? 0}</div>
                <div className="text-xs text-bro-muted">Season Total</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-base-content">{managerB.totalPoints ?? managerB.total ?? 0}</div>
                <div className="text-xs text-bro-muted">Season Total</div>
              </div>
            </div>
          </Card>

          {record.weeks.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[420px]">
                  <thead>
                    <tr className="border-b border-base-content/10 text-left">
                      <th className="p-3 text-bro-muted font-medium">GW</th>
                      <th className="p-3 text-bro-muted font-medium text-right">{managerA.managerName}</th>
                      <th className="p-3 text-bro-muted font-medium text-center"></th>
                      <th className="p-3 text-bro-muted font-medium">{managerB.managerName}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...record.weeks].reverse().map((week) => (
                      <tr key={week.gameweek} className="border-b border-base-content/5 last:border-0">
                        <td className="p-3 text-bro-muted">GW{week.gameweek}</td>
                        <td className={`p-3 text-right font-bold ${week.aPoints > week.bPoints ? 'text-bro-primary' : 'text-base-content'}`}>
                          {week.aPoints}
                        </td>
                        <td className="p-3 text-center text-bro-muted">
                          {week.aPoints === week.bPoints ? <Minus size={14} className="mx-auto" /> : (
                            week.aPoints > week.bPoints
                              ? <Trophy size={14} className="mx-auto text-bro-primary" />
                              : <Trophy size={14} className="mx-auto text-bro-accent" />
                          )}
                        </td>
                        <td className={`p-3 font-bold ${week.bPoints > week.aPoints ? 'text-bro-accent' : 'text-base-content'}`}>
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
    className="w-full bg-base-200 border border-base-content/10 rounded-xl px-4 py-3 text-base-content font-medium focus:outline-none focus:ring-2 focus:ring-bro-primary"
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
