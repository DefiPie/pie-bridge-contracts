const assert = require('assert');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
const PieBEP20EmulateJson = require('../build/contracts/PieBEP20Emulate.json');
const PieERC20EmulateJson = require('../build/contracts/PieERC20Emulate.json');

const abiDecoder = require('abi-decoder');
const BigNumber = require('bignumber.js');

const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

let accounts;
let pieBEP20;
let pieERC20;
let admin;
let ac1, ac2, ac3;

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

        pieBEP20 = await new web3.eth.Contract(PieBEP20EmulateJson['abi'])
            .deploy({ data: PieBEP20EmulateJson['bytecode'] })
            .send({ from: owner, gas: GAS });
        pieERC20 = await new web3.eth.Contract(PieERC20EmulateJson['abi'])
            .deploy({ data: PieERC20EmulateJson['bytecode'] })
            .send({ from: owner, gas: GAS });
    });
});