import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, AlertCircle, Zap, ChevronDown, Star } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
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
                    <div key={i} className="h-16 bg-bro-card/50 rounded-xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="text-center p-8 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-300 mb-4">{error}</p>
                <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
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
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-bro-muted">
                    <Zap size={16} className="text-yellow-400" />
                    <span>Live Points • GW {gameweek}</span>
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 text-xs bg-base-content/5 hover:bg-base-content/10 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Updating...' : 'Refresh'}
                </button>
            </div>

            {lastUpdated && (
                <div className="text-xs text-center text-bro-muted mb-4">
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
                            <Card className="p-0 overflow-hidden hover:bg-base-content/5 transition-colors">
                                <div
                                    className="p-4 flex items-center gap-4 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : manager.id)}
                                >
                                    <div className="flex-shrink-0 w-8 text-center font-bold text-bro-muted">
                                        {index + 1}
                                    </div>

                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-base-content truncate">
                                                {manager.name}
                                            </h3>
                                            {manager.activeChip && (
                                                <Badge variant="info" size="sm" className="text-[10px] px-1.5 py-0 h-5">
                                                    {manager.activeChip.toUpperCase()}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-bro-muted truncate">{manager.teamName}</p>
                                    </div>

                                    <div className="text-right">
                                        <div className="font-bold text-xl text-green-400">
                                            {manager.livePoints}
                                        </div>
                                        {manager.transferCost > 0 && (
                                            <div className="text-xs text-red-400">
                                                -{manager.transferCost} hit
                                            </div>
                                        )}
                                    </div>

                                    <ChevronDown
                                        size={18}
                                        className={`text-bro-muted transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="bg-base-300/50 border-t border-base-content/5"
                                        >
                                            <div className="p-3 space-y-1">
                                                <div className="text-[10px] text-bro-muted uppercase tracking-wider px-2 pb-1">
                                                    Live points • bonus is provisional (BPS) until the match is confirmed
                                                </div>
                                                {startingPicks.map((pick) => (
                                                    <div key={pick.element} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-base-content/5">
                                                        <span className="text-[10px] font-bold text-bro-muted w-8">{pick.positionType}</span>
                                                        <span className="flex-grow text-sm text-base-content truncate flex items-center gap-1">
                                                            {pick.name}
                                                            {pick.is_captain && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                                                        </span>
                                                        {pick.bps > 0 && (
                                                            <span className="text-[10px] text-bro-muted" title="Bonus Points System score">
                                                                BPS {pick.bps}
                                                            </span>
                                                        )}
                                                        {pick.bonus > 0 && (
                                                            <span className="text-xs font-bold text-yellow-400">+{pick.bonus}</span>
                                                        )}
                                                        <span className="text-sm font-bold text-base-content w-8 text-right">{pick.points}</span>
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
