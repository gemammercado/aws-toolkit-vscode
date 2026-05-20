/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Disposable } from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'
import { HookSummary, ListHooksRequest } from './hooksRequestTypes'
import { handleLspError } from '../utils/onlineErrorHandler'

export class HooksManager implements Disposable {
    private hooks: HookSummary[] = []
    private nextToken?: string
    private loaded = false

    constructor(private readonly client: LanguageClient) {}

    get(): HookSummary[] {
        return [...this.hooks]
    }

    hasMore(): boolean {
        return this.nextToken !== undefined
    }

    isLoaded(): boolean {
        return this.loaded
    }

    async ensureLoaded(): Promise<void> {
        if (!this.loaded) {
            await this.loadHooks()
        }
    }

    async loadMore(): Promise<void> {
        if (!this.nextToken) {
            return
        }
        await this.loadHooks(true)
    }

    async refresh(): Promise<void> {
        this.clear()
        await this.loadHooks()
    }

    clear(): void {
        this.hooks = []
        this.nextToken = undefined
        this.loaded = false
    }

    dispose(): void {
        // no-op
    }

    private async loadHooks(loadMore = false): Promise<void> {
        try {
            const response = await this.client.sendRequest(ListHooksRequest, { loadMore })
            this.hooks = response.hooks
            this.nextToken = response.nextToken
            this.loaded = true
        } catch (error) {
            await handleLspError(error, 'Error loading hooks')
            if (!loadMore) {
                this.hooks = []
                this.nextToken = undefined
            }
        }
    }
}
