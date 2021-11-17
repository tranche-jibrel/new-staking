// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

// if we need to define an interface to work with Migrate Staking contract from another contract
interface IMigrateMilestones {

    // some functions can be inserted here to work with them from another contract
    function migrateSingleStakingDetail(address _sender, uint8 _durationIdx, address _newStkAddress) external;

}