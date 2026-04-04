-- =============================================================
-- FHIR Seed Data
-- Generated from fhir_patient_example.json + fhir_medication_example.json
-- =============================================================

-- -------------------------------------------------------------
-- SCHEMA
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS patients (
    id          TEXT PRIMARY KEY,
    family_name TEXT NOT NULL,
    given_name  TEXT NOT NULL,
    gender      TEXT,
    birth_date  DATE
);

CREATE TABLE IF NOT EXISTS conditions (
    id              TEXT PRIMARY KEY,
    patient_id      TEXT NOT NULL REFERENCES patients(id),
    clinical_status TEXT,
    description     TEXT
);

CREATE TABLE IF NOT EXISTS medications (
    id          TEXT PRIMARY KEY,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS medication_requests (
    id          TEXT PRIMARY KEY,
    patient_id  TEXT NOT NULL REFERENCES patients(id),
    medication  TEXT NOT NULL,
    status      TEXT
);

CREATE TABLE IF NOT EXISTS medication_statements (
    id                  TEXT PRIMARY KEY,
    patient_id          TEXT NOT NULL REFERENCES patients(id),
    medication_id       TEXT NOT NULL REFERENCES medications(id),
    status              TEXT,
    dosage_text         TEXT,
    route               TEXT,
    dose_value          NUMERIC,
    dose_unit           TEXT
);

CREATE TABLE IF NOT EXISTS medication_knowledge (
    id                      TEXT PRIMARY KEY,
    description             TEXT NOT NULL,
    status                  TEXT,
    dose_form               TEXT,
    administration_guideline TEXT
);

CREATE TABLE IF NOT EXISTS observations (
    id          TEXT PRIMARY KEY,
    patient_id  TEXT NOT NULL REFERENCES patients(id),
    status      TEXT,
    code        TEXT NOT NULL,
    value       NUMERIC,
    unit        TEXT
);


-- -------------------------------------------------------------
-- PATIENTS
-- -------------------------------------------------------------

INSERT INTO patients (id, family_name, given_name, gender, birth_date) VALUES
    ('patient-1', 'Smith', 'Jane', 'female', '1975-06-15');


-- -------------------------------------------------------------
-- CONDITIONS
-- -------------------------------------------------------------

INSERT INTO conditions (id, patient_id, clinical_status, description) VALUES
    ('cond-1', 'patient-1', 'active', 'Type 2 Diabetes Mellitus');


-- -------------------------------------------------------------
-- MEDICATIONS
-- -------------------------------------------------------------

INSERT INTO medications (id, description) VALUES
    ('med-1', 'Metformin 500mg'),
    ('med-2', 'Insulin Glargine 10 units'),
    ('med-3', 'Glipizide 5mg'),
    ('med-4', 'Pioglitazone 15mg'),
    ('med-5', 'Acarbose 50mg');


-- -------------------------------------------------------------
-- MEDICATION REQUESTS
-- -------------------------------------------------------------

INSERT INTO medication_requests (id, patient_id, medication, status) VALUES
    ('med-1', 'patient-1', 'Metformin 500mg',          'active'),
    ('med-2', 'patient-1', 'Insulin Glargine 10 units', 'active'),
    ('med-3', 'patient-1', 'Glipizide 5mg',             'active'),
    ('med-4', 'patient-1', 'Pioglitazone 15mg',         'active'),
    ('med-5', 'patient-1', 'Acarbose 50mg',             'active');


-- -------------------------------------------------------------
-- MEDICATION STATEMENTS
-- -------------------------------------------------------------

INSERT INTO medication_statements (id, patient_id, medication_id, status, dosage_text, route, dose_value, dose_unit) VALUES
    ('medstat-1', 'patient-1', 'med-1', 'active', 'Take 1 tablet twice daily',                        'Oral',          500, 'mg'),
    ('medstat-2', 'patient-1', 'med-2', 'active', 'Inject 10 units subcutaneously once daily',        'Subcutaneous',   10, 'units'),
    ('medstat-3', 'patient-1', 'med-3', 'active', 'Take 1 tablet once daily before breakfast',        'Oral',            5, 'mg'),
    ('medstat-4', 'patient-1', 'med-4', 'active', 'Take 1 tablet once daily',                         'Oral',           15, 'mg'),
    ('medstat-5', 'patient-1', 'med-5', 'active', 'Take 1 tablet with first bite of each main meal',  'Oral',           50, 'mg');


-- -------------------------------------------------------------
-- MEDICATION KNOWLEDGE
-- -------------------------------------------------------------

INSERT INTO medication_knowledge (id, description, status, dose_form, administration_guideline) VALUES
    ('medknow-1', 'Metformin 500mg',       'active', 'Tablet',    'Take with meals to reduce GI upset'),
    ('medknow-2', 'Insulin Glargine',      'active', 'Injection', 'Inject once daily at bedtime'),
    ('medknow-3', 'Glipizide 5mg',         'active', 'Tablet',    'Take before breakfast'),
    ('medknow-4', 'Pioglitazone 15mg',     'active', 'Tablet',    'Take once daily'),
    ('medknow-5', 'Acarbose 50mg',         'active', 'Tablet',    'Take with first bite of each main meal');


-- -------------------------------------------------------------
-- OBSERVATIONS
-- -------------------------------------------------------------

INSERT INTO observations (id, patient_id, status, code, value, unit) VALUES
    ('obs-1', 'patient-1', 'final', 'Blood Glucose',    145,  'mg/dL'),
    ('obs-2', 'patient-1', 'final', 'Blood Pressure',   130,  'mmHg'),
    ('obs-3', 'patient-1', 'final', 'Weight',            82,  'kg'),
    ('obs-4', 'patient-1', 'final', 'HbA1c',             7.4, '%'),
    ('obs-5', 'patient-1', 'final', 'Cholesterol Total', 210, 'mg/dL'),
    ('obs-6', 'patient-1', 'final', 'Triglycerides',     160, 'mg/dL');
