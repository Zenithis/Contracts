import "@stdlib/deploy";
import "./voting_tracker.tact";

message Mint {
    amount: Int as uint64;
    receiver: Address;
}

/**
 * @title CampaignManager
 * @notice Manages voting campaigns and reward distribution
 * @dev Self-managing campaign cycles without off-chain triggers
 */
contract CampaignManager with Deployable {
    owner: Address;
    campaign_start: Int;
    campaign_end: Int;
    winning_nft: Address?;
    jetton_master: Address;
    campaign_number: Int;
    voter_reward: Int = 100;    // 100 Jettons for voters
    creator_reward: Int = 500;  // 500 Jettons for creator
    min_votes_required: Int = 5; // Minimum votes needed to conclude campaign
    
    init(owner: Address, jetton_master: Address) {
        self.owner = owner;
        self.jetton_master = jetton_master;
        self.campaign_start = now();
        self.campaign_end = now() + 24 * 60 * 60;
        self.campaign_number = 1;
    }

    /**
     * @notice Validates and manages campaign state
     * @dev Called internally before any campaign-related operation
     */
    fun manageCampaignState() {
        if (now() >= self.campaign_end) {
            let init: StateInit = initOf VotingTracker(myAddress());
            let voting_tracker: Address = contractAddress(init);
            
            // Check if minimum votes threshold is met
           
            if (VotingTracker(voting_tracker).get_total_votes() >= self.min_votes_required) {
                self.distributeRewards();
            }
            
            // Start new campaign
            self.campaign_start = now();
            self.campaign_end = now() + 24 * 60 * 60;
            self.campaign_number = self.campaign_number + 1;
            self.winning_nft = null;
            
            // Reset voting tracker
            voting_tracker.reset();
        }
    }

    /**
     * @notice Any interaction with the contract triggers campaign state check
     */
    receive("Touch") {
        self.manageCampaignState();
    }

    /**
     * @notice Distributes rewards to winners and voters
     * @dev Called automatically when campaign ends
     */
    fun distributeRewards() {
        let voting_tracker: VotingTracker = votingTracker();
        let winning_nft_address: Address? = voting_tracker.getWinningNFT();
        let winning_voters: map<Address, Bool> = voting_tracker.getWinningVoters();
        
        if (winning_nft_address != null) {
            let nft: NFTItem = NFTItem(winning_nft_address!!);
            let creator: Address = nft.getOwner();
            
            // Mint rewards for creator
            send(SendParameters{
                to: self.jetton_master,
                value: ton("0.1"),
                bounce: true,
                body: Mint{
                    amount: self.creator_reward,
                    receiver: creator
                }.toCell()
            });
            
        }
    }
    
    fun distribute_rewards() {
        foreach(voter, value in self.winning_voters){
             send(SendParameters{
            to: self.jetton_master,
            value: ton("0.1"),
            bounce: true,
            body: Mint{
                amount: self.voter_reward,
                receiver: voter
            }.toCell()
        });
        } 
    }
}