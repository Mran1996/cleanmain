export function PricingComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200 rounded-lg">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Service</th>
            <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-900">Ask AI Legal</th>
            <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-900">Traditional Attorney</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">Initial Consultation</td>
            <td className="border border-gray-200 px-4 py-3 text-center text-sm text-green-600 font-semibold">Included</td>
            <td className="border border-gray-200 px-4 py-3 text-center text-sm text-gray-700">$200-500</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">Document Drafting</td>
            <td className="border border-gray-200 px-4 py-3 text-center text-sm text-green-600 font-semibold">$199/month</td>
            <td className="border border-gray-200 px-4 py-3 text-center text-sm text-gray-700">$2,000-8,000</td>
          </tr>
          <tr>
            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">Revisions</td>
            <td className="border border-gray-200 px-4 py-3 text-center text-sm text-green-600 font-semibold">Unlimited</td>
            <td className="border border-gray-200 px-4 py-3 text-center text-sm text-gray-700">$500-1,500 each</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">Case Analysis</td>
            <td className="border border-gray-200 px-4 py-3 text-center text-sm text-green-600 font-semibold">Included</td>
            <td className="border border-gray-200 px-4 py-3 text-center text-sm text-gray-700">$1,000-3,000</td>
          </tr>
          <tr>
            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">Response Time</td>
            <td className="border border-gray-200 px-4 py-3 text-center text-sm text-green-600 font-semibold">Minutes</td>
            <td className="border border-gray-200 px-4 py-3 text-center text-sm text-gray-700">Days/Weeks</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
} 