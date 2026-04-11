export interface Item {
  id: number;
  category: string;
  item: string;
  quantity: string;
  notes: string;
  packed: boolean;
  loading?: boolean;
}

export interface UndoItem {
  id: number;
  name: string;
}
