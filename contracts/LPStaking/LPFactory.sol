// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import { LPStaking } from "./LPStaking.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract LPFactory is Ownable {

    address public rewardToken;
    address[] public stakingPools;

    constructor(address _rewardToken) {
        rewardToken = _rewardToken;
    }

    function newStakingPool(address _stakingToken, uint _rewardRate) onlyOwner external {
        LPStaking pool = new LPStaking(_stakingToken, rewardToken, _rewardRate);
        pool.transferOwnership(owner());
        
        stakingPools.push(address(pool));
    }
}