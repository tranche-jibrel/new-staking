const LPFactory = artifacts.require('LPFactory');
const LPStaking = artifacts.require('LPStaking');

const StakingMilestones = artifacts.require('StakingMilestones');
const MigrateMilestones = artifacts.require('MigrateMilestones');
const Token = artifacts.require('Token');
const LPToken = artifacts.require('LPToken');

const { time, expectRevert, constants } = require("@openzeppelin/test-helpers");
const { ZERO_ADDRESS } = constants;
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const { parse } = require("dotenv");

const fromWei = (x) => web3.utils.fromWei(x.toString());
const toWei = (x) => web3.utils.toWei(x.toString());

contract("MigrateMilestones", accounts => {
    let token, lp_token, factory;
    let newRewardRate;
    let initialBalance, pool1, pool2;

    let owner = accounts[0];
    let testUser1 = accounts[1];
    let testUser2 = accounts[2];
    let testUser3 = accounts[3];

    describe("setups", function () {
        it("retrieve deployed contracts", async function () {
          sliceContract = await Token.deployed();
          expect(sliceContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(sliceContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    
          stkMilestonesContract = await StakingMilestones.deployed();
          expect(stkMilestonesContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(stkMilestonesContract.address).to.match(/0x[0-9a-fA-F]{40}/);

          lpFactoryContract = await LPFactory.deployed();
          expect(lpFactoryContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(lpFactoryContract.address).to.match(/0x[0-9a-fA-F]{40}/); 
          
          migrateMSContract = await MigrateMilestones.deployed();
          expect(migrateMSContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(migrateMSContract.address).to.match(/0x[0-9a-fA-F]{40}/);
        });

        it("send some Slice to accounts", async function () {
            await sliceContract.transfer(testUser1, toWei("10000"))
            await sliceContract.transfer(testUser2, toWei("10000"))
            await sliceContract.transfer(testUser3, toWei("10000"))
        })
    })

})