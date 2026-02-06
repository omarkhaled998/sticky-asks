import React, { useState, useEffect } from "react";
import { getUserStats } from "../api/stats";
import { UserStats as UserStatsType } from "../types";

export function UserStats() {
  const [stats, setStats] = useState<UserStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getUserStats();
      setStats(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="stats-card loading">Loading stats...</div>;
  if (error) return <div className="stats-card error">{error}</div>;
  if (!stats) return null;

  const formatTurnaround = (minutes: number | null) => {
    if (minutes === null || minutes === undefined) return "N/A";
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 24
      ? `${Math.floor(hours / 24)}d ${hours % 24}h`
      : `${hours}h ${mins}m`;
  };

  return (
    <div className="stats-card">
      <h3>Your Stats</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-value">{stats.completed_tasks}</span>
          <span className="stat-label">Tasks Completed</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{formatTurnaround(stats.avg_turnaround_minutes)}</span>
          <span className="stat-label">Avg. Turnaround</span>
        </div>
      </div>
    </div>
  );
}
