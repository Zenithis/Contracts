import { toNano } from '@ton/core';
import { ZenCoinMaster } from '../wrappers/ZenCoinMaster';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const zenCoinMaster = provider.open(await ZenCoinMaster.fromInit());

    await zenCoinMaster.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(zenCoinMaster.address);

    // run methods on `zenCoinMaster`
}
