export interface Task {
  id: string;
  title: string;
  difficulty: "Low" | "Medium" | "High";
  reward: number;
}

export const TASKS: Task[] = [
  { id: "1", title: "Make a Sandwich", difficulty: "Low", reward: 100 },
  { id: "2", title: "Wipe the Table", difficulty: "Low", reward: 100 },
  { id: "3", title: "Sort Recycling", difficulty: "Medium", reward: 150 },
  { id: "4", title: "Fold Laundry", difficulty: "Medium", reward: 150 },
  { id: "5", title: "Load Dishwasher", difficulty: "High", reward: 200 },
  { id: "6", title: "Water Plants", difficulty: "Low", reward: 100 },
];
