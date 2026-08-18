/**
 * FILE: EdgeDatabase (IndexedDB Local Storage Pipeline)
 * Backend-first local persistence architecture for offline telemetry,
 * session analytics, dataset recording, and user calibration profiles.
 */

export interface GestureLogRecord {
  id?: number;
  sessionId: string;
  timestamp: number;
  sign: string;
  confidence: number;
  latencyMs: number;
  motionDetected: boolean;
  fps: number;
  dominantHand: 'left' | 'right';
  keypointsSummary?: number[];
}

export interface SessionRecord {
  id: string;
  startTime: number;
  endTime?: number;
  totalGesturesCount: number;
  averageFps: number;
  averageLatencyMs: number;
  tokensStream: string[];
}

export interface CalibrationProfile {
  id: string;
  name: string;
  updatedAt: number;
  handScaleMultiplier: number;
  minConfidenceCutoff: number;
  customThresholds: Record<string, number>;
}

class EdgeDatabasePipeline {
  private dbName: string = 'SignBridgeEdgeDB';
  private dbVersion: number = 1;
  private db: IDBDatabase | null = null;
  private currentSessionId: string = '';
  private gestureBuffer: GestureLogRecord[] = [];
  private flushTimer: any = null;

  constructor() {
    this.currentSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  /**
   * Initializes IndexedDB database schema safely in browser runtime
   */
  public async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // Store 1: Gesture Events Log
        if (!db.objectStoreNames.contains('gesture_events')) {
          const gestStore = db.createObjectStore('gesture_events', {
            keyPath: 'id',
            autoIncrement: true,
          });
          gestStore.createIndex('sessionId', 'sessionId', { unique: false });
          gestStore.createIndex('sign', 'sign', { unique: false });
          gestStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store 2: Sessions Log
        if (!db.objectStoreNames.contains('sessions')) {
          const sessStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessStore.createIndex('startTime', 'startTime', { unique: false });
        }

        // Store 3: User Calibration Profiles
        if (!db.objectStoreNames.contains('calibration_profiles')) {
          db.createObjectStore('calibration_profiles', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        this.startSession();
        resolve();
      };

      request.onerror = (event: any) => {
        console.warn('IndexedDB initialization failed, running in-memory fallback', event);
        resolve();
      };
    });
  }

  /**
   * Starts a new session record
   */
  private async startSession(): Promise<void> {
    if (!this.db) return;
    const session: SessionRecord = {
      id: this.currentSessionId,
      startTime: Date.now(),
      totalGesturesCount: 0,
      averageFps: 30,
      averageLatencyMs: 25,
      tokensStream: [],
    };

    try {
      const tx = this.db.transaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      store.put(session);
    } catch {
      // Ignore
    }
  }

  /**
   * Non-blocking buffered log of gesture events
   */
  public logGesture(record: Omit<GestureLogRecord, 'sessionId'>): void {
    const fullRecord: GestureLogRecord = {
      ...record,
      sessionId: this.currentSessionId,
    };

    this.gestureBuffer.push(fullRecord);

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flushBuffer(), 1500);
    }
  }

  /**
   * Flushes buffered records to IndexedDB in a single batch transaction
   */
  public async flushBuffer(): Promise<void> {
    this.flushTimer = null;
    if (!this.db || this.gestureBuffer.length === 0) return;

    const toWrite = [...this.gestureBuffer];
    this.gestureBuffer = [];

    try {
      const tx = this.db.transaction(['gesture_events', 'sessions'], 'readwrite');
      const eventStore = tx.objectStore('gesture_events');
      const sessStore = tx.objectStore('sessions');

      for (const item of toWrite) {
        eventStore.add(item);
      }

      // Update session statistics
      const sessReq = sessStore.get(this.currentSessionId);
      sessReq.onsuccess = () => {
        const sess = sessReq.result;
        if (sess) {
          sess.totalGesturesCount += toWrite.length;
          sess.tokensStream.push(...toWrite.map((w) => w.sign));
          sessStore.put(sess);
        }
      };
    } catch (e) {
      console.warn('Could not flush gesture logs to IndexedDB', e);
    }
  }

  /**
   * Fetches recent gesture logs
   */
  public async getRecentLogs(limit: number = 50): Promise<GestureLogRecord[]> {
    if (!this.db) return [];

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('gesture_events', 'readonly');
        const store = tx.objectStore('gesture_events');
        const req = store.openCursor(null, 'prev');
        const results: GestureLogRecord[] = [];

        req.onsuccess = (e: any) => {
          const cursor = e.target.result;
          if (cursor && results.length < limit) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };

        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  /**
   * Exports full telemetry dataset as JSON
   */
  public async exportDatasetJSON(): Promise<string> {
    const logs = await this.getRecentLogs(500);
    return JSON.stringify(
      {
        datasetName: 'SignBridge-ISL-EdgeTelemetry',
        exportTimestamp: new Date().toISOString(),
        totalSamples: logs.length,
        logs,
      },
      null,
      2
    );
  }

  /**
   * Clears database history
   */
  public async clearHistory(): Promise<void> {
    if (!this.db) return;
    try {
      const tx = this.db.transaction(['gesture_events', 'sessions'], 'readwrite');
      tx.objectStore('gesture_events').clear();
      tx.objectStore('sessions').clear();
    } catch {
      // Ignore
    }
  }
}

export const edgeDatabase = new EdgeDatabasePipeline();
