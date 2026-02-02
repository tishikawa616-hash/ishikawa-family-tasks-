import React from 'react';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface MonthlyTableProps {
  monthlyData: MonthlyData[];
}

export default function MonthlyTable({ monthlyData }: MonthlyTableProps) {
  // Sort descending by month usually makes sense for history, 
  // but for a yearly view ascending is also fine. Let's do descending (newest first).
  // But the input data might be 1..12. Let's reverse it.
  const reversedData = [...monthlyData].reverse();

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm mt-6">
      <h3 className="text-lg font-bold text-[#78350F] mb-4">月次推移</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="px-3 py-3 rounded-l-lg">月</th>
              <th className="px-3 py-3 text-right">収入</th>
              <th className="px-3 py-3 text-right">支出</th>
              <th className="px-3 py-3 text-right rounded-r-lg">収支</th>
            </tr>
          </thead>
          <tbody>
            {reversedData.map((d) => {
              const balance = d.income - d.expense;
              const hasActivity = d.income > 0 || d.expense > 0;
              
              if (!hasActivity) return null; // Skip empty months or show them? User likely wants to see active months.
              
              return (
                <tr key={d.month} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                  <td className="px-3 py-4 font-bold text-gray-700">{d.month}</td>
                  <td className="px-3 py-4 text-right text-[#4D7C0F]">{d.income > 0 ? `¥${fmt(d.income)}` : '-'}</td>
                  <td className="px-3 py-4 text-right text-red-600">{d.expense > 0 ? `¥${fmt(d.expense)}` : '-'}</td>
                  <td className={`px-3 py-4 text-right font-bold ${balance >= 0 ? 'text-[#4D7C0F]' : 'text-red-600'}`}>
                    ¥{fmt(balance)}
                  </td>
                </tr>
              );
            })}
            {reversedData.every(d => d.income === 0 && d.expense === 0) && (
               <tr>
                   <td colSpan={4} className="px-3 py-8 text-center text-gray-400 font-bold">データがありません</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
