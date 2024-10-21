import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { JettonMaster } from '../wrappers/JettonMaster';
import '@ton/test-utils';
import { Address } from 'ton';
import { buildOnchainMetadata } from '../utils/jetton-helpers';
import { JettonWallet } from '../wrappers/JettonWallet';
describe('JettonMaster and JettonWallet', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let jettonMaster: SandboxContract<JettonMaster>;
    let jettonWallet: SandboxContract<JettonWallet>;
    
    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');   
        user = await blockchain.treasury('user');
        let jettonParams = {
            name: "Zen Token",
            description: "Tokens for airdrop on TON blockchain",
            symbol: "ZEN",
            image: "https://olive-fashionable-mule-815.mypinata.cloud/ipfs/QmfG535VcZ6kREYF2SU81T5E1ndaiCJz21y19FsAp5gz1r",
        };

        let content = buildOnchainMetadata(jettonParams);
        jettonMaster = blockchain.openContract(await JettonMaster.fromInit(deployer.getSender().address as Address, content , 1000000000000000000n));
        jettonWallet = blockchain.openContract(await JettonWallet.fromInit(jettonMaster.address,user.address));

        const deployResult = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );
        const deployWalletResult = await jettonWallet.send(
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
            to: jettonMaster.address,
            deploy: true,
            success: true,
        });

        expect(deployWalletResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonWallet.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jettonMaster are ready to use
    });
    it('should mint',async () =>{
        const mintAmount = 1000n;
        const balanceBefore = (await jettonWallet.getGetWalletData()).balance;
        console.log("balance before ",balanceBefore);
        await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },{
                $$type:'Mint',
                amount:mintAmount,
                receiver:user.address
            })
        const balance = (await jettonWallet.getGetWalletData()).balance;
        console.log("balance after ",balance)
        expect(balance).toBe(balanceBefore+mintAmount);
    })
});