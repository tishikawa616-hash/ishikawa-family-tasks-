'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useState } from 'react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface CategoryData {
  name: string;
  amount: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  business_income: number;
  business_expense: number;
  household_expense: number;
}

interface ReportChartsProps {
  businessCategoryData: CategoryData[];
  householdCategoryData: CategoryData[];
  monthlyData: MonthlyData[];
}

// Color palette for categories
// Business colors (Green/Earth tones)
const COLORS_BUSINESS = [
  '#4D7C0F', // Matcha (Primary)
  '#65A30D', // Lime
  '#84CC16', 
  '#059669', // Emerald
  '#0D9488', // Teal
  '#A67C52', // Earth
  '#B45309', // Amber
  '#78350F', // Brown
];

// Household colors (Warmer/Living tones)
const COLORS_HOUSEHOLD = [
  '#EA580C', // Orange (Primary)
  '#F97316', 
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#8B5CF6', // Violet
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#0EA5E9', // Sky
];


export function CategoryPieChart({ data, isBusiness }: { data: CategoryData[], isBusiness: boolean }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 opacity-60 font-bold border-2 border-dashed border-gray-200 rounded-2xl">
        データがありません
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        data: data.map(d => d.amount),
        backgroundColor: (isBusiness ? COLORS_BUSINESS : COLORS_HOUSEHOLD).slice(0, data.length),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 10,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { family: "'Noto Sans JP', sans-serif", size: 12, weight: 'bold' as const },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle' as const,
          color: '#78350F',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#78350F',
        bodyColor: isBusiness ? '#4D7C0F' : '#EA580C',
        bodyFont: { weight: 'bold' as const, size: 14 },
        padding: 12,
        cornerRadius: 12,
        borderColor: isBusiness ? 'rgba(77, 124, 15, 0.1)' : 'rgba(234, 88, 12, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => 
            ` ${context.label}: ¥${context.raw.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="h-[300px] relative">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

export function CashFlowChart({ data }: { data: MonthlyData[] }) {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: '事業利益',
        data: data.map(d => d.business_income - d.business_expense),
        backgroundColor: '#4D7C0F',
        borderRadius: 6,
        barPercentage: 0.6,
      },
      {
        label: '家計支出',
        data: data.map(d => d.household_expense),
        backgroundColor: '#F97316',
        borderRadius: 6,
        barPercentage: 0.6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
          position: 'top' as const,
          align: 'end' as const,
          labels: {
             font: { family: "'Noto Sans JP', sans-serif", size: 11, weight: 'bold' as const },
             usePointStyle: true,
             pointStyle: 'circle' as const,
             color: '#78350F',
             boxWidth: 8,
             boxHeight: 8,
           }
        },
        tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#78350F',
            bodyColor: '#444',
            bodyFont: { weight: 'bold' as const },
            padding: 12,
            borderColor: 'rgba(0,0,0,0.1)',
            borderWidth: 1,
            callbacks: {
              label: (context: any) => 
                ` ${context.dataset.label}: ¥${context.raw.toLocaleString()}`,
            },
        }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#78350F', font: { family: "'Noto Sans JP', sans-serif", size: 11 } }
      },
      y: {
        border: { display: false },
        grid: { color: '#f0f0f0' },
        ticks: {
          color: '#A8A29E',
          font: { family: "'Noto Sans JP', sans-serif", size: 10 },
          callback: (value: number | string) => `¥${Number(value).toLocaleString()}`,
          maxTicksLimit: 5,
        },
      }
    }
  };
  
  return (
    <div className="h-[300px] w-full">
         <Bar data={chartData} options={options} />
    </div>
  );
}


export default function ReportCharts({ businessCategoryData, householdCategoryData, monthlyData }: ReportChartsProps) {
  const [viewMode, setViewMode] = useState<'cashflow' | 'breakdown'>('cashflow');
  const [breakdownType, setBreakdownType] = useState<'business' | 'household'>('business');

  return (
    <div className="space-y-6">
      
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#78350F] flex items-center gap-2">
              <span className={`w-1 h-5 rounded-full ${viewMode === 'cashflow' ? 'bg-[#4D7C0F]' : 'bg-[#D97706]'}`}></span>
              {viewMode === 'cashflow' ? '経営と家計' : '経費の内訳'}
            </h2>
            
            {/* Main Toggle */}
            <div className="bg-[#F8F7F2] p-1 rounded-xl flex gap-1">
                <button 
                  onClick={() => setViewMode('cashflow')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'cashflow' ? 'bg-white text-[#4D7C0F] shadow-sm' : 'text-[#A8A29E]'}`}
                >
                    推移
                </button>
                <button 
                  onClick={() => setViewMode('breakdown')}
                   className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'breakdown' ? 'bg-white text-[#D97706] shadow-sm' : 'text-[#A8A29E]'}`}
                >
                   内訳
                </button>
            </div>
        </div>
        
        {viewMode === 'cashflow' ? (
             <CashFlowChart data={monthlyData} />
        ) : (
             <div className="space-y-4">
                 {/* Breakdown Sub-Toggle */}
                 <div className="flex justify-center">
                    <div className="bg-[#F8F7F2] p-1 rounded-full flex gap-1">
                         <button
                            onClick={() => setBreakdownType('business')}
                            className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${breakdownType === 'business' ? 'bg-[#4D7C0F] text-white shadow-md' : 'text-[#4D7C0F] opacity-60'}`}
                         >
                            🚜 事業経費
                         </button>
                         <button
                            onClick={() => setBreakdownType('household')}
                            className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${breakdownType === 'household' ? 'bg-[#EA580C] text-white shadow-md' : 'text-[#EA580C] opacity-60'}`}
                         >
                            🏠 家計支出
                         </button>
                    </div>
                 </div>

                 <CategoryPieChart 
                    data={breakdownType === 'business' ? businessCategoryData : householdCategoryData} 
                    isBusiness={breakdownType === 'business'}
                 />
             </div>
        )}
        
        {viewMode === 'cashflow' && (
           <div className="mt-4 p-4 bg-[#F0FDF4] rounded-xl text-xs text-[#4D7C0F] leading-relaxed">
              <span className="font-bold">✨ キャッシュフロー診断</span><br/>
              緑の棒（事業利益）がオレンジの棒（生活費）を上回っていれば、経営は順調で安心です。
           </div>
        )}
      </div>

    </div>
  );
}
