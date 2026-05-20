/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { TreeItemCollapsibleState } from 'vscode'
import { AWSTreeNodeBase } from '../../../../shared/treeview/nodes/awsTreeNodeBase'
import { HooksManager } from '../../hooks/hooksManager'
import { HookSummary } from '../../hooks/hooksRequestTypes'
import { HookNode } from './hookNode'
import { commandKey } from '../../utils'

class LoadMoreHooksNode extends AWSTreeNodeBase {
    public constructor(private readonly parent: HooksNode) {
        super('[Load More...]', TreeItemCollapsibleState.None)
        this.contextValue = 'loadMoreHooks'
        this.command = {
            title: 'Load More',
            command: commandKey('api.loadMoreHooks'),
            arguments: [this.parent],
        }
    }
}

export class HooksNode extends AWSTreeNodeBase {
    public constructor(private readonly hooksManager: HooksManager) {
        super('Hooks', TreeItemCollapsibleState.Collapsed)
        this.contextValue = 'hookSection'
    }

    public override async getChildren(): Promise<AWSTreeNodeBase[]> {
        await this.hooksManager.ensureLoaded()
        this.updateNode()
        const hooks = this.hooksManager.get()
        const nodes = hooks.map((hook: HookSummary) => new HookNode(hook))
        return this.hooksManager.hasMore() ? [...nodes, new LoadMoreHooksNode(this)] : nodes
    }

    private updateNode(): void {
        const count = this.hooksManager.get().length
        const hasMore = this.hooksManager.hasMore()
        this.description = hasMore ? `(${count}+)` : `(${count})`
    }

    public async loadMoreHooks(): Promise<void> {
        await this.hooksManager.loadMore()
        this.updateNode()
    }
}
