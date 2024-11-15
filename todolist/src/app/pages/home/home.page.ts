import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonList, AlertController, ToastController } from '@ionic/angular';
import { Subscription, combineLatest } from 'rxjs';
import { Task } from '../../core/models/task.interface';
import { Category } from '../../core/models/category.interface';
import { TaskService } from '../../core/services/task.service';
import { CategoryService } from '../../core/services/category.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild(IonContent) content!: IonContent;
  @ViewChild(IonList) list!: IonList;

  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  categories: Category[] = [];
  selectedCategoryId: number = 0;
  newTaskTitle: string = '';
  isLoading: boolean = true;

  private subscription = new Subscription();

  constructor(
    private taskService: TaskService,
    private categoryService: CategoryService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router
  ) { }

  ngOnInit() {
    this.subscription.add(
      combineLatest([
        this.taskService.getTasks(),
        this.categoryService.getCategories()
      ]).subscribe(([tasks, categories]) => {
        this.tasks = tasks;
        this.categories = categories;
        this.isLoading = false;
        
        if (!this.categories.some(category => category.id === this.selectedCategoryId)) {
          this.selectedCategoryId = 0;
        }
        this.filterTasks(this.selectedCategoryId);
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getCategoryName(categoryId: number | null): string {
    return this.categories.find(c => c.id === categoryId)?.name || 'Sin categoría';
  }

  async addTask() {
    if (!this.newTaskTitle.trim())
      return;

    const selectedCategoryId = this.selectedCategoryId !== 0 ? this.selectedCategoryId : await this.promptCategorySelection(null);
    if (selectedCategoryId === null)
      return;

    await this.taskService.addTask(this.newTaskTitle, selectedCategoryId);
    this.newTaskTitle = '';
  }

  private async promptCategorySelection(defaultCategoryId: number | null): Promise<number | null> {
    if (this.categories.length === 0)
      return 0;

    const alert = await this.alertCtrl.create({
      header: 'Seleccionar categoría',
      inputs: [
        {
          type: 'radio',
          label: 'Sin categoría',
          value: 0,
          checked: defaultCategoryId === null
        },
        ...this.categories.map(category => ({
          type: 'radio' as const,
          label: category.name,
          value: category.id,
          checked: defaultCategoryId === category.id
        }))
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Seleccionar',
          role: 'confirm',
          handler: (categoryId) => categoryId
        }
      ]
    });

    await alert.present();
    const { role, data } = await alert.onDidDismiss();

    if (role !== 'confirm')
      return null;

    return data?.values ?? 0;
  }

  async editTask(task: Task) {
    const alert = await this.alertCtrl.create({
      header: 'Editar tarea',
      inputs: [
        {
          name: 'title',
          type: 'text',
          value: task.title,
          placeholder: 'Título de la tarea'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Actualizar',
          handler: async (data) => {
            if (data.title.trim()) {
              await this.taskService.updateTask({
                ...task,
                title: data.title
              });
              this.list.closeSlidingItems();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async changeCategory(task: Task) {
    const selectedCategoryId = await this.promptCategorySelection(task.categoryId);
    if (selectedCategoryId === null)
      return;
    await this.taskService.updateTask({
      ...task,
      categoryId: selectedCategoryId === 0 ? null : selectedCategoryId
    });
    this.list.closeSlidingItems();
  }

  async toggleTask(task: Task) {
    const updatedTask = { ...task, completed: !task.completed };
    await this.taskService.updateTask(updatedTask);

    const toast = await this.toastCtrl.create({
      message: updatedTask.completed ? '✨ ¡Tarea completada!' : 'Tarea reabierta',
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  async deleteTask(task: Task) {
    await this.taskService.deleteTask(task.id);
    const toast = await this.toastCtrl.create({
      message: 'Tarea eliminada',
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  selectCategory(categoryId: number): void {
    this.toggleSelectedCategoryId(categoryId);
    this.filterTasks(this.selectedCategoryId);
  }

  filterTasks(categoryId: number): void {
    this.updateFilteredTasks(categoryId);
  }

  private toggleSelectedCategoryId(categoryId: number): void {
    this.selectedCategoryId = (categoryId === this.selectedCategoryId) ? 0 : categoryId;
  }

  private updateFilteredTasks(categoryId: number): void {
    if (categoryId !== 0) {
      this.filteredTasks = this.tasks.filter(task => task.categoryId === categoryId);
    } else {
      this.filteredTasks = [...this.tasks];
    }
  }

  goToCategories() {
    this.router.navigate(['/categories']);
  }

  trackByTaskId(index: number, task: Task): number {
    return task.id;
  }

  trackByCategoryId(index: number, category: Category): number {
    return category.id;
  }
}