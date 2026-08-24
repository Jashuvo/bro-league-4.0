import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, AlertCircle, Zap, ChevronDown, Star } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { Jersey } from './ui/Doodles';
import fplApi from '../services/fplApi';

const LivePointsTable = ({ gameweek }) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    const fetchLivePoints = async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
            // Clear specific cache for this request if needed, but fplApi handles it via force refresh usually
            // For now, we rely on the short TTL in fplApi
        } else {
            setLoading(true);
        }

        setError(null);

        try {
            const result = await fplApi.getLiveLeagueStats(gameweek);

            if (result && result.success) {
                setData(result);
                setLastUpdated(new Date());
            } else {
                setError('Failed to load live points. Please try again.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred while fetching live data.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLivePoints();
    }, [gameweek]);

    const handleRefresh = () => {
        fetchLivePoints(true);
    };

    if (loading && !data) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-surface-sunk rounded-3xl border-2 border-ink/10 animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="text-center p-8 bg-coral/12 rounded-3xl border-2 border-ink/85 shadow-card">
                <AlertCircle className="w-12 h-12 text-coral-ink mx-auto mb-3" />
                <p className="text-ink font-bold mb-4">{error}</p>
                <button
                    onClick={handleRefresh}
                    className="btn-pop px-4 py-2 bg-coral text-ink border-2 border-ink/85 rounded-2xl font-display font-bold"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
        >
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-sm font-bold text-ink">
                    <Zap size={16} className="text-sunflower-ink fill-sunflower" />
                    <span>Live Points • GW {gameweek}</span>
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="btn-pop flex items-center gap-2 text-xs font-bold bg-surface-alt border-2 border-ink/85 px-3 py-1.5 rounded-xl disabled:opacity-50"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Updating...' : 'Refresh'}
                </button>
            </div>

            {lastUpdated && (
                <div className="text-xs font-semibold text-center text-ink-soft mb-4">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
            )}

            <div className="space-y-3">
                {data?.managers?.map((manager, index) => {
                    const isExpanded = expandedId === manager.id;
                    const startingPicks = (manager.picks || [])
                        .filter((p) => manager.activeChip === 'bboost' || p.position <= 11)
                        .sort((a, b) => b.points - a.points);

                    return (
                        <motion.div
                            key={manager.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card
                                tone={index === 0 ? 'sunflower' : 'paper'}
                                className="p-0 overflow-hidden hover:bg-surface-sunk/60 transition-colors"
                            >
                                <div
                                    className="p-3 md:p-4 flex items-center gap-3 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : manager.id)}
                                >
                                    <Jersey size={34} number={index + 1} tone={index === 0 ? 'fill-sunflower' : 'fill-surface-sunk'} className="shrink-0" />

                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-display font-bold text-ink truncate">
                                                {manager.name}
                                            </h3>
                                            {manager.activeChip && (
                                                <Badge variant="info" className="text-[10px] px-1.5 py-0">
                                                    {manager.activeChip.toUpperCase()}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs font-medium text-ink-soft truncate">{manager.teamName}</p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="font-display font-bold text-xl text-pitch-ink leading-tight">
                                            {manager.livePoints}
                                        </div>
                                        {manager.transferCost > 0 && (
                                            <div className="text-xs font-bold text-coral-ink">
                                                -{manager.transferCost} hit
                                            </div>
                                        )}
                                    </div>

                                    <ChevronDown
                                        size={18}
                                        className={`text-ink-soft transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="bg-surface-sunk border-t-2 border-dashed border-ink/15"
                                        >
                                            <div className="p-3 space-y-1">
                                                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider px-2 pb-1">
                                                    Live points • bonus is provisional (BPS) until the match is confirmed
                                                </div>
                                                {startingPicks.map((pick) => (
                                                    <div key={pick.element} className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface-alt">
                                                        <span className="text-[10px] font-bold text-ink-soft w-8">{pick.positionType}</span>
                                                        <span className="flex-grow text-sm font-medium text-ink truncate flex items-center gap-1">
                                                            {pick.name}
                                                            {pick.is_captain && <Star size={12} className="text-sunflower-ink fill-sunflower" />}
                                                        </span>
                                                        {pick.bps > 0 && (
                                                            <span className="text-[10px] font-semibold text-ink-soft" title="Bonus Points System score">
                                                                BPS {pick.bps}
                                                            </span>
                                                        )}
                                                        {pick.bonus > 0 && (
                                                            <span className="text-xs font-bold text-tangerine-ink">+{pick.bonus}</span>
                                                        )}
                                                        <span className="text-sm font-display font-bold text-ink w-8 text-right">{pick.points}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default LivePointsTable;
