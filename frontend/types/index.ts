export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  memberCount?: number;
}

export interface ListItem {
  id: string;
  name: string;
  quantity?: number;
  checked: boolean;
  addedById: string;
  addedByName?: string;
  createdAt: string;
  updatedAt?: string;
}
