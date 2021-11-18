const LockupFactory = artifacts.require('LockupFactory');
const Token = artifacts.require('Token');
const StakingWithLockup = artifacts.require('LockupStaking');
const OldStakingWithLockup = artifacts.require('StakingWithLockup');
const MigrateStaking = artifacts.require('MigrateStaking');

const { time, expectRevert } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

contract("MigrateStaking", accounts => {
    let token, factory;
    let initialBalance, pool1, pool2;
    let rewardRate = 10;
    let maxCapacity = web3.utils.toWei('1000');

    let owner = accounts[0];
    let testUser1 = accounts[1];
    let testUser2 = accounts[2];

})