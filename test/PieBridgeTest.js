const assert = require('assert');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
const TokenEmulateJson = require('../build/contracts/TokenEmulate.json');
const BridgeJson = require('../build/contracts/PieBridge.json');

const abiDecoder = require('abi-decoder');
const BigNumber = require('bignumber.js');

const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const GAS ='5000000';

let accounts;
let pieBEP20;
let pieERC20;
let admin, courier;
let ac1, ac2, ac3;
let bridgeETH, bridgeBSC;

async function balancePieBep20(addr) {
    const res = await pieBEP20.methods.balanceOf(addr).call();
    return res.toString();
}

async function balancePieErc20(addr) {
    const res = await pieERC20.methods.balanceOf(addr).call();
    return res.toString();
}

describe('Bridge Tests', function () {
    this.timeout(10000);

    beforeEach(async () => {
        accounts = await web3.eth.getAccounts();
        admin = accounts[0];
        ac1 = accounts[1];
        ac2 = accounts[2];
        ac3 = accounts[3];
        courier = accounts[9];

        pieBEP20 = await new web3.eth.Contract(TokenEmulateJson['abi'])
            .deploy({ data: TokenEmulateJson['bytecode'], arguments: [
                    'pieBSCToken', 'PIEBSC'] })
            .send({ from: admin, gas: GAS });
        pieERC20 = await new web3.eth.Contract(TokenEmulateJson['abi'])
            .deploy({ data: TokenEmulateJson['bytecode'], arguments: [
                    'pieBSCToken', 'PIEBSC'] })
            .send({ from: admin, gas: GAS });
        bridgeBSC = await new web3.eth.Contract(BridgeJson['abi'])
            .deploy({ data: BridgeJson['bytecode'], arguments: [
                    courier, pieBEP20._address, 0] })
            .send({ from: admin, gas: GAS });
        bridgeETH = await new web3.eth.Contract(BridgeJson['abi'])
            .deploy({ data: BridgeJson['bytecode'], arguments: [
                    courier, pieERC20._address, 0] })
            .send({ from: admin, gas: GAS });
    });

    describe('Constructor', () => {
        it('Check data for bridge', async () => {
            const adminContract = await bridgeBSC.methods.admin().call();
            assert.deepStrictEqual(adminContract, admin);

            const courierContract = await bridgeBSC.methods.courier().call();
            assert.deepStrictEqual(courierContract, courier);

            const bridgeTokenContract = await bridgeBSC.methods.bridgeToken().call();
            assert.deepStrictEqual(bridgeTokenContract, pieBEP20._address);

            const feeContract = await bridgeBSC.methods.fee().call();
            assert.deepStrictEqual(feeContract, '0');
        });

        it('Courier address is 0', async () => {
            await expectRevert(
                new web3.eth.Contract(BridgeJson['abi'])
                    .deploy({ data: BridgeJson['bytecode'], arguments: [
                            constants.ZERO_ADDRESS, pieBEP20._address, '0'] })
                    .send({ from: admin, gas: GAS }),
                'PieBridge: courier address is 0',
            );
        });

        it('Bridge token address is 0', async () => {
            await expectRevert(
                new web3.eth.Contract(BridgeJson['abi'])
                    .deploy({ data: BridgeJson['bytecode'], arguments: [
                            courier, constants.ZERO_ADDRESS, '0'] })
                    .send({ from: admin, gas: GAS }),
                'PieBridge: bridgeToken address is 0',
            );
        });
    });
});