import { toNano } from '@ton/core';
import { VotingTracker } from '../wrappers/VotingTracker';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const votingTracker = provider.open(await VotingTracker.fromInit());

    await votingTracker.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(votingTracker.address);

    // run methods on `votingTracker`
}
