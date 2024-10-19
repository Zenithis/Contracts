import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { VotingTracker } from '../wrappers/VotingTracker';
import '@ton/test-utils';

describe('VotingTracker', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let votingTracker: SandboxContract<VotingTracker>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        votingTracker = blockchain.openContract(await VotingTracker.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await votingTracker.send(
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
            to: votingTracker.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and votingTracker are ready to use
    });
});
