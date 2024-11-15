import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Category } from '../models/category.interface';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private readonly STORAGE_KEY = 'categories';
    private categoriesSubject = new BehaviorSubject<Category[]>([]);

    constructor(private storageService: StorageService) {
        this.loadCategories();
    }

    /**
     * Gets the observable stream of categories
     */
    getCategories(): Observable<Category[]> {
        return this.categoriesSubject.asObservable();
    }

    /**
     * Gets the current value of categories
     */
    getCurrentCategories(): Category[] {
        return this.categoriesSubject.value;
    }

    /**
     * Loads categories from storage
     */
    private async loadCategories(): Promise<void> {
        const categories = await this.storageService.get<Category[]>(this.STORAGE_KEY) || [];
        this.categoriesSubject.next(categories);
    }

    /**
     * Adds a new category
     */
    async addCategory(name: string): Promise<void> {
        const categories = this.getCurrentCategories();
        const newCategory: Category = {
            id: Date.now(),
            name: name.trim()
        };

        const updatedCategories = [...categories, newCategory];
        await this.storageService.set(this.STORAGE_KEY, updatedCategories);
        this.categoriesSubject.next(updatedCategories);
    }

    /**
     * Updates an existing category
     */
    async updateCategory(category: Category): Promise<void> {
        const categories = this.getCurrentCategories();
        const index = categories.findIndex(c => c.id === category.id);

        if (index !== -1) {
            const updatedCategories = [
                ...categories.slice(0, index),
                { ...category, name: category.name.trim() },
                ...categories.slice(index + 1)
            ];
            await this.storageService.set(this.STORAGE_KEY, updatedCategories);
            this.categoriesSubject.next(updatedCategories);
        }
    }

    /**
     * Deletes a category
     */
    async deleteCategory(categoryId: number): Promise<void> {
        const categories = this.getCurrentCategories();
        const updatedCategories = categories.filter(c => c.id !== categoryId);
        await this.storageService.set(this.STORAGE_KEY, updatedCategories);
        this.categoriesSubject.next(updatedCategories);
    }
}