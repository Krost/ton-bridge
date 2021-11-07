const BN            = TonWeb.utils.BN;
const joinSignature = window.ethers.utils.joinSignature;
const sha256        = window.ethers.utils.sha256;
const getNumber     = (pair) => parseInt(pair[1], 16);
const toUnit        = (n) => n * 1e9;
const fromUnit      = (n) => n / 1e9;
const decToHex      = (dec) => '0x' + new BN(dec).toString(16);
const balanceNum    = (n, d) => {
    n = (-(-n.toString())).toFixed(d + 1).toString();
    return -(-n.substr(0, n.length - 1));
}
const makeAddress = (address) => {
    if (!address.startsWith('0x')) throw new Error('Invalid address ' + address);
    let hex = address.substr(2);
    while (hex.length < 40) { hex = '0' + hex; }
    return '0x' + hex;
}
const parseEthSignature = (data) => {
    const tuple     = data.tuple.elements;
    const publicKey = makeAddress(decToHex(tuple[0].number.number));
    const rsv       = tuple[1].tuple.elements;
    const r         = decToHex(rsv[0].number.number);
    const s         = decToHex(rsv[1].number.number);
    const v         = Number(rsv[2].number.number);
    return { publicKey, r, s, v }
}
const serializeEthToTon = (data) => {
    const bits = new TonWeb.boc.BitString(8 + 256 + 16 + 8 + 256 + 64);
    bits.writeUint(0, 8);
    bits.writeUint(new BN(data.transactionHash.substr(2), 16), 256);
    bits.writeInt(data.logIndex, 16);
    bits.writeUint(data.to.workchain, 8);
    bits.writeUint(new BN(data.to.address_hash, 16), 256);
    bits.writeUint(new BN(data.value), 64);
    return bits.array;
}
const getQueryId = (data) => {
    const MULTISIG_QUERY_TIMEOUT = 30 * 24 * 60 * 60; // 30 days
    const VERSION  = 2;
    const timeout  = data.blockTime + MULTISIG_QUERY_TIMEOUT + VERSION;
    const query_id = Web3.utils.sha3(data.blockHash + '_' + data.transactionHash + '_' + data.logIndex).substr(2, 8);
    return new TonWeb.utils.BN(timeout).mul(new TonWeb.utils.BN(4294967296)).add(new TonWeb.utils.BN(query_id, 16));
};