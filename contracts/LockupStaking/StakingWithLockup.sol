// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";

contract StakingWithLockup is Ownable, ReentrancyGuard, Pausable
{
    using SafeMath for uint256;

    IERC20 public stakingToken;

    uint256 public rewardRate; // percentage of deposit to be rewarded
    uint256 public maxCapacity; // max tokens that can be deposited
    uint256 public stakeDuration; // staking duration in sec
    
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
    ){
        stakingToken = IERC20(_stakingToken);
        stakeDuration = _stakeDuration;
        maxCapacity = _maxCapacity;
        rewardRate = _rewardRate;
    }

    function stake(uint _amount)
    external nonReentrant whenNotPaused
    {
        // check max capacity
        totalDeposits = totalDeposits.add(_amount);
        require(totalDeposits < maxCapacity, "Total deposits limit reached");

        stakingToken.transferFrom(msg.sender, address(this), _amount);

        // add staking details
        StakingDetails storage _stake = stakingDetails[msg.sender][stakeCounter[msg.sender]];
        _stake.startTime = block.timestamp;
        _stake.amount = _amount;

        emit Stake(msg.sender, _amount, stakeCounter[msg.sender]);

        // increment stake counter for user
        stakeCounter[msg.sender] = stakeCounter[msg.sender].add(1);
    }

    function withdraw(uint _counter)
    external nonReentrant whenNotPaused
    {
        StakingDetails memory _stake = stakingDetails[msg.sender][_counter];
        // check if lockup period is over for _stake
        require((int(stakeDuration) - int(block.timestamp.sub(_stake.startTime))) <= 0, "Lockup Period not over");

        // if staking period is over -> reward = stakeAmount + stakeAmount*rewardRate/100
        stakingToken.transfer(msg.sender, _stake.amount.mul(rewardRate.add(100)).div(100));
        
        delete stakingDetails[msg.sender][_counter];

        emit Withdraw(msg.sender, _counter);
    }

    function withdrawAll()
    external nonReentrant whenNotPaused
    {
        StakingDetails memory _stake;
        uint amount;

        for(uint i = 0; i<stakeCounter[msg.sender]; i++){

            _stake = stakingDetails[msg.sender][i];
            // check if lockup period is over for _stake
            require((int(stakeDuration) - int(block.timestamp.sub(_stake.startTime))) <= 0, "Lockup Period not over");

            amount = amount.add(_stake.amount);
            
            delete stakingDetails[msg.sender][i];
        }

        // reward = stakeAmount + stakeAmount*rewardRate/100
        stakingToken.transfer(msg.sender, amount.mul(rewardRate.add(100)).div(100));

        delete stakeCounter[msg.sender];

        emit WithdrawAll(msg.sender, amount.mul(rewardRate.add(100)).div(100));
    }


    // -------- Restricted functions -------- // 
    
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


    // -------- View functions -------- // 

    function viewStake(address user, uint counter)
    external view returns(StakingDetails memory)
    {
        return stakingDetails[user][counter];
    }


    // -------- Events -------- //

    event Stake(address _user, uint _amount, uint _stakeCounter);
    event Withdraw(address _user, uint _stakeCounter);
    event WithdrawAll(address _user, uint _amount);
}