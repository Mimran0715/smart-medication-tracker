import pandas as pd
import random
import uuid
from datetime import datetime, timedelta

# -----------------------------
# CONFIG
# -----------------------------
INPUT_CSV = "glucose_dataset.csv"
OUTPUT_CSV = "glucose_timeseries.csv"

# -----------------------------
# LOAD DATA
# -----------------------------
PATIENTS_CSV = "patients.csv"

patients_df = pd.read_csv(PATIENTS_CSV)
patients_df.columns = [c.strip().lower() for c in patients_df.columns]

patient_ids = patients_df["id"].dropna().astype(str).tolist()

df = pd.read_csv(INPUT_CSV, header=2)


# normalize column names
df.columns = [c.strip().lower() for c in df.columns]

print(df.columns)
print()

df = df.rename(columns={
    "blood glucose level(bgl)": "glucose",
    "diabetic/nondiabetic (d/n)": "diabetic"
})

print(df.columns)
print()

df["diabetic"] = df["diabetic"].astype(str).str.upper()

# filter: adults + diabetic
df = df[(df["age"] > 18) & (df["diabetic"].isin(["Y", "D"]))]

# -----------------------------
# PHYSIOLOGY-BASED GLUCOSE FUNCTION
# -----------------------------
def generate_glucose(base_glucose, meal_context):
    noise = random.randint(-10, 10)

    if meal_context == "fasting":
        return max(70, base_glucose + noise)

    elif meal_context == "post_meal":
        spike = random.randint(20, 80)
        return base_glucose + spike + noise

    elif meal_context == "random":
        return base_glucose + random.randint(-15, 30)

    elif meal_context == "before_bed":
        return base_glucose + random.randint(-20, 10)

    # fallback
    return base_glucose + noise

def generate_note(meal_context):
    if meal_context == "fasting":
        return random.choice([
            "fasting glucose check",
            "woke up and measured glucose",
            "morning fasting reading"
        ])

    elif meal_context == "post_meal":
        return random.choice([
            "just ate lunch",
            "post breakfast reading",
            "after dinner glucose check",
            "post meal spike recorded"
        ])

    elif meal_context == "random":
        return random.choice([
            "random glucose check",
            "afternoon reading",
            "unscheduled measurement"
        ])

    elif meal_context == "before_bed":
        return random.choice([
            "before bed reading",
            "nighttime glucose check",
            "pre sleep measurement"
        ])

    return "glucose reading"

# -----------------------------
# GENERATE TIME SERIES DATA
# -----------------------------
rows = []

# for _, r in df.iterrows():
    # patient_id = str(uuid.uuid4())
rows = []

for patient_id in patient_ids:

    num_readings = random.randint(6, 18)

    base_time = datetime.utcnow() - timedelta(days=30)

    base_glucose = random.randint(110, 180)

    for i in range(num_readings):
        timestamp = base_time + timedelta(
            days=random.randint(0, 30),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )

        # meal_context = random.choice([
        #     "fasting",
        #     "post_meal",
        #     "random",
        #     "bedtime" # was before_bed changed due to check issue
        # ])
        meal_context = random.choice([
            'fasting', 
            'pre_meal',
              'post_meal',
                'bedtime', 
                'other'
        ])

        reading = max(60, generate_glucose(base_glucose, meal_context))

        rows.append({
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "reading": reading,
            "meal_context": meal_context,
            "notes": generate_note(meal_context),
            "created_at": timestamp,
            "date": timestamp.date(),
            "time_taken": timestamp.time()
        })

# -----------------------------
# SAVE CSV
# -----------------------------
out_df = pd.DataFrame(rows)

out_df.to_csv(OUTPUT_CSV, index=False)

print(f"Generated {len(out_df)} rows")
print(f"Saved to {OUTPUT_CSV}")

# -----------------------------
# CHECK READINGS PER PATIENT
# -----------------------------
patient_counts = out_df["patient_id"].value_counts()

print("\n=== READINGS PER PATIENT ===")
print(patient_counts.describe())

print("\nMin readings per patient:", patient_counts.min())
print("Max readings per patient:", patient_counts.max())
print("Avg readings per patient:", patient_counts.mean())

# optional: show top 10 most active patients
print("\nTop 10 patients by reading count:")
print(patient_counts.head(10))