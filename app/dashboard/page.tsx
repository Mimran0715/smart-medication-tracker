"use client";
//import GlucoseModal from '@/dashboard/GlucoseModal';
import {Line} from "react-chartjs-2";
import {useState, useEffect} from "react";
import {Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


export default function Dashboard() {
  const [open, setOpen] = useState(false);
  const glucoseData = [120, 130, 115, 140, 125, 135, 128];
  const adherence = 88;
  const sideEffectData = [150, 155, 152, 160, 159, 157]

  const glucoseChartData = {
    labels: glucoseData.map((_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: 'Glucose Level',
        data: glucoseData,
        borderColor: '#1AA1E3',
        backgroundColor: 'rgba(26, 161, 227, 0.2)',
      },
    ],
  };

  const sideEffectChartData = {
    labels: sideEffectData.map((_, i) => `Week ${i + 1}`),
    datasets: [
      {
        label: 'Weight',
        data: sideEffectData,
        borderColor: '#1AA1E3',
        backgroundColor: 'rgba(26, 161, 227, 0.2)',
      },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-bold mb-2">Glucose Levels</h2>
          <Line data={glucoseChartData} />
        </div>

        <div className="bg-white rounded shadow p-4 flex flex-col items-center justify-center">
          <h2 className="font-bold mb-2">Adherence</h2>
          <div className="text-4xl font-bold text-[#1AA1E3]">{adherence}%</div>
        </div>

        <div className="bg-white rounded shadow p-4 flex flex-col justify-center gap-4">
          <h2 className="font-bold mb-2">Quick Actions</h2>
          <button className="bg-[#1AA1E3] text-white py-2 px-4 rounded hover:bg-blue-600">
            Log Glucose
          </button>
           {/* <div>
            <button onClick={() => setOpen(true)}>Log Glucose</button>
            <GlucoseModal open={open} onClose={() => setOpen(false)} />
          </div> */}
          
          <button className="bg-[#1AA1E3] text-white py-2 px-4 rounded hover:bg-blue-600">
            Log Medication
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-bold mb-2">Medication Schedule</h3>
          <ul className="divide-y divide-gray-200">
            <li className="flex justify-between items-center px-4 py-2">
              <span>Metformin 6:00AM</span>
              <div className="flex gap-2">
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  onClick={() => alert('Edit Med')}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  onClick={() => alert('Remove Med')}
                >
                  Remove
                </button>
              </div>
            </li>

            <li className="flex justify-between items-center px-4 py-2">
              <span>Insulin 7:00AM</span>
              <div className="flex gap-2">
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  onClick={() => alert('Edit Med')}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  onClick={() => alert('Remove Med')}
                >
                  Remove
                </button>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h3 className="font-bold mb-2">Medications</h3>
          <ul className="divide-y divide-gray-200">
            <li className="flex justify-between items-center px-4 py-2">
              <span>Metformin 500mg</span>
              <div className="flex gap-2">
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  onClick={() => alert('Edit Med')}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  onClick={() => alert('Remove Med')}
                >
                  Remove
                </button>
              </div>
            </li>

            <li className="flex justify-between items-center px-4 py-2">
              <span>Insulin 20 units</span>
              <div className="flex gap-2">
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  onClick={() => alert('Edit Med')}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  onClick={() => alert('Remove Med')}
                >
                  Remove
                </button>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h3 className="font-bold mb-2">Side Effects</h3>
          <div className="flex gap-6">
            <ul className="list-disc list-inside">
              <li>Nausea after Metformin</li>
            </ul>
          
          <div className="flex-1">
            <Line data={sideEffectChartData} />
          </div>
          </div>
        </div>
      </div>
      
      <div>
        <button
          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          onClick={() => alert('Send CommunicationRequest')}
        >
          Send Message to Provider
        </button>
      </div>
    </div>
  ); 
}