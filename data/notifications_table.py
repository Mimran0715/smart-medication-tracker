import pandas as pd
import random
import uuid
from datetime import datetime, timedelta

# -----------------------------
# CONFIG
# -----------------------------
PATIENTS_CSV = "patients.csv"
OUTPUT_CSV = "notifications_timeseries.csv"

# -----------------------------
# LOAD PATIENTS
# -----------------------------
patients_df = pd.read_csv(PATIENTS_CSV)
patients_df.columns = [c.strip().lower() for c in patients_df.columns]

patient_ids = patients_df["id"].dropna().astype(str).tolist()

# -----------------------------
# NOTIFICATION TEMPLATES
# -----------------------------
def generate_notification():
    templates = [
        ("Glucose Logged", "Your glucose reading has been recorded."),
        ("Medication Reminder", "Time to take your medication."),
        ("Adherence Logged", "Medication intake has been recorded."),
        ("Glucose Alert", "Your glucose reading was outside expected range."),
        ("Check-in Reminder", "Don't forget to log today's glucose."),
        ("Weekly Summary", "Your weekly health summary is ready."),
        ("System Update", "Your health dashboard has been updated."),
        ("Care Reminder", "Stay on track with your medication schedule."),
    ]
    return random.choice(templates)

def generate_read_status():
    # bias toward unread for realism
    return random.choices([False, True], weights=[0.7, 0.3])[0]

# -----------------------------
# GENERATE DATA
# -----------------------------
rows = []

base_time = datetime.utcnow() - timedelta(days=30)

for patient_id in patient_ids:

    num_notifications = random.randint(8, 20)

    for _ in range(num_notifications):

        timestamp = base_time + timedelta(
            days=random.randint(0, 30),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )

        title, body = generate_notification()

        rows.append({
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "title": title,
            "body": body,
            "is_read": generate_read_status(),
            "created_at": timestamp
        })

# -----------------------------
# SAVE CSV
# -----------------------------
out_df = pd.DataFrame(rows)

out_df.to_csv(OUTPUT_CSV, index=False)

print(f"Generated {len(out_df)} notifications")
print(f"Saved to {OUTPUT_CSV}")

# -----------------------------
# STATS
# -----------------------------
patient_counts = out_df["patient_id"].value_counts()

print("\n=== NOTIFICATIONS PER PATIENT ===")
print(patient_counts.describe())

print("\nMin notifications per patient:", patient_counts.min())
print("Max notifications per patient:", patient_counts.max())
print("Avg notifications per patient:", patient_counts.mean())

print("\nTop 10 most notified patients:")
print(patient_counts.head(10))