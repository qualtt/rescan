export type Item = {
  id: string;
  name: string;
  price: number;
  category: string;
  assignedTo: string; // 'UNASSIGNED', 'SHARED', or participant id
};

export type Participant = {
  id: string;
  name: string;
};
