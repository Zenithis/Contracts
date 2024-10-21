import "@stdlib/deploy";
import "./messages.tact";
// Define message structures




contract ZenCoinWallet with Deployable {
    balance: Int as uint64;
    owner: Address;
    master: Address;
    
    init(owner: Address, master: Address) {
        self.balance = 0;
        self.owner = owner;
        self.master = master;
    }
    
    receive(msg: TokenTransfer) {
        
        // Get recipient wallet address directly from master contract
        let recipient_init: StateInit = initOf ZenCoinWallet(msg.destination, self.master);
        let recipient_wallet: Address = contractAddress(recipient_init);
            
        self.balance = self.balance - msg.amount;
        
        send(SendParameters{
            to: recipient_wallet,
            value: 0,
            mode: SendIgnoreErrors, // Add send mode
            bounce: true,          // Add bounce flag
            body: InternalTransfer{
                query_id: msg.query_id,
                amount: msg.amount,
                from: self.owner,
                response_destination: msg.response_destination
            }.toCell()
        });
    }

    // Add getter for balance
    get fun get_wallet_data(): WalletData {
        return WalletData{
            balance: self.balance,
            owner: self.owner,
            master: self.master
        };
    }
}

struct WalletData {
    balance: Int;
    owner: Address;
    master: Address;
}