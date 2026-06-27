import { format, startOfDay, differenceInMinutes, differenceInDays } from 'date-fns';

export const formatDate = (date: Date | number | string, fmt = 'yyyy-MM-dd') => {
  return format(new Date(date), fmt);
};

export const formatTime = (date: Date | number | string, fmt = 'HH:mm') => {
  return format(new Date(date), fmt);
};

export const formatDateTime = (date: Date | number | string) => {
  return format(new Date(date), 'yyyy-MM-dd HH:mm');
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  if (hours === 0) return `${mins}分钟`;
  return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
};

export const formatDurationHMS = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const getTodayDateString = (): string => {
  return formatDate(new Date());
};

export const isSameDay = (date1: Date | number | string, date2: Date | number | string): boolean => {
  return formatDate(date1) === formatDate(date2);
};

export const getMinutesSinceStartOfDay = (date: Date | number): number => {
  const d = new Date(date);
  return d.getHours() * 60 + d.getMinutes();
};

export const daysBetween = (date1: string, date2: string): number => {
  return Math.abs(differenceInDays(new Date(date1), new Date(date2)));
};

export const getDayOfWeek = (date: Date | number | string): number => {
  return new Date(date).getDay();
};

export const getWeekdayName = (day: number): string => {
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return names[day];
};
