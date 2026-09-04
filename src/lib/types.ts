export interface School {
  id: string;
  name: string;
  active?: boolean;
  // Short, typeable stand-in for `id` in check-in links and QR codes —
  // e.g. "G7K2P" instead of the full Mongo id. Always present once a
  // school has been read at least once through an admin/directory listing
  // (see backend/src/utils/schoolCode.js); falls back to `id` until then.
  code?: string | null;
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
  // Elapsed time (hours, 2dp) since this person's matching check-in the same
  // day at the same school. Only ever set on a check-out row — a check-in
  // row has nothing to measure yet — and null when no matching check-in is
  // on file (e.g. it was deleted, or this is a legacy record).
  hoursSpent: number | null;
  // 'late' if this check-in was after 7:30am (Africa/Accra), 'early'
  // otherwise. Only ever set on a check-in row — nothing to judge "on time"
  // about a check-out — so this is always null for type "out".
  arrivalStatus: "late" | "early" | null;
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
  // Present only when the directory was fetched with ?date= — that day's
  // check-in/out status for this teacher, so the district directory can
  // show a present/absent column without a separate request per teacher.
  attendanceStatus?: {
    date: string;
    checkedInAt: string | null;
    checkedOutAt: string | null;
    // 'late' if checkedInAt was after 7:30am (Africa/Accra), 'early'
    // otherwise, null when there's no check-in on file for the date.
    arrivalStatus: "late" | "early" | null;
  };
}

// One GES academic term's open ("first day back") and closing ("last day
// of term") date. Either can be null until an admin sets it.
export interface TermDates {
  startDate: string | null;
  endDate: string | null;
}

export interface TermSettings {
  academicYear: string;
  term1: TermDates;
  term2: TermDates;
  term3: TermDates;
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
