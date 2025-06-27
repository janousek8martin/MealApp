// src/utils/dateUtils.ts

export const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'short' 
  };
  return date.toLocaleDateString('en-US', options);
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return isSameDay(date, today);
};

export const getNextDay = (date: Date): Date => {
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  return nextDay;
};

export const getPreviousDay = (date: Date): Date => {
  const prevDay = new Date(date);
  prevDay.setDate(date.getDate() - 1);
  return prevDay;
};

export const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

export const getWeekDates = (date: Date): Date[] => {
  const monday = getMonday(date);
  return Array(7).fill(0).map((_, index) => {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + index);
    return currentDate;
  });
};

export const getMonthTitle = (date: Date): string => {
  const weekDates = getWeekDates(date);
  const firstDay = weekDates[0];
  const lastDay = weekDates[6];
  const firstMonth = firstDay.toLocaleString('default', { month: 'long' });
  const lastMonth = lastDay.toLocaleString('default', { month: 'long' });
  
  if (firstMonth === lastMonth) {
    return firstMonth.toUpperCase();
  } else {
    return `${firstMonth.toUpperCase()} - ${lastMonth.toUpperCase()}`;
  }
};

export const isMonday = (date: Date): boolean => {
  return date.getDay() === 1;
};

export const isSunday = (date: Date): boolean => {
  return date.getDay() === 0;
};