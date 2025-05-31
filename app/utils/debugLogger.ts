/**
 * Debug logger utility for game settings
 */

interface DebugLogOptions {
  enabled?: boolean;
  prefix?: string;
}

const defaultOptions: DebugLogOptions = {
  enabled: process.env.NODE_ENV !== 'production',
  prefix: '[GameSettings]'
};

export class DebugLogger {
  private options: DebugLogOptions;

  constructor(options: DebugLogOptions = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  log(message: string, data?: any) {
    if (this.options.enabled) {
      if (data) {
        console.log(`${this.options.prefix} ${message}`, data);
      } else {
        console.log(`${this.options.prefix} ${message}`);
      }
    }
  }

  warn(message: string, data?: any) {
    if (this.options.enabled) {
      if (data) {
        console.warn(`${this.options.prefix} ${message}`, data);
      } else {
        console.warn(`${this.options.prefix} ${message}`);
      }
    }
  }

  error(message: string, data?: any) {
    if (this.options.enabled) {
      if (data) {
        console.error(`${this.options.prefix} ${message}`, data);
      } else {
        console.error(`${this.options.prefix} ${message}`);
      }
    }
  }
}

// Create global debug loggers
export const gameSettingsLogger = new DebugLogger({ prefix: '[GameSettings]' });
export const socketLogger = new DebugLogger({ prefix: '[Socket]' }); 