/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { TreeItemCollapsibleState } from 'vscode'
import { AWSTreeNodeBase } from '../../../../shared/treeview/nodes/awsTreeNodeBase'
import { HookSummary } from '../../hooks/hooksRequestTypes'

export class HookNode extends AWSTreeNodeBase {
    public constructor(public readonly hook: HookSummary) {
        super(hook.typeName, TreeItemCollapsibleState.None)
        this.description = hook.description
        this.contextValue = 'hookNode'
        this.tooltip = `${hook.typeName}\n${hook.description ?? ''}\nARN: ${hook.typeArn}`
    }
}
