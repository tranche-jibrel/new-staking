// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./StakingMilestones.sol";
import "./IMigrateMilestones.sol";
import "../LPStaking/LPStaking.sol";

contract MigrateMilestones is Ownable {
    using SafeMath for uint;

    address public yieldFarmLPAddress;
    address public stakableToken;

    StakingMilestones osms;
    LPStaking nlps;

    constructor(address _stakableToken, address _oldFarmLP) {
        stakableToken = _stakableToken;
        yieldFarmLPAddress = _oldFarmLP;
    }

    // durationIndex can be linked to a new staking contract address deployed by the factory 
    // this function can be restricted to onlyOwner or it can be called by users to "migrate" their details...
    function migrateSingleMilestoneUser(address _user, address _lpToken, address _originalMS, address _newLPAddress) external onlyOwner{
        osms = StakingMilestones(_originalMS);
        nlps = LPStaking(_newLPAddress);

        //balances
        uint256 userAmount = osms.balanceOf(_user, _lpToken);
        osms.migrateUserBalanceToAnotherContract(_user, _lpToken, _newLPAddress);
        nlps.setUserBalance(_user, userAmount);
    }

}