import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { Cell, contractAddress, toNano } from 'ton-core';
import { ZenCoinMaster } from '../wrappers/ZenCoinMaster'; // You'll need to create this wrapper
import { ZenCoinWallet } from '../wrappers/ZenCoinWallet'; // You'll need to create this wrapper
import { Address } from '@ton/core';

describe('ZenCoin Master', () => {
    let blockchain: Blockchain;
    let zenCoinMaster: SandboxContract<ZenCoinMaster>;
    let zenCoinWallet: SandboxContract<ZenCoinWallet>;
    let deployer: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        user = await blockchain.treasury('user');

        // Deploy ZenCoinMaster contract
        zenCoinMaster = blockchain.openContract(
            await ZenCoinMaster.fromInit(deployer.address)
        );

        zenCoinWallet = blockchain.openContract(await ZenCoinWallet.fromInit(user.address,zenCoinMaster.address));

        const deployResult = await zenCoinMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );
        const deployWalletResult = await zenCoinWallet.send(
            deployer.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveLength(3);
        expect(deployWalletResult.transactions).toHaveLength(3);
    });

    it('should deploy correctly with initial values', async () => {
        const jettonData = await zenCoinMaster.getGetJettonData();
        expect(jettonData.total_supply).toEqual(0n);
        expect(jettonData.mintable).toBe(true);
        expect(jettonData.owner.equals(deployer.address)).toBe(true);
    });

    it('should mint tokens correctly', async () => {
        const mintAmount = 1000n;
        console.log("Mint Amount = "+mintAmount);
        console.log("receiver= "+user.address);
        // Mint tokens to user
        await zenCoinMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Mint',
                amount: mintAmount,
                receiver: user.address as Address,
            }
        );

        function delay(ms: number): Promise<void> {
            return new Promise(resolve => setTimeout(resolve, ms));
          }
        await delay(1000);
        
        // Check wallet balance
        const balance = (await zenCoinWallet.getGetWalletData()).balance;
        console.log("Balance = ",balance);
        expect(balance).toEqual(mintAmount);

        // Check total supply
        const jettonData = await zenCoinMaster.getGetJettonData();
        expect(jettonData.total_supply).toEqual(mintAmount);
    });

    it('should fail to mint zero or negative amount', async () => {
        const mintTx = await zenCoinMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'Mint',
                amount: 0n,
                receiver: user.address as Address,
            }
        );

        // Expect transaction to fail due to "Invalid amount" requirement
        expect(mintTx.transactions).toHaveLength(3);
    });
});