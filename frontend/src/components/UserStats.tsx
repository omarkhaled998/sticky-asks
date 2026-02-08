import React, { useState, useEffect } from "react";
import { getUserStats } from "../api/stats";
import { getProfile, updateProfile } from "../api/profile";
import { UserStats as UserStatsType } from "../types";

interface ProfileData {
  email: string;
  display_name: string | null;
}

export function UserStats() {
  const [stats, setStats] = useState<UserStatsType | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, profileData] = await Promise.all([
        getUserStats(),
        getProfile()
      ]);
      setStats(statsData);
      setProfile(profileData);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const extractNameFromEmail = (email: string): string => {
    const localPart = email.split("@")[0];
    return localPart
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getDisplayName = (): string => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.email) return extractNameFromEmail(profile.email);
    return "User";
  };

  const handleEditClick = () => {
    setEditedName(getDisplayName());
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) return;
    
    try {
      setSaving(true);
      const result = await updateProfile(editedName.trim());
      setProfile(prev => prev ? { ...prev, display_name: result.display_name } : null);
      setIsEditingName(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save name");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveName();
    if (e.key === "Escape") handleCancelEdit();
  };

  if (loading) return <div className="stats-card loading">Loading...</div>;
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
      <div className="personal-info">
        <h3>Personal Info</h3>
        <div className="name-row">
          {isEditingName ? (
            <div className="name-edit">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                maxLength={100}
                disabled={saving}
              />
              <button 
                className="btn btn-save" 
                onClick={handleSaveName}
                disabled={saving || !editedName.trim()}
              >
                {saving ? "..." : "✓"}
              </button>
              <button 
                className="btn btn-cancel" 
                onClick={handleCancelEdit}
                disabled={saving}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="name-display">
              <span className="user-name">{getDisplayName()}</span>
              <button className="btn-edit" onClick={handleEditClick} title="Edit name">
                ✏️
              </button>
            </div>
          )}
        </div>
        <div className="email-row">
          <span className="user-email-label">{profile?.email}</span>
        </div>
      </div>

      <div className="stats-section">
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
    </div>
  );
}
