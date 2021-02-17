// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract PieBridge {
    using SafeERC20 for IERC20;

    address public admin;
    address public token;

    event Cross(address from, uint amount);
    event Deliver(address from, uint amount);

    constructor(address _token) {
        admin = msg.sender;

        require(_token != address(0), "PieBridge: token address is 0");
        token = _token;
    }

    function cross(uint amount) public returns (bool) {
        require(amount > 0, "PieBridge: must be positive");

        doTransferIn(msg.sender, token, amount);

        emit Cross(msg.sender, amount);

        return true;
    }

    function deliver(address to, uint amount) public returns (bool) {
        require(msg.sender == admin, 'PieBridge: Only admin can send tokens');
        require(amount > 0, "PieBridge: must be positive");
        require(to != address(0), "PieBridge: to address is 0");

        doTransferOut(token, to, amount);

        emit Deliver(to, amount);

        return true;
    }

    function doTransferOut(address token, address to, uint amount) internal {
        if (amount == 0) {
            return;
        }

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
