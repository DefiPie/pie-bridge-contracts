pragma solidity ^0.7.4;

contract ImplementationStorage {

    address public implementation;

    function _setImplementation(address implementation_) internal {
        implementation = implementation_;
    }
}

contract BridgeStorage {
    address public admin;
    address public pendingAdmin;
}

contract BridgeProxy is ImplementationStorage, BridgeStorage {

    event NewImplementation(address oldImplementation, address newImplementation);

    constructor(
        address bridgeImplementation_,
        address _courier,
        address _bridgeToken,
        uint _fee
    ) {
        // Set admin to caller
        admin = msg.sender;

        _setImplementation(bridgeImplementation_);

        // First delegate gets to initialize the delegator (i.e. storage contract)
        delegateTo(implementation, abi.encodeWithSignature("initialize(address,address,uint)",
            _courier,
            _bridgeToken,
            _fee)
        );
    }

    /**
     * @notice Internal method to delegate execution to another contract
     * @dev It returns to the external caller whatever the implementation returns or forwards reverts
     * @param callee The contract to delegatecall
     * @param data The raw data to delegatecall
     * @return The returned bytes from the delegatecall
     */
    function delegateTo(address callee, bytes memory data) internal returns (bytes memory) {
        (bool success, bytes memory returnData) = callee.delegatecall(data);
        assembly {
            if eq(success, 0) {
                revert(add(returnData, 0x20), returndatasize())
            }
        }
        return returnData;
    }

    function delegateAndReturn() internal returns (bytes memory) {
        (bool success, ) = implementation.delegatecall(msg.data);

        assembly {
            let free_mem_ptr := mload(0x40)
            returndatacopy(free_mem_ptr, 0, returndatasize())

            switch success
            case 0 { revert(free_mem_ptr, returndatasize()) }
            default { return(free_mem_ptr, returndatasize()) }
        }
    }

    /**
     * @notice Delegates execution to an implementation contract
     * @dev It returns to the external caller whatever the implementation returns or forwards reverts
     */
    fallback() external {
        // delegate all other functions to current implementation
        delegateAndReturn();
    }

    function setImplementation(address newImplementation) external returns (bool) {
        require(msg.sender == admin, 'BridgeProxy: Only admin can set pending admin');

        address oldImplementation = implementation;
        _setImplementation(newImplementation);

        emit NewImplementation(oldImplementation, implementation);

        return true;
    }

    function _setPendingAdmin(address newPendingAdmin) public returns (bool) {
        // Check caller = admin
        require(msg.sender == admin, 'BridgeProxy: Only admin can set pending admin');

        // Store pendingAdmin with value newPendingAdmin
        pendingAdmin = newPendingAdmin;

        return true;
    }

    function _acceptAdmin() public returns (bool) {
        // Check caller is pendingAdmin
        require(msg.sender == pendingAdmin, 'BridgeProxy: Only pendingAdmin can accept admin');

        // Store admin with value pendingAdmin
        admin = pendingAdmin;

        // Clear the pending value
        pendingAdmin = address(0);

        return true;
    }
}

