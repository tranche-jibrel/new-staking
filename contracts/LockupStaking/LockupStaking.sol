// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ILockupStaking.sol";

contract LockupStaking is Ownable, ReentrancyGuard, Pausable, ILockupStaking {
    using SafeMath for uint256;

    IERC20 public stakingToken;

    uint256 public rewardRate; // percentage of deposit to be rewarded, 18 decimals
    uint256 public maxCapacity; // max tokens that can be deposited
    uint256 public stakeDuration; // staking duration in sec
    
    uint256 public totalDeposits;

    address public migrationStakingAddress;

    mapping (address => uint256) public stakeCounter;
    mapping (address => mapping (uint256 => StakingDetails)) public stakingDetails;

    constructor(address _stakingToken, uint256 _stakeDuration, uint256 _maxCapacity, uint256 _rewardRate) {
        stakingToken = IERC20(_stakingToken);
        stakeDuration = _stakeDuration;
        maxCapacity = _maxCapacity;
        rewardRate = _rewardRate;
    }

    modifier onlyMigrationContractOrOwner() {
        require(msg.sender == migrationStakingAddress || msg.sender == owner(), "Not owner or migration contract");
        _;
    }

    function stake(uint _amount) external nonReentrant whenNotPaused {
        // check max capacity
        totalDeposits = totalDeposits.add(_amount);
        require(totalDeposits < maxCapacity, "Total deposits limit reached, please reduce your deposit amount");

        SafeERC20.safeTransferFrom(stakingToken, msg.sender, address(this), _amount);

        // add staking details
        StakingDetails storage _stake = stakingDetails[msg.sender][stakeCounter[msg.sender]];
        _stake.startTime = block.timestamp;
        _stake.amount = _amount;

        emit Stake(msg.sender, _amount, stakeCounter[msg.sender]);

        // increment stake counter for user
        stakeCounter[msg.sender] = stakeCounter[msg.sender].add(1);
    }

    function withdraw(uint _counter) external nonReentrant whenNotPaused {
        StakingDetails memory _stake = stakingDetails[msg.sender][_counter];
        // check if lockup period is over for _stake
        require(block.timestamp.sub(_stake.startTime) >= stakeDuration, "Lockup Period not over");

        // if staking period is over -> reward = stakeAmount + stakeAmount*rewardRate/100
        SafeERC20.safeTransfer(stakingToken, msg.sender, _stake.amount.mul(rewardRate.add(1e18)).div(1e18));
        
        delete stakingDetails[msg.sender][_counter];

        emit Withdraw(msg.sender, _counter);
    }

    function withdrawAll() external nonReentrant whenNotPaused {
        StakingDetails memory _stake;
        uint amount;

        for(uint i = 0; i<stakeCounter[msg.sender]; i++){

            _stake = stakingDetails[msg.sender][i];
            // check if lockup period is over for _stake
            require(block.timestamp.sub(_stake.startTime) >= stakeDuration, "Lockup Period not over");

            amount = amount.add(_stake.amount);
            
            delete stakingDetails[msg.sender][i];
        }

        // reward = stakeAmount + stakeAmount*rewardRate/100
        SafeERC20.safeTransfer(stakingToken, msg.sender, amount.mul(rewardRate.add(1e18)).div(1e18));

        delete stakeCounter[msg.sender];

        emit WithdrawAll(msg.sender, amount.mul(rewardRate.add(1e18)).div(1e18));
    }


    // -------- Restricted functions -------- // 
    
    function updateRewardRate(uint newRewardRate) external onlyOwner {
        rewardRate = newRewardRate;
    }

    function updateMaxCapacity(uint newMaxCapacity) external onlyOwner {
        maxCapacity = newMaxCapacity;
    }

    function setMigrateStaking(address _migrationAddress) external onlyOwner {
        migrationStakingAddress = _migrationAddress;
    }

    function setStakingCounter(address _staker, uint256 _newCounter) external override onlyMigrationContractOrOwner {
        stakeCounter[_staker] = _newCounter;
    }

    function setStakingDetails(address _staker, uint256 _counter, uint256 _newTime, uint256 _newAmount) external override onlyMigrationContractOrOwner {
        stakingDetails[_staker][_counter].startTime = _newTime;
        stakingDetails[_staker][_counter].amount = _newAmount;
    }


    // -------- View functions -------- // 

    function viewStake(address user, uint counter) external view returns(StakingDetails memory) {
        return stakingDetails[user][counter];
    }

}