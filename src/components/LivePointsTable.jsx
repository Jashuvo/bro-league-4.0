import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Trophy, AlertCircle, Zap, Shield } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import fplApi from '../services/fplApi';

const LivePointsTable = ({ gameweek }) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

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
                {data?.managers?.map((manager, index) => (
                    <motion.div
                        key={manager.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className="p-4 flex items-center gap-4 hover:bg-base-content/5 transition-colors">
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
                        </Card>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default LivePointsTable;
