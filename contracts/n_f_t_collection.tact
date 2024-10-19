import "@stdlib/deploy";
import "./campaign_manager.tact";
/**
 * @title NFTCollection
 * @notice Manages the collection of NFTs in the current campaign
 */
contract NFTCollection with Deployable {
    owner: Address;
    next_item_index: Int;
    campaign_manager: Address;
    collection_content: Cell;
    nft_item_code: Cell;
    
    init(owner: Address, campaign_manager: Address, collection_content: Cell, nft_item_code: Cell) {
        self.owner = owner;
        self.next_item_index = 1;
        self.campaign_manager = campaign_manager;
        self.collection_content = collection_content;
        self.nft_item_code = nft_item_code;
    }

    /**
     * @notice Mints a new NFT in the current campaign
     * @param prompt The prompt used for AI generation
     * @param metadata NFT metadata including generated image
     */
    receive("Mint NFT") {
        // Touch campaign manager to ensure current state
        CampaignManager(self.campaign_manager).touch();
        
        let (campaign_start, campaign_end, campaign_number) = 
            CampaignManager(self.campaign_manager).getCampaignStatus();
            
        require(now() >= campaign_start, "Campaign not started");
        require(now() <= campaign_end, "Campaign ended");
        
        let nft_init: StateInit = self.getNFTItemInit(self.next_item_index);
        let nft_address: Address = contractAddress(nft_init);
        
        send(SendParameters{
            to: nft_address,
            value: ton("0.05"),
            code: nft_init.code,
            data: nft_init.data,
            body: NFTItemData{
                index: self.next_item_index,
                owner: sender(),
                prompt: msg.prompt,
                campaign: campaign_number,
                metadata: msg.metadata
            }.toCell()
        });
        
        self.next_item_index = self.next_item_index + 1;
    }
}
