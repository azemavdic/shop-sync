import { config } from '../constants/config';
import { useAuthStore } from '../stores/authStore';

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface Article {
  id: string;
  name: string;
  price: number;
  createdAt: string;
}

export async function getArticles(
  channelId: string,
  search?: string
): Promise<Article[]> {
  const url = new URL(
    `${config.apiUrl}/channels/${channelId}/articles`
  );
  if (search?.trim()) url.searchParams.set('search', search.trim());
  const res = await fetch(url.toString(), { headers: getAuthHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch articles');
  return data.articles;
}

export async function createArticle(
  channelId: string,
  name: string,
  price?: number
): Promise<Article> {
  const res = await fetch(
    `${config.apiUrl}/channels/${channelId}/articles`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ name: name.trim(), price: price ?? 0 }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to create article');
  return data;
}

export async function updateArticle(
  channelId: string,
  articleId: string,
  updates: { name?: string; price?: number }
): Promise<Article> {
  const res = await fetch(
    `${config.apiUrl}/channels/${channelId}/articles/${articleId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update article');
  return data;
}

export async function deleteArticle(
  channelId: string,
  articleId: string
): Promise<void> {
  const res = await fetch(
    `${config.apiUrl}/channels/${channelId}/articles/${articleId}`,
    { method: 'DELETE', headers: getAuthHeader() }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to delete article');
}
