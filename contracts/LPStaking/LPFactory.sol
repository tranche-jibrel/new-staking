// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import { LPStaking } from "./LPStaking.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract LPFactory is Ownable {

    address public rewardToken;

    constructor(address _rewardToken) {
        rewardToken = _rewardToken;
    }

    LPStaking[] public stakingPools;

    function newStakingPool(
        address _stakingToken,
        uint _rewardRate
    )
    onlyOwner external
    {
        LPStaking pool = new LPStaking(_stakingToken, rewardToken, _rewardRate);
        stakingPools.push(pool);
    }
}