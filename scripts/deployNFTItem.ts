import { toNano } from '@ton/core';
import { NFTItem } from '../wrappers/NFTItem';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const nFTItem = provider.open(await NFTItem.fromInit());

    await nFTItem.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(nFTItem.address);

    // run methods on `nFTItem`
}
