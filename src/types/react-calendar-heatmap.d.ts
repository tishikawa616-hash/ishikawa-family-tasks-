declare module 'react-calendar-heatmap' {
    import * as React from 'react';
  
    export interface HeatmapValue {
      date: string | Date;
      count: number;
      [key: string]: string | Date | number | undefined;
    }
  
    export interface Props {
      values: HeatmapValue[];
      startDate: string | Date;
      endDate: string | Date;
      showMonthLabels?: boolean;
      showWeekdayLabels?: boolean;
      horizontal?: boolean;
      titleForValue?: (value: HeatmapValue) => string | null;
      classForValue?: (value: HeatmapValue) => string | null;
      tooltipDataAttrs?: (value: HeatmapValue) => object | null;
      onClick?: (value: HeatmapValue) => void;
      onMouseOver?: (e: React.MouseEvent, value: HeatmapValue) => void;
      onMouseLeave?: (e: React.MouseEvent, value: HeatmapValue) => void;
      gutterSize?: number;
      monthLabels?: string[];
      weekdayLabels?: string[];
    }
  
    export default class CalendarHeatmap extends React.Component<Props> {}
  }
