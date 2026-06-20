export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  density: number;
  pressure: number;
  fx: number;
  fy: number;
}

export interface SimParams {
  gravity: number;
  viscosity: number;
  restDensity: number;
  gasConstant: number;
  smoothingRadius: number;
  particleMass: number;
  dt: number;
  damping: number;
  boundaryStiffness: number;
}

export interface Preset {
  name: string;
  label: string;
  description: string;
  params: Partial<SimParams>;
  particleCount: number;
  initialConfig: 'dam' | 'drop' | 'fountain' | 'wave';
}

export type TargetShape = 'rect' | 'circle' | 'custom';

export interface ExperimentTarget {
  id: string;
  name: string;
  shape: TargetShape;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: { x: number; y: number }[];
  targetFillRatio: number;
  color: string;
}

export interface ExperimentResult {
  completion: number;
  elapsedTime: number;
  particlesInTarget: number;
  totalParticles: number;
  isComplete: boolean;
}

export interface ExperimentPreset {
  id: string;
  name: string;
  label: string;
  description: string;
  initialConfig: 'dam' | 'drop' | 'fountain' | 'wave';
  particleCount: number;
  params: Partial<SimParams>;
  targets: ExperimentTarget[];
  timeLimit?: number;
}
