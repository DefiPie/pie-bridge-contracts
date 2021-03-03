// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "./PieBridge.sol";

contract BridgeProxyTest is PieBridge {
    constructor(
        address bridgeImplementation_,
        address _courier,
        address _guardian,
        address _bridgeToken,
        uint _fee,
        uint[] memory _newRoutes
    ) {
        // for abi in tests
    }

    function _setPendingAdmin(address) public returns (bool) {
        // for abi in tests
        return true;
    }

    function _acceptAdmin() public returns (bool) {
        // for abi in tests
        return true;
    }
}
