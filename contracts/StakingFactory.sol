// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import { LockupStaking } from "./LockupStaking.sol";
import { LPStaking } from "./LPStaking.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract StakingFactory is Ownable {
    address public rewardToken;
    address[] public lockupStakingPools;
    address[] public lpStakingPools;

    constructor(address _rewardToken) {
        rewardToken = _rewardToken;
    }

    function newLockupStakingPool( 
        uint256 _stakeDuration, // staking duration in sec
        uint256 _maxCapacity, // max tokens that can be deposited
        uint256 _rewardRate // % of reward on tokens in staking duration
    ) onlyOwner external 
    {
        LockupStaking pool = new LockupStaking(rewardToken, _stakeDuration, _maxCapacity, _rewardRate);
        pool.transferOwnership(owner());

        lockupStakingPools.push(address(pool));
    }

    function newLPStakingPool(address _stakingToken, uint _rewardRate) onlyOwner external {
        LPStaking pool = new LPStaking(_stakingToken, rewardToken, _rewardRate);
        pool.transferOwnership(owner());
        
        lpStakingPools.push(address(pool));
    }
}