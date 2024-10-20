import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { NFTItemV2 } from '../wrappers/NFTItemV2';
import '@ton/test-utils';

describe('NFTItemV2', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let nFTItemV2: SandboxContract<NFTItemV2>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        nFTItemV2 = blockchain.openContract(await NFTItemV2.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await nFTItemV2.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nFTItemV2.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and nFTItemV2 are ready to use
    });
});
