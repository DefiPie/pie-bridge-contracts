// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract PieBridge {
    using SafeERC20 for IERC20;

    address public admin;
    address public bridgeToken;

    event Cross(address from, address to, uint amount);
    event Deliver(address to, uint amount);

    constructor(address _bridgeToken) {
        admin = msg.sender;

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
        require(msg.sender == admin, 'PieBridge: Only admin can send tokens');
        require(amount > 0, "PieBridge: must be positive");
        require(to != address(0), "PieBridge: to address is 0");

        doTransferOut(bridgeToken, to, amount);

        emit Deliver(to, amount);

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

    function getTimeStamp() public view virtual returns (uint) {
        return block.timestamp;
    }
}
