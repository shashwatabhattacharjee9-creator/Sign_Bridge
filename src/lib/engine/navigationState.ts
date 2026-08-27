/**
 * FILE: Navigation State Manager
 * Unified navigation tracker to govern active view execution, isolate audio,
 * and pause/resume Studio stream state without losing word index progress.
 */

export type AppMode = 'studio' | 'practice' | 'calibrate' | 'translate' | 'vocabulary' | 'hero';

class NavigationStateManager {
  private activeMode: AppMode = 'studio';
  private modeChangeListeners: Array<(mode: AppMode) => void> = [];

  public getActiveMode(): AppMode {
    return this.activeMode;
  }

  public setMode(mode: AppMode): void {
    if (this.activeMode === mode) return;
    this.activeMode = mode;
    this.notifyListeners(mode);
  }

  public onModeChange(callback: (mode: AppMode) => void): () => void {
    this.modeChangeListeners.push(callback);
    return () => {
      this.modeChangeListeners = this.modeChangeListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(mode: AppMode): void {
    this.modeChangeListeners.forEach((cb) => {
      try {
        cb(mode);
      } catch (err) {
        console.error('Mode change listener error:', err);
      }
    });
  }
}

export const navigationStateManager = new NavigationStateManager();
