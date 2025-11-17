// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ShieldSwap - Private encrypted swap order storage using FHEVM
/// @notice Stores user's private swap orders with encrypted amounts on-chain.
/// @dev MVP showcasing privacy-preserving flow: encrypt -> store -> decrypt.
contract ShieldSwap is SepoliaConfig {
    struct Order {
        euint32 fromAmount;
        euint32 toAmount;
        uint256 timestamp;
    }

    mapping(address => Order) private _orders;

    event OrderCreated(address indexed user, uint256 timestamp);
    event OrderRetrieved(address indexed user, uint256 timestamp);

    /// @notice Set the caller's latest private swap order.
    /// @param fromAmount External encrypted euint32 (amount the user pays)
    /// @param toAmount External encrypted euint32 (amount the user receives)
    /// @param inputProof The encryption input proof for both external handles
    function setOrder(
        externalEuint32 fromAmount,
        externalEuint32 toAmount,
        bytes calldata inputProof
    ) external {
        require(inputProof.length > 0, "Invalid proof");
        
        euint32 encFrom = FHE.fromExternal(fromAmount, inputProof);
        euint32 encTo = FHE.fromExternal(toAmount, inputProof);

        _orders[msg.sender] = Order({
            fromAmount: encFrom,
            toAmount: encTo,
            timestamp: block.timestamp
        });

        // Allow contract re-encryption and the caller to decrypt
        FHE.allowThis(_orders[msg.sender].fromAmount);
        FHE.allowThis(_orders[msg.sender].toAmount);
        FHE.allow(_orders[msg.sender].fromAmount, msg.sender);
        FHE.allow(_orders[msg.sender].toAmount, msg.sender);

        emit OrderCreated(msg.sender, block.timestamp);
    }

    /// @notice Get the caller's latest private order handles.
    /// @return fromAmount Encrypted euint32 handle of the from amount
    /// @return toAmount Encrypted euint32 handle of the to amount
    function getMyOrder() external returns (euint32 fromAmount, euint32 toAmount) {
        Order storage o = _orders[msg.sender];
        emit OrderRetrieved(msg.sender, block.timestamp);
        return (o.fromAmount, o.toAmount);
    }

    /// @notice Get the timestamp of the caller's latest order.
    /// @return timestamp The block timestamp when the order was created
    function getMyOrderTimestamp() external view returns (uint256) {
        return _orders[msg.sender].timestamp;
    }

    /// @notice Check if the caller has an active order.
    /// @return hasOrder True if the caller has placed an order
    function hasOrder() external view returns (bool) {
        return _orders[msg.sender].timestamp > 0;
    }
}
