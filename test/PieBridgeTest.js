const assert = require('assert');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
const TokenEmulateJson = require('../build/contracts/TokenEmulate.json');
const BridgeJson = require('../build/contracts/PieBridge.json');
const BridgeProxyJson = require('../build/contracts/BridgeProxy.json');

const abiDecoder = require('abi-decoder');
const BigNumber = require('bignumber.js');

const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const GAS ='5000000';
const ropstenChainID = '3';
const rinkebyChainID = '4';

let accounts;
let pieBEP20;
let pieERC20;
let admin, guardian, courier;
let ac1, ac2, ac3;
let bridgeETH, bridgeBSC;
let bridgeProxyETH, bridgeProxyBSC;
let fee;
let routes;

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
        guardian = accounts[8];
        courier = accounts[9];
        fee = '0';
        routes = [];

        pieBEP20 = await new web3.eth.Contract(TokenEmulateJson['abi'])
            .deploy({ data: TokenEmulateJson['bytecode'], arguments: [
                    'pieBSCToken', 'PIEBSC'] })
            .send({ from: admin, gas: GAS });
        pieERC20 = await new web3.eth.Contract(TokenEmulateJson['abi'])
            .deploy({ data: TokenEmulateJson['bytecode'], arguments: [
                    'pieBSCToken', 'PIEBSC'] })
            .send({ from: admin, gas: GAS });
        bridgeBSC = await new web3.eth.Contract(BridgeJson['abi'])
            .deploy({ data: BridgeJson['bytecode']})
            .send({ from: admin, gas: GAS });
        bridgeETH = await new web3.eth.Contract(BridgeJson['abi'])
            .deploy({ data: BridgeJson['bytecode']})
            .send({ from: admin, gas: GAS });

        bridgeProxyBSC = await new web3.eth.Contract(BridgeProxyJson['abi'])
            .deploy({ data: BridgeProxyJson['bytecode'], arguments: [
                    bridgeBSC._address, courier, guardian, pieBEP20._address, fee, routes] })
            .send({ from: admin, gas: GAS });

        bridgeProxyETH = await new web3.eth.Contract(BridgeProxyJson['abi'])
            .deploy({ data: BridgeProxyJson['bytecode'], arguments: [
                    bridgeETH._address, courier, guardian, pieERC20._address, fee, routes] })
            .send({ from: admin, gas: GAS });
    });

    describe('Constructor', () => {
        it('Check data for bridge', async () => {
            const adminContract = await bridgeProxyBSC.methods.admin().call();
            assert.deepStrictEqual(adminContract, admin);

            const courierContract = await bridgeProxyBSC.methods.courier().call();
            assert.deepStrictEqual(courierContract, courier);

            const bridgeTokenContract = await bridgeProxyBSC.methods.bridgeToken().call();
            assert.deepStrictEqual(bridgeTokenContract, pieBEP20._address);

            const feeContract = await bridgeProxyBSC.methods.fee().call();
            assert.deepStrictEqual(feeContract, fee);
        });

        it('Courier address is 0', async () => {
            await expectRevert(
                new web3.eth.Contract(BridgeJson['abi'])
                    .deploy({ data: BridgeJson['bytecode'], arguments: [
                            constants.ZERO_ADDRESS, pieBEP20._address, fee] })
                    .send({ from: admin, gas: GAS }),
                'PieBridge: courier address is 0',
            );
        });

        it('Bridge token address is 0', async () => {
            await expectRevert(
                new web3.eth.Contract(BridgeJson['abi'])
                    .deploy({ data: BridgeJson['bytecode'], arguments: [
                            courier, constants.ZERO_ADDRESS, fee] })
                    .send({ from: admin, gas: GAS }),
                'PieBridge: bridgeToken address is 0',
            );
        });
    });

    describe('Admin functions', () => {
        it('Set pending admin', async () => {
            const pendingAdminContract = await bridgeProxyBSC.methods.pendingAdmin().call();
            assert.deepStrictEqual(pendingAdminContract, constants.ZERO_ADDRESS);

            let newPendingAdmin = ac1;
            await bridgeProxyBSC.methods._setPendingAdmin(newPendingAdmin).send({ from: admin, gas: GAS });

            const newPendingAdminContract = await bridgeProxyBSC.methods.pendingAdmin().call();
            assert.deepStrictEqual(newPendingAdminContract, newPendingAdmin);
        });

        it('Accept admin', async () => {
            const adminContract = await bridgeProxyBSC.methods.admin().call();
            assert.deepStrictEqual(adminContract, admin);

            let newPendingAdmin = ac1;
            await bridgeProxyBSC.methods._setPendingAdmin(newPendingAdmin).send({ from: admin, gas: GAS });

            const newPendingAdminContract = await bridgeProxyBSC.methods.pendingAdmin().call();
            assert.deepStrictEqual(newPendingAdminContract, newPendingAdmin);

            await bridgeProxyBSC.methods._acceptAdmin().send({ from: ac1, gas: GAS });

            const newAdminContract = await bridgeProxyBSC.methods.admin().call();
            assert.deepStrictEqual(newAdminContract, newPendingAdmin);

            const pendingAdminContract = await bridgeProxyBSC.methods.pendingAdmin().call();
            assert.deepStrictEqual(pendingAdminContract, constants.ZERO_ADDRESS);
        });

        it('Set pending admin from not admin', async () => {
            let notAdmin = ac1;
            await expectRevert(
                bridgeProxyBSC.methods._setPendingAdmin(notAdmin).send({ from: notAdmin, gas: GAS }),
                'PieBridge: Only admin can set pending admin',
            );
        });

        it('Accept admin from not pendingAdmin', async () => {
            const adminContract = await bridgeProxyBSC.methods.admin().call();
            assert.deepStrictEqual(adminContract, admin);

            let newPendingAdmin = ac1;
            await bridgeProxyBSC.methods._setPendingAdmin(newPendingAdmin).send({ from: admin, gas: GAS });

            const pendingAdminContract = await bridgeProxyBSC.methods.pendingAdmin().call();
            assert.deepStrictEqual(pendingAdminContract, newPendingAdmin);

            let notPendingAdmin = ac2;
            await expectRevert(
                bridgeProxyBSC.methods._acceptAdmin().send({ from: notPendingAdmin, gas: GAS }),
                'PieBridge: Only pendingAdmin can accept admin',
            );

            assert.deepStrictEqual(pendingAdminContract, newPendingAdmin);
        });

        it('Set courier', async () => {
            const courierContract = await bridgeProxyBSC.methods.courier().call();
            assert.deepStrictEqual(courierContract, courier);

            let newCourier = ac1;
            await bridgeProxyBSC.methods._setCourier(newCourier).send({ from: admin, gas: GAS });

            const newCourierContract = await bridgeProxyBSC.methods.courier().call();
            assert.deepStrictEqual(newCourierContract, newCourier);
        });

        it('Set courier from not admin', async () => {
            let notAdmin = ac1;
            await expectRevert(
                bridgeProxyBSC.methods._setCourier(notAdmin).send({ from: notAdmin, gas: GAS }),
                'PieBridge: Only admin can set courier',
            );
        });

        it('Set fee', async () => {
            const feeContract = await bridgeProxyBSC.methods.fee().call();
            assert.deepStrictEqual(feeContract, fee);

            let newFee = '1';
            let tx = await bridgeProxyBSC.methods._setFee(newFee).send({ from: admin, gas: GAS });

            expectEvent(tx, 'NewFee', {
                newFee: newFee
            });

            const newFeeContract = await bridgeProxyBSC.methods.fee().call();
            assert.deepStrictEqual(newFeeContract, newFee);
        });

        it('Set fee from not admin', async () => {
            let notAdmin = ac1;
            let newFee = '100';
            await expectRevert(
                bridgeProxyBSC.methods._setFee(newFee).send({ from: notAdmin, gas: GAS }),
                'PieBridge: Only admin can set fee',
            );
        });

        it('Set routes', async () => {
            let routes = [];
            const routesContract = await bridgeProxyBSC.methods.getRoutes().call();
            assert.deepStrictEqual(routesContract, routes);

            let newRoutes = ['3','4'];
            await bridgeProxyBSC.methods.setRoutes(newRoutes).send({ from: admin, gas: GAS });

            const newRoutesContract = await bridgeProxyBSC.methods.getRoutes().call();
            assert.deepStrictEqual(newRoutesContract, newRoutes);
        });

        it('Set fee from not admin', async () => {
            let notAdmin = ac1;
            let newRoutes = ['3','4', '18'];
            await expectRevert(
                bridgeProxyBSC.methods.setRoutes(newRoutes).send({ from: notAdmin, gas: GAS }),
                'PieBridge: Only admin can set routes',
            );
        });
    });

    describe('Check routes', () => {
        it('Check data for check routes function', async () => {
            let bscChainId = '97';

            let result = await bridgeProxyBSC.methods.checkRoute(ropstenChainID).call();
            assert.deepStrictEqual(result, false);

            let newRoutes = [ropstenChainID, rinkebyChainID];
            await bridgeProxyBSC.methods.setRoutes(newRoutes).send({ from: admin, gas: GAS });

            result = await bridgeProxyBSC.methods.checkRoute(ropstenChainID).call();
            assert.deepStrictEqual(result, true);

            result = await bridgeProxyBSC.methods.checkRoute(rinkebyChainID).call();
            assert.deepStrictEqual(result, true);

            result = await bridgeProxyBSC.methods.checkRoute(bscChainId).call();
            assert.deepStrictEqual(result, false);

            newRoutes = [bscChainId];
            await bridgeProxyBSC.methods.setRoutes(newRoutes).send({ from: admin, gas: GAS });

            result = await bridgeProxyBSC.methods.checkRoute(ropstenChainID).call();
            assert.deepStrictEqual(result, false);

            result = await bridgeProxyBSC.methods.checkRoute(rinkebyChainID).call();
            assert.deepStrictEqual(result, false);

            result = await bridgeProxyBSC.methods.checkRoute(bscChainId).call();
            assert.deepStrictEqual(result, true);
        });
    });

    describe('Cross', () => {
        beforeEach(async () => {
            let newRoutes = [ropstenChainID, rinkebyChainID];
            await bridgeProxyBSC.methods.setRoutes(newRoutes).send({ from: admin, gas: GAS });

            let newFee = '100';
            await bridgeProxyBSC.methods._setFee(newFee).send({ from: admin, gas: GAS });

            let amount = '1000';
            let user = ac1;
            await pieBEP20.methods.transfer(user, amount).send({ from: admin, gas: GAS });
        });

        it('Check data before cross', async () => {
            let fee = '100';
            let tokenBalance = '1000';

            let result = await bridgeProxyBSC.methods.checkRoute(ropstenChainID).call();
            assert.deepStrictEqual(result, true);

            result = await bridgeProxyBSC.methods.checkRoute(rinkebyChainID).call();
            assert.deepStrictEqual(result, true);

            const feeContract = await bridgeProxyBSC.methods.fee().call();
            assert.deepStrictEqual(feeContract, fee);

            let balanceOfAc1 = await balancePieBep20(ac1);
            assert.deepStrictEqual(balanceOfAc1, tokenBalance);
        });

        it('Cross with amount is 0', async () => {
            let user = ac1;
            let to = ac1;
            let amount = '0';

            await expectRevert(
                bridgeProxyBSC.methods.cross(rinkebyChainID, to, amount).send({ from: user, gas: GAS }),
                'PieBridge: amount must be more than fee',
            );

            let currentFee = '100';
            amount = currentFee;

            await expectRevert(
                bridgeProxyBSC.methods.cross(rinkebyChainID, to, amount).send({ from: user, gas: GAS }),
                'PieBridge: amount must be more than fee',
            );
        });

        it('Cross with to address is 0', async () => {
            let user = ac1;
            let to = constants.ZERO_ADDRESS;
            let amount = '101';

            await expectRevert(
                bridgeProxyBSC.methods.cross(rinkebyChainID, to, amount).send({ from: user, gas: GAS }),
                'PieBridge: to address is 0',
            );
        });

        it('Cross with bad chain id', async () => {
            let user = ac1;
            let to = ac1;
            let amount = '101';
            let chainId = '12';

            await expectRevert(
                bridgeProxyBSC.methods.cross(chainId, to, amount).send({ from: user, gas: GAS }),
                'PieBridge: chainId is not support',
            );
        });

        it('Cross with not approve token', async () => {
            let user = ac1;
            let to = ac1;
            let amount = '101';

            await expectRevert(
                bridgeProxyBSC.methods.cross(rinkebyChainID, to, amount).send({ from: user, gas: GAS }),
                'ERC20: transfer amount exceeds allowance',
            );
        });

        it('Good cross', async () => {
            let user = ac1;
            let to = ac1;
            let amount = '101';
            let currentFee = '100';

            await pieBEP20.methods.approve(bridgeProxyBSC._address, amount).send({ from: user, gas: GAS });

            let courierBalance = await balancePieBep20(courier);
            assert.deepStrictEqual(courierBalance, '0');

            let contractBalance = await balancePieBep20(bridgeProxyBSC._address);
            assert.deepStrictEqual(contractBalance, '0');

            const crossNonceContract = await bridgeProxyBSC.methods.crossNonce(rinkebyChainID).call();
            assert.deepStrictEqual(crossNonceContract, '0');

            let tx = await bridgeProxyBSC.methods.cross(rinkebyChainID, to, amount).send({ from: user, gas: GAS });

            expectEvent(tx, 'Cross', {
                from: user,
                to: to,
                amount: '1',
                chainId: rinkebyChainID,
                nonce: '1'
            });

            let courierBalanceAfterCross = await balancePieBep20(courier);
            assert.deepStrictEqual(courierBalanceAfterCross, currentFee);

            let contractBalanceAfterCross = await balancePieBep20(bridgeProxyBSC._address);
            assert.deepStrictEqual(contractBalanceAfterCross, '1');

            const crossNonceContractAfterCross = await bridgeProxyBSC.methods.crossNonce(rinkebyChainID).call();
            assert.deepStrictEqual(crossNonceContractAfterCross, '1');
        });
    });

    describe('Deliver', () => {
        beforeEach(async () => {
            let amount = '1000';
            await pieERC20.methods.transfer(bridgeETH._address, amount).send({ from: admin, gas: GAS });
        });

        it('Check data before deliver', async () => {
            let tokenBalance = '1000';

            let balanceOfBridge = await balancePieErc20(bridgeETH._address);
            assert.deepStrictEqual(balanceOfBridge, tokenBalance);
        });

        it('Deliver with amount is 0', async () => {
            let to = ac1;
            let amount = '0';
            let nonce = '1';

            await expectRevert(
                bridgeETH.methods.deliver(rinkebyChainID, to, amount, nonce).send({ from: courier, gas: GAS }),
                'PieBridge: amount must be positive',
            );
        });

        it('Deliver with to address is 0', async () => {
            let to = constants.ZERO_ADDRESS;
            let amount = '100';
            let nonce = '1';

            await expectRevert(
                bridgeETH.methods.deliver(rinkebyChainID, to, amount, nonce).send({ from: courier, gas: GAS }),
                'PieBridge: to address is 0',
            );
        });

        it('Deliver with not courier', async () => {
            let to = ac1;
            let amount = '100';
            let nonce = '1';

            await expectRevert(
                bridgeETH.methods.deliver(rinkebyChainID, to, amount, nonce).send({ from: to, gas: GAS }),
                'PieBridge: Only courier can deliver tokens',
            );
        });

        it('Good deliver', async () => {
            let to = ac1;
            let amount = '1';
            let nonce = '1';

            let userBalance = await balancePieErc20(to);
            assert.deepStrictEqual(userBalance, '0');

            let contractBalance = await balancePieErc20(bridgeETH._address);
            assert.deepStrictEqual(contractBalance, '1000');

            const deliverNonceContract = await bridgeETH.methods.deliverNonces(rinkebyChainID, nonce).call();
            assert.deepStrictEqual(deliverNonceContract, false);

            let tx = await bridgeETH.methods.deliver(rinkebyChainID, to, amount, nonce).send({ from: courier, gas: GAS });

            expectEvent(tx, 'Deliver', {
                fromChainId: rinkebyChainID,
                to: to,
                amount: '1',
                nonce: '1'
            });

            let userBalanceAfterDeliver = await balancePieErc20(to);
            assert.deepStrictEqual(userBalanceAfterDeliver, amount);

            let contractBalanceAfterDeliver = await balancePieErc20(bridgeETH._address);
            assert.deepStrictEqual(contractBalanceAfterDeliver, '999');

            const deliverNonceContractAfterDeliver = await bridgeETH.methods.deliverNonces(rinkebyChainID, nonce).call();
            assert.deepStrictEqual(deliverNonceContractAfterDeliver, true);
        });

        it('Deliver twice with identical nonce', async () => {
            let to = ac1;
            let amount = '1';
            let nonce = '1';

            await bridgeETH.methods.deliver(rinkebyChainID, to, amount, nonce).send({ from: courier, gas: GAS });

            await expectRevert(
                bridgeETH.methods.deliver(rinkebyChainID, to, amount, nonce).send({ from: courier, gas: GAS }),
                'PieBridge: bad nonce',
            );
        });
    });
});