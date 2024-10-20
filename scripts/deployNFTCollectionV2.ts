import { toNano } from '@ton/core';
import { NFTCollectionV2 } from '../wrappers/NFTCollectionV2';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const nFTCollectionV2 = provider.open(await NFTCollectionV2.fromInit());

    await nFTCollectionV2.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(nFTCollectionV2.address);

    // run methods on `nFTCollectionV2`
}
