# Smart Medication Tracker for Diabetes Patients

Course Project for CS 6440 - Health Informatics

Our goal was to create a smart medication tracker for diabetes patients. Users can create 
an account and login to view their glucose levels, track their medications, and understand
side effects. 

## Features

- Secure user authentication (Firebase)
- Medication tracking and scheduling
- Glucose monitoring and visualization
- Side effect tracking over time
- Interactive analytics dashboard (trends, comparisons, insights)

To run dev server: 

```bash
npm run dev
# or
pnpm dev
```
## System Architecture

This diagram shows the high-level structure of the Smart Medication Tracker,
including frontend, backend, authentication, and data sources.

![System Architecture](./docs/system-architecture.png)

## To use with Docker

### First time / fresh start
docker compose up -d

### View logs (both services)
docker compose logs -f

### View logs for one service
docker compose logs -f app
docker compose logs -f db

### Stop everything (preserve data)
docker compose down

### Reset everything including the database
docker compose down -v
docker compose up -d
