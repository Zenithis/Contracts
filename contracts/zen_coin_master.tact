import "@stdlib/deploy";
import "./zen_coin_wallet.tact";
import "./messages.tact";

contract ZenCoinMaster with Deployable {
    const minTonsForStorage: Int = ton("0.01");
    const gasConsumption: Int = ton("0.01");
    
    total_supply: Int as coins;
    owner: Address;

    
    init(owner: Address) {
        self.total_supply = 0;
        self.owner = owner;
    }

    receive(msg: Mint) {
        self.mint(msg.receiver, msg.amount, self.owner);
    }
    
    fun mint(to: Address, amount: Int, response_destination: Address) {
        require(amount > 0, "Invalid amount");
        self.total_supply = self.total_supply + amount;
        let init: StateInit = initOf ZenCoinWallet(to,myAddress());
        let wallet_address: Address = contractAddress(init);
        
        send(SendParameters{
            to: wallet_address,
            value: ton("0.5"),
            bounce: true,
            mode: SendIgnoreErrors,
            body: TokenTransfer{
                query_id: 0,
                amount: amount,
                destination: to,
                response_destination: response_destination,
                custom_payload: null,
                forward_ton_amount: 0,
                forward_payload: emptySlice()
            }.toCell(),
            code: init.code,
            data: init.data
        });
    }
    
    get fun getJettonWalletInit(address: Address): StateInit {
        return initOf ZenCoinWallet(address,myAddress());
    }
    
    get fun get_wallet_address(owner: Address): Address {
        let init: StateInit = initOf ZenCoinWallet(owner,myAddress());
        return contractAddress(init);
    }
    
    get fun get_jetton_data(): JettonData {
        return JettonData{
            total_supply: self.total_supply,
            mintable: true,
            owner: self.owner,
        };
    }
}

struct JettonData {
    total_supply: Int;
    mintable: Bool;
    owner: Address;
}