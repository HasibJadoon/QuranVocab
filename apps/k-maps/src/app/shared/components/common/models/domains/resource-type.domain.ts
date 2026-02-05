/**
 * Type de ressource
 */
export enum ResourceType {
  driver = 'driver',
  truck = 'truck'
}

export const RESOURCE_TYPES = Object.keys(ResourceType).map((k) => ResourceType[k]);
