import "./messages.tact";
import "@stdlib/deploy";
import "./n_f_t_item_v2.tact";

contract NftCollectionV2 with Deployable {
    next_item_index: Int as uint32 = 0;
    owner_address: Address;                      
    collection_content: Cell;   
    campaign_manager:Address;
    voting_tracker:Address;

    init(owner_address: Address, collection_content: Cell,campaign_manager: Address,voting_tracker: Address){
        self.owner_address = owner_address;
        self.collection_content = collection_content; 
        self.campaign_manager = campaign_manager;
        self.voting_tracker = voting_tracker;
    }

    receive("Mint"){
        let ctx: Context = context(); // get sender Info
        let msgValue: Int = ctx.value;
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = minTonsForStorage - min(tonBalanceBeforeMsg, minTonsForStorage);
        msgValue = msgValue - (storageFee + gasConsumption);
        self.mint(ctx.sender, msgValue);

        emit(LogEventMintRecord{ minter: sender(), item_id: self.next_item_index, generate_number: nativeRandom() }.toCell());
    }

    // ===== Private Methods ===== //
    fun mint(sender: Address, msgValue: Int) {
        require(self.next_item_index >= 0, "non-sequential NFTs");
        let nft_init: StateInit = self.getNFTItemV2Init(self.next_item_index);
        send(SendParameters{
                to: contractAddress(nft_init), 
                value: msgValue, 
                bounce: false,
                mode: SendIgnoreErrors,
                body: Transfer {
                    query_id: 0,
                    new_owner: sender,
                    response_destination: self.owner_address,
                    custom_payload: self.collection_content,
                    forward_amount: 0,
                    forward_payload: emptySlice()
                }.toCell(),
                code: nft_init.code,
                data: nft_init.data
            });
        // dump(self.next_item_index); // Reference at: https://tact-by-example.org/03-emit
        self.next_item_index = self.next_item_index + 1;
    }

    // receive(msg: GetRoyaltyParams) {   
    //     let ctx: Context = context(); // get sender Info
    //     send(SendParameters{
    //         to: ctx.sender,
    //         value: 0,
    //         mode: 64, 
    //         bounce: false,
    //         body: ReportRoyaltyParams {
    //             query_id: msg.query_id,
    //             numerator:  (self.royalty_params!!).numerator,
    //             denominator: (self.royalty_params!!).denominator,
    //             destination: self.owner_address
    //         }.toCell()
    //     });        
    // }

    // ------------------ Get Function  ------------------ //
    get fun get_collection_data(): CollectionData {     
        let b: StringBuilder = beginString();
        let collectionDataString: String = self.collection_content.asSlice().asString();
        b.append(collectionDataString);
        b.append("meta.json"); // You can changed this your self.
        return CollectionData{
            next_item_index: self.next_item_index, 
            collection_content: b.toCell(), 
            owner_address: self.owner_address
        };
    }

    get fun get_nft_address_by_index(item_index: Int): Address?{      
        let initCode: StateInit = self.getNFTItemV2Init(item_index);
        return contractAddress(initCode);
    }

    get fun getNFTItemV2Init(item_index: Int): StateInit {
        return initOf NftItemV2(myAddress(), item_index,self.campaign_manager,self.voting_tracker);
    }
    
    get fun get_nft_content(index: Int, individual_content: Cell): Cell { 
        let b: StringBuilder = beginString();
        let ic: String = individual_content.asSlice().asString();
        b.append(ic);
        return b.toCell();
    }

  
}