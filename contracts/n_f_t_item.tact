import "@stdlib/deploy";

/**
 * @title NFTItem
 * @notice Individual NFT contract managing votes and metadata
 */
contract NFTItem with Deployable {
    collection_address: Address;
    item_index: Int;
    owner: Address;
    prompt: String;
    votes: Int;
    voters: map<Address, Int>;  // voter -> last vote timestamp
    campaign_number: Int;
    metadata: Metadata;
    
    init(collection: Address, index: Int) {
        self.collection_address = collection;
        self.item_index = index;
        self.votes = 0;
    }

    /**
     * @notice Handles voting for this NFT
     * @dev Updates vote count and notifies tracker
     */
    receive("Vote") {
        // Touch campaign manager to ensure current state
        CampaignManager(campaignManager()).touch();
        
        let (campaign_start, campaign_end, current_campaign) = 
            CampaignManager(campaignManager()).getCampaignStatus();
            
        require(now() >= campaign_start, "Campaign not started");
        require(now() <= campaign_end, "Campaign ended");
        require(self.campaign_number == current_campaign, "NFT from previous campaign");
        
        let voter: Address = sender();
        let last_vote = self.voters.get(voter).default(0);
        
        require(now() - last_vote >= 24 * 60 * 60 || last_vote == 0, "Already voted today");
        
        self.votes = self.votes + 1;
        self.voters.set(voter, now());
        
        VotingTracker(votingTracker()).registerVote(myAddress(), voter);
    }
}
