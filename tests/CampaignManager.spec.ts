import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { Cell, toNano } from 'ton-core';
import { CampaignManager } from '../wrappers/CampaignManager'; // Assume this wrapper exists
import { VotingTracker } from '../wrappers/VotingTracker'; // Assume this wrapper exists
import { JettonMaster } from '../wrappers/JettonMaster'; // Assume this wrapper exists
import { NFTItem } from '../wrappers/NFTItem'; // Assume this wrapper exists
import { buildOnchainMetadata } from '../utils/jetton-helpers';
import { JettonWallet } from '../wrappers/JettonWallet';

describe('CampaignManager', () => {
    let blockchain: Blockchain;
    let campaignManager: SandboxContract<CampaignManager>;
    let votingTracker: SandboxContract<VotingTracker>;
    let jettonMaster: SandboxContract<JettonMaster>;
    let nftItem: SandboxContract<NFTItem>;
    let jettonWallet: SandboxContract<JettonWallet>;
    let deployer: SandboxContract<TreasuryContract>;
    let voter1: SandboxContract<TreasuryContract>;
    let voter2: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        voter1 = await blockchain.treasury('voter1');
        voter2 = await blockchain.treasury('voter2');

        let jettonParams = {
            name: "Zen Token",
            description: "Tokens for airdrop on TON blockchain",
            symbol: "ZEN",
            image: "https://olive-fashionable-mule-815.mypinata.cloud/ipfs/QmfG535VcZ6kREYF2SU81T5E1ndaiCJz21y19FsAp5gz1r",
        };

        let content = buildOnchainMetadata(jettonParams);

        jettonMaster = blockchain.openContract(await JettonMaster.fromInit(voter1.address,content,10000000n));
        jettonWallet = blockchain.openContract(await JettonWallet.fromInit(jettonMaster.address,voter1.address));

        campaignManager = blockchain.openContract(
            await CampaignManager.fromInit(jettonMaster.address)
        );
        votingTracker = blockchain.openContract(
            await VotingTracker.fromInit(campaignManager.address)
        )

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
        const deployVotingTrackerResult = await votingTracker.send(
            deployer.getSender(),
            {
                value: toNano('1'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );
        const deployWalletResult = await jettonWallet.send(
            deployer.getSender(),
            {
                value: toNano('1'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployVotingTrackerResult.transactions).toHaveLength(3);
        expect(deployResult.transactions).toHaveLength(3);
        expect(deployWalletResult.transactions).toHaveLength(3);
    });

    it('should initialize with correct values', async () => {
        const campaignDetails = await campaignManager.getCampaignDetail();
        expect(campaignDetails.current_campaign).toBe(1n);
        expect(campaignDetails.campaign_end).toBeGreaterThan(campaignDetails.campaign_start);
    });

    it('should manage campaign state correctly', async () => {
        // Fast forward time to end of campaign
        // await blockchain.setNow(Math.floor(Date.now() / 1000) + 24 * 60 * 60 + 1);

        const touchResult = await campaignManager.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            'Touch'
        );

        expect(touchResult.transactions).toHaveLength(2); // One for touch, one for reward distribution

        const newCampaignDetails = await campaignManager.getCampaignDetail();
        expect(newCampaignDetails.current_campaign).toBe(1n);
    });

    it('should distribute rewards correctly', async () => {
        // Set up a winning NFT and voters
        const nft1 = await blockchain.treasury('nft1');
        const balanceBefore = (await jettonWallet.getGetWalletData()).balance;
        console.log("Balance Before" , balanceBefore);
        
        const distributeResult = await campaignManager.send(
            deployer.getSender(),
            {
                value: toNano('1'),
            },
            'Touch'
        );
        const result = await votingTracker.send(
            deployer.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'RegisterVote',
                nft_address: nft1.address,
                voter: voter1.address
            }
        );
        console.log("Vote on nft txn ",result.events);
        expect(result.transactions).toHaveLength(3);

        const votesForNFT = await votingTracker.getGetVotesForNft(nft1.address);
        expect(votesForNFT).toEqual(1n);

        const nftWinner = await votingTracker.getWinningNft();

        // // Fast forward time to end of campaign
      
        console.log("Distribute rewards txn ",distributeResult.events);

        const balanceAfter = (await jettonWallet.getGetWalletData()).balance;
        console.log("Balance after ",balanceAfter);
        
        // Check if rewards were distributed
        expect(balanceAfter).toBeGreaterThan(balanceBefore);
        // You may need to add more specific checks here depending on your implementation
    });

    // Add more tests as needed
});