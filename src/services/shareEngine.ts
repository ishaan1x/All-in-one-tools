const API_BASE = '/api';

export interface ShareResult {
  id: string;
  url: string;
}

export async function createShare(
  type: 'paste' | 'note' | 'link' | 'bio',
  payload: { title?: string; content: string; isPublic: boolean; expiresAt?: string }
): Promise<ShareResult> {
  const res = await fetch(`${API_BASE}/share/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create share');
  return res.json();
}

export async function getShare(type: string, id: string) {
  const res = await fetch(`${API_BASE}/share/${type}/${id}`);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

export function copyShareLink(url: string) {
  return navigator.clipboard.writeText(url);
}
