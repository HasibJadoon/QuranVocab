export const TRUCK_PROFILES: { code: string; nameKey: string; descriptionKey?: string }[] = [
  'truck40t',
  'truck11_99t',
  'truck7_49t',
  'car',
  'trailertruck',
  '8_semitrailer_3axle',
  '8_semitrailer_4axle',
  '8_semitrailer_5axle',
  '7_medium_tractor',
  '8_double_trailer',
  '8_heavy_tractor',
  'bicycle',
  'pedestrian'
].map((key) => ({
  code: key,
  nameKey: `TRUCK_PROFILE.${key.toUpperCase()}`,
  descriptionKey: `TRUCK_PROFILE_DESCRIPTION.${key.toUpperCase()}`
}));
