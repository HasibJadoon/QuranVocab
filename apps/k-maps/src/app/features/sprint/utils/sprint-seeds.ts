import { PlannerTask, PlannerWeekPlan, SprintReview } from '../models/sprint.models';

export const WEEK_PLAN_SEED: PlannerWeekPlan = {
  schema_version: 1,
  title: 'Week Sprint — Surah Yusuf Focus',
  intent: 'Learn + produce',
  weekly_goals: [
    { id: 'g1', label: 'Finish Lesson: Yusuf 12:1-3', done: false },
  ],
  time_budget: { study_minutes: 420, podcast_minutes: 180, review_minutes: 60 },
  lanes: [
    { key: 'lesson', label: 'Lesson' },
    { key: 'podcast', label: 'Podcast' },
    { key: 'notes', label: 'Notes' },
    { key: 'admin', label: 'Admin' },
  ],
  definition_of_done: [
    'Lesson tasks marked done',
    'Key notes captured + promoted',
    'Podcast outline + recording draft stored',
  ],
  metrics: { tasks_done_target: 12, minutes_target: 600 },
};

export const TASK_SEED: PlannerTask = {
  schema_version: 1,
  lane: 'lesson',
  title: 'Read and annotate 12:1-3',
  priority: 'P1',
  status: 'todo',
  estimate_min: 30,
  actual_min: null,
  tags: ['quran', 'yusuf'],
  checklist: [
    { id: 'c1', label: 'Read + highlight tokens', done: false },
  ],
  note: '',
  links: [
    { kind: 'unit', container_id: 'AR:QURAN:12', unit_id: 'UNIT:12:1' },
    { kind: 'ayah', ref: '12:3' },
  ],
  capture_on_done: {
    create_capture_note: true,
    template: 'What did I learn? What confused me? One next step.',
  },
};

export const SPRINT_REVIEW_SEED: SprintReview = {
  schema_version: 1,
  title: 'Sprint Review — Week of 2026-02-16',
  outcomes: [
    { label: 'Lesson Yusuf 12:1-3 completed', status: 'partial' },
  ],
  metrics: {
    tasks_done: 0,
    tasks_total: 0,
    minutes_spent: 0,
    capture_notes: 0,
    promoted_notes: 0,
  },
  what_worked: [],
  what_blocked: [],
  carry_over_task_ids: [],
  next_week_focus: [],
};
