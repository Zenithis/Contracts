import { Address, toNano } from '@ton/core';
import { JettonMaster } from '../wrappers/JettonMaster';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from '../utils/jetton-helpers';

export async function run(provider: NetworkProvider) {
    const jettonParams = {
        name: "Zen Token",
        description: "Tokens for airdrop on TON blockchain",
        symbol: "ZEN",
        image: "https://olive-fashionable-mule-815.mypinata.cloud/ipfs/QmfG535VcZ6kREYF2SU81T5E1ndaiCJz21y19FsAp5gz1r",
    };

    // Create content Cell
    let content = buildOnchainMetadata(jettonParams);

    const jettonMaster  = provider.open(await JettonMaster.fromInit(provider.sender().address as Address, content, 1000000000000000000n));

    await jettonMaster.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Mint',
            amount: 100000000000000000n,
            receiver: provider.sender().address as Address
        }
    );

    await provider.waitForDeploy(jettonMaster.address);
    
    // run methods on `sampleJetton`
}