import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../models/task.interface';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly STORAGE_KEY = 'tasks';
  private tasksSubject = new BehaviorSubject<Task[]>([]);

  constructor(private storageService: StorageService) {
    this.loadTasks();
  }

  /**
   * Gets the observable stream of tasks
   */
  getTasks(): Observable<Task[]> {
    return new Observable(subscriber => {
      this.tasksSubject.subscribe(tasks => {
        subscriber.next(tasks);
      });
    });
  }

  /**
   * Loads tasks from storage
   */
  private async loadTasks(): Promise<void> {
    const tasks = await this.storageService.get<Task[]>(this.STORAGE_KEY) || [];
    const sortedTasks = tasks.sort((a, b) =>
      new Date(b.created).getTime() - new Date(a.created).getTime()
    );
    this.tasksSubject.next(sortedTasks);
  }

  /**
   * Adds a new task
   */
  async addTask(title: string, categoryId: number | null): Promise<void> {
    const tasks = this.tasksSubject.value;
    const newTask: Task = {
      id: Date.now(),
      title: title.trim(),
      completed: false,
      created: new Date(),
      categoryId: categoryId === 0 ? null : categoryId
    };

    const updatedTasks = [newTask, ...tasks];
    await this.storageService.set(this.STORAGE_KEY, updatedTasks);
    this.tasksSubject.next(updatedTasks);
  }

  /**
   * Updates an existing task
   */
  async updateTask(task: Task): Promise<void> {
    const tasks = this.tasksSubject.value;
    const index = tasks.findIndex(t => t.id === task.id);

    if (index !== -1) {
      const updatedTasks = [
        ...tasks.slice(0, index),
        { ...task, title: task.title.trim() },
        ...tasks.slice(index + 1)
      ];
      await this.storageService.set(this.STORAGE_KEY, updatedTasks);
      this.tasksSubject.next(updatedTasks);
    }
  }

  /**
   * Deletes a task
   */
  async deleteTask(taskId: number): Promise<void> {
    const tasks = this.tasksSubject.value;
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    await this.storageService.set(this.STORAGE_KEY, updatedTasks);
    this.tasksSubject.next(updatedTasks);
  }

  /**
   * Updates category for tasks when a category is deleted
   */
  async handleCategoryDeletion(categoryId: number): Promise<void> {
    const tasks = this.tasksSubject.value;
    const updatedTasks = tasks.map(task =>
      task.categoryId === categoryId ? { ...task, categoryId: null } : task
    );
    await this.storageService.set(this.STORAGE_KEY, updatedTasks);
    this.tasksSubject.next(updatedTasks);
  }
}