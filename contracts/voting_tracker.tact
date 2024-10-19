import "@stdlib/deploy";

/**
 * @title VotingTracker
 * @notice Tracks votes across all NFTs in the current campaign
 */

message RegisterVote {
    nft_address: Address;
    voter: Address;
}

message Touch {
    query_id: Int as uint64;
}

struct Voters {
    voters: map<Address, Bool>;
}

contract VotingTracker with Deployable {
    campaign_manager: Address;
    votes_per_nft: map<Address, Int>;
    voters_per_nft: map<Address, Voters>;
    total_votes: Int;

    init(campaign_manager: Address) {
        self.campaign_manager = campaign_manager;
        self.total_votes = 0;
    }

    /**
     * @notice Registers a vote for an NFT
     * @param msg RegisterVote message containing vote details
     */
    receive(msg: RegisterVote) {
        // Send touch message to campaign manager
        send(SendParameters{
            to: self.campaign_manager,
            value: ton("0.01"),
            bounce: true,
            body: Touch{
                query_id: 0
            }.toCell()
        });

        if(self.votes_per_nft.get(msg.nft_address)!=null){
            self.votes_per_nft.set(
                msg.nft_address, 
                ( self.votes_per_nft.get(msg.nft_address)!! + 1)
            );
        }
        
        if(self.voters_per_nft.get(msg.nft_address)!=null){
            let nft_voters: Voters = self.voters_per_nft.get(msg.nft_address)!!;
            nft_voters.voters.set(msg.voter, true);
            self.voters_per_nft.set(msg.nft_address, nft_voters);
        
            self.total_votes = self.total_votes + 1;
        }
       
    }
   
    // Getter functions
    get fun get_votes_for_nft(nft_address: Address): Int? {
        return self.votes_per_nft.get(nft_address);
    }

    get fun get_total_votes(): Int {
        return self.total_votes;
    }

    get fun get_voters_for_nft(nft_address: Address): Voters? {
        return self.voters_per_nft.get(nft_address);
    }
}