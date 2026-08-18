import { FrameLandmarkData, Landmark3D } from '@/types/isl';

export interface TrajectoryAnalysis {
  frameCount: number;
  durationMs: number;
  averageVelocity: { x: number; y: number; z: number; total: number };
  peakVelocity: number;
  displacement: { x: number; y: number; z: number; total: number };
  variance: { x: number; y: number; z: number; total: number };
  motionDetected: boolean;
  isOscillatingHorizontal: boolean;
  isOscillatingVertical: boolean;
  isCircular: boolean;
  isExpanding: boolean;
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'FORWARD' | 'BACKWARD' | 'STATIONARY';
}

interface BufferSlot {
  vector: Float32Array;
  timestamp: number;
  frameData?: FrameLandmarkData;
  isOccupied: boolean;
}

/**
 * FILE 3: TemporalBuffer
 * High-Performance Pre-Allocated Circular Ring Buffer.
 * Zero dynamic heap allocations on push() for 60 FPS sub-millisecond execution.
 */
export class TemporalBuffer {
  private bufferSize: number;
  private ring: BufferSlot[];
  private head: number = 0;
  private count: number = 0;

  constructor(bufferSize: number = 30) {
    this.bufferSize = bufferSize;
    this.ring = new Array(bufferSize);
    for (let i = 0; i < bufferSize; i++) {
      this.ring[i] = {
        vector: new Float32Array(63),
        timestamp: 0,
        isOccupied: false,
      };
    }
  }

  /**
   * Pushes a new feature vector into the ring buffer in-place (Zero GC allocation)
   */
  public push(vector: number[] | Float32Array | FrameLandmarkData, timestamp?: number): void {
    const time = timestamp ?? Date.now();
    const slot = this.ring[this.head];

    if (Array.isArray(vector) || vector instanceof Float32Array) {
      const len = Math.min(63, vector.length);
      for (let i = 0; i < len; i++) {
        slot.vector[i] = vector[i];
      }
      slot.timestamp = time;
      slot.frameData = undefined;
      slot.isOccupied = true;
    } else {
      const frame = vector as FrameLandmarkData;
      const primaryHand = frame.rightHand || frame.leftHand;
      if (primaryHand && primaryHand.vector63) {
        const len = Math.min(63, primaryHand.vector63.length);
        for (let i = 0; i < len; i++) {
          slot.vector[i] = primaryHand.vector63[i];
        }
      } else {
        slot.vector.fill(0);
      }
      slot.timestamp = frame.timestamp || time;
      slot.frameData = frame;
      slot.isOccupied = true;
    }

    this.head = (this.head + 1) % this.bufferSize;
    if (this.count < this.bufferSize) {
      this.count++;
    }
  }

  /**
   * Returns chronological array of frame vectors
   */
  public getSequence(): number[][] {
    const result: number[][] = [];
    const start = this.count < this.bufferSize ? 0 : this.head;

    for (let i = 0; i < this.count; i++) {
      const idx = (start + i) % this.bufferSize;
      result.push(Array.from(this.ring[idx].vector));
    }
    return result;
  }

  /**
   * Returns true once at least 15 frames are populated
   */
  public isReady(): boolean {
    return this.count >= 15;
  }

  /**
   * Returns current buffer length
   */
  public size(): number {
    return this.count;
  }

  /**
   * Clears the buffer
   */
  public clear(): void {
    this.head = 0;
    this.count = 0;
    for (let i = 0; i < this.bufferSize; i++) {
      this.ring[i].isOccupied = false;
      this.ring[i].frameData = undefined;
    }
  }

  /**
   * Returns raw frames in chronological order
   */
  public getFrames(): FrameLandmarkData[] {
    const frames: FrameLandmarkData[] = [];
    const start = this.count < this.bufferSize ? 0 : this.head;

    for (let i = 0; i < this.count; i++) {
      const idx = (start + i) % this.bufferSize;
      if (this.ring[idx].frameData) {
        frames.push(this.ring[idx].frameData!);
      }
    }
    return frames;
  }

  /**
   * Computes delta displacement velocity vector of wrist across the last N frames
   */
  public getVelocity(windowFrames: number = 8): number[] {
    const n = Math.min(this.count, windowFrames);
    if (n < 2) {
      return [0, 0, 0, 0];
    }

    const lastIdx = (this.head - 1 + this.bufferSize) % this.bufferSize;
    const firstIdx = (this.head - n + this.bufferSize) % this.bufferSize;

    const first = this.ring[firstIdx];
    const last = this.ring[lastIdx];

    const dt = Math.max(0.01, (last.timestamp - first.timestamp) / 1000);

    const dx = last.vector[0] - first.vector[0];
    const dy = last.vector[1] - first.vector[1];
    const dz = last.vector[2] - first.vector[2];

    const vx = dx / dt;
    const vy = dy / dt;
    const vz = dz / dt;
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

    return [
      Number(vx.toFixed(3)),
      Number(vy.toFixed(3)),
      Number(vz.toFixed(3)),
      Number(speed.toFixed(3)),
    ];
  }

  /**
   * Fast trajectory analysis
   */
  public analyzeTrajectory(handType: 'right' | 'left' = 'right'): TrajectoryAnalysis {
    const frames = this.getFrames();
    if (frames.length < 5) {
      const [vx, vy, vz, total] = this.getVelocity(8);
      const isMotion = total > 0.08;
      let dir: TrajectoryAnalysis['direction'] = 'STATIONARY';
      if (isMotion) {
        if (Math.abs(vx) > Math.abs(vy)) dir = vx > 0 ? 'RIGHT' : 'LEFT';
        else dir = vy < 0 ? 'UP' : 'DOWN';
      }

      return {
        frameCount: this.count,
        durationMs: 0,
        averageVelocity: { x: vx, y: vy, z: vz, total },
        peakVelocity: total,
        displacement: { x: 0, y: 0, z: 0, total: 0 },
        variance: { x: 0, y: 0, z: 0, total: 0 },
        motionDetected: isMotion,
        isOscillatingHorizontal: false,
        isOscillatingVertical: false,
        isCircular: false,
        isExpanding: false,
        direction: dir,
      };
    }

    const validFrames = frames.filter((f) => {
      const hand = handType === 'right' ? f.rightHand : f.leftHand;
      return hand && hand.rawLandmarks && hand.rawLandmarks.length >= 21;
    });

    if (validFrames.length < 5) {
      const [vx, vy, vz, total] = this.getVelocity(8);
      return {
        frameCount: validFrames.length,
        durationMs: 0,
        averageVelocity: { x: vx, y: vy, z: vz, total },
        peakVelocity: total,
        displacement: { x: 0, y: 0, z: 0, total: 0 },
        variance: { x: 0, y: 0, z: 0, total: 0 },
        motionDetected: total > 0.08,
        isOscillatingHorizontal: false,
        isOscillatingVertical: false,
        isCircular: false,
        isExpanding: false,
        direction: 'STATIONARY',
      };
    }

    const firstFrame = validFrames[0];
    const lastFrame = validFrames[validFrames.length - 1];
    const durationMs = Math.max(1, lastFrame.timestamp - firstFrame.timestamp);

    const wristPoints: Landmark3D[] = validFrames.map((f) => {
      const hand = handType === 'right' ? f.rightHand! : f.leftHand!;
      return hand.rawLandmarks[0];
    });

    let totalVelX = 0;
    let totalVelY = 0;
    let totalVelZ = 0;
    let totalVelMag = 0;
    let peakVelocity = 0;

    let xSignChanges = 0;
    let ySignChanges = 0;
    let lastDx = 0;
    let lastDy = 0;

    for (let i = 1; i < wristPoints.length; i++) {
      const p1 = wristPoints[i - 1];
      const p2 = wristPoints[i];
      const dt = (validFrames[i].timestamp - validFrames[i - 1].timestamp) / 1000 || 0.033;

      const vx = (p2.x - p1.x) / dt;
      const vy = (p2.y - p1.y) / dt;
      const vz = ((p2.z || 0) - (p1.z || 0)) / dt;
      const vMag = Math.sqrt(vx * vx + vy * vy + vz * vz);

      totalVelX += Math.abs(vx);
      totalVelY += Math.abs(vy);
      totalVelZ += Math.abs(vz);
      totalVelMag += vMag;

      if (vMag > peakVelocity) peakVelocity = vMag;

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;

      if (Math.abs(dx) > 0.003) {
        if (lastDx !== 0 && Math.sign(dx) !== Math.sign(lastDx)) xSignChanges++;
        lastDx = dx;
      }

      if (Math.abs(dy) > 0.003) {
        if (lastDy !== 0 && Math.sign(dy) !== Math.sign(lastDy)) ySignChanges++;
        lastDy = dy;
      }
    }

    const n = wristPoints.length - 1;
    const avgVx = totalVelX / n;
    const avgVy = totalVelY / n;
    const avgVz = totalVelZ / n;
    const avgTotal = totalVelMag / n;

    const dispX = wristPoints[wristPoints.length - 1].x - wristPoints[0].x;
    const dispY = wristPoints[wristPoints.length - 1].y - wristPoints[0].y;
    const dispZ = (wristPoints[wristPoints.length - 1].z || 0) - (wristPoints[0].z || 0);
    const totalDisp = Math.sqrt(dispX * dispX + dispY * dispY + dispZ * dispZ);

    const meanX = wristPoints.reduce((acc, p) => acc + p.x, 0) / wristPoints.length;
    const meanY = wristPoints.reduce((acc, p) => acc + p.y, 0) / wristPoints.length;
    const meanZ = wristPoints.reduce((acc, p) => acc + (p.z || 0), 0) / wristPoints.length;

    const varX = wristPoints.reduce((acc, p) => acc + Math.pow(p.x - meanX, 2), 0) / wristPoints.length;
    const varY = wristPoints.reduce((acc, p) => acc + Math.pow(p.y - meanY, 2), 0) / wristPoints.length;
    const varZ = wristPoints.reduce((acc, p) => acc + Math.pow((p.z || 0) - meanZ, 2), 0) / wristPoints.length;
    const totalVar = varX + varY + varZ;

    const motionDetected = avgTotal > 0.08 || totalVar > 0.0003;
    const isOscillatingHorizontal = xSignChanges >= 2 && varX > 0.0002;
    const isOscillatingVertical = ySignChanges >= 2 && varY > 0.0002;

    const isCircular =
      varX > 0.00015 &&
      varY > 0.00015 &&
      xSignChanges >= 1 &&
      ySignChanges >= 1 &&
      totalDisp < 0.2;

    let isExpanding = false;
    if (validFrames[0].leftHand && lastFrame.leftHand) {
      const initialDist = Math.abs(validFrames[0].leftHand.rawLandmarks[0].x - validFrames[0].rightHand!.rawLandmarks[0].x);
      const finalDist = Math.abs(lastFrame.leftHand.rawLandmarks[0].x - lastFrame.rightHand!.rawLandmarks[0].x);
      isExpanding = finalDist - initialDist > 0.05;
    }

    let direction: TrajectoryAnalysis['direction'] = 'STATIONARY';
    if (motionDetected) {
      const absX = Math.abs(dispX);
      const absY = Math.abs(dispY);
      const absZ = Math.abs(dispZ);

      if (absZ > absX && absZ > absY && absZ > 0.05) {
        direction = dispZ < 0 ? 'FORWARD' : 'BACKWARD';
      } else if (absX > absY) {
        direction = dispX > 0 ? 'RIGHT' : 'LEFT';
      } else if (absY > absX) {
        direction = dispY < 0 ? 'UP' : 'DOWN';
      }
    }

    return {
      frameCount: validFrames.length,
      durationMs,
      averageVelocity: { x: avgVx, y: avgVy, z: avgVz, total: avgTotal },
      peakVelocity,
      displacement: { x: dispX, y: dispY, z: dispZ, total: totalDisp },
      variance: { x: varX, y: varY, z: varZ, total: totalVar },
      motionDetected,
      isOscillatingHorizontal,
      isOscillatingVertical,
      isCircular,
      isExpanding,
      direction,
    };
  }
}

export const TemporalRollingBuffer = TemporalBuffer;
