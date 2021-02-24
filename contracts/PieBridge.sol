// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract PieBridge {
    using SafeERC20 for IERC20;

    address public admin;
    address public pendingAdmin;
    address public courier;
    address public pendingCourier;
    address public bridgeToken;

    uint public crossNonce;
    mapping (uint => bool) public deliverNonces;

    uint public fee;

    event Cross(address from, address to, uint amount, uint nonce);
    event Deliver(address to, uint amount, uint nonce);
    event NewFee(uint newFee);

    constructor(address _courier, address _bridgeToken, uint _fee) {
        admin = msg.sender;

        require(_courier != address(0), "PieBridge: courier address is 0");
        courier = _courier;

        require(_bridgeToken != address(0), "PieBridge: bridgeToken address is 0");
        bridgeToken = _bridgeToken;

        fee = _fee;
    }

    function cross(address to, uint amount) public returns (bool) {
        require(amount > fee, "PieBridge: amount must be more than fee");
        require(to != address(0), "PieBridge: to address is 0");

        doTransferIn(msg.sender, bridgeToken, amount);
        doTransferOut(bridgeToken, courier, fee);

        crossNonce++;

        emit Cross(msg.sender, to, amount - fee, crossNonce);

        return true;
    }

    function deliver(address to, uint amount, uint nonce) public returns (bool) {
        require(msg.sender == courier, 'PieBridge: Only courier can send tokens');
        require(amount > 0, "PieBridge: must be positive");
        require(to != address(0), "PieBridge: to address is 0");
        require(deliverNonces[nonce] == false, "PieBridge: bad nonce");

        doTransferOut(bridgeToken, to, amount);

        deliverNonces[nonce] = true;

        emit Deliver(to, amount, nonce);

        return true;
    }

    function _setPendingAdmin(address newPendingAdmin) public returns (bool) {
        // Check caller = admin
        require(msg.sender == admin, 'PieBridge: Only admin can set pending admin');

        // Store pendingAdmin with value newPendingAdmin
        pendingAdmin = newPendingAdmin;

        return true;
    }

    function _acceptAdmin() public returns (bool) {
        // Check caller is pendingAdmin
        require(msg.sender == pendingAdmin, 'PieBridge: Only pendingAdmin can accept admin');

        // Store admin with value pendingAdmin
        admin = pendingAdmin;

        // Clear the pending value
        pendingAdmin = address(0);

        return true;
    }

    function _setCourier(address newCourier) public returns (bool) {
        // Check caller = admin
        require(msg.sender == admin, 'PieBridge: Only admin can set pending courier');

        // Store courier with value pendingCourier
        courier = newCourier;

        return true;
    }

    function _setFee(uint newFee) public returns (bool) {
        // Check caller = admin
        require(msg.sender == admin, 'PieBridge: Only admin can set fee');

        // Store fee with value newFee
        fee = newFee;

        emit NewFee(newFee);

        return true;
    }

    function doTransferOut(address token, address to, uint amount) internal {
        IERC20 ERC20Interface = IERC20(token);
        ERC20Interface.safeTransfer(to, amount);
    }

    function doTransferIn(address from, address token, uint amount) internal {
        IERC20 ERC20Interface = IERC20(token);
        ERC20Interface.safeTransferFrom(from, address(this), amount);
    }
}
