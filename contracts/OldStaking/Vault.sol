// Inspired by https://github.com/BarnBridge/BarnBridge-YieldFarming/blob/master/contracts/CommunityVault.sol
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract Vault is Ownable {

    IERC20 public SLICE;

    constructor (address sliceAddress) {
        SLICE = IERC20(sliceAddress);
    }

    event SetAllowance(address indexed caller, address indexed spender, uint256 amount);

    function setAllowance(address spender, uint amount) external onlyOwner {
        SafeERC20.safeApprove(SLICE, spender, amount);

        emit SetAllowance(msg.sender, spender, amount);
    }
}
