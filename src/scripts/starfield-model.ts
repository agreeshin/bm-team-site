export interface Star { x: number; y: number; z: number; size: number; phase: number; cyan: boolean }
export interface Projection { x: number; y: number; radius: number; alpha: number }

export const FAR_DEPTH = 1.15;
const NEAR_DEPTH = .13;
const FLIGHT_SPEED = .105;

export function starCount(width: number, height: number): number {
  const mobile = width <= 700;
  return Math.min(mobile ? 140 : 440, Math.max(mobile ? 70 : 180, Math.round(width * height / (mobile ? 1900 : 3000))));
}

export function createStar(random: () => number, initial = false): Star {
  const z = initial ? .2 + random() * .95 : FAR_DEPTH;
  return { x: (random() - .68) * z / .52, y: (random() - .43) * z / .52,
    z, size: .55 + random() * .65, phase: random() * Math.PI * 2, cyan: random() < .35 };
}

export function projectStar(star: Star, width: number, height: number): Projection {
  const perspective = .52 / Math.max(star.z, NEAR_DEPTH);
  return { x: width * (.68 + star.x * perspective), y: height * (.43 + star.y * perspective),
    radius: Math.min(1.9, .35 + star.size * (.22 / Math.max(star.z, NEAR_DEPTH))),
    alpha: Math.min(1, Math.max(0, (FAR_DEPTH - star.z) / .15)) * (.3 + .5 * (1 - star.z / FAR_DEPTH)) };
}

/** Advance in-place: bounded pool, no particle allocations during normal frames. */
export function advanceStar(star: Star, seconds: number, width: number, height: number, random: () => number): boolean {
  star.z -= Math.min(.05, Math.max(0, seconds)) * FLIGHT_SPEED;
  const point = projectStar(star, width, height);
  if (star.z < NEAR_DEPTH || point.x < -12 || point.x > width + 12 || point.y < -12 || point.y > height + 12) {
    Object.assign(star, createStar(random));
    return true;
  }
  return false;
}
