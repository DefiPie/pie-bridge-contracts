// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PieERC20Emulate is ERC20, ERC20Burnable {
    uint public INITIAL_SUPPLY = 220_000_000 * 10 ** 18;

    constructor()
        ERC20("PIE Token", "PIE")
    {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}