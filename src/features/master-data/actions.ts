/**
 * Feature-Slice Actions: Master Data
 * Re-exports domain actions for academic years, semesters, classes, subjects, teachers, and students.
 */
export {
  saveAcademicYearAction,
  toggleAcademicYearAction,
  saveSemesterAction,
  toggleSemesterAction,
  saveClassAction,
  toggleClassAction,
  saveSubjectAction,
  toggleSubjectAction,
  saveTeacherAssignmentAction,
  saveTeacherAction,
  saveStudentAction,
  deleteStudentAction,
  saveClassMemberAction,
  importTeachersCsvAction,
  importStudentsCsvAction,
  importClassesCsvAction,
  importStudentClassAssignmentsCsvAction,
  importTeacherSubjectAssignmentsCsvAction,
} from "@/lib/actions/master-data-actions";
