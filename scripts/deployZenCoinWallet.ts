import { toNano } from '@ton/core';
import { ZenCoinWallet } from '../wrappers/ZenCoinWallet';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const zenCoinWallet = provider.open(await ZenCoinWallet.fromInit());

    await zenCoinWallet.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(zenCoinWallet.address);

    // run methods on `zenCoinWallet`
}
