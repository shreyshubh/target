import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAttendance, updateSubjects, updateTimetable, updateDailyRecord, saveBulkRecords, toggleHoliday } from '../api';

export function useAttendance() {
  const queryClient = useQueryClient();

  const attendanceQuery = useQuery({
    queryKey: ['attendance'],
    queryFn: fetchAttendance,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['attendance'] });

  const subjectsMutation = useMutation({ mutationFn: updateSubjects, onSuccess: invalidate });
  const timetableMutation = useMutation({ mutationFn: updateTimetable, onSuccess: invalidate });
  const dailyRecordMutation = useMutation({ mutationFn: (params) => updateDailyRecord(params.date, params.subjectId, params.status), onSuccess: invalidate });
  const bulkRecordsMutation = useMutation({ mutationFn: saveBulkRecords, onSuccess: invalidate });
  const toggleHolidayMutation = useMutation({ mutationFn: toggleHoliday, onSuccess: invalidate });

  const data = attendanceQuery.data || { subjects: [], timetable: {}, records: {}, holidays: [] };

  return {
    data,
    isLoading: attendanceQuery.isLoading,
    isError: attendanceQuery.isError,
    updateSubjects: subjectsMutation.mutateAsync,
    updateTimetable: timetableMutation.mutateAsync,
    updateDailyRecord: dailyRecordMutation.mutateAsync,
    saveBulkRecords: bulkRecordsMutation.mutateAsync,
    toggleHoliday: toggleHolidayMutation.mutateAsync,
  };
}
