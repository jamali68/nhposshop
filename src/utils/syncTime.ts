/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatTime12h(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return 'Not yet synced';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return 'Invalid date';

  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

export function formatRelativeTime(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return 'Never';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const now = Date.now();
  const diffMs = Math.max(0, now - d.getTime());
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 20) return 'Just now (ابھی ابھی)';
  if (diffSec < 60) return `${diffSec}s ago (${diffSec} سیکنڈ پہلے)`;
  if (diffMin === 1) return '1 min ago (1 منٹ پہلے)';
  if (diffMin < 60) return `${diffMin} mins ago (${diffMin} منٹ پہلے)`;
  if (diffHours === 1) return '1 hour ago (1 گھنٹہ پہلے)';
  if (diffHours < 24) return `${diffHours} hours ago (${diffHours} گھنٹے پہلے)`;
  if (diffDays === 1) return 'Yesterday (کل)';
  return `${diffDays} days ago (${diffDays} دن پہلے)`;
}
