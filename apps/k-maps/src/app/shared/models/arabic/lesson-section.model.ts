export interface LessonSection {
  id: string;
  title: string;
  description: string;
  mode?: 'original' | 'edited' | 'mixed';
  feature: 'quran' | 'literature';
}
