-- =============================================================================
-- User-Patient Mapping Table
-- Links Firebase Auth users to Synthea patient records
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_patient (
    firebase_uid  TEXT PRIMARY KEY,
    patient_id    UUID NOT NULL REFERENCES patient(id),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_patient_patient ON user_patient(patient_id);
