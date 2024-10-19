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
