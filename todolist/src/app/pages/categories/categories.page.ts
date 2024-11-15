import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CategoryService } from '../../core/services/category.service';
import { TaskService } from '../../core/services/task.service'
import { Category } from '../../core/models/category.interface';
import { AlertController, ToastController, IonList } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-categories',
    templateUrl: 'categories.page.html'
})
export class CategoriesPage implements OnInit, OnDestroy {
    @ViewChild(IonList) list!: IonList;

    categories: Category[] = [];
    newCategoryName: string = '';
    private subscription: Subscription = new Subscription();

    constructor(
        private categoryService: CategoryService,
        private taskService: TaskService,
        private alertCtrl: AlertController,
        private toastCtrl: ToastController
    ) { }

    ngOnInit() {
        this.subscription.add(
            this.categoryService.getCategories().subscribe(
                categories => this.categories = categories
            )
        );
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    async addCategory() {
        if (this.newCategoryName.trim()) {
            await this.categoryService.addCategory(this.newCategoryName);
            this.newCategoryName = '';
        }
    }

    async editCategory(category: Category) {
        const alert = await this.alertCtrl.create({
            header: 'Editar categoría',
            inputs: [
                {
                    name: 'name',
                    type: 'text',
                    value: category.name,
                    placeholder: 'Nombre de la categoría'
                }
            ],
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Actualizar',
                    handler: async (data) => {
                        if (data.name.trim()) {
                            await this.categoryService.updateCategory({
                                ...category,
                                name: data.name
                            });
                            this.list.closeSlidingItems();
                        }
                    }
                }
            ]
        });
        await alert.present();
    }

    async deleteCategory(category: Category) {
        const alert = await this.alertCtrl.create({
            header: 'Eliminar categoría',
            message: 'Las tareas en esta categoría se convertirán en sin categoría. ¿Continuar?',
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    handler: async () => {
                        await this.categoryService.deleteCategory(category.id);
                        await this.taskService.handleCategoryDeletion(category.id);
                        const toast = await this.toastCtrl.create({
                            message: 'Categoría eliminada',
                            duration: 2000
                        });
                        toast.present();
                    }
                }
            ]
        });
        await alert.present();
    }
}