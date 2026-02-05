import { ITracable } from './types.model';

export interface IReceiverError {
  _id?: string;
  message: string;
  date: string;
  username: string;
  version?: string;
  device?: {
    /**
     * The device.model returns the name of the device's model or product. The value is set
     * by the device manufacturer and may be different across versions of the same product.
     */
    model: string;
    /** Get the device's operating system name. */
    platform: string;
    /** Get the device's Universally Unique Identifier (UUID). */
    id: string;
    /** Get the operating system version. */
    version: string;
    /** Get the device's manufacturer. */
    manufacturer: string;
    /** Whether the device is running on a simulator. */
    isVirtual: boolean;
    /** Get the device hardware serial number. */
    hardware: string;
  };
  error?: string[];
}

export interface IReceiverIgnoredError extends ITracable {
  _id?: string;
  code: string;
  contains_text: string;
  description?: string;
  ignored: boolean;
}
