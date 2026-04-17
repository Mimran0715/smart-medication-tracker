from fastapi import FastAPI, HTTPException, Security, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import asyncpg
import os
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

DATABASE_URL = os.environ.get("DATABASE_URL")

# ---------------------------------------------------------------------------
# Firebase Admin SDK setup
# ---------------------------------------------------------------------------

if not firebase_admin._apps:
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": os.environ.get("FIREBASE_PROJECT_ID"),
        "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL"),
        "private_key": os.environ.get("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
        "token_uri": "https://oauth2.googleapis.com/token",
    })
    firebase_admin.initialize_app(cred)

# ---------------------------------------------------------------------------
# Auth dependency — verifies Firebase JWT and returns the firebase_uid
# ---------------------------------------------------------------------------

bearer_scheme = HTTPBearer(auto_error=False)


async def require_firebase_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization token")
    try:
        decoded = firebase_auth.verify_id_token(credentials.credentials)
        return decoded["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    yield
    await app.state.pool.close()


app = FastAPI(title="Smart Medication Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Authorization"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def pool(request):
    return request.app.state.pool


def fhir_bundle(entries: list) -> dict:
    return {
        "resourceType": "Bundle",
        "type": "collection",
        "entry": [{"resource": e} for e in entries],
    }


async def get_patient_id_for_user(conn, firebase_uid: str) -> str:
    """Resolve firebase_uid -> patient_id via user_patient mapping table."""
    patient_id = await conn.fetchval(
        "SELECT patient_id FROM user_patient WHERE firebase_uid = $1",
        firebase_uid,
    )
    if not patient_id:
        raise HTTPException(
            status_code=404,
            detail="No patient record mapped to this account"
        )
    return str(patient_id)


# ---------------------------------------------------------------------------
# GET /api/patients/me
# Returns the calling user's own FHIR Patient bundle.
# Patient ID is resolved from the Firebase token — users cannot access
# other patients' data.
# ---------------------------------------------------------------------------

@app.get("/api/patients/me")
async def get_my_patient(
    request: Request,
    firebase_uid: str = Depends(require_firebase_user),
):
    async with pool(request).acquire() as conn:
        patient_id = await get_patient_id_for_user(conn, firebase_uid)

        patient_row = await conn.fetchrow(
            """
            SELECT id, first_name, last_name, gender, birthdate, deathdate
            FROM patient WHERE id = $1::uuid
            """,
            patient_id,
        )

        condition_rows = await conn.fetch(
            """
            SELECT c.start_date, c.stop_date, cc.description, cc.code
            FROM condition c
            JOIN clinical_code cc ON cc.id = c.code_id
            WHERE c.patient_id = $1::uuid
            ORDER BY c.start_date DESC
            """,
            patient_id,
        )

        med_rows = await conn.fetch(
            """
            SELECT m.id, cc.description, m.start_time, m.stop_time
            FROM medication m
            JOIN clinical_code cc ON cc.id = m.code_id
            WHERE m.patient_id = $1::uuid
            ORDER BY m.start_time DESC
            """,
            patient_id,
        )

        obs_rows = await conn.fetch(
            """
            SELECT DISTINCT ON (o.code_id)
                o.observed_at, o.value_numeric, o.units, cc.description, cc.code
            FROM observation o
            JOIN clinical_code cc ON cc.id = o.code_id
            WHERE o.patient_id = $1::uuid
            ORDER BY o.code_id, o.observed_at DESC
            """,
            patient_id,
        )

    entries = []

    entries.append({
        "resourceType": "Patient",
        "id": str(patient_row["id"]),
        "name": [{"family": patient_row["last_name"], "given": [patient_row["first_name"]]}],
        "gender": "female" if patient_row["gender"] == "F" else "male",
        "birthDate": patient_row["birthdate"].isoformat(),
        **({"deceasedDateTime": patient_row["deathdate"].isoformat()}
           if patient_row["deathdate"] else {}),
    })

    for row in condition_rows:
        entries.append({
            "resourceType": "Condition",
            "clinicalStatus": {
                "coding": [{"code": "active" if not row["stop_date"] else "resolved"}]
            },
            "code": {
                "coding": [{"system": "http://snomed.info/sct", "code": row["code"]}],
                "text": row["description"],
            },
            "subject": {"reference": f"Patient/{patient_id}"},
            "onsetDateTime": row["start_date"].isoformat(),
            **({"abatementDateTime": row["stop_date"].isoformat()}
               if row["stop_date"] else {}),
        })

    for row in med_rows:
        entries.append({
            "resourceType": "MedicationRequest",
            "id": str(row["id"]),
            "status": "active" if not row["stop_time"] else "completed",
            "medicationCodeableConcept": {"text": row["description"]},
            "subject": {"reference": f"Patient/{patient_id}"},
            "authoredOn": row["start_time"].isoformat(),
        })

    for row in obs_rows:
        entries.append({
            "resourceType": "Observation",
            "status": "final",
            "code": {
                "coding": [{"system": "http://loinc.org", "code": row["code"]}],
                "text": row["description"],
            },
            "subject": {"reference": f"Patient/{patient_id}"},
            "effectiveDateTime": row["observed_at"].isoformat(),
            "valueQuantity": {
                "value": float(row["value_numeric"]) if row["value_numeric"] is not None else None,
                "unit": row["units"],
            },
        })

    return fhir_bundle(entries)


# ---------------------------------------------------------------------------
# GET /api/patients/me/medications
# ---------------------------------------------------------------------------

@app.get("/api/patients/me/medications")
async def get_my_medications(
    request: Request,
    firebase_uid: str = Depends(require_firebase_user),
):
    async with pool(request).acquire() as conn:
        patient_id = await get_patient_id_for_user(conn, firebase_uid)

        rows = await conn.fetch(
            """
            SELECT
                m.id,
                cc.code        AS rxnorm_code,
                cc.description AS medication_name,
                m.start_time,
                m.stop_time,
                m.dispenses,
                m.total_cost,
                m.payer_coverage,
                rc.description AS reason
            FROM medication m
            JOIN clinical_code cc ON cc.id = m.code_id
            LEFT JOIN clinical_code rc ON rc.id = m.reason_code_id
            WHERE m.patient_id = $1::uuid
            ORDER BY m.start_time DESC
            """,
            patient_id,
        )

    if not rows:
        raise HTTPException(status_code=404, detail="No medications found")

    entries = []
    for row in rows:
        med_id = str(row["id"])
        status = "active" if not row["stop_time"] else "completed"

        entries.append({
            "resourceType": "Medication",
            "id": f"med-{med_id}",
            "code": {
                "coding": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm",
                             "code": row["rxnorm_code"]}],
                "text": row["medication_name"],
            },
            "status": status,
        })

        entries.append({
            "resourceType": "MedicationStatement",
            "id": f"medstat-{med_id}",
            "status": status,
            "medicationReference": {"reference": f"Medication/med-{med_id}"},
            "subject": {"reference": f"Patient/{patient_id}"},
            "effectivePeriod": {
                "start": row["start_time"].isoformat(),
                **({"end": row["stop_time"].isoformat()} if row["stop_time"] else {}),
            },
            **({"reasonCode": [{"text": row["reason"]}]} if row["reason"] else {}),
        })

    return fhir_bundle(entries)


# ---------------------------------------------------------------------------
# GET /api/analytics/condition-trends
# ---------------------------------------------------------------------------

@app.get("/api/analytics/condition-trends")
async def condition_trends(
    request: Request,
    firebase_uid: str = Depends(require_firebase_user),
):
    async with pool(request).acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                cc.description AS condition,
                cc.code,
                COUNT(DISTINCT c.patient_id) AS patient_count,
                COUNT(*) FILTER (WHERE c.stop_date IS NULL) AS active_count,
                COUNT(*) FILTER (WHERE c.stop_date IS NOT NULL) AS resolved_count,
                MIN(c.start_date) AS first_seen,
                MAX(c.start_date) AS last_seen
            FROM condition c
            JOIN clinical_code cc ON cc.id = c.code_id
            GROUP BY cc.description, cc.code
            ORDER BY patient_count DESC
            """
        )

    return {
        "total_patients": 500,
        "conditions": [
            {
                "condition": row["condition"],
                "snomed_code": row["code"],
                "patient_count": row["patient_count"],
                "active_count": row["active_count"],
                "resolved_count": row["resolved_count"],
                "first_seen": row["first_seen"].isoformat(),
                "last_seen": row["last_seen"].isoformat(),
            }
            for row in rows
        ],
    }


# ---------------------------------------------------------------------------
# GET /api/analytics/medication-trends
# ---------------------------------------------------------------------------

@app.get("/api/analytics/medication-trends")
async def medication_trends(
    request: Request,
    firebase_uid: str = Depends(require_firebase_user),
):
    async with pool(request).acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                cc.description AS medication,
                cc.code AS rxnorm_code,
                COUNT(DISTINCT m.patient_id) AS patient_count,
                COUNT(*) FILTER (WHERE m.stop_time IS NULL) AS active_count,
                COUNT(*) FILTER (WHERE m.stop_time IS NOT NULL) AS completed_count,
                ROUND(AVG(m.total_cost)::numeric, 2) AS avg_total_cost,
                ROUND(AVG(m.payer_coverage)::numeric, 2) AS avg_payer_coverage
            FROM medication m
            JOIN clinical_code cc ON cc.id = m.code_id
            GROUP BY cc.description, cc.code
            ORDER BY patient_count DESC
            """
        )

    return {
        "total_patients": 500,
        "medications": [
            {
                "medication": row["medication"],
                "rxnorm_code": row["rxnorm_code"],
                "patient_count": row["patient_count"],
                "active_count": row["active_count"],
                "completed_count": row["completed_count"],
                "avg_total_cost": float(row["avg_total_cost"]) if row["avg_total_cost"] else None,
                "avg_payer_coverage": float(row["avg_payer_coverage"]) if row["avg_payer_coverage"] else None,
            }
            for row in rows
        ],
    }
