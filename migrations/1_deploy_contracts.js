// for deploy:
// > truffle migrate --network rinkeby
// or
// > truffle migrate --network bsctestnet
// for verify:
// > truffle run verify PieBridge@0x9dAC9ca6D25f2d58bC760488213154D46ce8dE03 --network rinkeby
// > truffle run verify BridgeProxy@0xcee070745Fe5804d81F2551F93f237Bc13279d66 --network rinkeby
// or
// > truffle run verify PieBridge@0x651c58c964965f5fC232bfEB6cEb30818a1e024E --network bsctestnet
// > truffle run verify BridgeProxy@0x8C32956a49d9D0b90624147ec9e607419d51F373 --network bsctestnet

const Implementation = artifacts.require("PieBridge");
const Proxy = artifacts.require("BridgeProxy");

module.exports = async function(deployer, network, accounts) {

    let courier;
    let guardian = '0x6EBD066e2891922f3c1BfD426B2a49D5D0bc11C8';
    let pie;
    let fee;
    let routes;

    if (network === 'bsctestnet') {
        pie = '0xd50da88069c69BF093e8dca1532Cc81711D9e0F4';
        courier = '0x9D19Be3814dB048C73F804db05d59a3EBd0F20B3';
        routes = ['3', '4'];
        fee = '2';
    } else if (network === 'rinkeby') {
        pie = '0xb36afc9f38d8ac6f991bb9939d3ee8d45a7a1285';
        courier = '0x9D19Be3814dB048C73F804db05d59a3EBd0F20B3';
        routes = ['3','97'];
        fee = '1';
    } else if (network === 'mainnet') {
        pie = '0x607C794cDa77efB21F8848B7910ecf27451Ae842';
        courier = '0x84aeFb0B787Fbc3a2CAF83dE068937FB8a70CF1C';
        routes = ['56'];
        fee = '10000000000000000000'; // 10 PIE
    } else if (network === 'bsc') {
        pie = '0xC4B35d3A24E3e8941c5d87fD21D0725642F50308';
        courier = '0x84aeFb0B787Fbc3a2CAF83dE068937FB8a70CF1C';
        routes = ['1'];
        fee = '200000000000000000000'; // 200 PIE
    } else {
        console.log('Pie is not defined');
        console.log('Routes are not defined');
        return;
    }

    await deployer.deploy(Implementation);
    const imp = await Implementation.deployed();

    await deployer.deploy(Proxy,
        imp.address,
        courier,
        guardian,
        pie,
        fee,
        routes
    );
    const proxy = await Proxy.deployed();

    console.log('Guardian', guardian);
    console.log('Pie address', pie);
    console.log('Bridge implementation', imp.address);
    console.log('Bridge proxy', proxy.address);
};
