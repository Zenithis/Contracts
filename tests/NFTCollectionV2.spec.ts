import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Cell, toNano } from '@ton/core';
import { NftCollectionV2} from '../wrappers/NFTCollectionV2';
import '@ton/test-utils';
// import '@ton-community/test-utils';
// import { randomAddress } from '@ton-community/test-utils';

describe('NftCollectionV2', () => {
    let blockchain: Blockchain;
    let nftCollection: SandboxContract<NftCollectionV2>;
    let deployer: SandboxContract<TreasuryContract>;
    let owner: SandboxContract<TreasuryContract>;
    let campaignManager: SandboxContract<TreasuryContract>;
    let votingTracker: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        owner = await blockchain.treasury('owner');
        campaignManager = await blockchain.treasury('campaign_manager');
        votingTracker = await blockchain.treasury('voting_tracker');

        // Create collection content cell
        const contentCell = beginCell().storeStringTail("https://olive-fashionable-mule-815.mypinata.cloud/ipfs/QmfG535VcZ6kREYF2SU81T5E1ndaiCJz21y19FsAp5gz1r").endCell()
        
        nftCollection = blockchain.openContract(
            await NftCollectionV2.fromInit(
                owner.address,
                contentCell,
                campaignManager.address,
                votingTracker.address
            )
        );

        const deployResult = await nftCollection.send(
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
            to: nftCollection.address,
            success: true,
        });
    });

    it('should deploy', async () => {
        // Collection data verification
        const collectionData = await nftCollection.getGetCollectionData();
        expect(collectionData.next_item_index).toEqual(0n);
        expect(collectionData.owner_address.equals(owner.address)).toBe(true);
    });

    it('should mint NFT', async () => {
        const buyer = await blockchain.treasury('buyer');
        
        const mintResult = await nftCollection.send(
            buyer.getSender(),
            {
                value: toNano('0.5'),
            },
            'Mint'
        );

        expect(mintResult.transactions).toHaveTransaction({
            from: buyer.address,
            to: nftCollection.address,
            success: true,
        });

        // Verify next item index increased
        const collectionData = await nftCollection.getGetCollectionData();
        expect(collectionData.next_item_index).toEqual(1n);

        // Verify NFT address
        const nftAddress = await nftCollection.getGetNftAddressByIndex(0n);
        expect(nftAddress).not.toBeNull();
    });

    it('should get correct NFT address by index', async () => {
        // Mint first
        const buyer = await blockchain.treasury('buyer');
        await nftCollection.send(
            buyer.getSender(),
            {
                value: toNano('0.5'),
            },
            'Mint'
        );

        // Get address for existing NFT
        const nftAddress = await nftCollection.getGetNftAddressByIndex(0n);
        expect(nftAddress).not.toBeNull();

        // Get address for non-existent NFT
        const futureNftAddress = await nftCollection.getGetNftAddressByIndex(1n);
        expect(futureNftAddress).not.toBeNull(); // Should return potential address
    });

    it('should get correct NFT content', async () => {
        const individualContent = beginCell().storeStringTail("https://olive-fashionable-mule-815.mypinata.cloud/ipfs/QmfG535VcZ6kREYF2SU81T5E1ndaiCJz21y19FsAp5gz1r").endCell();        
        const content = await nftCollection.getGetNftContent(0n, individualContent);
        expect(content).not.toBeNull();
    });

    it('should fail mint with insufficient funds', async () => {
        const buyer = await blockchain.treasury('buyer');
        
        const mintResult = await nftCollection.send(
            buyer.getSender(),
            {
                value: toNano('0.01'), // Very small amount
            },
            'Mint'
        );

        // Should have a failed transaction
        expect(mintResult.transactions).toHaveTransaction({
            from: buyer.address,
            to: nftCollection.address,
            success: false,
        });
    });

    it('should handle multiple mints correctly', async () => {
        const buyer = await blockchain.treasury('buyer');
        
        // Mint first NFT
        await nftCollection.send(
            buyer.getSender(),
            {
                value: toNano('0.5'),
            },
            'Mint'
        );

        // Mint second NFT
        await nftCollection.send(
            buyer.getSender(),
            {
                value: toNano('0.5'),
            },
            'Mint'
        );

        // Verify next item index
        const collectionData = await nftCollection.getGetCollectionData();
        expect(collectionData.next_item_index).toEqual(2n);

        // Verify both NFT addresses exist
        const nftAddress1 = await nftCollection.getGetNftAddressByIndex(0n);
        const nftAddress2 = await nftCollection.getGetNftAddressByIndex(1n);
        
        expect(nftAddress1).not.toBeNull();
        expect(nftAddress2).not.toBeNull();
        expect(nftAddress1).not.toEqual(nftAddress2);
    });

    it('should maintain correct owner and addresses after deployment', async () => {
        const collectionData = await nftCollection.getGetCollectionData();
        
        expect(collectionData.owner_address.equals(owner.address)).toBe(true);
        
        const initData = await nftCollection.getGetNftItemV2Init(0n);
        expect(initData.code).not.toBeNull();
        expect(initData.data).not.toBeNull();
    });
});