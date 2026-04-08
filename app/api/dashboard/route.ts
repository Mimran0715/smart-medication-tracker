import {getAdherenceDashboard, getGlucoseDashboard, getSideEffectDashboard} from "../../../lib/data.ts"

export async function GET() {
  const [adherence, glucose, sideEffects] = await Promise.all([
    getAdherenceDashboard(),
    getGlucoseDashboard(),
    getSideEffectDashboard(),
  ]);
  
  return new Response(JSON.stringify({
    adherence,
    glucose,
    sideEffects,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}