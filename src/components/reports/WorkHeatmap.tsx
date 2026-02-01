import { useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import { format, subDays } from 'date-fns';

interface WorkHeatmapProps {
  logs: any[];
}

export function WorkHeatmap({ logs }: WorkHeatmapProps) {
  // Aggregate duration by date
  const values = useMemo(() => {
    const map = new Map<string, number>();
    
    logs.forEach(log => {
      const date = new Date(log.started_at);
      const key = format(date, 'yyyy-MM-dd');
      const duration = log.duration || 0;
      map.set(key, (map.get(key) || 0) + duration);
    });

    return Array.from(map.entries()).map(([date, count]) => ({
      date,
      count: Math.round(count * 10) / 10,
    }));
  }, [logs]);

  const today = new Date();
  const startDate = subDays(today, 120); // Show last 4 months (approx)

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm overflow-hidden">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <span>作業の記録 (ヒートマップ)</span>
        <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-full">過去4ヶ月</span>
      </h3>
      
      <div className="w-full overflow-x-auto pb-2">
        <div className="min-w-[500px]">
            <CalendarHeatmap
                startDate={startDate}
                endDate={today}
                values={values}
                classForValue={(value) => {
                    if (!value || value.count === 0) {
                        return 'color-empty';
                    }
                    if (value.count < 2) return 'color-scale-1';
                    if (value.count < 4) return 'color-scale-2';
                    if (value.count < 6) return 'color-scale-3';
                    return 'color-scale-4'; // Very busy
                }}
                tooltipDataAttrs={(value: any) => {
                    if (!value || !value.date) return null;
                    return {
                        'data-tooltip-id': 'heatmap-tooltip',
                        'data-tooltip-content': `${value.date}: ${value.count}時間`,
                    };
                }}
                showWeekdayLabels
                gutterSize={3}
            />
            <Tooltip id="heatmap-tooltip" className="z-50 !bg-slate-800 !text-xs !rounded-lg !px-3 !py-2 !opacity-100" />
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-2 text-xs text-slate-400">
        <span>Less</span>
        <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-slate-100" />
            <div className="w-3 h-3 rounded-sm bg-emerald-100" />
            <div className="w-3 h-3 rounded-sm bg-emerald-300" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <div className="w-3 h-3 rounded-sm bg-emerald-700" />
        </div>
        <span>More</span>
      </div>

      <style jsx global>{`
        .react-calendar-heatmap text {
          font-size: 10px;
          fill: #94a3b8;
        }
        .react-calendar-heatmap .color-empty { fill: #f1f5f9; }
        .react-calendar-heatmap .color-scale-1 { fill: #d1fae5; }
        .react-calendar-heatmap .color-scale-2 { fill: #6ee7b7; }
        .react-calendar-heatmap .color-scale-3 { fill: #10b981; }
        .react-calendar-heatmap .color-scale-4 { fill: #047857; }
        .react-calendar-heatmap rect:hover { stroke: #cbd5e1; stroke-width: 1px; }
      `}</style>
    </div>
  );
}
