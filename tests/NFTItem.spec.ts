import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { NFTItem } from '../wrappers/NFTItem';
import '@ton/test-utils';

describe('NFTItem', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let nFTItem: SandboxContract<NFTItem>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        nFTItem = blockchain.openContract(await NFTItem.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await nFTItem.send(
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
            to: nFTItem.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and nFTItem are ready to use
    });
});
