export type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  unit_interest: string | null;
  budget: string | null;
  notes: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Unit = {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  price: number;
  location: string | null;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  lead_id: string | null;
  unit_id: string | null;
  booking_date: string;
  status: string;
  amount: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  leads?: Lead | null;
  units?: Unit | null;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  related_lead_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  leads?: Lead | null;
};

export type Expense = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  amount: number;
  date: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};
