-- =============================================================================
-- Synthea Patient Data — PostgreSQL Schema & Seed Script (Batch 1, Flat)
-- Tables: organization, payer, provider, patient,
--         encounter, claim, claim_transaction, payer_transition
--
-- Design philosophy:
--   • Categoricals stored as TEXT or native PG ENUMs — no lookup joins needed
--   • Addresses inlined on each table — no shared address table
--   • payer stats merged into payer
--   • claim diagnosis columns kept as diagnosis1..diagnosis8 on claim
--   • All UUIDs as uuid type; dates as date/timestamptz; money as numeric
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- ENUMs  (type-safe, zero join overhead, visible in psql \d)
-- ---------------------------------------------------------------------------

CREATE TYPE encounter_class_t    AS ENUM ('wellness','ambulatory','outpatient','urgentcare','emergency','inpatient','home','virtual','hospice');
CREATE TYPE claim_status_t       AS ENUM ('CLOSED','OPEN','PENDING');
CREATE TYPE transaction_type_t   AS ENUM ('CHARGE','PAYMENT','TRANSFERIN','TRANSFEROUT');
CREATE TYPE payer_ownership_t    AS ENUM ('GOVERNMENT','PRIVATE','NO_INSURANCE');
CREATE TYPE race_t               AS ENUM ('white','black','asian','native','hawaiian','other');
CREATE TYPE ethnicity_t          AS ENUM ('nonhispanic','hispanic');
CREATE TYPE gender_t             AS ENUM ('M','F');
CREATE TYPE marital_status_t     AS ENUM ('M','S','D','W');
CREATE TYPE plan_ownership_t     AS ENUM ('Self','Spouse','Guardian');

-- ---------------------------------------------------------------------------
-- ORGANIZATIONS
-- ---------------------------------------------------------------------------

CREATE TABLE organization (
    id          UUID PRIMARY KEY,
    name        TEXT NOT NULL,
    address     TEXT,
    city        TEXT,
    state TEXT,
    zip         TEXT,
    lat         DOUBLE PRECISION,
    lon         DOUBLE PRECISION,
    phone       TEXT,
    revenue     NUMERIC(15,2),
    utilization INT
);

-- ---------------------------------------------------------------------------
-- PAYERS  (stats merged in)
-- ---------------------------------------------------------------------------

CREATE TABLE payer (
    id                      UUID PRIMARY KEY,
    name                    TEXT NOT NULL,
    ownership               payer_ownership_t NOT NULL,
    address                 TEXT,
    city                    TEXT,
    state TEXT,
    zip                     TEXT,
    phone                   TEXT,
    -- aggregate stats
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

-- ---------------------------------------------------------------------------
-- PROVIDERS
-- ---------------------------------------------------------------------------

CREATE TABLE provider (
    id              UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organization(id),
    name            TEXT NOT NULL,
    gender          gender_t,
    speciality      TEXT,
    address         TEXT,
    city            TEXT,
    state TEXT,
    zip             TEXT,
    lat             DOUBLE PRECISION,
    lon             DOUBLE PRECISION
);

-- ---------------------------------------------------------------------------
-- PATIENTS
-- ---------------------------------------------------------------------------

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
    state TEXT,
    county              TEXT,
    fips                TEXT,
    zip                 TEXT,
    lat                 DOUBLE PRECISION,
    lon                 DOUBLE PRECISION,
    healthcare_expenses NUMERIC(15,2),
    healthcare_coverage NUMERIC(15,2),
    income              INT
);

-- ---------------------------------------------------------------------------
-- ENCOUNTERS
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- CLAIMS  (diagnoses as flat columns)
-- ---------------------------------------------------------------------------

CREATE TABLE claim (
    id                          UUID PRIMARY KEY,
    patient_id                  UUID NOT NULL REFERENCES patient(id),
    provider_id                 UUID REFERENCES provider(id),
    primary_insurance_id        UUID REFERENCES payer(id),
    secondary_insurance_id      UUID REFERENCES payer(id),
    department_id               INT,
    patient_department_id       INT,
    diagnosis1                  TEXT,
    diagnosis2                  TEXT,
    diagnosis3                  TEXT,
    diagnosis4                  TEXT,
    diagnosis5                  TEXT,
    diagnosis6                  TEXT,
    diagnosis7                  TEXT,
    diagnosis8                  TEXT,
    referring_provider_id       UUID REFERENCES provider(id),
    appointment_id              UUID REFERENCES encounter(id),
    current_illness_date        TIMESTAMPTZ,
    service_date                TIMESTAMPTZ,
    supervising_provider_id     UUID REFERENCES provider(id),
    status1                     claim_status_t,
    status2                     claim_status_t,
    status_p                    claim_status_t,
    outstanding1                NUMERIC(10,2),
    outstanding2                NUMERIC(10,2),
    outstanding_p               NUMERIC(10,2),
    last_billed_date1           TIMESTAMPTZ,
    last_billed_date2           TIMESTAMPTZ,
    last_billed_date_p          TIMESTAMPTZ,
    healthcare_claim_type_id1   INT,
    healthcare_claim_type_id2   INT
);

-- ---------------------------------------------------------------------------
-- CLAIM TRANSACTIONS
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- PAYER TRANSITIONS
-- ---------------------------------------------------------------------------

CREATE TABLE payer_transition (
    id                  SERIAL PRIMARY KEY,
    patient_id          UUID NOT NULL REFERENCES patient(id),
    member_id           TEXT,
    start_date          TIMESTAMPTZ NOT NULL,
    end_date            TIMESTAMPTZ,
    payer_id            UUID NOT NULL REFERENCES payer(id),
    secondary_payer_id  UUID REFERENCES payer(id),
    plan_ownership      plan_ownership_t,
    owner_name          TEXT
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

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

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ORGANIZATIONS
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
-- PAYERS
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
-- PROVIDERS
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
-- PATIENTS
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
-- ENCOUNTERS
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
-- CLAIMS
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
-- CLAIM TRANSACTIONS
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
-- PAYER TRANSITIONS
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
-- USAGE NOTES
-- =============================================================================
-- 1. Run as a superuser or role with COPY privileges.
-- 2. \copy runs client-side — adjust CSV paths to match your working directory,
--    or swap \copy for COPY for server-side loading.
-- 3. ENUMs enforce valid values without join overhead. If new values appear in
--    future data, extend with: ALTER TYPE <enum_name> ADD VALUE 'new_value';
-- 4. Run this file before seed_batch2_flat.sql (clinical tables FK to patient,
--    encounter, and payer defined here).
-- =============================================================================
