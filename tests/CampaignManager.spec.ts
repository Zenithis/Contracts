import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { Cell, toNano } from 'ton-core';
import { CampaignManager } from '../wrappers/CampaignManager'; // Assume this wrapper exists
import { VotingTracker } from '../wrappers/VotingTracker'; // Assume this wrapper exists
import { JettonMaster } from '../wrappers/JettonMaster'; // Assume this wrapper exists
import { NFTItem } from '../wrappers/NFTItem'; // Assume this wrapper exists

describe('CampaignManager', () => {
    let blockchain: Blockchain;
    let campaignManager: SandboxContract<CampaignManager>;
    let votingTracker: SandboxContract<VotingTracker>;
    let jettonMaster: SandboxContract<JettonMaster>;
    let nftItem: SandboxContract<NFTItem>;
    let deployer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        jettonMaster = await blockchain.treasury('jetton_master');
        votingTracker = await blockchain.treasury('voting_tracker');
        nftItem = await blockchain.treasury('nft_item');

        campaignManager = blockchain.openContract(
            await CampaignManager.fromInit(jettonMaster.address)
        );

        const deployResult = await campaignManager.send(
            deployer.getSender(),
            {
                value: toNano('1'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveLength(2);
    });

    it('should initialize with correct values', async () => {
        const campaignDetails = await campaignManager.getCampaignDetails();
        expect(campaignDetails.campaignNumber).toBe(1n);
        expect(campaignDetails.campaignEnd).toBeGreaterThan(campaignDetails.campaignStart);
    });

    it('should manage campaign state correctly', async () => {
        // Fast forward time to end of campaign
        await blockchain.setNow(Math.floor(Date.now() / 1000) + 24 * 60 * 60 + 1);

        const touchResult = await campaignManager.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            'Touch'
        );

        expect(touchResult.transactions).toHaveLength(2); // One for touch, one for reward distribution

        const newCampaignDetails = await campaignManager.getCampaignDetails();
        expect(newCampaignDetails.campaignNumber).toBe(2n);
    });

    it('should distribute rewards correctly', async () => {
        // Set up a winning NFT and voters
        const winningNFT = await blockchain.treasury('winning_nft');
        const voter1 = await blockchain.treasury('voter1');
        const voter2 = await blockchain.treasury('voter2');

        await campaignManager.setWinningNFT(winningNFT.address);
        await campaignManager.addWinningVoter(voter1.address);
        await campaignManager.addWinningVoter(voter2.address);

        // Fast forward time to end of campaign
        await blockchain.setNow(Math.floor(Date.now() / 1000) + 24 * 60 * 60 + 1);

        const distributeResult = await campaignManager.send(
            deployer.getSender(),
            {
                value: toNano('1'),
            },
            'Touch'
        );

        // Check if rewards were distributed
        expect(distributeResult.transactions).toHaveLength(4); // Touch, GetOwner, Mint for creator, 2x Mint for voters
        // You may need to add more specific checks here depending on your implementation
    });

    // Add more tests as needed
});