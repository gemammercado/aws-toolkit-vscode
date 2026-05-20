/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import * as sinon from 'sinon'
import { HooksManager } from '../../../../awsService/cloudformation/hooks/hooksManager'

describe('HooksManager', () => {
    let sandbox: sinon.SinonSandbox
    let manager: HooksManager
    let mockClient: any

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        mockClient = {
            sendRequest: sandbox.stub().resolves({
                hooks: [
                    { typeName: 'Private::Guard::S3Check', typeArn: 'arn:1', description: 'S3 encryption check' },
                    { typeName: 'Private::Guard::IAMCheck', typeArn: 'arn:2' },
                ],
                nextToken: undefined,
            }),
        }
        manager = new HooksManager(mockClient)
    })

    afterEach(() => {
        manager.dispose()
        sandbox.restore()
    })

    describe('lazy loading', () => {
        it('should not load hooks on construction', () => {
            assert.strictEqual(mockClient.sendRequest.called, false)
        })

        it('should return empty array when not loaded', () => {
            assert.deepStrictEqual(manager.get(), [])
        })

        it('should report not loaded initially', () => {
            assert.strictEqual(manager.isLoaded(), false)
        })

        it('should load hooks on ensureLoaded', async () => {
            await manager.ensureLoaded()
            assert.strictEqual(mockClient.sendRequest.calledOnce, true)
        })

        it('should not reload on subsequent ensureLoaded calls', async () => {
            await manager.ensureLoaded()
            await manager.ensureLoaded()
            assert.strictEqual(mockClient.sendRequest.calledOnce, true)
        })

        it('should report loaded after ensureLoaded', async () => {
            await manager.ensureLoaded()
            assert.strictEqual(manager.isLoaded(), true)
        })

        it('should return hooks after ensureLoaded', async () => {
            await manager.ensureLoaded()
            const hooks = manager.get()
            assert.strictEqual(hooks.length, 2)
            assert.strictEqual(hooks[0].typeName, 'Private::Guard::S3Check')
        })
    })

    describe('pagination', () => {
        it('should report hasMore when nextToken exists', async () => {
            mockClient.sendRequest.resolves({
                hooks: [{ typeName: 'Hook1', typeArn: 'arn:1' }],
                nextToken: 'page-2',
            })

            await manager.ensureLoaded()
            assert.strictEqual(manager.hasMore(), true)
        })

        it('should report no more when nextToken is undefined', async () => {
            await manager.ensureLoaded()
            assert.strictEqual(manager.hasMore(), false)
        })

        it('should append hooks on loadMore', async () => {
            mockClient.sendRequest.resolves({
                hooks: [{ typeName: 'Hook1', typeArn: 'arn:1' }],
                nextToken: 'page-2',
            })
            await manager.ensureLoaded()

            mockClient.sendRequest.resolves({
                hooks: [{ typeName: 'Hook1', typeArn: 'arn:1' }, { typeName: 'Hook2', typeArn: 'arn:2' }],
                nextToken: undefined,
            })
            await manager.loadMore()

            const hooks = manager.get()
            assert.strictEqual(hooks.length, 2)
            assert.strictEqual(hooks[1].typeName, 'Hook2')
        })
    })

    describe('clear', () => {
        beforeEach(async () => {
            await manager.ensureLoaded()
        })

        it('should clear hooks', () => {
            manager.clear()
            assert.deepStrictEqual(manager.get(), [])
        })

        it('should reset loaded state', () => {
            manager.clear()
            assert.strictEqual(manager.isLoaded(), false)
        })

        it('should reset hasMore', () => {
            manager.clear()
            assert.strictEqual(manager.hasMore(), false)
        })

        it('should allow reload after clear', async () => {
            manager.clear()
            mockClient.sendRequest.resetHistory()
            await manager.ensureLoaded()
            assert.strictEqual(mockClient.sendRequest.calledOnce, true)
        })
    })

    describe('refresh', () => {
        it('should reload from scratch', async () => {
            await manager.ensureLoaded()
            mockClient.sendRequest.resetHistory()
            mockClient.sendRequest.resolves({
                hooks: [{ typeName: 'NewHook', typeArn: 'arn:new' }],
                nextToken: undefined,
            })

            await manager.refresh()

            const hooks = manager.get()
            assert.strictEqual(hooks.length, 1)
            assert.strictEqual(hooks[0].typeName, 'NewHook')
        })
    })
})
