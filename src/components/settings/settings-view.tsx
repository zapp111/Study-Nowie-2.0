'use client';

import { Moon, Sun, TriangleAlert } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Field, Input } from '@/components/ui/field';
import { useProgress } from '@/lib/data/progress-store';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { cn } from '@/lib/utils';

export function SettingsView() {
  const { state, updateProfile, resetProgress } = useProgress();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />

      <Card className="space-y-4">
        <CardTitle>Profile</CardTitle>
        <ProfileForm
          // Remounts with fresh values whenever the saved profile changes.
          key={`${state.profile.displayName}:${state.profile.dailyGoalMinutes}:${state.profile.examDate}`}
          initial={state.profile}
          onSave={(patch) => {
            updateProfile(patch);
            toast.success('Saved');
          }}
        />
      </Card>

      <Card className="space-y-3">
        <CardTitle>Maths level</CardTitle>
        <CardDescription>
          Same chapters either way. On Basic, the harder Standard-only practice is hidden so you are not spending time
          on questions your paper will not ask.
        </CardDescription>
        <div className="flex gap-2">
          {(['basic', 'standard'] as const).map((level) => (
            <button
              key={level}
              type="button"
              aria-pressed={state.profile.mathsLevel === level}
              onClick={() => {
                updateProfile({ mathsLevel: level });
                toast.success(level === 'basic' ? 'Set to Maths Basic' : 'Set to Maths Standard');
              }}
              className={cn(
                'flex-1 rounded-xl border px-4 py-3 text-sm font-medium capitalize transition-colors',
                state.profile.mathsLevel === level
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border-[var(--border)] hover:bg-[var(--surface-muted)]',
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Appearance</CardTitle>
        <div className="flex gap-2">
          {(
            [
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: null },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={theme === option.id}
              onClick={() => setTheme(option.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                theme === option.id
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border-[var(--border)] hover:bg-[var(--surface-muted)]',
              )}
            >
              {option.icon ? <option.icon className="h-4 w-4" aria-hidden="true" /> : null}
              {option.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Where your progress is saved</CardTitle>
        <CardDescription>
          {isSupabaseConfigured
            ? 'Synced to your account, so it follows you to any device.'
            : 'Saved on this device. Connect the database to have it follow you everywhere.'}
        </CardDescription>
      </Card>

      <Card className="space-y-3 border-red-200 dark:border-red-900">
        <div className="flex items-center gap-2">
          <TriangleAlert className="h-4 w-4 text-red-600" aria-hidden="true" />
          <CardTitle>Reset progress</CardTitle>
        </div>
        <CardDescription>
          Clears every ticked task, quiz attempt and syllabus mark. Your mistake notebook and saved marks stay.
        </CardDescription>
        <ConfirmDialog
          trigger={
            <Button variant="danger" size="sm">
              Reset everything
            </Button>
          }
          title="Reset all progress?"
          description="Every tick and quiz attempt will be deleted. This cannot be undone."
          confirmLabel="Yes, reset"
          destructive
          onConfirm={() => {
            resetProgress();
            toast.success('Progress reset');
          }}
        />
      </Card>
    </div>
  );
}

function ProfileForm({
  initial,
  onSave,
}: {
  initial: { displayName: string; dailyGoalMinutes: number; examDate: string };
  onSave: (patch: { displayName: string; dailyGoalMinutes: number; examDate: string }) => void;
}) {
  const [name, setName] = React.useState(initial.displayName);
  const [goal, setGoal] = React.useState(initial.dailyGoalMinutes);
  const [examDate, setExamDate] = React.useState(initial.examDate);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ displayName: name.trim() || 'Joyuu', dailyGoalMinutes: goal, examDate });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="What should the app call you?" htmlFor="name">
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Class" htmlFor="class">
          <Input id="class" value="10 (CBSE)" readOnly disabled />
        </Field>
        <Field label="Daily goal" hint="Minutes on a normal school day." htmlFor="goal">
          <Input
            id="goal"
            type="number"
            min={15}
            max={720}
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
          />
        </Field>
        <Field label="First paper" hint="Maths, 17 February 2026." htmlFor="exam">
          <Input id="exam" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </Field>
      </div>
      <Button type="submit" size="sm">
        Save
      </Button>
    </form>
  );
}
