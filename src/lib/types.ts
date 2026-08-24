export interface School {
  id: string;
  name: string;
  active?: boolean;
  hasAnchor?: boolean;
  anchorLat?: number | null;
  anchorLng?: number | null;
  anchorSetAt?: string | null;
}

export interface Teacher {
  id: string;
  school: string;
  staffId: string;
  name: string;
  active: boolean;
  source?: "admin" | "self";
  dateOfBirth?: string | null;
  classTeaching?: string;
  association?: string;
  phoneNumber?: string;
}

export interface AttendanceRecord {
  id: string;
  school: { id: string; name: string } | null;
  staffId: string;
  name: string;
  type: "in" | "out";
  verified: boolean;
  distanceM: number | null;
  flagged: boolean;
  at: string;
  dateKey: string;
}

export interface StatusResponse {
  staffId: string;
  verifiedName: string | null;
  next: "in" | "out" | "done";
  checkedInAt: string | null;
  checkedOutAt: string | null;
}

export interface TodayStats {
  date: string;
  totalSchools: number;
  schoolsReporting: number;
  checkins: number;
  checkouts: number;
  flagged: number;
  perSchool: { schoolId: string; name: string; in: number; out: number }[];
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
}
