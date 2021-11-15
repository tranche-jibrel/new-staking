const LPFactory = artifacts.require('LPFactory');
const Token = artifacts.require('Token');
const LPStaking = artifacts.require('LPStaking');

const { time, expectRevert } = require("@openzeppelin/test-helpers");

contract("LPStaking", accounts => {
    let token, factory, lpStaking;
    let initialBalance, pool1;

    let owner = accounts[0];
    let testUser1 = accounts[1];
    let testUser2 = accounts[2];

    before(async() => {
        token = await Token.deployed();
        factory = await LPFactory.deployed();
    })
    
    
})