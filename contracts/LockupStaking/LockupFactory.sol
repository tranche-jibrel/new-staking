// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import { LockupStaking } from "./LockupStaking.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract LockupFactory is Ownable {
    address public stakingToken;
    address[] public stakingPools;

    constructor(address _stakingToken) {
        stakingToken = _stakingToken;
    }

    function newStakingPool( uint256 _stakeDuration, // staking duration in sec
            uint256 _maxCapacity, // max tokens that can be deposited
            uint256 _rewardRate // % of reward on tokens in staking duration
            ) onlyOwner external {
        LockupStaking pool = new LockupStaking(stakingToken, _stakeDuration, _maxCapacity, _rewardRate);
        pool.transferOwnership(owner());

        stakingPools.push(address(pool));
    }
}