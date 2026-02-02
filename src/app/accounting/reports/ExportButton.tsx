'use client';

import { useState, useTransition } from 'react';
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { generateIncomeStatementCSV } from './export-actions';

interface Props {
  fiscalYear: number;
}

export default function ExportButton({ fiscalYear }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleExport = () => {
    startTransition(async () => {
      try {
        const csv = await generateIncomeStatementCSV(fiscalYear);
        
        // Create and trigger download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `収支内訳書_${fiscalYear}年.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (error) {
        console.error('Export failed:', error);
        alert('エクスポートに失敗しました');
      }
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleExport}
        disabled={isPending}
        className="w-full py-4 bg-linear-to-r from-emerald-500 to-green-600 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-3 active:scale-98 transition-all disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 size={22} className="animate-spin" />
            出力中...
          </>
        ) : (
          <>
            <FileSpreadsheet size={22} />
            📄 収支内訳書を出力（CSV）
          </>
        )}
      </button>
      
      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-700">
          <Download size={18} />
          <span className="font-bold">ダウンロードしました！</span>
        </div>
      )}
      
      <p className="text-xs text-gray-400 text-center">
        CSVファイルはExcelで開けます。
        確定申告時に税理士さんへ渡す資料にもなります。
      </p>
    </div>
  );
}
