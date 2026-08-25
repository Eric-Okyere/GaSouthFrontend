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
  source?: "admin" | "self" | "checkin";
  dateOfBirth?: string | null;
  classTeaching?: string;
  association?: string;
  phoneNumber?: string;
  deviceBound?: boolean;
  deviceBoundAt?: string | null;
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
  registered: boolean;
  wrongSchool: boolean;
  verifiedName: string | null;
  next: "in" | "out" | "done";
  checkedInAt: string | null;
  checkedOutAt: string | null;
  deviceBound: boolean;
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

export interface SchoolTotals {
  checkins: number;
  checkouts: number;
}

export interface TeacherAttendanceSummary {
  id: string;
  staffId: string;
  name: string;
  phoneNumber: string;
  totalSchoolDays: number;
  presentDays: number;
  absentDays: number;
}

export interface AttendanceSummaryResponse {
  school: { id: string; name: string };
  start: string;
  end: string;
  teachers: TeacherAttendanceSummary[];
}

export interface OpenCheckin {
  id: string;
  school: { id: string; name: string } | null;
  staffId: string;
  name: string;
  checkedInAt: string;
  phoneNumber: string;
}

export interface CheckedInTeacher {
  id: string;
  staffId: string;
  name: string;
  phoneNumber: string;
  checkedInAt: string;
  checkedOutAt: string | null;
}

export interface NotCheckedInTeacher {
  id: string;
  staffId: string;
  name: string;
  phoneNumber: string;
}

export interface RosterStatusResponse {
  school: { id: string; name: string };
  date: string;
  checkedIn: CheckedInTeacher[];
  notCheckedIn: NotCheckedInTeacher[];
}

// A teacher as listed in the district-wide directory (/admin/teachers) —
// same underlying roster record as `Teacher` above, but with the school
// resolved to {id, name} instead of a bare id, since this list spans every
// school at once and needs to show/sort/search by school name.
export interface DirectoryTeacher {
  id: string;
  staffId: string;
  name: string;
  school: { id: string; name: string } | null;
  active: boolean;
  source?: "admin" | "self" | "checkin";
  dateOfBirth?: string | null;
  classTeaching?: string;
  association?: string;
  phoneNumber?: string;
  deviceBound?: boolean;
  deviceBoundAt?: string | null;
}

export interface TeacherDetailResponse {
  teacher: DirectoryTeacher;
  attendance: {
    start: string;
    end: string;
    totalSchoolDays: number;
    presentDays: number;
    absentDays: number;
  };
}
