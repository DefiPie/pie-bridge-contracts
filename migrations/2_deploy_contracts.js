// for deploy:
// > truffle migrate --network rinkeby
// or
// > truffle migrate --network bsctestnet
// for verify:
// > truffle run verify PieBridge@0xC5E5516A4624EdFec39E99b2A79515c29AF4085b --network rinkeby
// or
// > truffle run verify PieBridge@0xAB8237B53c1A751b94598b5Bd3ee04de2DFe49cA --network bsctestnet

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const Bridge = artifacts.require("PieBridge");
const BridgeData = require('../build/contracts/PieBridge.json');

module.exports = async function(deployer, network, accounts) {

    let courier = '0x9D19Be3814dB048C73F804db05d59a3EBd0F20B3';
    let pie;

    if (network === 'bsctestnet')
        pie = '0xd50da88069c69BF093e8dca1532Cc81711D9e0F4';
    else if (network === 'rinkeby') {
        pie = '0xb36afc9f38d8ac6f991bb9939d3ee8d45a7a1285';
    } else if (network === 'mainnet') {
        pie = '0x607C794cDa77efB21F8848B7910ecf27451Ae842';
    } else {
        console.log('Pie is not defined');
        return;
    }

    let fee = '1';

    await deployer.deploy(Bridge,
        courier,
        pie,
        fee
    );

    const bridge = await Bridge.deployed();

    console.log('Pie address', pie);
    console.log('PieBridge', bridge.address);

    let PieBridge = new web3.eth.Contract(BridgeData.abi, bridge.address);

    if (network === 'bsctestnet')
        await PieBridge.methods.setRoutes(['3','4']).send({from: accounts[0]});
    else if (network === 'rinkeby') {
        await PieBridge.methods.setRoutes(['3','97']).send({from: accounts[0]});
    } else if (network === 'mainnet') {
        await PieBridge.methods.setRoutes(['56']).send({from: accounts[0]});
    } else if (network === 'bsc') {
        await PieBridge.methods.setRoutes(['1']).send({from: accounts[0]});
    } else {
        console.log('Routes are not defined');
    }
};
