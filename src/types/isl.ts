export type ISLSign =
  // Emergency / Needs
  | 'HELP'
  | 'WATER'
  | 'FOOD'
  | 'MEDICINE'
  | 'HOSPITAL'
  | 'POLICE'
  | 'BATHROOM'
  | 'PAIN'
  | 'DANGER'
  | 'AMBULANCE'
  // Campus / Action
  | 'TEACHER'
  | 'CLASS'
  | 'GO'
  | 'COME'
  | 'STOP'
  | 'WAIT'
  | 'REPEAT'
  | 'WANT'
  | 'NEED'
  | 'LEARN'
  | 'BOOK'
  | 'WRITE'
  // Greetings / Courtesy
  | 'HELLO'
  | 'GOODBYE'
  | 'THANK_YOU'
  | 'PLEASE'
  | 'SORRY'
  | 'YES'
  | 'NO'
  | 'OKAY'
  | 'NAMASTE'
  | 'FRIEND'
  | 'IDLE';

// Alias for backward compatibility
export type ISLSignId = ISLSign;

export type ISLSignCategory =
  | 'EMERGENCY'
  | 'NEEDS'
  | 'CAMPUS'
  | 'GREETINGS'
  | 'ACTIONS';

export type SignCategory = 'emergency' | 'campus' | 'greetings';

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type HandLandmarks = Landmark3D[]; // 21 landmarks
export type PoseLandmarks = Landmark3D[]; // 33 landmarks
export type HandLandmarkArray = Landmark3D[];
export type PoseLandmarkArray = Landmark3D[];

export interface FingerExtensionScores {
  thumb: number;   // 0.0 to 1.0
  index: number;
  middle: number;
  ring: number;
  pinky: number;
}

export interface FingerCurlState {
  isThumbCurled: boolean;
  isIndexCurled: boolean;
  isMiddleCurled: boolean;
  isRingCurled: boolean;
  isPinkyCurled: boolean;
}

export interface HandOrientation {
  pitch: number;
  yaw: number;
  roll: number;
  palmFacing: 'camera' | 'user' | 'up' | 'down' | 'left' | 'right';
}

export type RecognizedHandShape =
  | 'OPEN_PALM'
  | 'FIST'
  | 'THUMBS_UP'
  | 'POINT_1'
  | 'PEACE_2'
  | 'W_SHAPE'
  | 'OK_SHAPE'
  | 'C_SHAPE'
  | 'PINCH_FOOD'
  | 'HOOK_X'
  | 'Y_SHAPE'
  | 'L_SHAPE'
  | 'UNKNOWN';

export interface HandState {
  isOpen: boolean;
  isClosed: boolean;
  isPinching: boolean;
  fingerCurls: FingerCurlState;
  fingerExtensions: FingerExtensionScores;
  angles: number[];
  detectedShape: RecognizedHandShape;
}

export interface NormalizedHandFeatures {
  vector63: number[];
  wristDistance: number;
  fingerCurls: FingerCurlState;
  fingerExtensions: FingerExtensionScores;
  detectedShape: RecognizedHandShape;
  shapeConfidence: number;
  fingerDistances: {
    thumbToIndex: number;
    thumbToMiddle: number;
    indexToMiddle: number;
    thumbToPinky: number;
    indexTipToWrist: number;
  };
  orientation: HandOrientation;
  rawLandmarks: Landmark3D[];
}

export interface FrameLandmarkData {
  timestamp: number;
  leftHand?: NormalizedHandFeatures;
  rightHand?: NormalizedHandFeatures;
  pose?: {
    nose: Landmark3D;
    leftShoulder: Landmark3D;
    rightShoulder: Landmark3D;
    leftElbow: Landmark3D;
    rightElbow: Landmark3D;
    leftWrist: Landmark3D;
    rightWrist: Landmark3D;
    shoulderSpan: number;
  };
}

export interface ClassificationScore {
  sign: ISLSign;
  confidence: number;
  matchReason?: string;
}

export interface ClassificationResult {
  sign: ISLSign;
  confidence: number;
  isDynamic: boolean;
  latencyMs: number;
  isUncertain?: boolean;
  rankedScores?: ClassificationScore[];
  motionDetected?: boolean;
  timestamp?: number;
}

export interface FrameTelemetry {
  fps: number;
  latency: number;
  rawLandmarkCount: number;
  isTracking: boolean;
}

export interface TelemetryMetrics {
  fps: number;
  latencyMs: number;
  confidence: number;
  isOffline: boolean;
  handsCount: number;
  poseDetected: boolean;
  frameCount: number;
  bufferDepth: number;
  activeSign: ISLSign | 'UNCERTAIN' | 'NONE';
  detectedShape?: RecognizedHandShape;
  fingerExtensions?: FingerExtensionScores;
}

export interface ISLSignDefinition {
  id: ISLSign;
  label: string;
  category: SignCategory;
  description: string;
  motionType: 'static' | 'dynamic';
  instructions: string[];
  emoji: string;
  keyPoints: string[];
  speechText: string;
  hindiTranslation: string;
  twoHanded: boolean;
}

export interface SentenceToken {
  id: string;
  sign: ISLSign;
  label: string;
  emoji: string;
  timestamp: number;
  confidence: number;
}

export interface PracticeTarget {
  signId: ISLSign;
  targetHoldingFrames: number;
  currentHoldingFrames: number;
  isSuccess: boolean;
  feedback: string;
}
