import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Trophy, AlertCircle, Zap, Crown, Medal, Award, TrendingUp, TrendingDown } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import fplApi from '../services/fplApi';

const LiveTotalPointsTable = ({ standings = [], gameweek }) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [liveData, setLiveData] = useState(null);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchLiveTotalPoints = async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError(null);

        try {
            const result = await fplApi.getLiveLeagueStats(gameweek);

            if (result && result.success) {
                // Merge live GW points with existing total points
                const mergedData = standings.map(standing => {
                    const liveManager = result.managers.find(
                        m => m.id === (standing.id || standing.entry)
                    );

                    const liveGWPoints = liveManager ? liveManager.livePoints : 0;
                    const existingTotal = standing.totalPoints || standing.total || 0;
                    const liveTotalPoints = existingTotal + liveGWPoints;

                    return {
                        ...standing,
                        liveGWPoints,
                        liveTotalPoints,
                        liveManager
                    };
                });

                // Sort by live total points
                mergedData.sort((a, b) => b.liveTotalPoints - a.liveTotalPoints);

                setLiveData(mergedData);
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
        fetchLiveTotalPoints();
    }, [gameweek]);

    const handleRefresh = () => {
        fetchLiveTotalPoints(true);
    };

    const getPositionIcon = (rank) => {
        if (rank === 1) return <Crown size={20} className="text-yellow-400 fill-yellow-400" />;
        if (rank === 2) return <Medal size={20} className="text-gray-300 fill-gray-300" />;
        if (rank === 3) return <Award size={20} className="text-orange-400 fill-orange-400" />;
        return <span className="text-bro-muted font-bold w-6 text-center">{rank}</span>;
    };

    if (loading && !liveData) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-bro-card/50 rounded-xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (error && !liveData) {
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
                    <span>Live Total Points • GW {gameweek}</span>
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
                {liveData?.map((manager, index) => {
                    const position = index + 1;
                    const originalPosition = standings.findIndex(s =>
                        (s.id || s.entry) === (manager.id || manager.entry)
                    ) + 1;
                    const positionChange = originalPosition - position;

                    return (
                        <motion.div
                            key={manager.id || manager.entry}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="p-4 flex items-center gap-4 hover:bg-base-content/5 transition-colors">
                                <div className="flex-shrink-0 w-8 flex justify-center">
                                    {getPositionIcon(position)}
                                </div>

                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className={`font-bold ${position === 1 ? 'text-yellow-400' : 'text-base-content'} truncate`}>
                                            {manager.managerName || manager.player_name}
                                        </h3>
                                        {positionChange !== 0 && (
                                            positionChange > 0
                                                ? <TrendingUp size={16} className="text-green-500" title={`Up ${positionChange}`} />
                                                : <TrendingDown size={16} className="text-red-500" title={`Down ${Math.abs(positionChange)}`} />
                                        )}
                                    </div>
                                    <p className="text-xs text-bro-muted truncate">{manager.teamName || manager.entry_name}</p>
                                </div>

                                <div className="text-right">
                                    <div className="font-bold text-xl text-green-400">
                                        {manager.liveTotalPoints}
                                    </div>
                                    <div className="text-xs text-bro-muted">
                                        +{manager.liveGWPoints} GW
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default LiveTotalPointsTable;
