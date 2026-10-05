-- Clear the old starter schedule and its quizzes. Subjects and chapters remain
-- available so a new plan can be created deliberately from the admin area.

delete from public.quiz_attempts;
delete from public.quizzes;
delete from public.sessions;
