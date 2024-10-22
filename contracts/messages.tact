
struct Voters {
    voters: map<Address, Bool>;
}
struct CampaignDetails{
    campaign_start:Int;
    campaign_end:Int;
    current_campaign:Int;
}
message ResCampaignDetails{
    campaign_start:Int;
    campaign_end:Int;
    current_campaign:Int;
}

message(0x178d4519) TokenTransfer {
    query_id: Int as uint64;
    amount: Int as uint64;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as uint64;
    forward_payload: Slice as remaining;
}

message(0x7362d09c) TokenBurnNotification {
    query_id: Int as uint64;
    amount: Int as uint64;
    sender: Address;
    response_destination: Address;
}

message(0xf8a7ea5) TokenExcesses {
    query_id: Int as uint64;
}

message Mint {
    amount: Int as uint64;
    receiver: Address;
}

message InternalTransfer {
    query_id: Int as uint64;
    amount: Int as uint64;
    from: Address;
    response_destination: Address;
}

message ReqVotes{
    query_id:Int;
}

message ResponseTotalVotes{
    query_id:Int;
    totalVotes:Int;
}

message ResNFTOwner{
    owner:Address;
}

message RegisterVote {
    nft_address: Address;
    voter: Address;
}

message Touch {
    query_id: Int as uint64;
}

message ResponseWinningNFT{
    nftAddress:Address;
    voters:map<Address,Bool>;
}

message LogEventMintRecord {
    minter: Address;
    item_id: Int;
    generate_number: Int;
}


message(0x693d3950) GetRoyaltyParams {
    query_id: Int as uint64;
}
message(0xa8cb00ad) ReportRoyaltyParams {
    query_id: Int as uint64;
    numerator: Int as uint16;
    denominator: Int as uint16;
    destination: Address;
}
struct CollectionData {
    next_item_index: Int;
    collection_content: Cell;
    owner_address: Address;
}
struct RoyaltyParams {
    numerator: Int;
    denominator: Int;
    destination: Address;
}
message(0x5fcc3d14) Transfer {
    query_id: Int as uint64;
    new_owner: Address;
    response_destination: Address?;
    custom_payload: Cell?;
    forward_amount: Int as coins;
    forward_payload: Slice as remaining;
}
message(0x05138d91) OwnershipAssigned {
    query_id: Int as uint64;
    prev_owner: Address;
    forward_payload: Slice as remaining;
}
message(0xd53276db) Excesses {
    query_id: Int as uint64;
}
message(0x2fcb26a2) GetStaticData {
    query_id: Int as uint64;
}
message(0x8b771735) ReportStaticData {
    query_id: Int as uint64;
    index_id: Int;
    collection: Address;
}
struct GetNftData {
    is_initialized: Bool;
    index: Int;
    collection_address: Address;
    owner_address: Address;
    individual_content: Cell;
}


