// const LPFactory = artifacts.require('LPFactory');
const LPStaking = artifacts.require('LPStaking');

const StakingMilestones = artifacts.require('StakingMilestones');
const Vault = artifacts.require("Vault");
const YieldFarm = artifacts.require("YieldFarm");
const YieldFarmLP = artifacts.require('YieldFarmLP');

const Token = artifacts.require('Token');
const LPToken = artifacts.require('LPToken');

const { time, expectRevert } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const { parse } = require("dotenv");

contract("MigrateMilestones", accounts => {
    let token, lp_token, factory;
    let newRewardRate;
    let initialBalance, pool1, pool2;

    let owner = accounts[0];
    let testUser1 = accounts[1];
    let testUser2 = accounts[2];
    let testUser3 = accounts[3];

})