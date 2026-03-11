import { Activity, Role } from '../types';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function getOverlapActivities(
activities: Activity[],
roleIds: string[])
: Activity[] {
  if (roleIds.length === 0) return activities;
  return activities.filter(
    (activity) =>
    roleIds.every((id) => activity.roleIds.includes(id)) &&
    activity.roleIds.length === roleIds.length // Exact match for the specific overlap
  );
}

export function getRoleActivities(
activities: Activity[],
roleId: string)
: Activity[] {
  return activities.filter((activity) => activity.roleIds.includes(roleId));
}

export function getActivitiesByExactRoles(
activities: Activity[],
roleIds: string[])
: Activity[] {
  if (roleIds.length === 0) return activities;
  return activities.filter(
    (activity) =>
    activity.roleIds.length === roleIds.length &&
    roleIds.every((id) => activity.roleIds.includes(id))
  );
}

// Deterministic pseudo-random number generator based on string seed
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function () {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

export interface Point {
  x: number;
  y: number;
}

// Calculate base positions for Venn diagram circles
export function getVennPositions(
roleCount: number,
centerX = 200,
centerY = 200,
radius = 65)
: Point[] {
  const positions: Point[] = [];

  if (roleCount === 0) return positions;
  if (roleCount === 1) return [{ x: centerX, y: centerY }];

  if (roleCount === 2) {
    return [
    { x: centerX - 40, y: centerY },
    { x: centerX + 40, y: centerY }];

  }

  if (roleCount === 3) {
    return [
    { x: centerX, y: centerY - 45 },
    { x: centerX - 45, y: centerY + 25 },
    { x: centerX + 45, y: centerY + 25 }];

  }

  // For 4-6 roles, arrange in a circle
  const angleStep = Math.PI * 2 / roleCount;
  // Offset by -PI/2 to start at the top
  const startAngle = -Math.PI / 2;

  for (let i = 0; i < roleCount; i++) {
    const angle = startAngle + i * angleStep;
    positions.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  }

  return positions;
}

// Calculate a position for an activity dot based on its roles
export function getActivityDotPosition(
activity: Activity,
roles: Role[],
rolePositions: Record<string, Point>)
: Point {
  const activeRoles = activity.roleIds.filter((id) => rolePositions[id]);

  if (activeRoles.length === 0) return { x: 200, y: 200 };

  // Calculate centroid of involved roles
  let sumX = 0;
  let sumY = 0;
  activeRoles.forEach((id) => {
    sumX += rolePositions[id].x;
    sumY += rolePositions[id].y;
  });

  let centerX = sumX / activeRoles.length;
  let centerY = sumY / activeRoles.length;

  // If it's a single role, push it slightly away from the absolute center (200,200)
  // so it doesn't sit exactly on the inner edge
  if (activeRoles.length === 1) {
    const dx = centerX - 200;
    const dy = centerY - 200;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      centerX += dx / dist * 20;
      centerY += dy / dist * 20;
    }
  }

  // Add deterministic jitter based on activity ID so dots don't perfectly overlap
  const rand = seededRandom(activity.id);
  const jitterRadius = activeRoles.length > 1 ? 15 : 25;
  const angle = rand() / 4294967296 * Math.PI * 2;
  const distance = rand() / 4294967296 * jitterRadius;

  return {
    x: centerX + Math.cos(angle) * distance,
    y: centerY + Math.sin(angle) * distance
  };
}

export function formatRelativeTime(timestamp: number): string {
  // Clamp future timestamps — activities can't be in the future
  const clampedTimestamp = Math.min(timestamp, Date.now());
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const daysDifference = Math.round(
    (clampedTimestamp - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysDifference === 0) {
    const hoursDifference = Math.round(
      (clampedTimestamp - Date.now()) / (1000 * 60 * 60)
    );
    if (hoursDifference === 0) {
      const minutesDifference = Math.round(
        (clampedTimestamp - Date.now()) / (1000 * 60)
      );
      if (minutesDifference === 0) return 'Just now';
      return rtf.format(minutesDifference, 'minute');
    }
    return rtf.format(hoursDifference, 'hour');
  }

  if (daysDifference > -7) {
    return rtf.format(daysDifference, 'day');
  }

  return new Date(clampedTimestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}

export function getActivitiesInPeriod(
activities: Activity[],
period: 'day' | 'week' | 'quarter')
: Activity[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  let cutoff = 0;

  if (period === 'day') cutoff = now - dayMs;
  if (period === 'week') cutoff = now - 7 * dayMs;
  if (period === 'quarter') cutoff = now - 90 * dayMs;

  return activities.filter((a) => a.timestamp >= cutoff);
}

export function getRoleActivityCounts(
activities: Activity[],
roles: Role[])
: Record<string, number> {
  const counts: Record<string, number> = {};
  roles.forEach((r) => counts[r.id] = 0);

  activities.forEach((a) => {
    a.roleIds.forEach((id) => {
      if (counts[id] !== undefined) counts[id]++;
    });
  });

  return counts;
}

export function getSharedActivityCount(
activities: Activity[],
roleId1: string,
roleId2: string)
: number {
  return activities.filter(
    (a) => a.roleIds.includes(roleId1) && a.roleIds.includes(roleId2)
  ).length;
}

export function formatDuration(minutes: number): string {
  if (!minutes) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function getRoleTimeLogged(
activities: Activity[],
roles: Role[])
: Record<string, number> {
  const times: Record<string, number> = {};
  roles.forEach((r) => times[r.id] = 0);

  activities.forEach((a) => {
    const duration = a.duration || 0;
    a.roleIds.forEach((id) => {
      if (times[id] !== undefined) times[id] += duration;
    });
  });

  return times;
}

export function getSharedTimeLogged(
activities: Activity[],
roleId1: string,
roleId2: string)
: number {
  return activities.
  filter((a) => a.roleIds.includes(roleId1) && a.roleIds.includes(roleId2)).
  reduce((total, a) => total + (a.duration || 0), 0);
}