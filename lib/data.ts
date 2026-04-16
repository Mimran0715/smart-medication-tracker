import fs from "fs";
import { Pool } from "pg";
import path from "path";
// import dotenv from "dotenv"

// dotenv.config()

const dbConfig = {
  user: process.env.POSTGRES_USER,                  
  host: "db",                 
  database: process.env.POSTGRES_DB,                
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,                          
};

const pool = new Pool(dbConfig);

export async function getGlucoseDashboard(){
    const glucose = [120, 130, 115, 140, 125, 135, 128];
    return glucose; 
}

export async function getAdherenceDashboard(){
    const adherence = 88;
    return adherence; 
}

export async function getSideEffectDashboard() {
    const sideEffectData = [150, 155, 152, 160, 159, 157];
    return sideEffectData;
}

export async function getPatientByFirebaseUid(uid: string): Promise<string | null> {
    const result = await pool.query(
        "SELECT patient_id FROM user_patient WHERE firebase_uid = $1",
        [uid]
    );
    return result.rows[0]?.patient_id ?? null;
}

export async function assignRandomPatient(uid: string): Promise<string> {
    const result = await pool.query(`
        INSERT INTO user_patient (firebase_uid, patient_id)
        SELECT $1, p.id
        FROM patient p
        WHERE p.id NOT IN (SELECT patient_id FROM user_patient)
        ORDER BY RANDOM()
        LIMIT 1
        RETURNING patient_id
    `, [uid]);

    if (result.rows.length === 0) {
        throw new Error("No available patients to assign");
    }

    return result.rows[0].patient_id;
}

export async function getPatientName(patientId: string): Promise<string | null> {
    const result = await pool.query(
        "SELECT first_name, last_name FROM patient WHERE id = $1::uuid",
        [patientId]
    );
    if (result.rows.length === 0) return null;
    const { first_name, last_name } = result.rows[0];
    return `${first_name} ${last_name}`;
}
