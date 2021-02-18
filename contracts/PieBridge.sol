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

    event Cross(address from, address to, uint amount);
    event Deliver(address to, uint amount);

    constructor(address _courier, address _bridgeToken) {
        admin = msg.sender;

        require(_courier != address(0), "PieBridge: courier address is 0");
        courier = _courier;

        require(_bridgeToken != address(0), "PieBridge: bridgeToken address is 0");
        bridgeToken = _bridgeToken;
    }

    function cross(address to, uint amount) public returns (bool) {
        require(amount > 0, "PieBridge: must be positive");
        require(to != address(0), "PieBridge: to address is 0");

        doTransferIn(msg.sender, bridgeToken, amount);

        emit Cross(msg.sender, to, amount);

        return true;
    }

    function deliver(address to, uint amount) public returns (bool) {
        require(msg.sender == courier, 'PieBridge: Only courier can send tokens');
        require(amount > 0, "PieBridge: must be positive");
        require(to != address(0), "PieBridge: to address is 0");

        doTransferOut(bridgeToken, to, amount);

        emit Deliver(to, amount);

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

    function doTransferOut(address token, address to, uint amount) internal {
        IERC20 ERC20Interface = IERC20(token);
        ERC20Interface.safeTransfer(to, amount);
    }

    function doTransferIn(address from, address token, uint amount) internal {
        IERC20 ERC20Interface = IERC20(token);
        ERC20Interface.safeTransferFrom(from, address(this), amount);
    }
}
