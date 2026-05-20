/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { commands, window, Disposable } from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'
import { commandKey } from '../utils'
import { HooksManager } from '../hooks/hooksManager'
import { HooksNode } from '../explorer/nodes/hooksNode'
import { HookNode } from '../explorer/nodes/hookNode'
import { ConfigureHookRequest } from '../hooks/hooksRequestTypes'
import { handleLspError } from '../utils/onlineErrorHandler'
import { CloudFormationExplorer } from '../explorer/explorer'

export function refreshHooksCommand(hooksManager: HooksManager, explorer: CloudFormationExplorer): Disposable {
    return commands.registerCommand(commandKey('hooks.refresh'), async () => {
        await hooksManager.refresh()
        explorer.refresh()
    })
}

export function loadMoreHooksCommand(): Disposable {
    return commands.registerCommand(commandKey('api.loadMoreHooks'), async (node: HooksNode) => {
        await node.loadMoreHooks()
    })
}

export function configureHookCommand(client: LanguageClient, hooksManager: HooksManager, explorer: CloudFormationExplorer): Disposable {
    return commands.registerCommand(commandKey('hooks.configure'), async (node: HookNode) => {
        const failureMode = await window.showQuickPick(['FAIL', 'WARN'], {
            placeHolder: `Select failure mode for ${node.hook.typeName}`,
        })
        if (!failureMode) {
            return
        }

        try {
            await client.sendRequest(ConfigureHookRequest, {
                typeName: node.hook.typeName,
                failureMode,
            })
            await hooksManager.refresh()
            explorer.refresh()
            void window.showInformationMessage(`Hook ${node.hook.typeName} configured with failure mode: ${failureMode}`)
        } catch (error) {
            await handleLspError(error, 'Error configuring hook')
        }
    })
}
