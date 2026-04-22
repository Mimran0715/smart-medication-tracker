-- =============================================================================
-- init.sql — Merged Database Seed
-- Combines: 01_seed_sql.OLD (FHIR legacy), 01_seed_batch1_flat.sql (Synthea
--           administrative), 02_seed_batch2_flat.sql (Synthea clinical),
--           03_user_patient.sql (Firebase auth mapping)
--
-- Conflict resolutions:
--   • OLD `patients`             → dropped; superseded by Batch1 `patient` (UUID PK, full Synthea schema)
--   • OLD `conditions`           → dropped; superseded by Batch2 `condition` (normalized via clinical_code)
--   • OLD `medications`          → dropped; superseded by Batch2 `medication`
--   • OLD `observations`         → dropped; superseded by Batch2 `observation`
--   • OLD `medication_requests`  → kept as medication_requests  (schema updated per PDF)
--   • OLD `medication_statements`→ kept as medication_statements (schema updated per PDF)
--   • OLD `medication_knowledge` → kept as medication_knowledge  (schema updated per PDF)
--   • OLD patient FK on legacy tables patched TEXT→UUID to join Batch1 `patient`
--
-- New tables added (per db_schema_docx.pdf):
--   • side_effects, exercise, weight, adherence
--
-- Execution order:
--   1. Extensions
--   2. ENUMs
--   3. Core / administrative tables  (Batch1)
--   4. Shared terminology tables     (Batch2)
--   5. Clinical tables               (Batch2)
--   6. Legacy medication tables      (OLD schema, updated to match PDF)
--   7. Patient tracking tables       (side_effects, exercise, weight, adherence)
--   8. Auth mapping                  (user_patient)
--   9. Indexes
--  10. Seed data — administrative    (Batch1 CSV loads)
--  11. Seed data — clinical codes    (Batch2 static inserts + CSV loads)
--  12. Seed data — legacy medication (OLD static inserts)
-- =============================================================================

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 2. ENUMs
-- =============================================================================

CREATE TYPE encounter_class_t  AS ENUM ('wellness','ambulatory','outpatient','urgentcare','emergency','inpatient','home','virtual','hospice');
CREATE TYPE claim_status_t     AS ENUM ('CLOSED','OPEN','PENDING');
CREATE TYPE transaction_type_t AS ENUM ('CHARGE','PAYMENT','TRANSFERIN','TRANSFEROUT');
CREATE TYPE payer_ownership_t  AS ENUM ('GOVERNMENT','PRIVATE','NO_INSURANCE');
CREATE TYPE race_t             AS ENUM ('white','black','asian','native','hawaiian','other');
CREATE TYPE ethnicity_t        AS ENUM ('nonhispanic','hispanic');
CREATE TYPE gender_t           AS ENUM ('M','F');
CREATE TYPE marital_status_t   AS ENUM ('M','S','D','W');
CREATE TYPE plan_ownership_t   AS ENUM ('Self','Spouse','Guardian');

-- =============================================================================
-- 3. CORE / ADMINISTRATIVE TABLES  (Batch1)
-- =============================================================================

CREATE TABLE organization (
    id          UUID PRIMARY KEY,
    name        TEXT NOT NULL,
    address     TEXT,
    city        TEXT,
    state       TEXT,
    zip         TEXT,
    lat         DOUBLE PRECISION,
    lon         DOUBLE PRECISION,
    phone       TEXT,
    revenue     NUMERIC(15,2),
    utilization INT
);

CREATE TABLE payer (
    id                      UUID PRIMARY KEY,
    name                    TEXT NOT NULL,
    ownership               payer_ownership_t NOT NULL,
    address                 TEXT,
    city                    TEXT,
    state                   TEXT,
    zip                     TEXT,
    phone                   TEXT,
    amount_covered          NUMERIC(15,2),
    amount_uncovered        NUMERIC(15,2),
    revenue                 NUMERIC(15,2),
    covered_encounters      INT,
    uncovered_encounters    INT,
    covered_medications     INT,
    uncovered_medications   INT,
    covered_procedures      INT,
    uncovered_procedures    INT,
    covered_immunizations   INT,
    uncovered_immunizations INT,
    unique_customers        INT,
    qols_avg                DOUBLE PRECISION,
    member_months           INT
);

CREATE TABLE provider (
    id              UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organization(id),
    name            TEXT NOT NULL,
    gender          gender_t,
    speciality      TEXT,
    address         TEXT,
    city            TEXT,
    state           TEXT,
    zip             TEXT,
    lat             DOUBLE PRECISION,
    lon             DOUBLE PRECISION
);

CREATE TABLE patient (
    id                  UUID PRIMARY KEY,
    birthdate           DATE NOT NULL,
    deathdate           DATE,
    ssn                 TEXT,
    drivers_license     TEXT,
    passport            TEXT,
    prefix              TEXT,
    first_name          TEXT NOT NULL,
    middle_name         TEXT,
    last_name           TEXT NOT NULL,
    suffix              TEXT,
    maiden_name         TEXT,
    marital_status      marital_status_t,
    race                race_t,
    ethnicity           ethnicity_t,
    gender              gender_t NOT NULL,
    birthplace          TEXT,
    address             TEXT,
    city                TEXT,
    state               TEXT,
    county              TEXT,
    fips                TEXT,
    zip                 TEXT,
    lat                 DOUBLE PRECISION,
    lon                 DOUBLE PRECISION,
    healthcare_expenses NUMERIC(15,2),
    healthcare_coverage NUMERIC(15,2),
    income              INT
);

CREATE TABLE encounter (
    id                  UUID PRIMARY KEY,
    start_time          TIMESTAMPTZ NOT NULL,
    stop_time           TIMESTAMPTZ,
    patient_id          UUID NOT NULL REFERENCES patient(id),
    organization_id     UUID REFERENCES organization(id),
    provider_id         UUID REFERENCES provider(id),
    payer_id            UUID REFERENCES payer(id),
    encounter_class     encounter_class_t,
    snomed_code         TEXT,
    description         TEXT,
    base_encounter_cost NUMERIC(10,2),
    total_claim_cost    NUMERIC(10,2),
    payer_coverage      NUMERIC(10,2),
    reason_code         TEXT,
    reason_description  TEXT
);

CREATE TABLE claim (
    id                        UUID PRIMARY KEY,
    patient_id                UUID NOT NULL REFERENCES patient(id),
    provider_id               UUID REFERENCES provider(id),
    primary_insurance_id      UUID REFERENCES payer(id),
    secondary_insurance_id    UUID REFERENCES payer(id),
    department_id             INT,
    patient_department_id     INT,
    diagnosis1                TEXT,
    diagnosis2                TEXT,
    diagnosis3                TEXT,
    diagnosis4                TEXT,
    diagnosis5                TEXT,
    diagnosis6                TEXT,
    diagnosis7                TEXT,
    diagnosis8                TEXT,
    referring_provider_id     UUID REFERENCES provider(id),
    appointment_id            UUID REFERENCES encounter(id),
    current_illness_date      TIMESTAMPTZ,
    service_date              TIMESTAMPTZ,
    supervising_provider_id   UUID REFERENCES provider(id),
    status1                   claim_status_t,
    status2                   claim_status_t,
    status_p                  claim_status_t,
    outstanding1              NUMERIC(10,2),
    outstanding2              NUMERIC(10,2),
    outstanding_p             NUMERIC(10,2),
    last_billed_date1         TIMESTAMPTZ,
    last_billed_date2         TIMESTAMPTZ,
    last_billed_date_p        TIMESTAMPTZ,
    healthcare_claim_type_id1 INT,
    healthcare_claim_type_id2 INT
);

CREATE TABLE claim_transaction (
    id                      UUID PRIMARY KEY,
    claim_id                UUID NOT NULL REFERENCES claim(id),
    charge_id               INT,
    patient_id              UUID NOT NULL REFERENCES patient(id),
    type                    transaction_type_t NOT NULL,
    amount                  NUMERIC(10,2),
    method                  TEXT,
    from_date               TIMESTAMPTZ,
    to_date                 TIMESTAMPTZ,
    place_of_service        TEXT,
    procedure_code          TEXT,
    modifier1               TEXT,
    modifier2               TEXT,
    diagnosis_ref1          SMALLINT,
    diagnosis_ref2          SMALLINT,
    diagnosis_ref3          SMALLINT,
    diagnosis_ref4          SMALLINT,
    units                   INT,
    department_id           INT,
    notes                   TEXT,
    unit_amount             NUMERIC(10,2),
    transfer_out_id         TEXT,
    transfer_type           TEXT,
    payments                NUMERIC(10,2),
    adjustments             NUMERIC(10,2),
    transfers               NUMERIC(10,2),
    outstanding             NUMERIC(10,2),
    appointment_id          UUID REFERENCES encounter(id),
    line_note               TEXT,
    patient_insurance_id    UUID,
    fee_schedule_id         INT,
    provider_id             UUID REFERENCES provider(id),
    supervising_provider_id UUID REFERENCES provider(id)
);

CREATE TABLE payer_transition (
    id                 SERIAL PRIMARY KEY,
    patient_id         UUID NOT NULL REFERENCES patient(id),
    member_id          TEXT,
    start_date         TIMESTAMPTZ NOT NULL,
    end_date           TIMESTAMPTZ,
    payer_id           UUID NOT NULL REFERENCES payer(id),
    secondary_payer_id UUID REFERENCES payer(id),
    plan_ownership     plan_ownership_t,
    owner_name         TEXT
);

-- =============================================================================
-- 4. SHARED TERMINOLOGY TABLES  (Batch2)
-- =============================================================================

CREATE TABLE coding_system (
    id   SMALLSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    uri  TEXT
);

CREATE TABLE clinical_code (
    id               SERIAL PRIMARY KEY,
    coding_system_id SMALLINT NOT NULL REFERENCES coding_system(id),
    code             TEXT NOT NULL,
    description      TEXT,
    UNIQUE (coding_system_id, code)
);

-- =============================================================================
-- 5. CLINICAL TABLES  (Batch2)
-- =============================================================================

CREATE TABLE careplan (
    id             UUID PRIMARY KEY,
    start_date     DATE NOT NULL,
    stop_date      DATE,
    patient_id     UUID NOT NULL REFERENCES patient(id),
    encounter_id   UUID REFERENCES encounter(id),
    code_id        INT  NOT NULL REFERENCES clinical_code(id),
    reason_code_id INT  REFERENCES clinical_code(id)
);

CREATE TABLE condition (
    patient_id   UUID NOT NULL REFERENCES patient(id),
    encounter_id UUID NOT NULL REFERENCES encounter(id),
    code_id      INT  NOT NULL REFERENCES clinical_code(id),
    start_date   DATE NOT NULL,
    stop_date    DATE,
    PRIMARY KEY (patient_id, encounter_id, code_id)
);

CREATE TABLE device (
    id           SERIAL PRIMARY KEY,
    start_time   TIMESTAMPTZ NOT NULL,
    stop_time    TIMESTAMPTZ,
    patient_id   UUID NOT NULL REFERENCES patient(id),
    encounter_id UUID REFERENCES encounter(id),
    code_id      INT  NOT NULL REFERENCES clinical_code(id),
    udi          TEXT
);

CREATE TABLE immunization (
    id              SERIAL PRIMARY KEY,
    administered_at TIMESTAMPTZ NOT NULL,
    patient_id      UUID NOT NULL REFERENCES patient(id),
    encounter_id    UUID REFERENCES encounter(id),
    code_id         INT  NOT NULL REFERENCES clinical_code(id),
    base_cost       NUMERIC(10,2)
);

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

-- value split into numeric/text columns to support non-numeric obs types
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

CREATE TABLE supply (
    id           SERIAL PRIMARY KEY,
    supply_date  DATE NOT NULL,
    patient_id   UUID NOT NULL REFERENCES patient(id),
    encounter_id UUID REFERENCES encounter(id),
    code_id      INT  NOT NULL REFERENCES clinical_code(id),
    quantity     INT
);

-- =============================================================================
-- 6. LEGACY MEDICATION TABLES  (OLD schema — updated to match PDF)
--    patient_id is UUID FK into the authoritative `patient` table.
--    Seed data (static inserts) for the single legacy patient is in section 12.
-- =============================================================================

CREATE TABLE medication_knowledge (
    id                       TEXT PRIMARY KEY,
    description              TEXT NOT NULL,
    status                   TEXT,
    dose_form                TEXT NOT NULL,
    administration_guideline TEXT
);

-- medication column is a free-text name; for coded lookups use the
-- Synthea `medication` table joined via clinical_code.
CREATE TABLE medication_requests (
    id         SERIAL PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patient(id),
    medication TEXT NOT NULL,
    status     TEXT NOT NULL
);

CREATE TABLE medication_statements (
    id            SERIAL PRIMARY KEY,
    patient_id    UUID NOT NULL REFERENCES patient(id),
    medication_id TEXT REFERENCES medication_knowledge(id),
    status        TEXT NOT NULL,
    dosage_text   TEXT NOT NULL,
    route         TEXT NOT NULL,
    dose_value    NUMERIC NOT NULL,
    dose_unit     TEXT NOT NULL
);

-- =============================================================================
-- 7. PATIENT TRACKING TABLES  (new — per db_schema_docx.pdf)
-- =============================================================================

CREATE TABLE side_effects (
    patient_id           UUID NOT NULL REFERENCES patient(id),
    -- Drives the UI dropdown; only these exact values are permitted.
    -- To add a new option: ALTER TABLE side_effects DROP CONSTRAINT side_effects_side_effect_category_check,
    --                       then re-add with the updated value list.
    side_effect_category TEXT NOT NULL CHECK (side_effect_category IN ('fatigue','dizziness','nausea','headache','other')),
    -- Required when side_effect_category = 'other'; ignored otherwise.
    side_effect_notes    TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    side_effect_severity INT  NOT NULL,
    date                 DATE NOT NULL,
    CONSTRAINT chk_other_notes CHECK (
        side_effect_category <> 'other' OR (side_effect_notes IS NOT NULL AND TRIM(side_effect_notes) <> '')
    )
);

CREATE TABLE exercise (
    patient_id UUID    NOT NULL REFERENCES patient(id),
    exercised  BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date       DATE    NOT NULL
);

CREATE TABLE weight (
    patient_id UUID NOT NULL REFERENCES patient(id),
    weight     INT  NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date       DATE NOT NULL
);

CREATE TABLE adherence (
    patient_id      UUID NOT NULL REFERENCES patient(id),
    medication_id   INT  NOT NULL,
    medication_name TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    date            DATE NOT NULL
);

-- =============================================================================
-- 8. AUTH MAPPING TABLE
-- =============================================================================

CREATE TABLE user_patient (
    firebase_uid TEXT PRIMARY KEY,
    patient_id   UUID NOT NULL REFERENCES patient(id),
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 8. INDEXES
-- =============================================================================

-- Batch1 — administrative
CREATE INDEX idx_encounter_patient     ON encounter(patient_id);
CREATE INDEX idx_encounter_provider    ON encounter(provider_id);
CREATE INDEX idx_encounter_payer       ON encounter(payer_id);
CREATE INDEX idx_encounter_start       ON encounter(start_time);
CREATE INDEX idx_encounter_class       ON encounter(encounter_class);

CREATE INDEX idx_claim_patient         ON claim(patient_id);
CREATE INDEX idx_claim_provider        ON claim(provider_id);
CREATE INDEX idx_claim_appointment     ON claim(appointment_id);
CREATE INDEX idx_claim_insurance1      ON claim(primary_insurance_id);
CREATE INDEX idx_claim_service_date    ON claim(service_date);

CREATE INDEX idx_claimtxn_claim        ON claim_transaction(claim_id);
CREATE INDEX idx_claimtxn_patient      ON claim_transaction(patient_id);
CREATE INDEX idx_claimtxn_type         ON claim_transaction(type);
CREATE INDEX idx_claimtxn_from_date    ON claim_transaction(from_date);

CREATE INDEX idx_paytrans_patient      ON payer_transition(patient_id);
CREATE INDEX idx_paytrans_payer        ON payer_transition(payer_id);
CREATE INDEX idx_paytrans_dates        ON payer_transition(start_date, end_date);

CREATE INDEX idx_patient_gender        ON patient(gender);
CREATE INDEX idx_patient_race          ON patient(race);
CREATE INDEX idx_patient_dob           ON patient(birthdate);

CREATE INDEX idx_provider_org          ON provider(organization_id);

-- Batch2 — terminology
CREATE INDEX idx_clinical_code_system  ON clinical_code(coding_system_id);
CREATE INDEX idx_clinical_code_code    ON clinical_code(code);

-- Batch2 — clinical
CREATE INDEX idx_careplan_patient      ON careplan(patient_id);
CREATE INDEX idx_careplan_encounter    ON careplan(encounter_id);
CREATE INDEX idx_careplan_code         ON careplan(code_id);

CREATE INDEX idx_condition_patient     ON condition(patient_id);
CREATE INDEX idx_condition_encounter   ON condition(encounter_id);
CREATE INDEX idx_condition_code        ON condition(code_id);
CREATE INDEX idx_condition_start       ON condition(start_date);

CREATE INDEX idx_device_patient        ON device(patient_id);
CREATE INDEX idx_device_encounter      ON device(encounter_id);
CREATE INDEX idx_device_code           ON device(code_id);

CREATE INDEX idx_immunization_patient  ON immunization(patient_id);
CREATE INDEX idx_immunization_encounter ON immunization(encounter_id);
CREATE INDEX idx_immunization_code     ON immunization(code_id);
CREATE INDEX idx_immunization_date     ON immunization(administered_at);

CREATE INDEX idx_medication_patient    ON medication(patient_id);
CREATE INDEX idx_medication_encounter  ON medication(encounter_id);
CREATE INDEX idx_medication_payer      ON medication(payer_id);
CREATE INDEX idx_medication_code       ON medication(code_id);
CREATE INDEX idx_medication_start      ON medication(start_time);

CREATE INDEX idx_observation_patient   ON observation(patient_id);
CREATE INDEX idx_observation_encounter ON observation(encounter_id);
CREATE INDEX idx_observation_code      ON observation(code_id);
CREATE INDEX idx_observation_date      ON observation(observed_at);
CREATE INDEX idx_observation_category  ON observation(category);

CREATE INDEX idx_procedure_patient     ON procedure_record(patient_id);
CREATE INDEX idx_procedure_encounter   ON procedure_record(encounter_id);
CREATE INDEX idx_procedure_code        ON procedure_record(code_id);
CREATE INDEX idx_procedure_start       ON procedure_record(start_time);

CREATE INDEX idx_supply_patient        ON supply(patient_id);
CREATE INDEX idx_supply_encounter      ON supply(encounter_id);
CREATE INDEX idx_supply_code           ON supply(code_id);

-- auth mapping
CREATE INDEX idx_user_patient_patient  ON user_patient(patient_id);

-- FHIR legacy
CREATE INDEX idx_fhir_medreq_patient   ON medication_requests(patient_id);
CREATE INDEX idx_fhir_medstat_patient  ON medication_statements(patient_id);
CREATE INDEX idx_fhir_medstat_med      ON medication_statements(medication_id);

-- =============================================================================
-- 9. SEED DATA — ADMINISTRATIVE  (Batch1 CSV loads)
-- All CSVs must be present in /docker-entrypoint-initdb.d/ at container start.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _org_raw (
    id TEXT, name TEXT, address TEXT, city TEXT, state TEXT,
    zip TEXT, lat TEXT, lon TEXT, phone TEXT, revenue TEXT, utilization TEXT
);
COPY _org_raw FROM '/docker-entrypoint-initdb.d/organizations.csv' WITH (FORMAT csv, HEADER true);

INSERT INTO organization (id, name, address, city, state, zip, lat, lon, phone, revenue, utilization)
SELECT
    id::uuid, name,
    NULLIF(address,''), NULLIF(city,''), NULLIF(state,''), NULLIF(zip,''),
    NULLIF(lat,'')::double precision,
    NULLIF(lon,'')::double precision,
    NULLIF(phone,''),
    NULLIF(revenue,'')::numeric,
    NULLIF(utilization,'')::int
FROM _org_raw;
DROP TABLE _org_raw;

-- ---------------------------------------------------------------------------
-- Payers
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _payer_raw (
    id TEXT, name TEXT, ownership TEXT, address TEXT, city TEXT,
    state TEXT, zip TEXT, phone TEXT,
    amount_covered TEXT, amount_uncovered TEXT, revenue TEXT,
    covered_encounters TEXT, uncovered_encounters TEXT,
    covered_medications TEXT, uncovered_medications TEXT,
    covered_procedures TEXT, uncovered_procedures TEXT,
    covered_immunizations TEXT, uncovered_immunizations TEXT,
    unique_customers TEXT, qols_avg TEXT, member_months TEXT
);
COPY _payer_raw FROM '/docker-entrypoint-initdb.d/payers.csv' WITH (FORMAT csv, HEADER true);

INSERT INTO payer (
    id, name, ownership, address, city, state, zip, phone,
    amount_covered, amount_uncovered, revenue,
    covered_encounters, uncovered_encounters,
    covered_medications, uncovered_medications,
    covered_procedures, uncovered_procedures,
    covered_immunizations, uncovered_immunizations,
    unique_customers, qols_avg, member_months
)
SELECT
    id::uuid, name,
    ownership::payer_ownership_t,
    NULLIF(address,''), NULLIF(city,''), NULLIF(state,''), NULLIF(zip,''),
    NULLIF(phone,''),
    NULLIF(amount_covered,'')::numeric,
    NULLIF(amount_uncovered,'')::numeric,
    NULLIF(revenue,'')::numeric,
    NULLIF(covered_encounters,'')::int,
    NULLIF(uncovered_encounters,'')::int,
    NULLIF(covered_medications,'')::int,
    NULLIF(uncovered_medications,'')::int,
    NULLIF(covered_procedures,'')::int,
    NULLIF(uncovered_procedures,'')::int,
    NULLIF(covered_immunizations,'')::int,
    NULLIF(uncovered_immunizations,'')::int,
    NULLIF(unique_customers,'')::int,
    NULLIF(qols_avg,'')::double precision,
    NULLIF(member_months,'')::int
FROM _payer_raw;
DROP TABLE _payer_raw;

-- ---------------------------------------------------------------------------
-- Providers
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _provider_raw (
    id TEXT, organization TEXT, name TEXT, gender TEXT,
    speciality TEXT, address TEXT, city TEXT, state TEXT,
    zip TEXT, lat TEXT, lon TEXT, encounters TEXT, procedures TEXT
);
COPY _provider_raw FROM '/docker-entrypoint-initdb.d/providers.csv' WITH (FORMAT csv, HEADER true);

INSERT INTO provider (id, organization_id, name, gender, speciality, address, city, state, zip, lat, lon)
SELECT
    id::uuid,
    organization::uuid,
    name,
    NULLIF(gender,'')::gender_t,
    NULLIF(speciality,''),
    NULLIF(address,''), NULLIF(city,''), NULLIF(state,''), NULLIF(zip,''),
    NULLIF(lat,'')::double precision,
    NULLIF(lon,'')::double precision
FROM _provider_raw;
DROP TABLE _provider_raw;

-- ---------------------------------------------------------------------------
-- Patients
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _patient_raw (
    id TEXT, birthdate TEXT, deathdate TEXT, ssn TEXT, drivers TEXT,
    passport TEXT, prefix TEXT, first TEXT, middle TEXT, last TEXT,
    suffix TEXT, maiden TEXT, marital TEXT, race TEXT, ethnicity TEXT,
    gender TEXT, birthplace TEXT, address TEXT, city TEXT, state TEXT,
    county TEXT, fips TEXT, zip TEXT, lat TEXT, lon TEXT,
    healthcare_expenses TEXT, healthcare_coverage TEXT, income TEXT
);
COPY _patient_raw FROM '/docker-entrypoint-initdb.d/patients.csv' WITH (FORMAT csv, HEADER true);

INSERT INTO patient (
    id, birthdate, deathdate, ssn, drivers_license, passport,
    prefix, first_name, middle_name, last_name, suffix, maiden_name,
    marital_status, race, ethnicity, gender, birthplace,
    address, city, state, county, fips, zip, lat, lon,
    healthcare_expenses, healthcare_coverage, income
)
SELECT
    id::uuid,
    birthdate::date,
    NULLIF(deathdate,'')::date,
    NULLIF(ssn,''), NULLIF(drivers,''), NULLIF(passport,''),
    NULLIF(prefix,''), first, NULLIF(middle,''), last,
    NULLIF(suffix,''), NULLIF(maiden,''),
    NULLIF(marital,'')::marital_status_t,
    race::race_t,
    ethnicity::ethnicity_t,
    gender::gender_t,
    NULLIF(birthplace,''),
    NULLIF(address,''), NULLIF(city,''), NULLIF(state,''),
    NULLIF(county,''), NULLIF(fips,''), NULLIF(zip,''),
    NULLIF(lat,'')::double precision,
    NULLIF(lon,'')::double precision,
    NULLIF(healthcare_expenses,'')::numeric,
    NULLIF(healthcare_coverage,'')::numeric,
    NULLIF(income,'')::int
FROM _patient_raw;
DROP TABLE _patient_raw;

-- ---------------------------------------------------------------------------
-- Encounters
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _encounter_raw (
    id TEXT, start_time TEXT, stop_time TEXT, patient TEXT,
    organization TEXT, provider TEXT, payer TEXT,
    encounterclass TEXT, code TEXT, description TEXT,
    base_encounter_cost TEXT, total_claim_cost TEXT, payer_coverage TEXT,
    reasoncode TEXT, reasondescription TEXT
);
COPY _encounter_raw FROM '/docker-entrypoint-initdb.d/encounters.csv' WITH (FORMAT csv, HEADER true);

INSERT INTO encounter (
    id, start_time, stop_time, patient_id, organization_id, provider_id,
    payer_id, encounter_class, snomed_code, description,
    base_encounter_cost, total_claim_cost, payer_coverage,
    reason_code, reason_description
)
SELECT
    id::uuid,
    start_time::timestamptz,
    NULLIF(stop_time,'')::timestamptz,
    patient::uuid,
    NULLIF(organization,'')::uuid,
    NULLIF(provider,'')::uuid,
    NULLIF(payer,'')::uuid,
    LOWER(encounterclass)::encounter_class_t,
    NULLIF(code,''),
    NULLIF(description,''),
    NULLIF(base_encounter_cost,'')::numeric,
    NULLIF(total_claim_cost,'')::numeric,
    NULLIF(payer_coverage,'')::numeric,
    NULLIF(reasoncode,''),
    NULLIF(reasondescription,'')
FROM _encounter_raw;
DROP TABLE _encounter_raw;

-- ---------------------------------------------------------------------------
-- Claims
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _claim_raw (
    id TEXT, patientid TEXT, providerid TEXT,
    primarypatientinsuranceid TEXT, secondarypatientinsuranceid TEXT,
    departmentid TEXT, patientdepartmentid TEXT,
    diagnosis1 TEXT, diagnosis2 TEXT, diagnosis3 TEXT, diagnosis4 TEXT,
    diagnosis5 TEXT, diagnosis6 TEXT, diagnosis7 TEXT, diagnosis8 TEXT,
    referringproviderid TEXT, appointmentid TEXT,
    currentillnessdate TEXT, servicedate TEXT, supervisingproviderid TEXT,
    status1 TEXT, status2 TEXT, statusp TEXT,
    outstanding1 TEXT, outstanding2 TEXT, outstandingp TEXT,
    lastbilleddate1 TEXT, lastbilleddate2 TEXT, lastbilleddatep TEXT,
    healthcareclaimtypeid1 TEXT, healthcareclaimtypeid2 TEXT
);
COPY _claim_raw FROM '/docker-entrypoint-initdb.d/claims.csv' WITH (FORMAT csv, HEADER true);

INSERT INTO claim (
    id, patient_id, provider_id, primary_insurance_id, secondary_insurance_id,
    department_id, patient_department_id,
    diagnosis1, diagnosis2, diagnosis3, diagnosis4,
    diagnosis5, diagnosis6, diagnosis7, diagnosis8,
    referring_provider_id, appointment_id,
    current_illness_date, service_date, supervising_provider_id,
    status1, status2, status_p,
    outstanding1, outstanding2, outstanding_p,
    last_billed_date1, last_billed_date2, last_billed_date_p,
    healthcare_claim_type_id1, healthcare_claim_type_id2
)
SELECT
    id::uuid,
    patientid::uuid,
    NULLIF(providerid,'')::uuid,
    NULLIF(primarypatientinsuranceid,'')::uuid,
    NULLIF(secondarypatientinsuranceid,'')::uuid,
    NULLIF(departmentid,'')::int,
    NULLIF(patientdepartmentid,'')::int,
    NULLIF(diagnosis1,''), NULLIF(diagnosis2,''), NULLIF(diagnosis3,''), NULLIF(diagnosis4,''),
    NULLIF(diagnosis5,''), NULLIF(diagnosis6,''), NULLIF(diagnosis7,''), NULLIF(diagnosis8,''),
    NULLIF(referringproviderid,'')::uuid,
    NULLIF(appointmentid,'')::uuid,
    NULLIF(currentillnessdate,'')::timestamptz,
    NULLIF(servicedate,'')::timestamptz,
    NULLIF(supervisingproviderid,'')::uuid,
    NULLIF(status1,'')::claim_status_t,
    NULLIF(status2,'')::claim_status_t,
    NULLIF(statusp,'')::claim_status_t,
    NULLIF(outstanding1,'')::numeric,
    NULLIF(outstanding2,'')::numeric,
    NULLIF(outstandingp,'')::numeric,
    NULLIF(lastbilleddate1,'')::timestamptz,
    NULLIF(lastbilleddate2,'')::timestamptz,
    NULLIF(lastbilleddatep,'')::timestamptz,
    NULLIF(healthcareclaimtypeid1,'')::int,
    NULLIF(healthcareclaimtypeid2,'')::int
FROM _claim_raw;
DROP TABLE _claim_raw;

-- ---------------------------------------------------------------------------
-- Claim Transactions
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _txn_raw (
    id TEXT, claimid TEXT, chargeid TEXT, patientid TEXT,
    type TEXT, amount TEXT, method TEXT,
    fromdate TEXT, todate TEXT, placeofservice TEXT,
    procedurecode TEXT, modifier1 TEXT, modifier2 TEXT,
    diagnosisref1 TEXT, diagnosisref2 TEXT, diagnosisref3 TEXT, diagnosisref4 TEXT,
    units TEXT, departmentid TEXT, notes TEXT, unitamount TEXT,
    transferoutid TEXT, transfertype TEXT,
    payments TEXT, adjustments TEXT, transfers TEXT, outstanding TEXT,
    appointmentid TEXT, linenote TEXT, patientinsuranceid TEXT,
    feescheduleid TEXT, providerid TEXT, supervisingproviderid TEXT
);
COPY _txn_raw FROM '/docker-entrypoint-initdb.d/claims_transactions.csv' WITH (FORMAT csv, HEADER true);

INSERT INTO claim_transaction (
    id, claim_id, charge_id, patient_id, type, amount, method,
    from_date, to_date, place_of_service, procedure_code,
    modifier1, modifier2,
    diagnosis_ref1, diagnosis_ref2, diagnosis_ref3, diagnosis_ref4,
    units, department_id, notes, unit_amount,
    transfer_out_id, transfer_type,
    payments, adjustments, transfers, outstanding,
    appointment_id, line_note, patient_insurance_id,
    fee_schedule_id, provider_id, supervising_provider_id
)
SELECT
    id::uuid,
    claimid::uuid,
    NULLIF(chargeid,'')::int,
    patientid::uuid,
    type::transaction_type_t,
    NULLIF(amount,'')::numeric,
    NULLIF(method,''),
    NULLIF(fromdate,'')::timestamptz,
    NULLIF(todate,'')::timestamptz,
    NULLIF(placeofservice,''),
    NULLIF(procedurecode,''),
    NULLIF(modifier1,''), NULLIF(modifier2,''),
    NULLIF(diagnosisref1,'')::smallint,
    NULLIF(diagnosisref2,'')::smallint,
    NULLIF(diagnosisref3,'')::smallint,
    NULLIF(diagnosisref4,'')::smallint,
    NULLIF(units,'')::int,
    NULLIF(departmentid,'')::int,
    NULLIF(notes,''),
    NULLIF(unitamount,'')::numeric,
    NULLIF(transferoutid,''),
    NULLIF(transfertype,''),
    NULLIF(payments,'')::numeric,
    NULLIF(adjustments,'')::numeric,
    NULLIF(transfers,'')::numeric,
    NULLIF(outstanding,'')::numeric,
    NULLIF(appointmentid,'')::uuid,
    NULLIF(linenote,''),
    NULLIF(patientinsuranceid,'')::uuid,
    NULLIF(feescheduleid,'')::int,
    NULLIF(providerid,'')::uuid,
    NULLIF(supervisingproviderid,'')::uuid
FROM _txn_raw;
DROP TABLE _txn_raw;

-- ---------------------------------------------------------------------------
-- Payer Transitions
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _pt_raw (
    patient TEXT, memberid TEXT, start_date TEXT, end_date TEXT,
    payer TEXT, secondary_payer TEXT, plan_ownership TEXT, owner_name TEXT
);
COPY _pt_raw FROM '/docker-entrypoint-initdb.d/payer_transitions.csv' WITH (FORMAT csv, HEADER true);

INSERT INTO payer_transition (
    patient_id, member_id, start_date, end_date,
    payer_id, secondary_payer_id, plan_ownership, owner_name
)
SELECT
    patient::uuid,
    NULLIF(memberid,''),
    start_date::timestamptz,
    NULLIF(end_date,'')::timestamptz,
    payer::uuid,
    NULLIF(secondary_payer,'')::uuid,
    NULLIF(plan_ownership,'')::plan_ownership_t,
    NULLIF(owner_name,'')
FROM _pt_raw;
DROP TABLE _pt_raw;

-- =============================================================================
-- 10. SEED DATA — CLINICAL CODES & CLINICAL TABLES  (Batch2)
-- =============================================================================

INSERT INTO coding_system (name, uri) VALUES
    ('SNOMED-CT', 'http://snomed.info/sct'),
    ('LOINC',     'http://loinc.org'),
    ('CVX',       'http://hl7.org/fhir/sid/cvx'),
    ('RxNorm',    'http://www.nlm.nih.gov/research/umls/rxnorm');

-- Static SNOMED codes
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

-- Static LOINC codes
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

-- Static CVX codes
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

-- Static RxNorm codes
INSERT INTO clinical_code (coding_system_id, code, description)
SELECT (SELECT id FROM coding_system WHERE name = 'RxNorm'), code, description
FROM (VALUES
    ('860975', '24 HR Metformin hydrochloride 500 MG Extended Release Oral Tablet'),
    ('978015', 'Levothyroxine Sodium 25 MCG Oral Tablet'),
    ('104490', 'Simvastatin 20 MG Oral Tablet')
) AS t(code, description)
ON CONFLICT (coding_system_id, code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Careplans
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
-- Conditions
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
-- Devices
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
-- Immunizations
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
-- Medications
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
-- Observations
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
-- Procedures
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
-- Supplies
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
-- 11. SEED DATA — FHIR LEGACY TABLES
--     Static inserts from 01_seed_sql.OLD.
--     patient_id 'patient-1' must match a UUID in the `patient` table loaded
--     above. Replace the UUID below with the actual Synthea patient UUID that
--     corresponds to Jane Smith, or remove these rows if she is loaded via CSV.
--
--     Example: UPDATE the placeholder UUID after confirming the real one with:
--       SELECT id FROM patient WHERE first_name = 'Jane' AND last_name = 'Smith';
-- =============================================================================

-- NOTE: substitute the real UUID for the Jane Smith patient record.
-- If patients are loaded from CSV only (no static FHIR patient), comment out
-- this entire section and the fhir_* tables will remain empty until populated
-- by your application layer.

DO $$
DECLARE
    v_patient_id UUID;
BEGIN
    -- Resolve Jane Smith to her Synthea UUID; skip FHIR seed if not found.
    SELECT id INTO v_patient_id
    FROM patient
    WHERE first_name = 'Jane' AND last_name = 'Smith'
    LIMIT 1;

    IF v_patient_id IS NULL THEN
        RAISE NOTICE 'FHIR legacy seed skipped: no patient matching Jane Smith found in patient table.';
        RETURN;
    END IF;

    -- medication_knowledge
    INSERT INTO medication_knowledge (id, description, status, dose_form, administration_guideline) VALUES
        ('medknow-1', 'Metformin 500mg',       'active', 'Tablet',    'Take with meals to reduce GI upset'),
        ('medknow-2', 'Insulin Glargine',      'active', 'Injection', 'Inject once daily at bedtime'),
        ('medknow-3', 'Glipizide 5mg',         'active', 'Tablet',    'Take before breakfast'),
        ('medknow-4', 'Pioglitazone 15mg',     'active', 'Tablet',    'Take once daily'),
        ('medknow-5', 'Acarbose 50mg',         'active', 'Tablet',    'Take with first bite of each main meal');

    -- medication_requests
    INSERT INTO medication_requests (patient_id, medication, status) VALUES
        (v_patient_id, 'Metformin 500mg',           'active'),
        (v_patient_id, 'Insulin Glargine 10 units', 'active'),
        (v_patient_id, 'Glipizide 5mg',             'active'),
        (v_patient_id, 'Pioglitazone 15mg',         'active'),
        (v_patient_id, 'Acarbose 50mg',             'active');

    -- medication_statements
    INSERT INTO medication_statements (id, patient_id, medication_id, status, dosage_text, route, dose_value, dose_unit) VALUES
        ('medstat-1', v_patient_id, 'medknow-1', 'active', 'Take 1 tablet twice daily',                       'Oral',          500, 'mg'),
        ('medstat-2', v_patient_id, 'medknow-2', 'active', 'Inject 10 units subcutaneously once daily',       'Subcutaneous',   10, 'units'),
        ('medstat-3', v_patient_id, 'medknow-3', 'active', 'Take 1 tablet once daily before breakfast',       'Oral',            5, 'mg'),
        ('medstat-4', v_patient_id, 'medknow-4', 'active', 'Take 1 tablet once daily',                        'Oral',           15, 'mg'),
        ('medstat-5', v_patient_id, 'medknow-5', 'active', 'Take 1 tablet with first bite of each main meal', 'Oral',           50, 'mg');

END $$;

-- =============================================================================
-- END OF init.sql
-- =============================================================================
