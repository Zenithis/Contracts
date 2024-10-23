import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { Cell, toNano } from 'ton-core';
import { CampaignManager } from '../wrappers/CampaignManager';
import { VotingTracker } from '../wrappers/VotingTracker';
import { JettonMaster } from '../wrappers/JettonMaster';
import { NftItemV2 } from '../wrappers/NFTItemV2';
import { NftCollectionV2 } from '../wrappers/NFTCollectionV2';
import { buildOnchainMetadata } from '../utils/jetton-helpers';
import { JettonWallet } from '../wrappers/JettonWallet';
import { beginCell } from '@ton/core';

describe('CampaignManager', () => {
    let blockchain: Blockchain;
    let campaignManager: SandboxContract<CampaignManager>;
    let votingTracker: SandboxContract<VotingTracker>;
    let jettonMaster: SandboxContract<JettonMaster>;
    let nftItem: SandboxContract<NftItemV2>;
    let nftCollection: SandboxContract<NftCollectionV2>;
    let jettonWallet: SandboxContract<JettonWallet>;
    let deployer: SandboxContract<TreasuryContract>;
    let voter1: SandboxContract<TreasuryContract>;
    let voter2: SandboxContract<TreasuryContract>;
    let nftOwner: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        voter1 = await blockchain.treasury('voter1');
        voter2 = await blockchain.treasury('voter2');
        nftOwner = await blockchain.treasury('nftOwner');

        // Setup Jetton parameters
        const jettonParams = {
            name: "Zen Token",
            description: "Tokens for airdrop on TON blockchain",
            symbol: "ZEN",
            image: "https://olive-fashionable-mule-815.mypinata.cloud/ipfs/QmfG535VcZ6kREYF2SU81T5E1ndaiCJz21y19FsAp5gz1r",
        };
        const content = buildOnchainMetadata(jettonParams);
        const contentCell = beginCell().storeStringTail("https://olive-fashionable-mule-815.mypinata.cloud/ipfs/QmfG535VcZ6kREYF2SU81T5E1ndaiCJz21y19FsAp5gz1r").endCell()
        
        // Deploy contracts
        jettonMaster = blockchain.openContract(
            await JettonMaster.fromInit(voter1.address, content, 10000000n)
        );
        
        jettonWallet = blockchain.openContract(
            await JettonWallet.fromInit(jettonMaster.address, voter1.address)
        );

        campaignManager = blockchain.openContract(
            await CampaignManager.fromInit(jettonMaster.address)
        );

        votingTracker = blockchain.openContract(
            await VotingTracker.fromInit(campaignManager.address)
        );

        nftCollection = blockchain.openContract(
            await NftCollectionV2.fromInit(deployer.address,contentCell,campaignManager.address,votingTracker.address)
        );
        // Deploy NFT for testing
        nftItem = blockchain.openContract(
            await NftItemV2.fromInit(nftCollection.address,0n,campaignManager.address,votingTracker.address)
        );
        

        // Deploy all contracts
        await deployContracts();
    });

    async function deployContracts() {
        // Deploy JettonMaster
        const deployJettonMaster = await jettonMaster.send(
            deployer.getSender(),
            { value: toNano('1') },
            { $$type: 'Deploy', queryId: 0n }
        );
        expect(deployJettonMaster.transactions).toHaveLength(3);

        // Deploy CampaignManager
        const deployCampaignManager = await campaignManager.send(
            deployer.getSender(),
            { value: toNano('1') },
            { $$type: 'Deploy', queryId: 0n }
        );
        expect(deployCampaignManager.transactions).toHaveLength(3);

        // Deploy VotingTracker
        const deployVotingTracker = await votingTracker.send(
            deployer.getSender(),
            { value: toNano('1') },
            { $$type: 'Deploy', queryId: 0n }
        );
        expect(deployVotingTracker.transactions).toHaveLength(3);

        // Deploy JettonWallet
        const deployWallet = await jettonWallet.send(
            deployer.getSender(),
            { value: toNano('1') },
            { $$type: 'Deploy', queryId: 0n }
        );
        expect(deployWallet.transactions).toHaveLength(3);

        // Deploy NFT
        const deployNFT = await nftItem.send(
            deployer.getSender(),
            { value: toNano('1') },
            { $$type: 'Deploy', queryId: 0n }
        );
        expect(deployNFT.transactions).toHaveLength(3);

        const deployNFTCollection = await nftCollection.send(
            deployer.getSender(),
            { value: toNano('1') },
            { $$type: 'Deploy', queryId: 0n }
        );
        expect(deployNFTCollection.transactions).toHaveLength(3);
    }

    it('should initialize with correct values', async () => {
        const campaignDetails = await campaignManager.getCampaignDetail();
        expect(campaignDetails.current_campaign).toBe(1n);
        expect(campaignDetails.campaign_end).toBeGreaterThan(campaignDetails.campaign_start);
    });

    it('should handle voting and update vote counts correctly', async () => {
        // Register votes
        const voteResult1 = await votingTracker.send(
            voter1.getSender(),
            { value: toNano('0.5') },
            {
                $$type: 'RegisterVote',
                nft_address: nftItem.address,
                voter: voter1.address
            }
        );
        expect(voteResult1.transactions).toHaveLength(3);

        // Check vote count
        const votesForNFT = await votingTracker.getGetVotesForNft(nftItem.address);
        expect(votesForNFT).toBe(1n);
    });

    it('should distribute rewards after campaign ends', async () => {
        // Setup initial balances
        const initialBalance = await jettonWallet.getGetWalletData();
        
        // Register votes
        await votingTracker.send(
            voter1.getSender(),
            { value: toNano('0.5') },
            {
                $$type: 'RegisterVote',
                nft_address: nftItem.address,
                voter: voter1.address
            }
        );

        // Simulate NFT owner response
        await campaignManager.send(
            nftOwner.getSender(),
            { value: toNano('0.5') },
            {
                $$type: 'ResNFTOwner',
                owner: nftOwner.address
            }
        );

        // Trigger reward distribution
        const distributeResult = await campaignManager.send(
            deployer.getSender(),
            { value: toNano('2') },
            'Touch'
        );

        // Verify transactions
        expect(distributeResult.transactions).toHaveLength(4); // Deploy + Mint messages

        // Check final balances
        const finalBalance = await jettonWallet.getGetWalletData();
        expect(finalBalance.balance).toBeGreaterThan(initialBalance.balance);
    });

    it('should handle multiple voters and distribute rewards correctly', async () => {
        // Register multiple votes
        await votingTracker.send(
            voter1.getSender(),
            { value: toNano('0.5') },
            {
                $$type: 'RegisterVote',
                nft_address: nftItem.address,
                voter: voter1.address
            }
        );

        await votingTracker.send(
            voter2.getSender(),
            { value: toNano('0.5') },
            {
                $$type: 'RegisterVote',
                nft_address: nftItem.address,
                voter: voter2.address
            }
        );
        const balanceBefore = await jettonWallet.getGetWalletData();
        console.log("Balance before ",balanceBefore.balance);
        // Set NFT winner
        // await campaignManager.send(
        //     deployer.getSender(),
        //     { value: toNano('0.5') },
        //     {
        //         $$type: 'ResponseWinningNFT',
        //         nftAddress: nftItem.address,
        //         voters: new Map([
        //             [voter1.address, true],
        //             [voter2.address, true]
        //         ])
        //     }
        // );

        // Trigger distribution
        const distributeResult = await campaignManager.send(
            deployer.getSender(),
            { value: toNano('3') },
            'Touch'
        );
        const balanceAfter = await jettonWallet.getGetWalletData();
        console.log("Balance after ",balanceAfter.balance);
        // Verify multiple reward distributions
        expect(balanceAfter.balance).toBeGreaterThan(balanceBefore.balance);
        // expect(distributeResult.transactions.length).toBeGreaterThan(3);
    });
});