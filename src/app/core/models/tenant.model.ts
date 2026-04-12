export interface PeriodTiming {
  period: number;
  name: string;
  start: string;
  end: string;
}

export interface Tenant {
  id: string;
  slug: string;
  schoolName: string;
  board: string;
  address: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  loginBgImage: string;
  fontFamily: string;
  attendanceMode: 'daily' | 'per-period';
  periodsPerDay: number;
  periodTimings: PeriodTiming[];
  workingDays: string[];
}
