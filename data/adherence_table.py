import pandas as pd
import random
import uuid
from datetime import datetime, timedelta

# -----------------------------
# MEDICATIONS (from FHIR bundle)
# -----------------------------
medications = [
    ("med-1", "Metformin 500mg"),
    ("med-2", "Insulin Glargine 10 units"),
    ("med-3", "Glipizide 5mg"),
    ("med-4", "Pioglitazone 15mg"),
    ("med-5", "Acarbose 50mg"),
]

# -----------------------------
# LOAD PATIENTS (reuse existing dataset)
# -----------------------------
df = pd.read_csv("glucose_dataset.csv", header=2)
df.columns = [c.strip().lower() for c in df.columns]

df = df.rename(columns={
    "diabetic/nondiabetic (d/n)": "diabetic"
})

df = df[df["age"] > 18]

# patient_ids = [str(uuid.uuid4()) for _ in range(len(df))]
# patient_ids = [str(uuid.uuid4()) for _ in range(len(df))]
PATIENTS_CSV = "patients.csv"

patients_df = pd.read_csv(PATIENTS_CSV)
patients_df.columns = [c.strip().lower() for c in patients_df.columns]

patient_ids = patients_df["id"].dropna().astype(str).tolist()

# -----------------------------
# ADHERENCE GENERATION
# -----------------------------
rows = []

start_time = datetime.utcnow() - timedelta(days=7)

for pid in patient_ids:

    # each patient takes 1–4 meds
    patient_meds = random.sample(medications, random.randint(1, 4))

    for med_id, med_name in patient_meds:

        # adherence frequency depends on med type
        if "Insulin" in med_name:
            num_doses = random.randint(5, 14)
        elif "Metformin" in med_name:
            num_doses = random.randint(3, 10)
        else:
            num_doses = random.randint(2, 8)

        for _ in range(num_doses):

            timestamp = start_time + timedelta(
                days=random.randint(0, 6),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )

            rows.append({
                "patient_id": pid,
                "medication_id": med_id,
                "medication_name": med_name,
                "created_at": timestamp,
                "date": timestamp.date()
            })

# -----------------------------
# SAVE CSV
# -----------------------------
out_df = pd.DataFrame(rows)

out_df.to_csv("adherence_timeseries.csv", index=False)

print(f"Generated {len(out_df)} adherence rows")