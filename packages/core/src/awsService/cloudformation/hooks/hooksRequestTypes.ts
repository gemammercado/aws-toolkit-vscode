/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { RequestType } from 'vscode-languageserver-protocol'

export type HookSummary = {
    typeName: string
    typeArn: string
    defaultVersionId?: string
    description?: string
    lastUpdated?: string
}

export type ListHooksParams = {
    loadMore?: boolean
}

export type ListHooksResult = {
    hooks: HookSummary[]
    nextToken?: string
}

export const ListHooksRequest = new RequestType<ListHooksParams, ListHooksResult, void>('aws/cfn/hooks/list')

export type DescribeHookParams = {
    typeName?: string
    arn?: string
}

export type HookTargetInfo = {
    targetName: string
    invocationPoint: string
    failureMode: string
}

export type DescribeHookResult = {
    typeName: string
    arn: string
    description?: string
    schema?: string
    configurationSchema?: string
    visibility: string
    defaultVersionId?: string
    lastUpdated?: string
    targets?: HookTargetInfo[]
}

export const DescribeHookRequest = new RequestType<DescribeHookParams, DescribeHookResult, void>(
    'aws/cfn/hooks/describe'
)

export type ConfigureHookParams = {
    typeName: string
    failureMode: string
}

export type ConfigureHookResult = {
    configurationArn?: string
}

export const ConfigureHookRequest = new RequestType<ConfigureHookParams, ConfigureHookResult, void>(
    'aws/cfn/hooks/configure'
)
