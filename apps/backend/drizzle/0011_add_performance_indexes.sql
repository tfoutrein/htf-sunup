-- Migration: Ajout des indexes de performance
-- Date: 2025-10-04
-- Description: Ajoute des indexes sur les colonnes fréquemment utilisées pour améliorer les performances

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id) WHERE manager_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_facebook_id ON users(facebook_id) WHERE facebook_id IS NOT NULL;

-- User Actions table indexes
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_challenge_id ON user_actions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_action_id ON user_actions(action_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_completed ON user_actions(completed);
CREATE INDEX IF NOT EXISTS idx_user_actions_user_challenge ON user_actions(user_id, challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_completed_at ON user_actions(completed_at) WHERE completed_at IS NOT NULL;

-- Daily Bonus table indexes
CREATE INDEX IF NOT EXISTS idx_daily_bonus_user_id ON daily_bonus(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_bonus_campaign_id ON daily_bonus(campaign_id);
CREATE INDEX IF NOT EXISTS idx_daily_bonus_status ON daily_bonus(status);
CREATE INDEX IF NOT EXISTS idx_daily_bonus_bonus_date ON daily_bonus(bonus_date);
CREATE INDEX IF NOT EXISTS idx_daily_bonus_reviewed_by ON daily_bonus(reviewed_by) WHERE reviewed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_bonus_user_campaign ON daily_bonus(user_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_daily_bonus_campaign_status ON daily_bonus(campaign_id, status);

-- Challenges table indexes
CREATE INDEX IF NOT EXISTS idx_challenges_campaign_id ON challenges(campaign_id);
CREATE INDEX IF NOT EXISTS idx_challenges_date ON challenges(date);
CREATE INDEX IF NOT EXISTS idx_challenges_campaign_date ON challenges(campaign_id, date);

-- Actions table indexes
CREATE INDEX IF NOT EXISTS idx_actions_challenge_id ON actions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_actions_challenge_order ON actions(challenge_id, "order");

-- Campaigns table indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_archived ON campaigns(archived);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON campaigns(end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_archived ON campaigns(status, archived);

-- Proofs table indexes (certains peuvent déjà exister)
CREATE INDEX IF NOT EXISTS idx_proofs_user_action_id ON proofs(user_action_id) WHERE user_action_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proofs_daily_bonus_id ON proofs(daily_bonus_id) WHERE daily_bonus_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proofs_created_at ON proofs(created_at);
CREATE INDEX IF NOT EXISTS idx_proofs_type ON proofs(type);

-- Campaign Bonus Config indexes
CREATE INDEX IF NOT EXISTS idx_campaign_bonus_config_campaign_id ON campaign_bonus_config(campaign_id);

-- Campaign Validations indexes
CREATE INDEX IF NOT EXISTS idx_campaign_validations_user_id ON campaign_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_validations_campaign_id ON campaign_validations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_validations_status ON campaign_validations(status);
CREATE INDEX IF NOT EXISTS idx_campaign_validations_validated_by ON campaign_validations(validated_by) WHERE validated_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_validations_user_campaign ON campaign_validations(user_id, campaign_id);

-- App Versions indexes
CREATE INDEX IF NOT EXISTS idx_app_versions_is_active ON app_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_app_versions_release_date ON app_versions(release_date);

-- User Version Tracking indexes
CREATE INDEX IF NOT EXISTS idx_user_version_tracking_user_id ON user_version_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_version_tracking_version_id ON user_version_tracking(version_id);
CREATE INDEX IF NOT EXISTS idx_user_version_tracking_has_seen ON user_version_tracking(has_seen_popup);

-- Composite indexes pour les requêtes courantes
CREATE INDEX IF NOT EXISTS idx_campaigns_active_lookup ON campaigns(status, archived, start_date, end_date) 
  WHERE status = 'active' AND archived = false;

-- Mise à jour des statistiques après création des indexes
ANALYZE users;
ANALYZE user_actions;
ANALYZE daily_bonus;
ANALYZE campaigns;
ANALYZE challenges;
ANALYZE actions;
ANALYZE proofs;
ANALYZE campaign_validations;
ANALYZE app_versions;
ANALYZE user_version_tracking;
ANALYZE campaign_bonus_config;

-- Log de complétion
DO $$
BEGIN
  RAISE NOTICE 'Performance indexes created successfully!';
  RAISE NOTICE 'Total indexes created: ~35';
  RAISE NOTICE 'Statistics updated for all tables';
END $$;


