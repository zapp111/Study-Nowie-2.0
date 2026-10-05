/**
 * Rules that are deliberately easy to change.
 *
 * Locking is off by default. Falling two days behind in October is normal and
 * being shut out of the plan because of it would do more harm than good — but
 * the rule is here in one place if it ever earns its keep.
 */

import { SESSIONS, getSessionByNumber, type Session } from './content';
import type { ProgressState } from './progress-store';
import { sessionProgress, type Visibility } from './stats';

export const RULES = {
  /** Turn on to require the previous day before opening the next one. */
  lockFutureSessions: false,
  /** How many days ahead stay open when locking is on. */
  lookaheadDays: 2,
  /** A quiz counts as passed at this percentage. */
  passPercentage: 70,
  /** Days before a logged mistake comes back for a reattempt. */
  reattemptAfterDays: 3,
};

export function isSessionLocked(session: Session, state: ProgressState, v: Visibility): boolean {
  if (!RULES.lockFutureSessions) return false;

  const explicit = session.number && getSessionByNumber(session.number - 1);
  if (!explicit) return false;

  const index = SESSIONS.findIndex((s) => s.id === session.id);
  const previous = SESSIONS.slice(Math.max(0, index - RULES.lookaheadDays), index).filter((s) => s.blocks.length > 0);

  return previous.some((s) => !sessionProgress(s, state, v).complete);
}
