import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { ZenCoinWallet } from '../wrappers/ZenCoinWallet';
import '@ton/test-utils';
import { ZenCoinMaster } from '../wrappers/ZenCoinMaster';

describe('ZenCoinMaster and ZenCoinWallet', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let zenCoinWallet: SandboxContract<ZenCoinWallet>;
    let zenCoinMaster: SandboxContract<ZenCoinMaster>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        zenCoinMaster = blockchain.openContract(await ZenCoinMaster.fromInit(deployer.address));
        zenCoinWallet = blockchain.openContract(await ZenCoinWallet.fromInit(deployer.address,zenCoinMaster.address));

        const deployResult = await zenCoinWallet.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        const deployMasterResult = await zenCoinMaster.send(
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
            to: zenCoinWallet.address,
            deploy: true,
            success: true,
        });
        expect(deployMasterResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: zenCoinMaster.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and zenCoinWallet are ready to use
    });
    it('should mint', async()=>{
        const balanceBefore = await zenCoinWallet.getGetWalletData();
        console.log("Balance Before",toNano(balanceBefore.balance));
        let wallet = await blockchain.treasury('ZenCoinWallet');
        let master = await blockchain.treasury('ZenCoinMaster');
        await zenCoinMaster.send(
            deployer.getSender(),
            {
                value:toNano("0.05")
            },{
                $$type: 'Mint',
                amount: toNano("100"),
                receiver:zenCoinWallet.address
            }   
        )
        const balanceAfter = await zenCoinWallet.getGetWalletData();
        console.log("Balance After",toNano(balanceAfter.balance));
        expect(balanceBefore.balance).toBeLessThan(balanceAfter.balance);
    })
});
