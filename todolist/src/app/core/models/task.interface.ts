export interface Task {
    id: number;
    title: string;
    completed: boolean;
    created: Date;
    categoryId: number | null;
}