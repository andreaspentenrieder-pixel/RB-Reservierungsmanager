export default function CsvImportExport() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold mb-4 text-vr-blue">CSV Import / Export</h2>
      <a href="/api/admin/csv-export" className="px-4 py-2 bg-vr-blue text-white rounded hover:bg-vr-blue-dark inline-block mb-4">Users als CSV exportieren</a>
    </div>
  );
}
