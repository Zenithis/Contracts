import { toNano } from '@ton/core';
import { NFTItemV2 } from '../wrappers/NFTItemV2';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const nFTItemV2 = provider.open(await NFTItemV2.fromInit());

    await nFTItemV2.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(nFTItemV2.address);

    // run methods on `nFTItemV2`
}
