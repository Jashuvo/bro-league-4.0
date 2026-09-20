import { describe, it, expect } from 'vitest';
import { buildSeasonComparison } from './seasonCompare';

// Minimal season_archive.total_standing row factory — only the fields the
// comparison reads.
const row = (overrides) => ({
  category: 'total_standing',
  season: '2026/27',
  period: 5,
  manager_id: 1,
  manager_name: 'Manager 1',
  team_name: 'Team 1',
  total_points: 300,
  final_rank: 1,
  ...overrides,
});

describe('buildSeasonComparison', () => {
  it('is unavailable when only the live season has been captured', () => {
    const result = buildSeasonComparison({
      seasonArchive: [
        row({ manager_id: 1 }),
        row({ manager_id: 2, total_points: 250, final_rank: 2 }),
        row({ category: 'weekly_winner', period: 4 }),
      ],
      currentSeason: '2026/27',
      standings: [],
    });
    expect(result.available).toBe(false);
    expect(result.reason).toBe('no-previous-season');
  });

  it('compares the same gameweek of the previous season, ranked by current rank', () => {
    const result = buildSeasonComparison({
      seasonArchive: [
        // current season at GW5
        row({ season: '2026/27', manager_id: 1, total_points: 320, final_rank: 1 }),
        row({ season: '2026/27', manager_id: 2, total_points: 300, final_rank: 2 }),
        // current season at an EARLIER gameweek (must not be picked)
        row({ season: '2026/27', manager_id: 1, period: 4, total_points: 260, final_rank: 1 }),
        // previous season at GW5 — total is lower for #1, higher for #2
        row({ season: '2025/26', manager_id: 1, total_points: 290, final_rank: 1 }),
        row({ season: '2025/26', manager_id: 2, total_points: 310, final_rank: 2 }),
        // other categories must be ignored
        row({ season: '2025/26', category: 'weekly_winner', period: 5, total_points: 80 }),
      ],
      currentSeason: '2026/27',
      standings: [{ id: 1, managerName: 'Jubayed' }, { id: 2, managerName: 'Shuvo' }],
    });

    expect(result.available).toBe(true);
    expect(result.gameweek).toBe(5);
    expect(result.previousSeason).toBe('2025/26');
    expect(result.rows).toHaveLength(2);

    const [first, second] = result.rows;
    expect(first.managerId).toBe(1);
    expect(first.name).toBe('Jubayed'); // live standings overlay
    expect(first.currentTotal).toBe(320);
    expect(first.previousTotal).toBe(290);
    expect(first.delta).toBe(30);
    expect(second.delta).toBe(-10);
  });

  it('reports previous-season-incomplete when the old season stops before the current GW', () => {
    const result = buildSeasonComparison({
      seasonArchive: [
        row({ season: '2026/27', manager_id: 1, period: 12 }),
        row({ season: '2025/26', manager_id: 1, period: 8, total_points: 200 }), // stopped at GW8
      ],
      currentSeason: '2026/27',
      standings: [],
    });
    expect(result.available).toBe(false);
    expect(result.reason).toBe('previous-season-incomplete');
    expect(result.gameweek).toBe(12);
  });

  it('marks managers who were not in the previous season as new and trails them last', () => {
    const result = buildSeasonComparison({
      seasonArchive: [
        row({ season: '2026/27', manager_id: 1, total_points: 320, final_rank: 1 }),
        row({ season: '2026/27', manager_id: 9, total_points: 280, final_rank: 2 }),
        row({ season: '2025/26', manager_id: 1, total_points: 290, final_rank: 1 }),
      ],
      currentSeason: '2026/27',
      standings: [],
    });

    expect(result.rows[0].managerId).toBe(1);
    expect(result.rows[0].isNew).toBe(false);
    const newcomer = result.rows[1];
    expect(newcomer.managerId).toBe(9);
    expect(newcomer.isNew).toBe(true);
    expect(newcomer.previousTotal).toBeNull();
    expect(newcomer.delta).toBeNull();
  });

  it('picks the most recent previous season when several are archived', () => {
    const result = buildSeasonComparison({
      seasonArchive: [
        row({ season: '2026/27', manager_id: 1, total_points: 100, final_rank: 1 }),
        row({ season: '2025/26', manager_id: 1, total_points: 90, final_rank: 1 }),
        row({ season: '2024/25', manager_id: 1, total_points: 80, final_rank: 1 }),
      ],
      currentSeason: '2026/27',
      standings: [],
    });
    expect(result.previousSeason).toBe('2025/26');
    expect(result.rows[0].previousTotal).toBe(90);
  });

  it('uses the archived name when the manager is no longer in the live standings', () => {
    const result = buildSeasonComparison({
      seasonArchive: [
        row({ season: '2026/27', manager_id: 7, manager_name: 'Archived Name', total_points: 320, final_rank: 1 }),
        row({ season: '2025/26', manager_id: 7, total_points: 290, final_rank: 1 }),
      ],
      currentSeason: '2026/27',
      standings: [], // manager has left the league
    });
    expect(result.rows[0].name).toBe('Archived Name');
  });
});
