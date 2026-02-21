export type PlannerItemType = 'week_plan' | 'task' | 'sprint_review';
export type PlannerLane = 'lesson' | 'podcast' | 'notes' | 'admin';
export type PlannerPriority = 'P1' | 'P2' | 'P3';
export type PlannerTaskStatus = 'todo' | 'doing' | 'done' | 'blocked';
export type FocusMode = 'planning' | 'studying' | 'producing' | 'reviewing';
export type CaptureSource = 'weekly' | 'lesson' | 'podcast';

export interface RelatedTarget {
  kind: string;
  container_id?: string;
  unit_id?: string;
  ref?: string;
}

export interface PlannerWeekPlan {
  schema_version: 1;
  title: string;
  intent: string;
  weekly_goals: Array<{ id: string; label: string; done: boolean }>;
  time_budget: {
    study_minutes: number;
    podcast_minutes: number;
    review_minutes: number;
  };
  lanes: Array<{ key: PlannerLane; label: string }>;
  definition_of_done: string[];
  metrics: {
    tasks_done_target: number;
    minutes_target: number;
  };
}

export interface PlannerTask {
  schema_version: 1;
  lane: PlannerLane;
  title: string;
  priority: PlannerPriority;
  status: PlannerTaskStatus;
  estimate_min: number;
  actual_min: number | null;
  tags: string[];
  checklist: Array<{ id: string; label: string; done: boolean }>;
  note: string;
  links: RelatedTarget[];
  capture_on_done: {
    create_capture_note: boolean;
    template: string;
  };
  order_index?: number;
}

export interface SprintReview {
  schema_version: 1;
  title: string;
  outcomes: Array<{ label: string; status: 'partial' | 'done' | 'missed' }>;
  metrics: {
    tasks_done: number;
    tasks_total: number;
    minutes_spent: number;
    capture_notes: number;
    promoted_notes: number;
  };
  what_worked: string[];
  what_blocked: string[];
  carry_over_task_ids: string[];
  next_week_focus: string[];
}

export interface CaptureNoteMeta {
  schema_version: 1;
  kind: 'capture';
  week_start: string;
  source: CaptureSource;
  related_type?: string;
  related_id?: string;
  container_id?: string;
  unit_id?: string;
  ref?: string;
  task_type?: string;
}

export interface CaptureNote {
  id: string;
  user_id: number;
  status: 'inbox' | 'archived';
  body_md: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  meta: CaptureNoteMeta | null;
  text: string;
}

export interface PromotionRequest {
  note_type: string;
  title?: string;
  excerpt?: string;
  commentary?: string;
  source_id?: number;
  locator?: string;
  targets?: Array<{
    target_type: string;
    target_id: string;
    container_id?: string;
    unit_id?: string;
    ref?: string;
    extra_json?: Record<string, unknown>;
  }>;
  extra_json?: Record<string, unknown>;
}

export interface PlannerItemRow<TItemJson> {
  id: string;
  canonical_input: string;
  user_id: number;
  item_type: PlannerItemType;
  week_start: string | null;
  period_start: string | null;
  period_end: string | null;
  related_type: string | null;
  related_id: string | null;
  item_json: TItemJson;
  status: string;
  created_at: string;
  updated_at: string | null;
}

export type PlannerWeekPlanRow = PlannerItemRow<PlannerWeekPlan>;
export type PlannerTaskRow = PlannerItemRow<PlannerTask>;
export type SprintReviewRow = PlannerItemRow<SprintReview>;

export interface PlannerWeekSummary {
  tasks_done: number;
  tasks_total: number;
  minutes_spent: number;
  inbox_count: number;
  capture_notes: number;
  promoted_notes: number;
}

export interface PlannerWeekResponse {
  ok: boolean;
  week_start: string;
  weekPlan: PlannerWeekPlanRow | null;
  tasks: PlannerTaskRow[];
  review: SprintReviewRow | null;
  summary: PlannerWeekSummary;
}

export interface PodcastEpisode {
  id: string;
  canonical_input: string;
  user_id: number;
  title: string;
  content_type: 'podcast_episode';
  status: string;
  related_type: string | null;
  related_id: string | null;
  refs_json: Record<string, unknown>;
  content_json: Record<string, unknown>;
  created_at: string;
  updated_at: string | null;
}

export interface UserFocusState {
  user_id: number;
  current_type: string | null;
  current_id: string | null;
  current_unit_id: string | null;
  focus_mode: FocusMode | null;
  state_json: Record<string, unknown> | null;
  updated_at: string | null;
}

export interface LessonPickerItem {
  id: number;
  user_id: number;
  title: string;
  lesson_type: string;
  status: string;
  container_id: string | null;
  unit_id: string | null;
  updated_at: string | null;
  created_at: string;
}
