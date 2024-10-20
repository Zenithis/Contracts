import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { NFTCollectionV2 } from '../wrappers/NFTCollectionV2';
import '@ton/test-utils';

describe('NFTCollectionV2', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let nFTCollectionV2: SandboxContract<NFTCollectionV2>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        nFTCollectionV2 = blockchain.openContract(await NFTCollectionV2.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await nFTCollectionV2.send(
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
            to: nFTCollectionV2.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and nFTCollectionV2 are ready to use
    });
});
