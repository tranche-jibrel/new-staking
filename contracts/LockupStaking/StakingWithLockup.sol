// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract StakingWithLockup is Ownable {
    using SafeMath for uint256;
    IERC20 public stakingToken;

    uint public rewardRate; // percentage of deposit to be rewarded
    uint public maxCapacity; // max tokens that can be deposited
    uint public stakeDuration; // staking duration in sec
    
    uint public totalDeposits;

    struct StakingDetails {
        uint256 startTime;
        uint256 amount;
    }

    mapping (address => uint256) public stakeCounter;
    mapping (address => mapping (uint256 => StakingDetails)) public stakingDetails;

    constructor(
        address _stakingToken,
        uint256 _stakeDuration,
        uint256 _maxCapacity,
        uint256 _rewardRate
    ) {
        stakingToken = IERC20(_stakingToken);
        stakeDuration = _stakeDuration;
        maxCapacity = _maxCapacity;
        rewardRate = _rewardRate;
    }

    function updateRewardRate(uint newRewardRate)
    external onlyOwner
    {
        rewardRate = newRewardRate;
    }

    function updateMaxCapacity(uint newMaxCapacity)
    external onlyOwner
    {
        maxCapacity = newMaxCapacity;
    }

    function viewStake(address user, uint counter)
    external view returns(StakingDetails memory)
    {
        return stakingDetails[user][counter];
    }

    function stake(uint _amount)
    external
    {
        // check max capacity
        totalDeposits += _amount;
        require(totalDeposits < maxCapacity, "Total deposits limit reached");

        stakingToken.transferFrom(msg.sender, address(this), _amount);

        // increment stake counter for user
        stakeCounter[msg.sender] += 1;

        // update staking details
        StakingDetails storage _stake = stakingDetails[msg.sender][stakeCounter[msg.sender]];
        _stake.startTime = block.timestamp;
        _stake.amount = _amount;
    }

    function withdraw(uint _counter)
    external
    {
        StakingDetails memory _stake = stakingDetails[msg.sender][_counter];

        // if stakeDuration is NOT satisfied
        if((int(stakeDuration) - int(block.timestamp - _stake.startTime)) > 0){
            // premature withdrawal
            stakingToken.transfer(msg.sender, _stake.amount);
            totalDeposits -= _stake.amount;
            return;
        }

        stakingToken.transfer(msg.sender, _stake.amount*(100 + rewardRate) / 100);
        
        delete stakingDetails[msg.sender][_counter];
    }
}