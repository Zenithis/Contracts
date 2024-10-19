import { toNano } from '@ton/core';
import { CampaignManager } from '../wrappers/CampaignManager';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const campaignManager = provider.open(await CampaignManager.fromInit());

    await campaignManager.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(campaignManager.address);

    // run methods on `campaignManager`
}
