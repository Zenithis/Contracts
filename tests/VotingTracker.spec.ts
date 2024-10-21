import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, beginCell } from 'ton-core';
import { VotingTracker } from '../wrappers/VotingTracker';
import '@ton/test-utils';

describe('VotingTracker', () => {
    let blockchain: Blockchain;
    let votingTracker: SandboxContract<VotingTracker>;
    let deployer: SandboxContract<TreasuryContract>;
    let campaignManager: SandboxContract<TreasuryContract>;
    let nft1: SandboxContract<TreasuryContract>;
    let nft2: SandboxContract<TreasuryContract>;
    let voter1: SandboxContract<TreasuryContract>;
    let voter2: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        campaignManager = await blockchain.treasury('campaign_manager');
        nft1 = await blockchain.treasury('nft1');
        nft2 = await blockchain.treasury('nft2');
        voter1 = await blockchain.treasury('voter1');
        voter2 = await blockchain.treasury('voter2');

        votingTracker = blockchain.openContract(
            await VotingTracker.fromInit(campaignManager.address)
        );

        const deployResult = await votingTracker.send(
            deployer.getSender(),
            {
                value: toNano('1'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: votingTracker.address,
            success: true,
        });
    });

    it('should deploy correctly', async () => {
        const totalVotes = await votingTracker.getGetTotalVotes();
        console.log(totalVotes);
        expect(totalVotes).toEqual(0n);
    });

    it('should register a vote correctly', async () => {
        const result = await votingTracker.send(
            nft1.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'RegisterVote',
                nft_address: nft1.address,
                voter: voter1.address
            }
        );

        expect(result.transactions).toHaveTransaction({
            from: nft1.address,
            to: votingTracker.address,
            success: true,
        });

        const votesForNFT = await votingTracker.getGetVotesForNft(nft1.address);
        expect(votesForNFT).toEqual(1n);
    });

    it('should track multiple votes for the same NFT', async () => {
        // First vote
        await votingTracker.send(
            nft1.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'RegisterVote',
                nft_address: nft1.address,
                voter: voter1.address
            }
        );

        // Second vote
        await votingTracker.send(
            nft1.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'RegisterVote',
                nft_address: nft1.address,
                voter: voter2.address
            }
        );

        const votesForNFT = await votingTracker.getGetVotesForNft(nft1.address);
        expect(votesForNFT).toEqual(2n);

        const totalVotes = await votingTracker.getGetTotalVotes();
        expect(totalVotes).toEqual(2n);
    });

    it('should track votes across multiple NFTs', async () => {
        // Vote for NFT1
        await votingTracker.send(
            nft1.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'RegisterVote',
                nft_address: nft1.address,
                voter: voter1.address
            }
        );

        // Vote for NFT2
        await votingTracker.send(
            nft2.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'RegisterVote',
                nft_address: nft2.address,
                voter: voter2.address
            }
        );

        const votesForNFT1 = await votingTracker.getGetVotesForNft(nft1.address);
        const votesForNFT2 = await votingTracker.getGetVotesForNft(nft2.address);
        
        expect(votesForNFT1).toEqual(1n);
        expect(votesForNFT2).toEqual(1n);

        const totalVotes = await votingTracker.getGetTotalVotes();
        expect(totalVotes).toEqual(2n);
    });

    it('should correctly identify winning NFT', async () => {
        // Multiple votes for NFT1
        await votingTracker.send(
            nft1.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'RegisterVote',
                nft_address: nft1.address,
                voter: voter1.address
            }
        );

        await votingTracker.send(
            nft1.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'RegisterVote',
                nft_address: nft1.address,
                voter: voter2.address
            }
        );

        // Single vote for NFT2
        await votingTracker.send(
            nft2.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'RegisterVote',
                nft_address: nft2.address,
                voter: voter1.address
            }
        );

        const winningNFT = await votingTracker.getWinningNft();
        expect(winningNFT.equals(nft1.address)).toBe(true);
    });

    it('should track voters for each NFT', async () => {
        await votingTracker.send(
            nft1.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'RegisterVote',
                nft_address: nft1.address,
                voter: voter1.address
            }
        );

        const voters = await votingTracker.getGetVotersForNft(nft1.address);
        expect(voters).toBeDefined();
        // Additional checks for voters map can be added based on your specific needs
    });

    it('should handle reset command correctly', async () => {
        // Register some votes first
        await votingTracker.send(
            nft1.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'RegisterVote',
                nft_address: nft1.address,
                voter: voter1.address
            }
        );

        // Send reset command
        const resetResult = await votingTracker.send(
            campaignManager.getSender(),
            {
                value: toNano('0.1'),
            },
            'reset'
        );

        expect(resetResult.transactions).toHaveTransaction({
            from: campaignManager.address,
            to: votingTracker.address,
            success: true,
        });

        // Verify reset
        const totalVotes = await votingTracker.getGetTotalVotes();
        expect(totalVotes).toEqual(0n);

        const votesForNFT = await votingTracker.getGetVotesForNft(nft1.address);
        expect(votesForNFT).toBeNull();
    });

    it('should handle ReqWinningNFT command', async () => {
        // Register some votes first
        await votingTracker.send(
            nft1.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'RegisterVote',
                nft_address: nft1.address,
                voter: voter1.address
            }
        );

        const result = await votingTracker.send(
            campaignManager.getSender(),
            {
                value: toNano('0.1'),
            },
            'ReqWinningNFT'
        );

        expect(result.transactions).toHaveTransaction({
            from: campaignManager.address,
            to: votingTracker.address,
            success: true,
        });
    });

    it('should get winning NFT voters correctly', async () => {
        // Register votes
        await votingTracker.send(
            nft1.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'RegisterVote',
                nft_address: nft1.address,
                voter: voter1.address
            }
        );

        await votingTracker.send(
            nft1.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'RegisterVote',
                nft_address: nft1.address,
                voter: voter2.address
            }
        );

        const winningVoters = await votingTracker.getWinningNftVoters();
        expect(winningVoters).toBeDefined();
        // Additional checks for winning voters can be added based on your specific needs
    });

    it('should handle edge case with no votes', async () => {
        const winningNFT = await votingTracker.getWinningNft();
        expect(winningNFT.toString()).toBe('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c');
    });

});