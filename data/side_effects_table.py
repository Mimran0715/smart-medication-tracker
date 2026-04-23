import pandas as pd
import random
import uuid
from datetime import datetime, timedelta

INPUT_CSV = "glucose_dataset.csv"
OUTPUT_CSV = "side_effects_timeseries.csv"

# -----------------------------
# LOAD PATIENTS
# -----------------------------
df = pd.read_csv(INPUT_CSV, header=2)
df.columns = [c.strip().lower() for c in df.columns]

df = df.rename(columns={
    "diabetic/nondiabetic (d/n)": "diabetic"
})

df["diabetic"] = df["diabetic"].astype(str).str.upper()
df = df[df["age"] > 18]

# patient_ids = [str(uuid.uuid4()) for _ in range(len(df))]
PATIENTS_CSV = "patients.csv"

patients_df = pd.read_csv(PATIENTS_CSV)
patients_df.columns = [c.strip().lower() for c in patients_df.columns]

patient_ids = patients_df["id"].dropna().astype(str).tolist()

# -----------------------------
# SIDE EFFECT CATEGORIES
# -----------------------------
categories = [
    "fatigue",
    "nausea",
    "dizziness",
    "headache",
    "blurred_vision",
    "other"
]

notes_map = {
    "fatigue": [
        "feeling unusually tired",
        "low energy throughout the day",
        "exhausted after minimal activity"
    ],
    "nausea": [
        "mild stomach discomfort",
        "felt slightly nauseous after eating",
        "waves of nausea in the morning"
    ],
    "dizziness": [
        "lightheaded when standing",
        "brief dizziness episode",
        "felt faint after walking"
    ],
    "headache": [
        "mild headache in the afternoon",
        "pressure behind eyes",
        "persistent headache today"
    ],
    "blurred_vision": [
        "slight blurry vision episode",
        "difficulty focusing eyes",
        "temporary vision blurriness"
    ],
    "other": [
        "unusual tingling sensation",
        "mild tremor in hands",
        "general feeling of being off",
        "increased sweating without clear cause",
        "stomach discomfort not clearly nausea",
        "feeling jittery and unsettled"
    ]
}

# severity_levels = ["mild", "moderate", "severe"]

# -----------------------------
# GENERATE DATA
# -----------------------------
rows = []

start_time = datetime.utcnow() - timedelta(days=7)

for pid in patient_ids:
    num_entries = random.randint(0, 5)

    for _ in range(num_entries):
        category = random.choice(categories)

        timestamp = start_time + timedelta(
            days=random.randint(0, 6),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )

        # # severity logic
        # if category == "none":
        #     severity = "none"
        # else:
        #     severity = random.choices(
        #         population=[1, 2, 3, 4, 5],
        #         weights=[0.25, 0.35, 0.25, 0.10, 0.05]
        #     )[0]

        if category == "other":
            severity = random.choices([1,2,3,4], weights=[0.4,0.3,0.2,0.1])[0]
        elif category in ["blurred_vision", "dizziness"]:
            severity = random.choices([2,3,4,5], weights=[0.2,0.4,0.3,0.1])[0]
        else:
            severity = random.choices([1,2,3,4,5], weights=[0.25,0.35,0.25,0.1,0.05])[0]
        note = random.choice(notes_map[category])

        rows.append({
            "patient_id": pid,
            "side_effect_category": category,
            "side_effect_notes": note,
            "created_at": timestamp,
            "side_effect_severity": severity,
            "date": timestamp.date()
        })

# -----------------------------
# SAVE CSV
# -----------------------------
out_df = pd.DataFrame(rows)
out_df.to_csv(OUTPUT_CSV, index=False)

print(f"Generated {len(out_df)} side effect rows")
print(f"Saved to {OUTPUT_CSV}")