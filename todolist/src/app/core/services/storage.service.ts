import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private initialized = false;
    private cache = new Map<string, any>();

    constructor(private storage: Storage) { }

    /**
     * Initializes the storage if not already initialized
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.initialized) {
            await this.storage.create();
            this.initialized = true;
        }
    }

    /**
     * Gets data from storage with caching
     */
    async get<T>(key: string): Promise<T | null> {
        await this.ensureInitialized();

        if (!this.cache.has(key)) {
            const value = await this.storage.get(key);
            this.cache.set(key, value);
        }

        return this.cache.get(key);
    }

    /**
     * Sets data in storage and updates cache
     */
    async set(key: string, value: any): Promise<void> {
        await this.ensureInitialized();
        this.cache.set(key, value);
        await this.storage.set(key, value);
    }
}