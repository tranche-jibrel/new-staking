// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface ILockupStaking {
    // -------- Events -------- //
    event Stake(address _user, uint _amount, uint _stakeCounter);
    event Withdraw(address _user, uint _stakeCounter);
    event WithdrawAll(address _user, uint _amount);

    struct StakingDetails {
        uint256 startTime;
        uint256 amount;
    }

    struct OldStakingDetails {
        uint256 startTime;
        uint256 amount;
        uint256 endTime;
        uint256 reward;
        uint8 durationIndex;
    }

    function setStakingCounter(address _staker, uint256 _newCounter) external;
    function setStakingDetails(address _staker, uint256 _counter, uint256 _newTime, uint256 _newAmount) external;

}