-- Hapus kolom is_flagged yang tidak digunakan
ALTER TABLE public.exam_answers 
DROP COLUMN IF EXISTS is_flagged;

-- Perbaiki unique constraint untuk exam_attempts
DROP INDEX IF EXISTS public.uq_exam_attempts_participant_active;

CREATE UNIQUE INDEX IF NOT EXISTS uq_exam_attempts_participant_not_cancelled 
ON public.exam_attempts(exam_participant_id) 
WHERE status != 'cancelled';
