// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract StakingWithLockup {
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

    address public owner;

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

        // set [account that sent tx] as owner
        owner = tx.origin;
    }

    modifier onlyOwner(){
        require(msg.sender == owner, "Caller not owner");
        _;
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
        totalDeposits = totalDeposits.add(_amount);
        require(totalDeposits < maxCapacity, "Total deposits limit reached");

        stakingToken.transferFrom(msg.sender, address(this), _amount);

        // update staking details
        StakingDetails storage _stake = stakingDetails[msg.sender][stakeCounter[msg.sender]];
        _stake.startTime = block.timestamp;
        _stake.amount = _amount;

        // increment stake counter for user
        stakeCounter[msg.sender] = stakeCounter[msg.sender].add(1);
    }

    function withdraw(uint _counter)
    external
    {
        StakingDetails memory _stake = stakingDetails[msg.sender][_counter];
        // check if lockup period is over for _stake
        require((int(stakeDuration) - int(block.timestamp.sub(_stake.startTime))) <= 0, "Lockup Period not over");

        // if staking period is over -> reward = stakeAmount + stakeAmount*rewardRate/100
        stakingToken.transfer(msg.sender, _stake.amount.mul(rewardRate.add(100)).div(100));
        
        delete stakingDetails[msg.sender][_counter];
    }
}