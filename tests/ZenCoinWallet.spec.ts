import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { ZenCoinWallet } from '../wrappers/ZenCoinWallet';
import '@ton/test-utils';

describe('ZenCoinWallet', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let zenCoinWallet: SandboxContract<ZenCoinWallet>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        zenCoinWallet = blockchain.openContract(await ZenCoinWallet.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await zenCoinWallet.send(
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
            to: zenCoinWallet.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and zenCoinWallet are ready to use
    });
});
