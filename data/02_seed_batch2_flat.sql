-- =============================================================================
-- Synthea Patient Data — PostgreSQL Schema & Seed Script (Batch 2, Flat)
-- Tables: coding_system, clinical_code, careplan, condition,
--         device, immunization, medication, observation,
--         procedure_record, supply
--
-- Design philosophy:
--   • clinical_code kept as shared terminology table — eliminates repeated
--     description strings across 8 tables, and allows future SNOMED/LOINC
--     lookups against a single reference. The tradeoff (one extra join per
--     clinical query) is worth it for code-level analytics.
--   • observation_category removed — stored as plain TEXT on observation.
--   • All other categoricals stored inline as TEXT.
--   • No surrogate lookup tables for anything non-terminology.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- CODING SYSTEM + CLINICAL CODE  (shared terminology lookup)
-- ---------------------------------------------------------------------------

CREATE TABLE coding_system (
    id      SMALLSERIAL PRIMARY KEY,
    name    TEXT NOT NULL UNIQUE,
    uri     TEXT
);

INSERT INTO coding_system (name, uri) VALUES
    ('SNOMED-CT', 'http://snomed.info/sct'),
    ('LOINC',     'http://loinc.org'),
    ('CVX',       'http://hl7.org/fhir/sid/cvx'),
    ('RxNorm',    'http://www.nlm.nih.gov/research/umls/rxnorm');

CREATE TABLE clinical_code (
    id               SERIAL PRIMARY KEY,
    coding_system_id SMALLINT NOT NULL REFERENCES coding_system(id),
    code             TEXT NOT NULL,
    description      TEXT,
    UNIQUE (coding_system_id, code)
);

CREATE INDEX idx_clinical_code_system ON clinical_code(coding_system_id);
CREATE INDEX idx_clinical_code_code   ON clinical_code(code);

-- ---------------------------------------------------------------------------
-- CAREPLANS
-- ---------------------------------------------------------------------------

CREATE TABLE careplan (
    id              UUID PRIMARY KEY,
    start_date      DATE NOT NULL,
    stop_date       DATE,
    patient_id      UUID NOT NULL REFERENCES patient(id),
    encounter_id    UUID REFERENCES encounter(id),
    code_id         INT NOT NULL REFERENCES clinical_code(id),
    reason_code_id  INT REFERENCES clinical_code(id)
);

CREATE INDEX idx_careplan_patient   ON careplan(patient_id);
CREATE INDEX idx_careplan_encounter ON careplan(encounter_id);
CREATE INDEX idx_careplan_code      ON careplan(code_id);

-- ---------------------------------------------------------------------------
-- CONDITIONS
-- ---------------------------------------------------------------------------

CREATE TABLE condition (
    patient_id   UUID NOT NULL REFERENCES patient(id),
    encounter_id UUID NOT NULL REFERENCES encounter(id),
    code_id      INT  NOT NULL REFERENCES clinical_code(id),
    start_date   DATE NOT NULL,
    stop_date    DATE,
    PRIMARY KEY (patient_id, encounter_id, code_id)
);

CREATE INDEX idx_condition_patient   ON condition(patient_id);
CREATE INDEX idx_condition_encounter ON condition(encounter_id);
CREATE INDEX idx_condition_code      ON condition(code_id);
CREATE INDEX idx_condition_start     ON condition(start_date);

-- ---------------------------------------------------------------------------
-- DEVICES
-- ---------------------------------------------------------------------------

CREATE TABLE device (
    id           SERIAL PRIMARY KEY,
    start_time   TIMESTAMPTZ NOT NULL,
    stop_time    TIMESTAMPTZ,
    patient_id   UUID NOT NULL REFERENCES patient(id),
    encounter_id UUID REFERENCES encounter(id),
    code_id      INT  NOT NULL REFERENCES clinical_code(id),
    udi          TEXT
);

CREATE INDEX idx_device_patient   ON device(patient_id);
CREATE INDEX idx_device_encounter ON device(encounter_id);
CREATE INDEX idx_device_code      ON device(code_id);

-- ---------------------------------------------------------------------------
-- IMMUNIZATIONS
-- ---------------------------------------------------------------------------

CREATE TABLE immunization (
    id             SERIAL PRIMARY KEY,
    administered_at TIMESTAMPTZ NOT NULL,
    patient_id     UUID NOT NULL REFERENCES patient(id),
    encounter_id   UUID REFERENCES encounter(id),
    code_id        INT  NOT NULL REFERENCES clinical_code(id),
    base_cost      NUMERIC(10,2)
);

CREATE INDEX idx_immunization_patient   ON immunization(patient_id);
CREATE INDEX idx_immunization_encounter ON immunization(encounter_id);
CREATE INDEX idx_immunization_code      ON immunization(code_id);
CREATE INDEX idx_immunization_date      ON immunization(administered_at);

-- ---------------------------------------------------------------------------
-- MEDICATIONS
-- ---------------------------------------------------------------------------

CREATE TABLE medication (
    id             SERIAL PRIMARY KEY,
    start_time     TIMESTAMPTZ NOT NULL,
    stop_time      TIMESTAMPTZ,
    patient_id     UUID NOT NULL REFERENCES patient(id),
    payer_id       UUID REFERENCES payer(id),
    encounter_id   UUID REFERENCES encounter(id),
    code_id        INT  NOT NULL REFERENCES clinical_code(id),
    base_cost      NUMERIC(10,2),
    payer_coverage NUMERIC(10,2),
    dispenses      INT,
    total_cost     NUMERIC(10,2),
    reason_code_id INT REFERENCES clinical_code(id)
);

CREATE INDEX idx_medication_patient   ON medication(patient_id);
CREATE INDEX idx_medication_encounter ON medication(encounter_id);
CREATE INDEX idx_medication_payer     ON medication(payer_id);
CREATE INDEX idx_medication_code      ON medication(code_id);
CREATE INDEX idx_medication_start     ON medication(start_time);

-- ---------------------------------------------------------------------------
-- OBSERVATIONS
-- category stored as plain TEXT (currently always 'laboratory')
-- value split into numeric/text columns to support future non-numeric types
-- ---------------------------------------------------------------------------

CREATE TABLE observation (
    id               SERIAL PRIMARY KEY,
    observed_at      TIMESTAMPTZ NOT NULL,
    patient_id       UUID NOT NULL REFERENCES patient(id),
    encounter_id     UUID REFERENCES encounter(id),
    category         TEXT,
    code_id          INT  NOT NULL REFERENCES clinical_code(id),
    value_numeric    NUMERIC,
    value_text       TEXT,
    units            TEXT,
    observation_type TEXT
);

CREATE INDEX idx_observation_patient   ON observation(patient_id);
CREATE INDEX idx_observation_encounter ON observation(encounter_id);
CREATE INDEX idx_observation_code      ON observation(code_id);
CREATE INDEX idx_observation_date      ON observation(observed_at);
CREATE INDEX idx_observation_category  ON observation(category);

-- ---------------------------------------------------------------------------
-- PROCEDURES
-- ---------------------------------------------------------------------------

CREATE TABLE procedure_record (
    id             SERIAL PRIMARY KEY,
    start_time     TIMESTAMPTZ NOT NULL,
    stop_time      TIMESTAMPTZ,
    patient_id     UUID NOT NULL REFERENCES patient(id),
    encounter_id   UUID REFERENCES encounter(id),
    code_id        INT  NOT NULL REFERENCES clinical_code(id),
    base_cost      NUMERIC(10,2),
    reason_code_id INT REFERENCES clinical_code(id)
);

CREATE INDEX idx_procedure_patient   ON procedure_record(patient_id);
CREATE INDEX idx_procedure_encounter ON procedure_record(encounter_id);
CREATE INDEX idx_procedure_code      ON procedure_record(code_id);
CREATE INDEX idx_procedure_start     ON procedure_record(start_time);

-- ---------------------------------------------------------------------------
-- SUPPLIES
-- ---------------------------------------------------------------------------

CREATE TABLE supply (
    id           SERIAL PRIMARY KEY,
    supply_date  DATE NOT NULL,
    patient_id   UUID NOT NULL REFERENCES patient(id),
    encounter_id UUID REFERENCES encounter(id),
    code_id      INT  NOT NULL REFERENCES clinical_code(id),
    quantity     INT
);

CREATE INDEX idx_supply_patient   ON supply(patient_id);
CREATE INDEX idx_supply_encounter ON supply(encounter_id);
CREATE INDEX idx_supply_code      ON supply(code_id);

-- =============================================================================
-- SEED — CLINICAL CODES
-- Pre-seeded from known codes in dataset; dynamic upserts below handle any
-- additional codes encountered during CSV loading.
-- =============================================================================

INSERT INTO clinical_code (coding_system_id, code, description)
SELECT (SELECT id FROM coding_system WHERE name = 'SNOMED-CT'), code, description
FROM (VALUES
    ('714628002',       'Prediabetes (finding)'),
    ('271737000',       'Anemia (disorder)'),
    ('44054006',        'Diabetes mellitus type 2 (disorder)'),
    ('13644009',        'Hypercholesterolemia (finding)'),
    ('55822004',        'Hyperlipidemia (disorder)'),
    ('40930008',        'Hypothyroidism (disorder)'),
    ('117521000119101', 'Anemia co-occurrent and due to chronic kidney disease stage 3 (disorder)'),
    ('735985000',       'Diabetes self management plan (record artifact)'),
    ('337414009',       'Blood glucose meter (physical object)'),
    ('337388004',       'Blood glucose testing strips (physical object)'),
    ('1137596000',      'Blood lancet (physical object)'),
    ('8537005',         'Solution (substance)'),
    ('14768001',        'Peripheral blood smear interpretation (procedure)'),
    ('415300000',       'Review of systems (procedure)')
) AS t(code, description)
ON CONFLICT (coding_system_id, code) DO NOTHING;

INSERT INTO clinical_code (coding_system_id, code, description)
SELECT (SELECT id FROM coding_system WHERE name = 'LOINC'), code, description
FROM (VALUES
    ('4548-4',  'Hemoglobin A1c/Hemoglobin.total in Blood'),
    ('6690-2',  'Leukocytes [#/volume] in Blood by Automated count'),
    ('718-7',   'Hemoglobin [Mass/volume] in Blood'),
    ('20570-8', 'Hematocrit [Volume Fraction] of Blood by calculation'),
    ('777-3',   'Platelets [#/volume] in Blood by Automated count'),
    ('785-6',   'MCH [Entitic mass] by Automated count'),
    ('786-4',   'MCHC [Entitic Mass/volume] in Red Blood Cells by Automated count'),
    ('787-2',   'MCV [Entitic mean volume] in Red Blood Cells by Automated count'),
    ('32207-3', 'Platelet distribution width [Entitic volume] in Blood by Automated count'),
    ('32623-1', 'Platelet [Entitic mean volume] in Blood by Automated count'),
    ('731-0',   'Lymphocytes [#/volume] in Blood by Automated count'),
    ('751-8',   'Neutrophils [#/volume] in Blood by Automated count'),
    ('736-9',   'Lymphocytes/100 leukocytes in Blood by Automated count'),
    ('769-0',   'Neutrophils/100 leukocytes in Blood by Automated count'),
    ('30428-7', 'MCV [Entitic volume]')
) AS t(code, description)
ON CONFLICT (coding_system_id, code) DO NOTHING;

INSERT INTO clinical_code (coding_system_id, code, description)
SELECT (SELECT id FROM coding_system WHERE name = 'CVX'), code, description
FROM (VALUES
    ('140', 'Influenza, split virus, trivalent, PF'),
    ('03',  'MMR'),
    ('08',  'Hep B, adolescent or pediatric'),
    ('10',  'IPV'),
    ('113', 'Td (adult) 5 Lf tetanus toxoid, preservative free, adsorbed'),
    ('114', 'meningococcal MCV4P'),
    ('115', 'Tdap'),
    ('119', 'rotavirus, monovalent'),
    ('121', 'zoster vaccine, live'),
    ('133', 'Pneumococcal conjugate PCV 13'),
    ('207', 'COVID-19, mRNA, LNP-S, PF, 100 mcg/0.5mL dose or 50 mcg/0.25mL dose'),
    ('208', 'COVID-19, mRNA, LNP-S, PF, 30 mcg/0.3 mL dose'),
    ('21',  'varicella'),
    ('212', 'COVID-19 vaccine, vector-nr, rS-Ad26, PF, 0.5 mL'),
    ('33',  'pneumococcal polysaccharide vaccine, 23 valent'),
    ('43',  'Hep B, adult'),
    ('49',  'Hib (PRP-OMP)'),
    ('52',  'Hep A, adult'),
    ('62',  'HPV, quadrivalent'),
    ('83',  'Hep A, ped/adol, 2 dose'),
    ('20',  'DTaP')
) AS t(code, description)
ON CONFLICT (coding_system_id, code) DO NOTHING;

INSERT INTO clinical_code (coding_system_id, code, description)
SELECT (SELECT id FROM coding_system WHERE name = 'RxNorm'), code, description
FROM (VALUES
    ('860975', '24 HR Metformin hydrochloride 500 MG Extended Release Oral Tablet'),
    ('978015', 'Levothyroxine Sodium 25 MCG Oral Tablet'),
    ('104490', 'Simvastatin 20 MG Oral Tablet')
) AS t(code, description)
ON CONFLICT (coding_system_id, code) DO NOTHING;

-- =============================================================================
-- SEED — CLINICAL DATA
-- Each block: upsert any new codes from CSV, then insert rows.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- CAREPLANS
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE _careplan_raw (
    id TEXT, start_date TEXT, stop_date TEXT, patient TEXT, encounter TEXT,
    code TEXT, description TEXT, reasoncode TEXT, reasondescription TEXT
);
COPY _careplan_raw FROM '/docker-entrypoint-initdb.d/careplans.csv' WITH (FORMAT csv, HEADER true);

INSERT INTO clinical_code (coding_system_id, code, description)
SELECT DISTINCT (SELECT id FROM coding_system WHERE name = 'SNOMED-CT'),
    NULLIF(code,''), NULLIF(description,'')
FROM _careplan_raw WHERE NULLIF(code,'') IS NOT NULL
ON CONFLICT (coding_system_id, code) DO NOTHING;

INSERT INTO clinical_code (coding_system_id, code, description)
SELECT DISTINCT (SELECT id FROM coding_system WHERE name = 'SNOMED-CT'),
    NULLIF(reasoncode,''), NULLIF(reasondescription,'')
FROM _careplan_raw WHERE NULLIF(reasoncode,'') IS NOT NULL
ON CONFLICT (coding_system_id, code) DO NOTHING;

INSERT INTO careplan (id, start_date, stop_date, patient_id, encounter_id, code_id, reason_code_id)
SELECT
    c.id::uuid,
    c.start_date::date,
    NULLIF(c.stop_date,'')::date,
    c.patient::uuid,
    NULLIF(c.encounter,'')::uuid,
    cc.id,
    rc.id
FROM _careplan_raw c
JOIN  clinical_code cc ON cc.code = c.code
    AND cc.coding_system_id = (SELECT id FROM coding_system WHERE name = 'SNOMED-CT')
LEFT JOIN clinical_code rc ON rc.code = NULLIF(c.reasoncode,'')
    AND rc.coding_system_id = (SELECT id FROM coding_system WHERE name = 'SNOMED-CT');

DROP TABLE _careplan_raw;

-- ---------------------------------------------------------------------------
-- CONDITIONS
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE _condition_raw (
    start_date TEXT, stop_date TEXT, patient TEXT, encounter TEXT,
    system TEXT, code TEXT, description TEXT
);
COPY _condition_raw FROM '/docker-entrypoint-initdb.d/conditions.csv' WITH (FORMAT csv, HEADER true);

INSERT INTO clinical_code (coding_system_id, code, description)
SELECT DISTINCT (SELECT id FROM coding_system WHERE name = 'SNOMED-CT'),
    NULLIF(code,''), NULLIF(description,'')
FROM _condition_raw WHERE NULLIF(code,'') IS NOT NULL
ON CONFLICT (coding_system_id, code) DO NOTHING;

INSERT INTO condition (patient_id, encounter_id, code_id, start_date, stop_date)
SELECT
    c.patient::uuid, c.encounter::uuid, cc.id,
    c.start_date::date, NULLIF(c.stop_date,'')::date
FROM _condition_raw c
JOIN clinical_code cc ON cc.code = c.code
    AND cc.coding_system_id = (SELECT id FROM coding_system WHERE name = 'SNOMED-CT')
ON CONFLICT (patient_id, encounter_id, code_id) DO NOTHING;

DROP TABLE _condition_raw;

-- ---------------------------------------------------------------------------
-- DEVICES
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE _device_raw (
    start_time TEXT, stop_time TEXT, patient TEXT, encounter TEXT,
    code TEXT, description TEXT, udi TEXT
);
COPY _device_raw FROM '/docker-entrypoint-initdb.d/devices.csv' WITH (FORMAT csv, HEADER true);

INSERT INTO clinical_code (coding_system_id, code, description)
SELECT DISTINCT (SELECT id FROM coding_system WHERE name = 'SNOMED-CT'),
    NULLIF(code,''), NULLIF(description,'')
FROM _device_raw WHERE NULLIF(code,'') IS NOT NULL
ON CONFLICT (coding_system_id, code) DO NOTHING;

INSERT INTO device (start_time, stop_time, patient_id, encounter_id, code_id, udi)
SELECT
    d.start_time::timestamptz,
    NULLIF(d.stop_time,'')::timestamptz,
    d.patient::uuid,
    NULLIF(d.encounter,'')::uuid,
    cc.id,
    NULLIF(d.udi,'')
FROM _device_raw d
JOIN clinical_code cc ON cc.code = d.code
    AND cc.coding_system_id = (SELECT id FROM coding_system WHERE name = 'SNOMED-CT');

DROP TABLE _device_raw;

-- ---------------------------------------------------------------------------
-- IMMUNIZATIONS
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE _immunization_raw (
    date TEXT, patient TEXT, encounter TEXT,
    code TEXT, description TEXT, base_cost TEXT
);
COPY _immunization_raw FROM '/docker-entrypoint-initdb.d/immunizations.csv' WITH (FORMAT csv, HEADER true);

INSERT INTO clinical_code (coding_system_id, code, description)
SELECT DISTINCT (SELECT id FROM coding_system WHERE name = 'CVX'),
    NULLIF(code,''), NULLIF(description,'')
FROM _immunization_raw WHERE NULLIF(code,'') IS NOT NULL
ON CONFLICT (coding_system_id, code) DO NOTHING;

INSERT INTO immunization (administered_at, patient_id, encounter_id, code_id, base_cost)
SELECT
    i.date::timestamptz,
    i.patient::uuid,
    NULLIF(i.encounter,'')::uuid,
    cc.id,
    NULLIF(i.base_cost,'')::numeric
FROM _immunization_raw i
JOIN clinical_code cc ON cc.code = i.code
    AND cc.coding_system_id = (SELECT id FROM coding_system WHERE name = 'CVX');

DROP TABLE _immunization_raw;

-- ---------------------------------------------------------------------------
-- MEDICATIONS
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE _medication_raw (
    start_time TEXT, stop_time TEXT, patient TEXT, payer TEXT, encounter TEXT,
    code TEXT, description TEXT, base_cost TEXT, payer_coverage TEXT,
    dispenses TEXT, totalcost TEXT, reasoncode TEXT, reasondescription TEXT
);
COPY _medication_raw FROM '/docker-entrypoint-initdb.d/medications.csv' WITH (FORMAT csv, HEADER true);

INSERT INTO clinical_code (coding_system_id, code, description)
SELECT DISTINCT (SELECT id FROM coding_system WHERE name = 'RxNorm'),
    NULLIF(code,''), NULLIF(description,'')
FROM _medication_raw WHERE NULLIF(code,'') IS NOT NULL
ON CONFLICT (coding_system_id, code) DO NOTHING;

INSERT INTO clinical_code (coding_system_id, code, description)
SELECT DISTINCT (SELECT id FROM coding_system WHERE name = 'SNOMED-CT'),
    NULLIF(reasoncode,''), NULLIF(reasondescription,'')
FROM _medication_raw WHERE NULLIF(reasoncode,'') IS NOT NULL
ON CONFLICT (coding_system_id, code) DO NOTHING;

INSERT INTO medication (
    start_time, stop_time, patient_id, payer_id, encounter_id,
    code_id, base_cost, payer_coverage, dispenses, total_cost, reason_code_id
)
SELECT
    m.start_time::timestamptz,
    NULLIF(m.stop_time,'')::timestamptz,
    m.patient::uuid,
    NULLIF(m.payer,'')::uuid,
    NULLIF(m.encounter,'')::uuid,
    cc.id,
    NULLIF(m.base_cost,'')::numeric,
    NULLIF(m.payer_coverage,'')::numeric,
    NULLIF(m.dispenses,'')::int,
    NULLIF(m.totalcost,'')::numeric,
    rc.id
FROM _medication_raw m
JOIN  clinical_code cc ON cc.code = m.code
    AND cc.coding_system_id = (SELECT id FROM coding_system WHERE name = 'RxNorm')
LEFT JOIN clinical_code rc ON rc.code = NULLIF(m.reasoncode,'')
    AND rc.coding_system_id = (SELECT id FROM coding_system WHERE name = 'SNOMED-CT');

DROP TABLE _medication_raw;

-- ---------------------------------------------------------------------------
-- OBSERVATIONS
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE _observation_raw (
    obs_date TEXT, patient TEXT, encounter TEXT, category TEXT,
    code TEXT, description TEXT, value TEXT, units TEXT, obs_type TEXT
);
COPY _observation_raw FROM '/docker-entrypoint-initdb.d/observations.csv' WITH (FORMAT csv, HEADER true);

INSERT INTO clinical_code (coding_system_id, code, description)
SELECT DISTINCT (SELECT id FROM coding_system WHERE name = 'LOINC'),
    NULLIF(code,''), NULLIF(description,'')
FROM _observation_raw WHERE NULLIF(code,'') IS NOT NULL
ON CONFLICT (coding_system_id, code) DO NOTHING;

INSERT INTO observation (
    observed_at, patient_id, encounter_id, category,
    code_id, value_numeric, value_text, units, observation_type
)
SELECT
    o.obs_date::timestamptz,
    o.patient::uuid,
    NULLIF(o.encounter,'')::uuid,
    NULLIF(o.category,''),
    cc.id,
    CASE WHEN o.obs_type = 'numeric' THEN NULLIF(o.value,'')::numeric END,
    CASE WHEN o.obs_type != 'numeric' THEN NULLIF(o.value,'') END,
    NULLIF(o.units,''),
    NULLIF(o.obs_type,'')
FROM _observation_raw o
JOIN clinical_code cc ON cc.code = o.code
    AND cc.coding_system_id = (SELECT id FROM coding_system WHERE name = 'LOINC');

DROP TABLE _observation_raw;

-- ---------------------------------------------------------------------------
-- PROCEDURES
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE _procedure_raw (
    start_time TEXT, stop_time TEXT, patient TEXT, encounter TEXT,
    system TEXT, code TEXT, description TEXT, base_cost TEXT,
    reasoncode TEXT, reasondescription TEXT
);
COPY _procedure_raw FROM '/docker-entrypoint-initdb.d/procedures.csv' WITH (FORMAT csv, HEADER true);

INSERT INTO clinical_code (coding_system_id, code, description)
SELECT DISTINCT (SELECT id FROM coding_system WHERE name = 'SNOMED-CT'),
    NULLIF(code,''), NULLIF(description,'')
FROM _procedure_raw WHERE NULLIF(code,'') IS NOT NULL
ON CONFLICT (coding_system_id, code) DO NOTHING;

INSERT INTO clinical_code (coding_system_id, code, description)
SELECT DISTINCT (SELECT id FROM coding_system WHERE name = 'SNOMED-CT'),
    NULLIF(reasoncode,''), NULLIF(reasondescription,'')
FROM _procedure_raw WHERE NULLIF(reasoncode,'') IS NOT NULL
ON CONFLICT (coding_system_id, code) DO NOTHING;

INSERT INTO procedure_record (
    start_time, stop_time, patient_id, encounter_id,
    code_id, base_cost, reason_code_id
)
SELECT
    p.start_time::timestamptz,
    NULLIF(p.stop_time,'')::timestamptz,
    p.patient::uuid,
    NULLIF(p.encounter,'')::uuid,
    cc.id,
    NULLIF(p.base_cost,'')::numeric,
    rc.id
FROM _procedure_raw p
JOIN  clinical_code cc ON cc.code = p.code
    AND cc.coding_system_id = (SELECT id FROM coding_system WHERE name = 'SNOMED-CT')
LEFT JOIN clinical_code rc ON rc.code = NULLIF(p.reasoncode,'')
    AND rc.coding_system_id = (SELECT id FROM coding_system WHERE name = 'SNOMED-CT');

DROP TABLE _procedure_raw;

-- ---------------------------------------------------------------------------
-- SUPPLIES
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE _supply_raw (
    supply_date TEXT, patient TEXT, encounter TEXT,
    code TEXT, description TEXT, quantity TEXT
);
COPY _supply_raw FROM '/docker-entrypoint-initdb.d/supplies.csv' WITH (FORMAT csv, HEADER true);

INSERT INTO clinical_code (coding_system_id, code, description)
SELECT DISTINCT (SELECT id FROM coding_system WHERE name = 'SNOMED-CT'),
    NULLIF(code,''), NULLIF(description,'')
FROM _supply_raw WHERE NULLIF(code,'') IS NOT NULL
ON CONFLICT (coding_system_id, code) DO NOTHING;

INSERT INTO supply (supply_date, patient_id, encounter_id, code_id, quantity)
SELECT
    s.supply_date::date,
    s.patient::uuid,
    NULLIF(s.encounter,'')::uuid,
    cc.id,
    NULLIF(s.quantity,'')::int
FROM _supply_raw s
JOIN clinical_code cc ON cc.code = s.code
    AND cc.coding_system_id = (SELECT id FROM coding_system WHERE name = 'SNOMED-CT');

DROP TABLE _supply_raw;

-- =============================================================================
-- USAGE NOTES
-- =============================================================================
-- 1. Run seed_batch1_flat.sql first.
-- 2. To look up a code description without remembering the join:
--      SELECT cc.description FROM clinical_code cc WHERE cc.code = '4548-4';
-- 3. Standard pattern for joining code descriptions in queries:
--      SELECT o.observed_at, o.value_numeric, cc.description
--      FROM observation o
--      JOIN clinical_code cc ON cc.id = o.code_id
--      WHERE o.patient_id = '<uuid>';
-- 4. procedure_record avoids the reserved word PROCEDURE.
-- =============================================================================
