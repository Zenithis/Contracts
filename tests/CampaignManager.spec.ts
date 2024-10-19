import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { CampaignManager } from '../wrappers/CampaignManager';
import '@ton/test-utils';

describe('CampaignManager', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let campaignManager: SandboxContract<CampaignManager>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        campaignManager = blockchain.openContract(await CampaignManager.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await campaignManager.send(
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
            to: campaignManager.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and campaignManager are ready to use
    });
});
