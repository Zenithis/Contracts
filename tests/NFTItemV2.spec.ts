import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, beginCell, Address } from '@ton/core';
import { NftItemV2 } from '../wrappers/NFTItemV2';
import '@ton/test-utils';

describe('NftItemV2', () => {
    let blockchain: Blockchain;
    let nftItem: SandboxContract<NftItemV2>;
    let collection: SandboxContract<TreasuryContract>;
    let owner: SandboxContract<TreasuryContract>;
    let campaignManager: SandboxContract<TreasuryContract>;
    let votingTracker: SandboxContract<TreasuryContract>;
    let deployer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        collection = await blockchain.treasury('collection');
        owner = await blockchain.treasury('owner');
        campaignManager = await blockchain.treasury('campaign_manager');
        votingTracker = await blockchain.treasury('voting_tracker');
        deployer = await blockchain.treasury('deployer');

        nftItem = blockchain.openContract(
            await NftItemV2.fromInit(
                collection.address,
                0n, // item_index
                campaignManager.address,
                votingTracker.address
            )
        );

        const deployResult = await nftItem.send(
            collection.getSender(), // Must be from collection address
            {
                value: toNano('1'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: collection.address,
            to: nftItem.address,
            success: true,
        });
    });

    it('should deploy correctly', async () => {

    });

    it('should initialize NFT on first transfer', async () => {
        const individualContent = beginCell().storeStringTail('https://olive-fashionable-mule-815.mypinata.cloud/ipfs/QmfG535VcZ6kREYF2SU81T5E1ndaiCJz21y19FsAp5gz1r').endCell();
        
        const transferResult = await nftItem.send(
            collection.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Transfer',
                query_id: 0n,
                new_owner: owner.address,
                response_destination: collection.address,
                custom_payload: individualContent,
                forward_amount: 0n,
                forward_payload: beginCell().endCell().asSlice()
            }
        );

        expect(transferResult.transactions).toHaveTransaction({
            from: collection.address,
            to: nftItem.address,
            success: true,
        });

        const data = await nftItem.getGetNftData();
        console.log(data)
        expect(data.is_initialized).toBe(true);
        expect(data.owner_address.equals(owner.address)).toBe(true);
    });

    it('should fail transfer if not from collection during initialization', async () => {
        const individualContent = beginCell().storeStringTail('https://olive-fashionable-mule-815.mypinata.cloud/ipfs/QmfG535VcZ6kREYF2SU81T5E1ndaiCJz21y19FsAp5gz1r').endCell();
        
        const transferResult = await nftItem.send(
            owner.getSender(), // Wrong sender
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Transfer',
                query_id: 0n,
                new_owner: owner.address,
                response_destination: collection.address,
                custom_payload: individualContent,
                forward_amount: 0n,
                forward_payload: beginCell().endCell().asSlice()
            }
        );

        expect(transferResult.transactions).toHaveTransaction({
            from: owner.address,
            to: nftItem.address,
            success: false,
        });
    });

    it('should allow owner to transfer NFT after initialization', async () => {
        // First initialize the NFT
        await nftItem.send(
            collection.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Transfer',
                query_id: 0n,
                new_owner: owner.address,
                response_destination: collection.address,
                custom_payload:beginCell().storeStringTail('https://olive-fashionable-mule-815.mypinata.cloud/ipfs/QmfG535VcZ6kREYF2SU81T5E1ndaiCJz21y19FsAp5gz1r').endCell(),
                forward_amount: 0n,
                forward_payload: beginCell().endCell().asSlice()
            }
        );

        // Create new owner
        const newOwner = await blockchain.treasury('new_owner');

        // Transfer to new owner
        const transferResult = await nftItem.send(
            owner.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Transfer',
                query_id: 0n,
                new_owner: newOwner.address,
                response_destination: owner.address,
                custom_payload: null,
                forward_amount: toNano('0.1'),
                forward_payload: beginCell().endCell().asSlice()
            }
        );

        expect(transferResult.transactions).toHaveTransaction({
            from: owner.address,
            to: nftItem.address,
            success: true,
        });

        const data = await nftItem.getGetNftData();
        expect(data.owner_address.equals(newOwner.address)).toBe(true);
    });

    it('should handle GetStaticData request', async () => {
        const result = await nftItem.send(
            owner.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'GetStaticData',
                query_id: 1n,
            }
        );

        expect(result.transactions).toHaveTransaction({
            from: owner.address,
            to: nftItem.address,
            success: true,
        });
    });

    it('should handle voting mechanics correctly', async () => {
        // Initialize NFT first
        await nftItem.send(
            collection.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Transfer',
                query_id: 0n,
                new_owner: owner.address,
                response_destination: collection.address,
                custom_payload: beginCell().storeStringTail('https://olive-fashionable-mule-815.mypinata.cloud/ipfs/QmfG535VcZ6kREYF2SU81T5E1ndaiCJz21y19FsAp5gz1r').endCell(),
                forward_amount: 0n,
                forward_payload: beginCell().endCell().asSlice()
            }
        );

        // Create voter
        const voter = await blockchain.treasury('voter');

        // Set up voting period (will need to be handled through campaign manager)
        // await blockchain.now; // Set initial time

        const voteResult = await nftItem.send(
            voter.getSender(),
            {
                value: toNano('0.1'),
            },
            'Vote'
        );

        // Note: This test might need adjustment based on your campaign manager implementation
        expect(voteResult.transactions).toHaveTransaction({
            from: voter.address,
            to: nftItem.address,
        });
    });

    it('should prevent voting outside campaign period', async () => {
        // Initialize NFT first
        await nftItem.send(
            collection.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Transfer',
                query_id: 0n,
                new_owner: owner.address,
                response_destination: collection.address,
                custom_payload: beginCell().storeStringTail('https://olive-fashionable-mule-815.mypinata.cloud/ipfs/QmfG535VcZ6kREYF2SU81T5E1ndaiCJz21y19FsAp5gz1r').endCell(),
                forward_amount: 0n,
                forward_payload: beginCell().endCell().asSlice()
            }
        );

        const voter = await blockchain.treasury('voter');
        // await blockchain.setUnixTime(0); // Set time before campaign start

        const voteResult = await nftItem.send(
            voter.getSender(),
            {
                value: toNano('0.1'),
            },
            'Vote'
        );

        expect(voteResult.transactions).toHaveTransaction({
            from: voter.address,
            to: nftItem.address,
            success: false,
        });
    });

    it('should prevent double voting within 24 hours', async () => {
        // Initialize NFT first
        await nftItem.send(
            collection.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Transfer',
                query_id: 0n,
                new_owner: owner.address,
                response_destination: collection.address,
                custom_payload: beginCell().storeStringTail('https://olive-fashionable-mule-815.mypinata.cloud/ipfs/QmfG535VcZ6kREYF2SU81T5E1ndaiCJz21y19FsAp5gz1r').endCell(),
                forward_amount: 0n,
                forward_payload: beginCell().endCell().asSlice()
            }
        );

        const voter = await blockchain.treasury('voter');
         // Set time within campaign period

        // First vote
        await nftItem.send(
            voter.getSender(),
            {
                value: toNano('0.1'),
            },
            'Vote'
        );

        // Second vote within 24 hours
        const secondVoteResult = await nftItem.send(
            voter.getSender(),
            {
                value: toNano('0.1'),
            },
            'Vote'
        );

        expect(secondVoteResult.transactions).toHaveTransaction({
            from: voter.address,
            to: nftItem.address,
            success: false,
        });
    });

    it('should handle GetOwner request', async () => {
        // Initialize NFT first
        await nftItem.send(
            collection.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Transfer',
                query_id: 0n,
                new_owner: owner.address,
                response_destination: collection.address,
                custom_payload: beginCell().storeStringTail('https://olive-fashionable-mule-815.mypinata.cloud/ipfs/QmfG535VcZ6kREYF2SU81T5E1ndaiCJz21y19FsAp5gz1r').endCell(),
                forward_amount: 0n,
                forward_payload: beginCell().endCell().asSlice()
            }
        );

        const result = await nftItem.send(
            owner.getSender(),
            {
                value: toNano('0.1'),
            },
            'GetOwner'
        );

        expect(result.transactions).toHaveTransaction({
            from: owner.address,
            to: nftItem.address,
            success: true,
        });
    });
});