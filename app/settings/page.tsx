"use client";
import {useState} from "react";

interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  hint,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium tracking-widest uppercase text-stone-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
      />
      {hint && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [firstName, setFirstName] = useState("Jane");
  const [lastName, setLastName] = useState("Doe");
  const [email, setEmail] = useState("jdoe@example.com");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <div className="flex flex-col gap-5"> {/* page card*/}
      <div className="bg-white rounded shadow p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          {/*accnt info */}
          <h1 className="font-bold text-lg">Account Info</h1>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="First name"
              value={firstName}
              onChange={setFirstName}
              placeholder="Alex"
            />
            <InputField
              label="Last name"
              value={lastName}
              onChange={setLastName}
              placeholder="Morgan"
            />
            <InputField
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />
          </div>
        </div>

        {/*password*/}
        <div className="flex flex-col gap-4">
          <h1 className="font-bold text-lg">Password</h1>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="••••••••"
            />
            <InputField
              label="New password"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="••••••••"
              hint="Minimum 8 characters."
            />
            <InputField
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="••••••••"
            />
          </div>
          <button className="self-start text-sm px-5 py-2 bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all">
            Update password
          </button>
        </div>

      {/* export */}
      <div className="flex flex-col gap-4" > 
        <h1 className="font-bold text-lg">Export Data</h1>
        <p className="text-sm text-stone-500">
            Includes your medication list, dosage history, and account info in JSON format.
          </p>
          <button className="self-start text-sm px-5 py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 active:scale-95 transition-all">
            Request data export
          </button>
      </div>

      {/* delete */}
      <div className="flex flex-col gap-4" > 
        <h1 className="font-bold text-lg">Delete</h1>
        <div className= "flex flex-wrap gap-2">
          <p className="text-sm text-stone-500">
            Deleting your account will permanently remove all your medications,
            history, and personal data from Smart Medication Tracker.
          </p>
          <p className="text-sm text-red-400">This action is 
            permanent and cannot be undone. </p>
        </div>
        <button className="self-start text-sm px-5 py-2 bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all">
          Delete my account
        </button>

      </div>
      {/*end box*/}
      </div> 

    {/* end page card*/}
    </div> 
  );
}