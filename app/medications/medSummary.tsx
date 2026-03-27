export default function MedSummary({ medication }: { medication: any }) {
    return (
    <div className="p-6">
      <h2>{medication?.code?.text || "Unknown"}</h2>
    </div>
  );
}