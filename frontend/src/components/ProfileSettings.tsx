import React, { useState, useEffect } from "react";
import { getProfile, updateProfile } from "../api/profile";

interface ProfileSettingsProps {
  onClose: () => void;
  onUpdated?: () => void;
}

export function ProfileSettings({ onClose, onUpdated }: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const profile = await getProfile();
      setDisplayName(profile.display_name || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    setSaving(true);
    try {
      await updateProfile(displayName.trim());
      setSuccess("Profile updated successfully!");
      onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="profile-settings-modal">
        <div className="profile-settings">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-settings-modal" onClick={onClose}>
      <div className="profile-settings" onClick={(e) => e.stopPropagation()}>
        <h3>Profile Settings</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Display Name:</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="form-input"
              maxLength={100}
            />
            <p className="form-help">This name will be shown to others instead of your email.</p>
          </div>

          {error && <p className="error-text">{error}</p>}
          {success && <p className="success-text">{success}</p>}

          <div className="form-actions">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={onClose} className="btn btn-cancel">
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
