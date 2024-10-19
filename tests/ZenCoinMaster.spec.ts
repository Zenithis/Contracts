import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { ZenCoinMaster } from '../wrappers/ZenCoinMaster';
import '@ton/test-utils';

describe('ZenCoinMaster', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let zenCoinMaster: SandboxContract<ZenCoinMaster>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        zenCoinMaster = blockchain.openContract(await ZenCoinMaster.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await zenCoinMaster.send(
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
            to: zenCoinMaster.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and zenCoinMaster are ready to use
    });
});
