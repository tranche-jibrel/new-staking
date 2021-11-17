// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./StakingWithLockup.sol";
import "../LockupStaking/LockupStaking.sol";
import "./IMigrateStaking.sol";
import "../LockupStaking/ILockupStaking.sol";

contract MigrateStaking is Ownable, IMigrateStaking {
    using SafeMath for uint;

    address public oldStakingAddress;
    address public stakableToken;

    StakingWithLockup oswl;
    LockupStaking ls;

    struct StakingDetails {
        uint256 startTime;
        uint256 amount;
        uint256 endTime;
        uint256 reward;
        uint8 durationIndex;
    }
    StakingDetails public stkDet;


    constructor(address _stakableToken, address _oldStaking) {
        stakableToken = _stakableToken;
        oldStakingAddress = _oldStaking;
    }

    // durationIndex can be linked to a new staking contract address deployed by the factory 
    // this function can be restricted to onlyOwner or it can be called by users to "migrate" their details...
    function migrateSingleStakingDetail(address _sender, uint8 _durationIdx, address _newStkAddress) external onlyOwner{
        oswl = StakingWithLockup(oldStakingAddress);
        ls = LockupStaking(_newStkAddress);

        uint256 nStakes = oswl.stakeCounter(_sender);
        if (nStakes > 0) {
            for (uint256 i = 1; i <= nStakes; i++) {
                (stkDet.startTime, stkDet.amount, stkDet.endTime, stkDet.reward, stkDet.durationIndex) = oswl.stakingDetails(_sender, i);
                // new details can be inserted directly inside the new staking contract!!
                if (stkDet.durationIndex == _durationIdx){
                    uint256 tempCounter = (ls.stakeCounter(_sender)).add(1);
                    ls.setStakingCounter(_sender, tempCounter);
                    ls.setStakingDetails(_sender, tempCounter, stkDet.startTime, stkDet.amount);

                    // eventually we can burn tokens from user wallet
                }
            }
        }
    }

}