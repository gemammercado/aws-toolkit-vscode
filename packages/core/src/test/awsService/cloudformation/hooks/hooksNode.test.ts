/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import * as sinon from 'sinon'
import { HooksNode } from '../../../../awsService/cloudformation/explorer/nodes/hooksNode'

describe('HooksNode', () => {
    let sandbox: sinon.SinonSandbox
    let mockHooksManager: any

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        mockHooksManager = {
            ensureLoaded: sandbox.stub().resolves(),
            get: sandbox.stub().returns([
                { typeName: 'Private::Guard::S3Check', typeArn: 'arn:1', description: 'S3 check' },
                { typeName: 'Private::Guard::IAMCheck', typeArn: 'arn:2' },
            ]),
            hasMore: sandbox.stub().returns(false),
            isLoaded: sandbox.stub().returns(true),
            loadMore: sandbox.stub().resolves(),
        }
    })

    afterEach(() => {
        sandbox.restore()
    })

    it('should have label "Hooks"', () => {
        const node = new HooksNode(mockHooksManager)
        assert.strictEqual(node.label, 'Hooks')
    })

    it('should call ensureLoaded on getChildren', async () => {
        const node = new HooksNode(mockHooksManager)
        await node.getChildren()
        assert.strictEqual(mockHooksManager.ensureLoaded.calledOnce, true)
    })

    it('should return HookNode children', async () => {
        const node = new HooksNode(mockHooksManager)
        const children = await node.getChildren()
        assert.strictEqual(children.length, 2)
    })

    it('should include Load More node when hasMore is true', async () => {
        mockHooksManager.hasMore.returns(true)
        const node = new HooksNode(mockHooksManager)
        const children = await node.getChildren()
        assert.strictEqual(children.length, 3) // 2 hooks + Load More
    })

    it('should show count in description when loaded', async () => {
        const node = new HooksNode(mockHooksManager)
        await node.getChildren()
        assert.strictEqual(node.description, '(2)')
    })

    it('should show count+ when hasMore', async () => {
        mockHooksManager.hasMore.returns(true)
        const node = new HooksNode(mockHooksManager)
        await node.getChildren()
        assert.strictEqual(node.description, '(2+)')
    })
})
