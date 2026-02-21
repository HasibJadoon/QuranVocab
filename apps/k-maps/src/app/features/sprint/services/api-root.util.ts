import { API_BASE } from '../../../shared/api-base';

export function resolveApiRoot(): string {
  const normalized = API_BASE.replace(/\/+$/, '');
  if (!normalized) {
    return '/api';
  }
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}
