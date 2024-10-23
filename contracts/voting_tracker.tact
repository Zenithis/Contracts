import "@stdlib/deploy";
import "./messages.tact";
/**
 * @title VotingTracker
 * @notice Tracks votes across all NFTs in the current campaign
 */

contract VotingTracker with Deployable {
    campaign_manager: Address;
    votes_per_nft: map<Address, Int>;
    voters_per_nft: map<Address, Voters>;
    total_votes: Int;
    winning_nft:Address;

    init(campaign_manager: Address) {
        self.campaign_manager = campaign_manager;
        self.total_votes = 0;
        self.winning_nft = newAddress(0,0);
    }

    receive("reset"){

        self.votes_per_nft = emptyMap();
        self.voters_per_nft = emptyMap();
        self.total_votes = 0;
        self.WinningNFT();
        send(SendParameters{
            to:self.campaign_manager,
            value:0,
            mode:SendIgnoreErrors,
            body:ResponseWinningNFT{nftAddress:self.winning_nft,voters:self.WinningNFTVoters()}.toCell()
        });
        self.winning_nft = newAddress(0,0);
    }

    receive("ReqWinningNFT"){
        self.WinningNFT();
         send(SendParameters{
            to:self.campaign_manager,
            value:0,
            mode:SendIgnoreErrors,
            body:ResponseWinningNFT{nftAddress:self.winning_nft,voters:self.WinningNFTVoters()}.toCell()
        })
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
            body: "Touch".asComment()
        });
        if(self.votes_per_nft.get(msg.nft_address)!=null){
            self.votes_per_nft.set(
                msg.nft_address, 
                ( self.votes_per_nft.get(msg.nft_address)!! + 1)
            );
        }else{
            self.votes_per_nft.set(
                msg.nft_address,
                1
            )
        }
        
        if(self.voters_per_nft.get(msg.nft_address)!=null){
            let nft_voters: Voters = self.voters_per_nft.get(msg.nft_address)!!;
            nft_voters.voters.set(msg.voter, true);
            self.voters_per_nft.set(msg.nft_address, nft_voters);
        
            self.total_votes = self.total_votes + 1;
        
        }else{
            let fizz:map<Address,Bool> = emptyMap();
            fizz.set(msg.voter, true);
            let nft_voters: Voters = Voters{
                voters: fizz
            };
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

   get fun WinningNFT(): Address {
        let maxVotes: Int = 0;
        let isFirstMaxFound: Bool = false;

        foreach(nft, votes in self.votes_per_nft) {
            if (votes > maxVotes ) {
                maxVotes = votes;
            } 
        }
        foreach(nft, votes in self.votes_per_nft) {
            if (votes == maxVotes && !isFirstMaxFound) {
                self.winning_nft = nft;
                isFirstMaxFound = true;
            }
        }


        return self.winning_nft;
    }

    get fun WinningNFTVoters(): map<Address,Bool>{
        let voters:map<Address,Bool > = emptyMap();
        if(self.voters_per_nft.get(self.winning_nft)!=null){
        let winning_voters:Voters =self.voters_per_nft.get(self.winning_nft)!!; 
            voters = winning_voters.voters;   
        }
        return voters;
    }
}