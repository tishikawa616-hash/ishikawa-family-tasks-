declare module 'react-calendar-heatmap' {
    import * as React from 'react';
  
    export interface HeatmapValue {
      date: string | Date;
      count: number;
      [key: string]: any;
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
      onMouseOver?: (e: any, value: HeatmapValue) => void;
      onMouseLeave?: (e: any, value: HeatmapValue) => void;
      gutterSize?: number;
      monthLabels?: string[];
      weekdayLabels?: string[];
    }
  
    export default class CalendarHeatmap extends React.Component<Props> {}
  }
