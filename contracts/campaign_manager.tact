import "@stdlib/deploy";
import "./voting_tracker.tact";
import "./n_f_t_item_v2.tact";
/**
 * @title CampaignManager
 * @notice Manages voting campaigns and reward distribution
 * @dev Self-managing campaign cycles without off-chain triggers
 */
 
const voter_reward: Int = 100;    // 100 Jettons for voters
const creator_reward: Int = 500;  // 500 Jettons for creator
const min_votes_required: Int = 1; // Minimu

contract CampaignManager with Deployable {
    campaign_start: Int;
    campaign_end: Int;
    winning_nft: Address?;
    winning_voters:map<Address,Bool>;
    jetton_master: Address;
    campaign_number: Int;
    total_votes:Int = 0;
    voting_tracker:Address;
    winning_nft_owner:Address;

    init(jetton_master: Address) {
        self.jetton_master = jetton_master;
        self.voting_tracker = contractAddress(initOf VotingTracker(myAddress()));
        self.campaign_start = now();
        self.campaign_end = now() + 1;
        self.campaign_number = 1;
        self.winning_nft = newAddress(0,0);
        self.winning_nft_owner = newAddress(0,0);
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
            dump(self.winning_nft);
        }

        receive("GetCampaignDetails"){
            self.reply(ResCampaignDetails{campaign_start:self.campaign_start,campaign_end:self.campaign_end,current_campaign:self.campaign_number}.toCell())
        }
        receive(msg:ResNFTOwner){
               self.winning_nft_owner = msg.owner;
               dump("Winning NFT Owner");
               dump(self.winning_nft_owner);
        }
    

    /**
     * @notice Validates and manages campaign state
     * @dev Called internally before any campaign-related operation
     */
    

    fun manageCampaignState() {
        if (now() >= self.campaign_end) {
            // Distribute Rewards
           dump("Distributing Rewards");
           self.distributeRewards();
            
            
            // Start new campaign
            self.campaign_start = now();
            self.campaign_end = now() + 24 * 60 * 60;
            self.campaign_number = self.campaign_number + 1;
        }

            // send(SendParameters{
            //     to:self.voting_tracker,
            //     value:0,
            //     mode:SendIgnoreErrors,
            //     body:"reset".asComment()
            // })
        // }
    }

    /**
     * @notice Distributes rewards to winners and voters
     * @dev Called automatically when campaign ends
     */


     bounced(msg:bounced<Mint>){
        dump("Mint function Bounced");
     }
    fun distributeRewards() {
        send(SendParameters{
            to:self.voting_tracker,
            value:0,
            mode:SendIgnoreErrors,
            body:"ReqWinningNFT".asComment()
        });
        
        //Getting winning_nft owner
        if(self.winning_nft!=null){
            send(SendParameters{
                to:self.winning_nft!!,
                value:ton("0.1"),
                mode:SendIgnoreErrors,
                body:"GetOwner".asComment()
        });
        }
        
        
        // Mint rewards for creator
        dump("Minting Rewards for Creator");
            send(SendParameters{
                to: self.jetton_master,
                value: ton("0.5"),
                bounce: true,
                body: Mint{
                    amount: creator_reward,
                    receiver: self.winning_nft_owner
                }.toCell()
            });
            
            self.distribute_rewards_to_voters();
        }
    
    fun distribute_rewards_to_voters() {

        foreach(voter, value in self.winning_voters){
             send(SendParameters{
            to: self.jetton_master,
            value: ton("0.5"),
            bounce: true,
            body: Mint{
                amount: voter_reward,
                receiver: voter
            }.toCell()
        });
        }
    }
    get fun CampaignDetail():CampaignDetails{
        return CampaignDetails{
            campaign_start:self.campaign_start,
            campaign_end:self.campaign_end,
            current_campaign:self.campaign_number
        }
    }
}
