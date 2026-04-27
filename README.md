# Smart Medication Tracker for Diabetes Patients

# Course Project for CS 6440 - Health Informatics

Our goal was to create a smart medication tracker for diabetes patients. Users can create 
an account and login to view their glucose levels, track their medications, and understand
side effects. 


# To use with Docker

## First time / fresh start
docker compose up -d

## View logs (both services)
docker compose logs -f

## View logs for one service
docker compose logs -f app

docker compose logs -f db

## Stop everything (preserve data)
docker compose down

## Reset everything including the database
docker compose down -v

docker compose up -d
