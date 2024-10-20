import "@stdlib/deploy";
import "./messages.tact";

const minTonsForStorage: Int = ton("0.02");
const gasConsumption: Int = ton("0.02");

contract NftItem with Deployable {
    collection_address: Address;
    item_index: Int; 
    is_initialized: Bool;
    campaign_manager:Address;
    owner: Address?;
    individual_content: Cell?;
    campaign_start:Int;
    campaign_end:Int;
    current_campaign:Int;
    voters:map<Address, Int>;
    votes:Int;
    voting_tracker:Address;

    init(collection_address: Address, item_index: Int,campaign_manager: Address,voting_tracker: Address){
        require(sender() == collection_address, "not from collection");
        self.collection_address = collection_address;
        self.item_index = item_index;
        self.is_initialized = false;
        self.campaign_manager = campaign_manager;
        self.voting_tracker = voting_tracker;
        self.current_campaign = 0;
        self.campaign_start = 0;
        self.campaign_end = 0;
        self.votes = 0;
    }

    receive("GetOwner"){
        if(self.owner!=null){
            self.reply(ResNFTOwner{owner:self.owner!!}.toCell());
        }
    }
    receive(msg: Transfer){
        let ctx: Context = context(); // Reference: https://docs.tact-lang.org/language/ref/common#context
        let msgValue: Int = self.msgValue(ctx.value);
        
        if (self.is_initialized == false) {  // Initial Transfer, aka the "Minting" of the NFT
            require(ctx.sender == self.collection_address, "initialized tx need from collection");
            self.is_initialized = true;
            self.owner = msg.new_owner;
            self.individual_content = msg.custom_payload;
            send(SendParameters{
                to: msg.response_destination!!,
                value: msgValue,
                mode: SendPayGasSeparately,
                body: Excesses { query_id: msg.query_id }.toCell()
            });
        } else {
            require(ctx.sender == self.owner!!, "not owner");
            self.owner = msg.new_owner;  // change current owner to the new_owner
            if (msg.forward_amount > 0) {
                send(SendParameters{
                    to: msg.new_owner,
                    value: msg.forward_amount,
                    mode:  SendPayGasSeparately, 
                    bounce: true,
                    body: OwnershipAssigned{
                        query_id: msg.query_id,
                        prev_owner: ctx.sender,
                        forward_payload: msg.forward_payload
                    }.toCell()
                }); 
            }

            msgValue = msgValue - ctx.readForwardFee(); 
            if (msg.response_destination != null) { 
                send(SendParameters{ 
                    to: msg.response_destination!!,
                    value: msgValue - msg.forward_amount,
                    mode: SendPayGasSeparately,
                    bounce: true,
                    body: Excesses { query_id: msg.query_id }.toCell()
                });
            } 
        }
    }
    
    receive("Vote") {
        // Touch campaign manager to ensure current state
        send(SendParameters{
            to:self.campaign_manager,
            value:0,
            mode:SendIgnoreErrors,
            body:Touch{
                query_id:0
            }.toCell()
        });
        
        send(SendParameters{
            to:self.campaign_manager,
            value:0,
            mode:SendIgnoreErrors,
            body:"GetCampaignDetails".asComment()
        });
        
            
        require(now() >= self.campaign_start, "Campaign not started");
        require(now() <= self.campaign_end, "Campaign ended");
        
        let voter: Address = sender();
        let last_vote: Int = 0;

        if(self.voters.get(voter)!=null){
            last_vote= self.voters.get(voter)!!;
        }
        
        require(now() - last_vote >= 24 * 60 * 60 || last_vote == 0, "Already voted today");
        
        self.votes = self.votes + 1;
        self.voters.set(voter, now());
        
        send(SendParameters{
            to:self.voting_tracker,
            value:0,
            mode:SendIgnoreErrors,
            body:RegisterVote{
                nft_address:myAddress(),
                voter
            }.toCell()
        });
    }
    receive(msg: GetStaticData){ 
        let ctx: Context = context();
        send(SendParameters {
            to: ctx.sender,
            value: 0,
            mode: 64,  // (return msg amount except gas fees) 
            bounce: true,
            body: ReportStaticData{
                query_id: msg.query_id,
                index_id: self.item_index,
                collection: self.collection_address
            }.toCell()
        });
    }

    fun msgValue(value: Int): Int {
        let tonBalanceBeforeMsg: Int = myBalance() - value;
        let storageFee: Int = minTonsForStorage - min(tonBalanceBeforeMsg, minTonsForStorage);
        return value - (storageFee + gasConsumption);
    }

    // --------- Get Function  --------- //
    get fun get_nft_data(): GetNftData {
        let b: StringBuilder = beginString();
        let collectionData: String = (self.individual_content!!).asSlice().asString();
        b.append(collectionData);
        b.append(self.item_index.toString());
        b.append(".json");

        return GetNftData {
            is_initialized: self.is_initialized, 
            index: self.item_index, 
            collection_address: self.collection_address, 
            owner_address: self.owner!!,
            individual_content: b.toCell()
        };
    }
}