# Smart Medication Tracker for Diabetes Patients

Course Project for CS 6440 - Health Informatics

Our goal was to create a smart medication tracker for diabetes patients. Users can create 
an account and login to view their glucose levels, track their medications, and understand
side effects. 

## Overview

This application allows users to:
- Create an account and securely log in
- Track medications and adherence
- Monitor glucose levels over time
- Record and visualize side effects
- Explore analytics to understand treatment effectiveness

To run dev server: 

```bash
npm run dev
# or
pnpm dev
```
## System Architecture

This diagram shows the high-level structure of the Smart Medication Tracker,
including frontend, backend, authentication, and data sources.

[![System Architecture](./docs/system-architecture.png)](./docs/system-architecture.png)

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
