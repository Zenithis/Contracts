import "@stdlib/deploy";
import "./voting_tracker.tact";

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
    winning_voters:Voters?;
    jetton_master: Address;
    campaign_number: Int;
    voter_reward: Int = 100;    // 100 Jettons for voters
    creator_reward: Int = 500;  // 500 Jettons for creator
    min_votes_required: Int = 1; // Minimum votes needed to conclude campaign
    total_votes:Int = 0;
    voting_tracker:Address;

    init(owner: Address, jetton_master: Address) {
        self.owner = owner;
        self.jetton_master = jetton_master;
        self.campaign_start = now();
        self.campaign_end = now() + 24 * 60 * 60;
        self.campaign_number = 1;
        self.winning_nft = newAddress(0,0);
        self.voting_tracker = contractAddress(initOf VotingTracker(myAddress()))
    }

    /**
     * @notice Validates and manages campaign state
     * @dev Called internally before any campaign-related operation
     */
    

    fun manageCampaignState() {
        if (now() >= self.campaign_end) {
            // Distribute Rewards
           self.distributeRewards();
            
            
            // Start new campaign
            self.campaign_start = now();
            self.campaign_end = now() + 24 * 60 * 60;
            self.campaign_number = self.campaign_number + 1;

            send(SendParameters{
                to:self.voting_tracker,
                value:0,
                mode:SendIgnoreErrors,
                body:"reset".asComment()
            })
        }
    }

    /**
     * @notice Any interaction with the contract triggers campaign state check
     */
    receive("Touch") {
        self.manageCampaignState();
    }

    receive(msg:ResponseWinningNFT){
        self.winning_nft = msg.nftAddress;
        self.winning_voters = msg.voters;
    }
    /**
     * @notice Distributes rewards to winners and voters
     * @dev Called automatically when campaign ends
     */
    fun distributeRewards() {
        send(SendParameters{
            to:self.voting_tracker,
            value:0,
            mode:SendIgnoreErrors,
            body:"ReqWinningNFT".asComment()
        });
        
        if(self.winning_nft != null) {
            let nft: NFTItem = NFTItem(self.winning_nft!!);
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
            
            self.distribute_rewards_to_voters();
        }
    }
    
    fun distribute_rewards_to_voters() {
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