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
    //console.log(first_name, last_name);
    const clean_first_name = first_name.replace(/\d+$/, "").trim();
    const clean_last_name = last_name.replace(/\d+$/, "").trim();

    return `${clean_first_name} ${clean_last_name}`;
}


export async function getPatientById(patientId: string) {
  const result = await pool.query(
    `
    SELECT first_name, last_name
    FROM patients
    WHERE id = $1
    `,
    [patientId]
  );

  return result.rows[0] || null;
}