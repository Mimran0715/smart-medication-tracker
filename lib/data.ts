import fs from "fs";
//import { Pool } from "pg";
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

//const pool = new Pool(dbConfig);

export async function getGlucoseDashboard(){
    const glucose = [120, 130, 115, 140, 125, 135, 128];
    return glucose; 
}

export async function getAdherenceDashboard(){
    const adherence = 88;
    return adherence; 
}

export async function getSideEffectDashboard(){
    const sideEffect = [150, 155, 152, 160, 159, 157];
    // try{
    //     const res = await 
    //     pool.query("SELECT value FROM observations WHERE code=Weight") 
    //     console.log("result: ", res)

    // } catch(err){
    //     console.log("Connection Error: ", err)
    // }
    
    return sideEffect;
}

