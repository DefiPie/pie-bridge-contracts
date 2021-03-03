// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract PieBridge {
    using SafeERC20 for IERC20;

    address public admin;
    address public courier;
    address public guardian;
    address public bridgeToken;
    uint public fee;

    uint[] public routes;

    // chainId => nonce
    mapping (uint => uint) public crossNonce;
    // chainId => (nonce => deliver)
    mapping (uint => mapping (uint => bool)) public deliverNonces;

    event Cross(address from, address to, uint amount, uint chainId, uint nonce);
    event Deliver(uint fromChainId, address to, uint amount, uint nonce);
    event NewFee(uint newFee);

    constructor() {}

    function initialize(address _courier, address _guardian, address _bridgeToken, uint _fee, uint[] memory newRoutes) public {
        require(
            courier == address(0) &&
            guardian == address(0) &&
            bridgeToken == address(0) &&
            fee == 0 &&
            routes.length == 0
            , "PieBridge may only be initialized once"
        );

        admin = msg.sender;

        require(_courier != address(0), "PieBridge: courier address is 0");
        courier = _courier;

        require(_guardian != address(0), "PieBridge: guardian address is 0");
        guardian = _guardian;

        require(_bridgeToken != address(0), "PieBridge: bridgeToken address is 0");
        bridgeToken = _bridgeToken;

        routes = newRoutes;

        fee = _fee;
    }

    function cross(uint chainId, address to, uint amount) public returns (bool) {
        require(amount > fee, "PieBridge: amount must be more than fee");
        require(to != address(0), "PieBridge: to address is 0");
        require(checkRoute(chainId), "PieBridge: chainId is not support");

        doTransferIn(msg.sender, bridgeToken, amount);
        doTransferOut(bridgeToken, courier, fee);

        crossNonce[chainId]++;

        emit Cross(msg.sender, to, amount - fee, chainId, crossNonce[chainId]);

        return true;
    }

    function deliver(uint fromChainId, address to, uint amount, uint nonce) public returns (bool) {
        require(msg.sender == courier, 'PieBridge: Only courier can deliver tokens');
        require(amount > 0, "PieBridge: amount must be positive");
        require(to != address(0), "PieBridge: to address is 0");
        require(!deliverNonces[fromChainId][nonce], "PieBridge: bad nonce");

        doTransferOut(bridgeToken, to, amount);

        deliverNonces[fromChainId][nonce] = true;

        emit Deliver(fromChainId, to, amount, nonce);

        return true;
    }

    function _setCourier(address newCourier) public returns (bool) {
        // Check caller = admin
        require(msg.sender == admin, 'PieBridge: Only admin can set courier');

        // Store courier with value newCourier
        courier = newCourier;

        return true;
    }

    function _setGuardian(address newGuadrdian) public returns (bool) {
        // Check caller = admin
        require(msg.sender == admin, 'PieBridge: Only admin can set guardian');

        // Store guardian with value guardian
        guardian = newGuadrdian;

        return true;
    }

    function unsetCourier() public returns (bool) {
        // Check caller = admin
        require(msg.sender == guardian, 'PieBridge: Only guardian can unset courier');

        // Store courier with value address(0)
        courier = address(0);

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

    function getRoutes() public view returns (uint[] memory) {
        return routes;
    }

    function setRoutes(uint[] memory newRoutes) public {
        // Check caller = admin
        require(msg.sender == admin, 'PieBridge: Only admin can set routes');

        routes = newRoutes;
    }

    function checkRoute(uint toChainId) public view returns (bool) {
        for(uint i = 0; i < routes.length; i++) {
            if (routes[i] == toChainId) {
                return true;
            }
        }

        return false;
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
