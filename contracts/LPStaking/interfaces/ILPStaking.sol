// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

// https://docs.synthetix.io/contracts/source/interfaces/istakingrewards
interface ILPStaking {
    /* ========== EVENTS ========== */
    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardsDurationUpdated(uint256 newDuration);
    event Recovered(address token, uint256 amount);

    // View
    function balanceOf(address account) external view returns (uint256);

    function earned(address account) external view returns (uint256);

    function rewardPerToken() external view returns (uint256);

    function totalSupply() external view returns (uint256);

    // Mutative
    function exit() external;

    function getReward() external;

    function stake(uint256 amount) external;

    function withdraw(uint256 amount) external;

    function updateRewardRate(uint newRewardRate) external;
}